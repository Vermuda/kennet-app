Attribute VB_Name = "DataResetSurvey"
'' =============================================
'' DataResetSurvey - マッピングセルの初期化
'' テスト用: マッピングシートのセルアドレスを参照し
'' チェック欄は□、テキスト/数値欄は空に戻す
'' =============================================

Option Explicit

'' チェック欄のリセット値
Private Const CHECK_EMPTY As String = "□"

Public Sub ResetAllMappedCells()
    If MsgBox("マッピングシートに登録された全セルを初期状態に戻します。" & vbCrLf & _
              "チェック欄→□、テキスト/数値→空" & vbCrLf & vbCrLf & _
              "実行しますか？", vbYesNo + vbQuestion, "セル初期化") = vbNo Then
        Exit Sub
    End If

    Application.ScreenUpdating = False
    Application.EnableEvents = False

    Dim mapWs As Worksheet
    On Error Resume Next
    Set mapWs = Worksheets(DataImport.MAPPING_SHEET)
    On Error GoTo 0
    If mapWs Is Nothing Then
        MsgBox "マッピングシートが見つかりません。", vbCritical
        Exit Sub
    End If

    ' シート保護解除
    DataImport.UnprotectAllSheets

    Dim ws As Worksheet
    Set ws = Worksheets(DataImport.SURVEY_SHEET)

    Dim resetCount As Long
    resetCount = 0

    ' === テーブルA: 評価セル (列2-9) ===
    Dim r As Long
    r = 3
    Do While mapWs.Cells(r, 1).Value <> ""
        Dim c As Long
        For c = 2 To 9
            If mapWs.Cells(r, c).Value <> "" Then
                Dim cAddr As String
                cAddr = CStr(mapWs.Cells(r, c).Value)
                Dim itemKey As String
                itemKey = CStr(mapWs.Cells(r, 1).Value)
                ' item97-101(懸念テキスト X列)は空にする
                ' item38のY列はスキップ（高さラベルのため）
                If itemKey = "item38" And Left(cAddr, 1) = "Y" Then
                    ' スキップ
                ElseIf Left(cAddr, 1) = "X" Then
                    ResetCell ws, cAddr, False
                Else
                    ResetCell ws, cAddr, True
                End If
                resetCount = resetCount + 1
            End If
        Next c
        r = r + 1
    Loop

    ' === テーブルB: グループ有無 (列12-13) ===
    r = 3
    Do While mapWs.Cells(r, 11).Value <> ""
        If mapWs.Cells(r, 13).Value <> "" Then
            ResetCell ws, CStr(mapWs.Cells(r, 13).Value), True
            resetCount = resetCount + 1
        End If
        If mapWs.Cells(r, 14).Value <> "" Then
            ResetCell ws, CStr(mapWs.Cells(r, 14).Value), True
            resetCount = resetCount + 1
        End If
        r = r + 1
    Loop

    ' === テーブルC: オプション選択 (列16=セルアドレス) ===
    r = 3
    Do While mapWs.Cells(r, 15).Value <> ""
        If mapWs.Cells(r, 17).Value <> "" Then
            Dim optKey As String
            optKey = CStr(mapWs.Cells(r, 15).Value)
            ' _text/_reason で終わるキーはテキストリセット、それ以外はチェックリセット
            If Right(optKey, 5) = "_text" Or Right(optKey, 7) = "_reason" Then
                ResetCell ws, CStr(mapWs.Cells(r, 17).Value), False
            Else
                ResetCell ws, CStr(mapWs.Cells(r, 17).Value), True
            End If
            resetCount = resetCount + 1
        End If
        r = r + 1
    Loop

    ' === テーブルD: メンテナンス (列20-23) ===
    r = 3
    Do While mapWs.Cells(r, 19).Value <> ""
        For c = 20 To 23
            If mapWs.Cells(r, c).Value <> "" Then
                ResetCell ws, CStr(mapWs.Cells(r, c).Value), True
                resetCount = resetCount + 1
            End If
        Next c
        r = r + 1
    Loop

    ' === テーブルE: カテゴリ調査状況 (列25-28) ===
    r = 3
    Do While mapWs.Cells(r, 25).Value <> ""
        For c = 26 To 27
            If mapWs.Cells(r, c).Value <> "" Then
                ResetCell ws, CStr(mapWs.Cells(r, c).Value), True
                resetCount = resetCount + 1
            End If
        Next c
        ' 列28=不可理由はテキスト
        If mapWs.Cells(r, 28).Value <> "" Then
            ResetCell ws, CStr(mapWs.Cells(r, 28).Value), False
            resetCount = resetCount + 1
        End If
        r = r + 1
    Loop

    ' === テーブルF: 項目調査実施状況 (列29-33) ===
    r = 3
    Do While mapWs.Cells(r, 29).Value <> ""
        For c = 30 To 33
            If mapWs.Cells(r, c).Value <> "" Then
                ResetCell ws, CStr(mapWs.Cells(r, c).Value), True
                resetCount = resetCount + 1
            End If
        Next c
        r = r + 1
    Loop

    ' === テーブルG: 資料値・実測値 (列37-38) ===
    r = 3
    Do While mapWs.Cells(r, 36).Value <> ""
        For c = 37 To 38
            If mapWs.Cells(r, c).Value <> "" Then
                ResetCell ws, CStr(mapWs.Cells(r, c).Value), False
                resetCount = resetCount + 1
            End If
        Next c
        r = r + 1
    Loop

    ' === テーブルH: 物件基本情報 (列41) ===
    r = 3
    Do While mapWs.Cells(r, 40).Value <> ""
        If mapWs.Cells(r, 42).Value <> "" Then
            ResetCell ws, CStr(mapWs.Cells(r, 42).Value), False
            resetCount = resetCount + 1
        End If
        r = r + 1
    Loop

    ' === テーブルI: 備考 (列45) ===
    r = 3
    Do While mapWs.Cells(r, 44).Value <> ""
        If mapWs.Cells(r, 45).Value <> "" Then
            ResetCell ws, CStr(mapWs.Cells(r, 45).Value), False
            resetCount = resetCount + 1
        End If
        r = r + 1
    Loop

    ' === テーブルJ: 定型写真 (列49=画像セル) ===
    ' 画像は削除ではなくスキップ（別途対応）

    ' シート再保護
    DataImport.ReprotectAllSheets

    Application.ScreenUpdating = True
    Application.EnableEvents = True

    MsgBox "初期化完了: " & resetCount & " セルをリセットしました。", vbInformation, "完了"
End Sub

'' セルをリセット
'' isCheck=True: □に戻す, isCheck=False: 空に戻す
Private Sub ResetCell(ws As Worksheet, cellAddress As String, isCheck As Boolean)
    On Error Resume Next
    Dim targetRange As Range
    Set targetRange = ws.Range(cellAddress)
    If targetRange Is Nothing Then Exit Sub

    If targetRange.MergeCells Then
        If isCheck Then
            targetRange.MergeArea.Cells(1, 1).Value = CHECK_EMPTY
        Else
            targetRange.MergeArea.Cells(1, 1).Value = ""
        End If
    Else
        If isCheck Then
            targetRange.Value = CHECK_EMPTY
        Else
            targetRange.Value = ""
        End If
    End If
    On Error GoTo 0
End Sub
