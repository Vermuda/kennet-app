#!/usr/bin/env python3
"""
DataImportSurvey.bas に GetStandardPhotoMapping / ImportStandardPhotos を追加する。
CP932 + \r\r\n (ダブルCR) 改行コードを維持する。
"""

BAS_PATH = "/Users/kobayashi/develop/03_kennet/kennet-app/hyoka/01_check/src/DataImportSurvey.bas"

NEW_CODE = """

'' =============================================
'' 定形写真インポート
'' =============================================


'' テーブルJ: 定形写真マッピング
'' マッピングシート列47=photoType, 列49=imageCellAddress
'' 戻り値: Dictionary - photoType(Long) -> cellAddress(String)

Public Function GetStandardPhotoMapping() As Object
    Dim d As Object
    Set d = New Dictionary

    Dim mapWs As Worksheet
    Set mapWs = DataImport.GetMappingSheet()
    If mapWs Is Nothing Then
        Set GetStandardPhotoMapping = d
        Exit Function
    End If

    Dim r As Long
    r = 3 ' データ開始行（Row 2はヘッダー）
    Do While mapWs.Cells(r, 47).Value <> ""
        Dim photoType As Long
        photoType = CLng(mapWs.Cells(r, 47).Value)
        Dim cellAddr As String
        cellAddr = CStr(mapWs.Cells(r, 49).Value)
        If cellAddr <> "" Then
            d(photoType) = cellAddr
        End If
        r = r + 1
    Loop

    Set GetStandardPhotoMapping = d
End Function


'' 定形写真のインポート
'' jsonData("property")("standardPhotos") から写真を読み取り、
'' 「定形写真」シートの対応セルに画像を挿入する

Public Sub ImportStandardPhotos(jsonData As Object)
    On Error GoTo ErrHandler

    ' property.standardPhotos の存在チェック
    If Not jsonData.Exists("property") Then Exit Sub
    Dim prop As Object
    Set prop = jsonData("property")
    If Not prop.Exists("standardPhotos") Then Exit Sub

    Dim photos As Object
    Set photos = prop("standardPhotos")
    If photos.Count = 0 Then Exit Sub

    ' 定形写真シートを取得
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = Worksheets("定形写真")
    On Error GoTo ErrHandler
    If ws Is Nothing Then
        DataImport.m_ErrorLog.Add "定形写真シートが見つかりません"
        Exit Sub
    End If

    ' シート保護解除
    On Error Resume Next
    ws.Unprotect Password:=DataImport.SHEET_PW
    On Error GoTo ErrHandler

    ' マッピング取得
    Dim photoMap As Object
    Set photoMap = GetStandardPhotoMapping()

    ' 各写真を処理
    Dim i As Long
    For i = 1 To photos.Count
        Dim photo As Object
        Set photo = photos(i)

        If photo.Exists("photoType") And photo.Exists("imageData") Then
            Dim pType As Long
            pType = CLng(photo("photoType"))

            ' マッピングからセルアドレスを取得
            If photoMap.Exists(pType) Then
                Dim targetCell As String
                targetCell = photoMap(pType)

                Dim imgData As String
                imgData = CStr(photo("imageData"))

                If imgData <> "" Then
                    ' Base64デコードして一時ファイルに保存
                    Dim imgPath As String
                    imgPath = DataImport.DecodeBase64ToTempFile(imgData)

                    If imgPath <> "" Then
                        ' 画像をセルに挿入
                        DataImportDefects.InsertImageToCell ws, imgPath, targetCell
                    End If
                End If
            End If
        End If
    Next i

    ' シート再保護
    On Error Resume Next
    ws.Protect Password:=DataImport.SHEET_PW
    On Error GoTo 0

    Exit Sub

ErrHandler:
    DataImport.m_ErrorLog.Add "定形写真インポートエラー: " & Err.Description
    ' シート再保護（エラー時も確実に）
    On Error Resume Next
    ws.Protect Password:=DataImport.SHEET_PW
    On Error GoTo 0
End Sub
"""


def main():
    # 1. CP932で読み込み
    with open(BAS_PATH, "rb") as f:
        raw = f.read()

    # 2. 改行を正規化（\r\r\n → \n）
    content = raw.decode("cp932")
    content = content.replace("\r\r\n", "\n").replace("\r\n", "\n").replace("\r", "\n")

    # 3. 末尾の空行を削除してからコードを追加
    content = content.rstrip("\n")

    # 4. 新しいコードを追加
    content += NEW_CODE

    # 末尾に改行を1つ追加
    content = content.rstrip("\n") + "\n"

    # 5. \r\r\n に変換してCP932で書き込み
    content = content.replace("\n", "\r\r\n")

    with open(BAS_PATH, "wb") as f:
        f.write(content.encode("cp932"))

    print(f"OK: {BAS_PATH} に GetStandardPhotoMapping / ImportStandardPhotos を追加しました。")


if __name__ == "__main__":
    main()
