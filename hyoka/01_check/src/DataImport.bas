Attribute VB_Name = "DataImport"

'' =============================================
'' DataImport メインモジュール - エントリポイント＋基盤関数
'' =============================================

Option Explicit

'' =============================================
'' 定数定義（Public: 他モジュールから参照）
'' =============================================
Public Const SHEET_PW As String = "2025Ken0129ken"
Public Const SURVEY_SHEET As String = "現地調査"
Public Const MAPPING_SHEET As String = "マッピング"
Public Const DESKTOP_SHEET As String = "机上チェックシート"
Public Const TEMPLATE_C As String = "評価c劣化事象"      ' Sheet3テンプレート
Public Const TEMPLATE_B2 As String = "評価b2劣化事象"    ' Sheet4テンプレート
Public Const MAX_IMAGES_PER_SHEET As Long = 18
Public Const PIN_SIZE As Double = 14   ' ピンマーカーサイズ(pt)
Public Const THUMBNAIL_W As Double = 120 ' サムネイル幅(pt)
Public Const THUMBNAIL_H As Double = 90  ' サムネイル高(pt)
Public Const BP_MAX_W As Double = 500  ' 図面最大幅(pt)
Public Const BP_MAX_H As Double = 400  ' 図面最大高(pt)

'' エラーログ（Public: 他モジュールから参照）
Public m_ErrorLog As Collection
'' 一時フォルダパス（Public: 他モジュールから参照）
Public m_TempFolder As String
'' 画像フォルダパス（ZIP展開済みフォルダ）
Public m_ImageFolder As String

'' メインエントリポイント

'' =============================================

Public Sub ImportJsonData()

    Dim startTime As Double

    startTime = Timer



    ' エラーログ初期化

    Set m_ErrorLog = New Collection



    ' ファイル選択

    Dim jsonFilePath As String

    jsonFilePath = SelectJsonFile()
    If jsonFilePath = "" Then Exit Sub

    ' 画像フォルダパスを設定（data.jsonの親フォルダ）
    #If Mac Then
        Dim lastSlash As Long
        lastSlash = InStrRev(jsonFilePath, "/")
        If lastSlash > 0 Then m_ImageFolder = Left(jsonFilePath, lastSlash - 1)
    #Else
        Dim lastBackslash As Long
        Dim pathSep As String
        pathSep = Chr(92)
        lastBackslash = InStrRev(jsonFilePath, pathSep)
        If lastBackslash > 0 Then
            m_ImageFolder = Left(jsonFilePath, lastBackslash - 1)
        Else
            m_ImageFolder = Left(jsonFilePath, InStrRev(jsonFilePath, "/") - 1)
        End If
    #End If

    ' 確認ダイアログ

    If MsgBox("選択したJSONファイルからデータを取り込みます。" & vbCrLf & _
              jsonFilePath & vbCrLf & vbCrLf & _
              "既存の入力データは上書きされます。" & vbCrLf & _
              "実行してもよろしいですか？", _
              vbYesNo + vbExclamation + vbDefaultButton2, _
              "JSONデータ取り込み確認") = vbNo Then

        Exit Sub

    End If



    ' 画面更新停止

    Application.ScreenUpdating = False

    Application.EnableEvents = False

    Application.Calculation = xlCalculationManual



    ' DEBUGOFF On Error GoTo 0
    Dim currentPhase As String
    currentPhase = "初期化"



    ' 一時フォルダ作成

    CreateTempFolder



    ' JSON読み込み＆解析

    Application.StatusBar = "JSONファイルを読み込み中..."

    Dim jsonText As String

    jsonText = ReadUtf8File(jsonFilePath)

    ' BOM除去 (ADODB.StreamがUTF-8 BOMをU+FEFFとして残す場合がある)
    If Len(jsonText) > 0 Then
        If AscW(Left(jsonText, 1)) = &HFEFF Then
            jsonText = Mid(jsonText, 2)
        End If
    End If



    Dim jsonData As Object

    Set jsonData = JsonConverter.ParseJson(jsonText)



    ' シート保護解除

    Application.StatusBar = "シート保護を解除中..."

    UnprotectAllSheets



    ' Phase 3: 現地調査シートへの入力

    Application.StatusBar = "現地調査シートにデータを入力中..."

    currentPhase = "Phase3: 現地調査シート"
    ImportToOnsiteSurveySheet jsonData



    ' Phase 4: 劣化事象シート作成

    Application.StatusBar = "劣化事象シートを作成中..."

    currentPhase = "Phase4: 劣化事象シート"
    CreateDefectSheets jsonData



    ' Phase 5: キープランシート作成

    Application.StatusBar = "キープランシートを作成中..."

    currentPhase = "Phase5: キープランシート"
    CreateKeyPlanSheets jsonData



    ' Phase 6: 定型写真シートへの入力

    Application.StatusBar = "定型写真を入力中..."

    currentPhase = "Phase6: 定型写真"
    ImportStandardPhotos jsonData





    ' シート再保護
    currentPhase = "後処理: シート再保護"
    ReprotectAllSheets

    ' シート並べ替え
    currentPhase = "後処理: シート並べ替え"
    ArrangeSheets

    ' 一時ファイル削除
    CleanupTempFiles

    ' 画面更新復帰
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    Application.Calculation = xlCalculationAutomatic
    Application.StatusBar = False

    ' 完了メッセージ
    Dim elapsedSec As Double
    elapsedSec = Timer - startTime
    Dim resultMsg As String
    resultMsg = "JSONデータの読み込みが完了しました。" & vbCrLf & _
               "処理時間: " & Format(elapsedSec, "0.0") & " 秒"

    If m_ErrorLog.Count > 0 Then
        resultMsg = resultMsg & vbCrLf & vbCrLf & _
                   "警告: " & m_ErrorLog.Count & " 件のエラーがありました。"
        Dim e As Long
        For e = 1 To m_ErrorLog.Count
            resultMsg = resultMsg & vbCrLf & "  - " & m_ErrorLog(e)
            If e >= 10 Then
                resultMsg = resultMsg & vbCrLf & "  ... 他 " & (m_ErrorLog.Count - 10) & " 件"
                Exit For
            End If
        Next e
    End If

    MsgBox resultMsg, vbInformation, "処理完了"



    ' 現地調査シートをアクティブに

    On Error Resume Next

    Worksheets(SURVEY_SHEET).Activate

    On Error GoTo 0



    Exit Sub



ErrorHandler:
    ' エラー情報を保存（クリーンアップでErrがクリアされるため）
    Dim errMsg As String
    Dim errNum As Long
    errMsg = Err.Description
    errNum = Err.Number
    If errMsg = "" Then errMsg = "不明なエラー"

    ' エラー時のクリーンアップ
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    Application.Calculation = xlCalculationAutomatic
    Application.StatusBar = False

    ' シート再保護（エラー時も確実に）
    On Error Resume Next
    ReprotectAllSheets
    CleanupTempFiles
    On Error GoTo 0

    MsgBox "エラーが発生しました: " & vbCrLf & vbCrLf & _
           "フェーズ: " & currentPhase & vbCrLf & _
           "エラー番号: " & errNum & vbCrLf & _
           "内容: " & errMsg, vbCritical, "エラー"

End Sub



'' =============================================

'' Phase 1: 基盤関数

'' =============================================




Public Function SelectJsonFile() As String
    Dim filePath As Variant

    #If Mac Then
        Dim script As String
        Dim result As String
        
        ' まずAppleScriptでPOSIXパスを取得
        script = "set f to choose file with prompt ""JSONデータファイルを選択してください""" & Chr(10) & "return POSIX path of f"
        
        On Error Resume Next
        result = MacScript(script)
        On Error GoTo 0
        
        ' 末尾の改行・空白を除去
        result = Replace(result, vbLf, "")
        result = Replace(result, vbCr, "")
        result = Trim(result)
        
        If result = "" Then
            filePath = False
        Else
            filePath = result
        End If
    #Else
        filePath = Application.GetOpenFilename( _
            FileFilter:="JSONファイル (*.json),*.json", _
            Title:="JSONデータファイルを選択してください")
    #End If

    If filePath = False Then
        SelectJsonFile = ""
    Else
        SelectJsonFile = CStr(filePath)
    End If
End Function




'' POSIXパスをMac形式パスに変換（日本語パス対応）
Public Function ConvertPosixToMacPath(posixPath As String) As String
    #If Mac Then
        ' 方法1: AppleScriptで変換（日本語パスはエスケープが必要）
        Dim script As String
        script = "set p to """ & posixPath & """" & Chr(10) & _
                 "return POSIX file p as text"
        On Error Resume Next
        Dim result As String
        result = MacScript(script)
        On Error GoTo 0
        
        If result <> "" Then
            ConvertPosixToMacPath = result
            Exit Function
        End If
        
        ' 方法2: 手動変換 /Users/... → Macintosh HD:Users:...
        Dim macPath As String
        macPath = posixPath
        If Left(macPath, 1) = "/" Then macPath = Mid(macPath, 2)
        macPath = Replace(macPath, "/", ":")
        macPath = "Macintosh HD:" & macPath
        ConvertPosixToMacPath = macPath
    #Else
        ConvertPosixToMacPath = posixPath
    #End If
End Function

Public Function ReadUtf8File(ByVal filePath As String) As String

    #If Mac Then
        ' Mac: シェルコマンドでファイル読み込み（日本語パス対応）
        Dim shellCmd As String
        Dim shellScript As String
        shellScript = "do shell script ""cat '" & filePath & "'"""
        Dim fileContent As String
        On Error Resume Next
        fileContent = MacScript(shellScript)
        On Error GoTo 0
        
        If fileContent <> "" Then
            ' BOM除去
            If Left(fileContent, 1) = Chr(&HFEFF) Then
                fileContent = Mid(fileContent, 2)
            End If
            ReadUtf8File = fileContent
            Exit Function
        End If
        
        ' フォールバック: VBAのOpenを試行
        Dim macPath As String
        macPath = ConvertPosixToMacPath(filePath)
        If macPath = "" Then macPath = filePath

        Dim fileNum As Integer
        fileNum = FreeFile
        Dim fileData() As Byte

        Open macPath For Binary Access Read As #fileNum

        ReDim fileData(LOF(fileNum) - 1)

        Get #fileNum, , fileData

        Close #fileNum



        ' UTF-8 BOMスキップ（先頭3バイトが EF BB BF の場合）

        Dim startPos As Long

        startPos = 0

        If UBound(fileData) >= 2 Then

            If fileData(0) = &HEF And fileData(1) = &HBB And fileData(2) = &HBF Then

                startPos = 3

            End If

        End If



        ' バイト配列→文字列変換（UTF-8）

        If startPos > 0 Then

            Dim trimmedData() As Byte

            ReDim trimmedData(UBound(fileData) - startPos)

            Dim i As Long

            For i = startPos To UBound(fileData)

                trimmedData(i - startPos) = fileData(i)

            Next i

            ReadUtf8File = StrConv(trimmedData, vbUnicode)

        Else

            ReadUtf8File = StrConv(fileData, vbUnicode)

        End If

    #Else

        ' Windows: ADODB.Stream使用

        Dim stream As Object

        Set stream = CreateObject("ADODB.Stream")



        stream.Type = 2 ' adTypeText

        stream.Charset = "UTF-8"

        stream.Open

        stream.LoadFromFile filePath
        ReadUtf8File = stream.ReadText
        stream.Close
        Set stream = Nothing

    #End If

End Function




Public Sub CreateTempFolder()

    #If Mac Then

        m_TempFolder = Environ("TMPDIR") & "KennetImport_" & Format(Now, "yyyymmdd_hhnnss")

        MacScript "do shell script ""mkdir -p '" & m_TempFolder & "'"""

    #Else

        m_TempFolder = Environ("TEMP") & Chr(92) & "KennetImport_" & Format(Now, "yyyymmdd_hhnnss")

        Dim fso As Object

        Set fso = CreateObject("Scripting.FileSystemObject")

        If Not fso.FolderExists(m_TempFolder) Then

            fso.CreateFolder m_TempFolder

        End If

        Set fso = Nothing

    #End If

End Sub




Public Sub CleanupTempFiles()

    On Error Resume Next

    If m_TempFolder <> "" Then

        #If Mac Then

            MacScript "do shell script ""rm -rf '" & m_TempFolder & "'"""

        #Else

            Dim fso As Object

            Set fso = CreateObject("Scripting.FileSystemObject")

            If fso.FolderExists(m_TempFolder) Then

                fso.DeleteFolder m_TempFolder, True

            End If

            Set fso = Nothing

        #End If

    End If

    On Error GoTo 0

End Sub




Public Sub UnprotectAllSheets()

    Dim ws As Worksheet

    On Error Resume Next

    For Each ws In ThisWorkbook.Worksheets

        ws.Unprotect Password:=SHEET_PW

    Next ws

    On Error GoTo 0

End Sub




Public Sub ReprotectAllSheets()

    '' 保護対象は「机上チェックシート」と「現地調査」のみ
    Dim targetNames As Variant
    targetNames = Array("机上チェックシート", "現地調査")

    On Error Resume Next

    Dim i As Long
    For i = LBound(targetNames) To UBound(targetNames)
        Dim ws As Worksheet
        Set ws = Nothing
        Set ws = ThisWorkbook.Worksheets(targetNames(i))
        If Not ws Is Nothing Then
            ws.Protect Password:=SHEET_PW
        End If
    Next i

    On Error GoTo 0

End Sub



'' Base64デコード → 一時ファイルに保存してパスを返す


'' 画像ファイルの相対パスをフルパスに変換
'' imageFile: ZIP内の相対パス（例: "事象写真/外部1_地盤_c_001.jpg"）
'' m_ImageFolderと結合してフルパスを返す
Public Function ResolveImagePath(imageFile As String) As String
    If imageFile = "" Then
        ResolveImagePath = ""
        Exit Function
    End If
    
    Dim fullPath As String
    #If Mac Then
        ' Mac: POSIXパスで結合
        fullPath = m_ImageFolder & "/" & Replace(imageFile, "\", "/")
        ' Mac形式パス（Dir/Open用）とPOSIXパス（AddPicture用）の両方を試す
        ' AddPictureはMac Excel 2016+ではPOSIXパスを受け付ける
        ResolveImagePath = fullPath
    #Else
        Dim sep As String
        sep = Chr(92)
        fullPath = m_ImageFolder & sep & Replace(imageFile, "/", sep)
        ResolveImagePath = fullPath
    #End If
End Function


Public Function DecodeBase64ToTempFile(ByVal base64Data As String, Optional ByVal fileExt As String = ".png") As String

    On Error GoTo ErrHandler



    ' data:image/xxx;base64, プレフィックスを除去

    Dim commaPos As Long

    commaPos = InStr(base64Data, ",")

    If commaPos > 0 Then

        ' 拡張子をMIMEタイプから判定

        Dim mimeStr As String

        mimeStr = Left(base64Data, commaPos - 1)

        If InStr(mimeStr, "jpeg") > 0 Or InStr(mimeStr, "jpg") > 0 Then

            fileExt = ".jpg"

        ElseIf InStr(mimeStr, "webp") > 0 Then

            fileExt = ".webp"

        ElseIf InStr(mimeStr, "gif") > 0 Then

            fileExt = ".gif"

        End If

        base64Data = Mid(base64Data, commaPos + 1)

    End If



    ' 一時ファイルパス

    Dim tempPath As String

    Dim sep As String

    #If Mac Then

        sep = "/"

    #Else

        sep = Chr(92)

    #End If

    tempPath = m_TempFolder & sep & "img_" & Format(Now, "hhnnss") & "_" & Int(Rnd * 100000) & fileExt



    #If Mac Then
        ' Mac: VBAのOpenはMac形式パスが必要なので変換して書き込み
        Dim tmpB64 As String
        tmpB64 = tempPath & ".b64"
        Dim macTmpB64 As String
        macTmpB64 = ConvertPosixToMacPath(tmpB64)
        
        ' Base64テキストを一時ファイルに書き込み（Mac形式パス使用）
        Dim fn1 As Integer
        fn1 = FreeFile
        Open macTmpB64 For Output As #fn1
        Print #fn1, base64Data
        Close #fn1
        
        ' base64 -Dコマンドでデコード（POSIXパス使用）
        Dim decodeCmd As String
        decodeCmd = "base64 -D -i '" & tmpB64 & "' -o '" & tempPath & "'"
        MacScript "do shell script """ & decodeCmd & """"
        
        ' 一時b64ファイル削除
        On Error Resume Next
        Kill macTmpB64
        On Error GoTo ErrHandler

    #Else

        ' Windows: MSXML2.DOMDocumentでBase64デコード

        Dim xmlDoc As Object

        Set xmlDoc = CreateObject("MSXML2.DOMDocument")



        Dim xmlNode As Object

        Set xmlNode = xmlDoc.createElement("b64")

        xmlNode.DataType = "bin.base64"

        xmlNode.Text = base64Data



        ' バイト配列を取得

        Dim binaryData() As Byte

        binaryData = xmlNode.nodeTypedValue



        ' 一時ファイルに書き込み

        Dim fileNum As Integer

        fileNum = FreeFile

        Open tempPath For Binary Access Write As #fileNum

        Put #fileNum, , binaryData

        Close #fileNum

    #End If



    ' WebP→JPEG変換が必要な場合

    If fileExt = ".webp" Then

        Dim jpegPath As String

        jpegPath = ConvertWebpToJpeg(tempPath)

        If jpegPath <> "" Then

            tempPath = jpegPath

        End If

    End If



    DecodeBase64ToTempFile = tempPath

    Exit Function



ErrHandler:

    m_ErrorLog.Add "Base64デコードエラー: " & Err.Description

    DecodeBase64ToTempFile = ""

End Function



'' WebP → JPEG変換


Public Function ConvertWebpToJpeg(ByVal webpPath As String) As String

    On Error GoTo ErrHandler



    Dim jpegPath As String

    jpegPath = Replace(webpPath, ".webp", ".jpg")



    #If Mac Then

        ' Mac: sipsコマンドで変換

        Dim cmd As String

        cmd = "sips -s format jpeg """ & webpPath & """ --out """ & jpegPath & """"

        MacScript "do shell script """ & Replace(cmd, """", "\""") & """"



        ' 元のWebPファイルを削除

        On Error Resume Next

        Kill webpPath

        On Error GoTo ErrHandler

    #Else

        ' Windows: WIA.ImageFile使用

        Dim img As Object

        Set img = CreateObject("WIA.ImageFile")

        img.LoadFile webpPath



        Dim ip As Object

        Set ip = CreateObject("WIA.ImageProcess")

        ip.Filters.Add ip.FilterInfos("Convert").FilterID

        ip.Filters(1).Properties("FormatID") = "{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}" ' JPEG

        ip.Filters(1).Properties("Quality") = 85



        Dim resultImg As Object

        Set resultImg = ip.Apply(img)



        ' 既存ファイルを削除

        Dim fso As Object

        Set fso = CreateObject("Scripting.FileSystemObject")

        If fso.FileExists(jpegPath) Then fso.DeleteFile jpegPath



        resultImg.SaveFile jpegPath



        ' 元のWebPファイルを削除

        If fso.FileExists(webpPath) Then fso.DeleteFile webpPath

    #End If



    ConvertWebpToJpeg = jpegPath

    Exit Function



ErrHandler:

    m_ErrorLog.Add "WebP変換エラー (ファイル直接使用を試行): " & Err.Description

    ConvertWebpToJpeg = ""

End Function



'' 結合セル対応の値設定


Public Sub SetCellValueSafe(ws As Worksheet, cellAddress As String, cellValue As Variant)

    On Error Resume Next



    Dim targetRange As Range

    Set targetRange = ws.Range(cellAddress)



    If targetRange.MergeCells Then

        targetRange.mergeArea.Cells(1, 1).Value = cellValue

    Else

        targetRange.Value = cellValue

    End If



    On Error GoTo 0

End Sub


'' セルアドレスの行番号をオフセット


'' =============================================

'' Phase 2: マッピングシート参照

''

'' 「マッピング」シート（非表示）から各テーブルを読み取り

'' CellAddressCollector.bas で作成・入力されたデータを使用

'' =============================================



'' マッピングシートの存在チェック


Public Function GetMappingSheet() As Worksheet

    On Error Resume Next

    Set GetMappingSheet = Worksheets(MAPPING_SHEET)

    On Error GoTo 0



    If GetMappingSheet Is Nothing Then

        m_ErrorLog.Add "マッピングシートが見つかりません。CellAddressCollector.CreateMappingSheet を実行してください。"

    End If

End Function



'' テーブルA: item番号 → b2評価セル(W列) のマッピングを返す


Public Sub CreateImportButton()

    Dim ws As Worksheet

    On Error Resume Next

    Set ws = Worksheets(SURVEY_SHEET)

    On Error GoTo 0



    If ws Is Nothing Then

        MsgBox "「" & SURVEY_SHEET & "」シートが見つかりません。", vbCritical

        Exit Sub

    End If



    ' シート保護解除

    On Error Resume Next

    ws.Unprotect Password:=SHEET_PW

    On Error GoTo 0



    ' 既存のボタンがあれば削除

    Dim shp As Shape

    For Each shp In ws.Shapes

        If shp.Name = "btnImportJson" Then

            shp.Delete

            Exit For

        End If

    Next shp



    ' ボタン作成

    Dim btn As Shape

    Set btn = ws.Shapes.AddShape(msoShapeRoundedRectangle, 10, 10, 180, 30)

    btn.Name = "btnImportJson"

    btn.TextFrame.Characters.Text = "JSONデータ取り込み"

    btn.TextFrame.Characters.Font.Size = 11

    btn.TextFrame.Characters.Font.Bold = True

    btn.TextFrame.Characters.Font.Color = RGB(255, 255, 255)

    btn.TextFrame.HorizontalAlignment = xlHAlignCenter

    btn.TextFrame.VerticalAlignment = xlVAlignCenter

    btn.Fill.ForeColor.RGB = RGB(5, 150, 105) ' emerald-600

    btn.Line.Visible = msoFalse



    ' マクロ割り当て

    btn.OnAction = "DataImport.ImportJsonData"



    ' シート再保護

    On Error Resume Next

    ws.Protect Password:=SHEET_PW

    On Error GoTo 0



    MsgBox "「JSONデータ取り込み」ボタンを配置しました。", vbInformation

End Sub


'' シート並べ替え
'' 指定の順序にシートタブを整列する
Public Sub ArrangeSheets()
    On Error Resume Next
    Dim ws As Worksheet
    Dim i As Long
    Dim pos As Long
    pos = 0

    ' 1. 固定シート: 机上チェックシート、現地調査、定型写真
    Dim fixedNames As Variant
    fixedNames = Array("机上チェックシート", "現地調査", "定型写真")
    Dim fn As Variant
    For Each fn In fixedNames
        Set ws = Nothing
        Set ws = Worksheets(CStr(fn))
        If Not ws Is Nothing Then
            pos = pos + 1
            ws.Move Before:=Worksheets(pos)
        End If
    Next fn

    ' 2. 評価c劣化事象_* シート群
    Dim names() As String
    Dim cnt As Long

    ' c劣化事象
    cnt = 0
    ReDim names(0)
    For Each ws In Worksheets
        If Left(ws.Name, 7) = "評価c劣化事象" Then
            cnt = cnt + 1
            ReDim Preserve names(cnt)
            names(cnt) = ws.Name
        End If
    Next ws
    If cnt > 0 Then
        SortStringArray names, 1, cnt
        For i = 1 To cnt
            Worksheets(names(i)).Move After:=Worksheets(pos + i - 1)
        Next i
        pos = pos + cnt
    End If

    ' 3. 評価「c」写真キープラン_* シート群
    cnt = 0
    ReDim names(0)
    For Each ws In Worksheets
        If Left(ws.Name, 12) = "評価「c」写真キープラン" Then
            cnt = cnt + 1
            ReDim Preserve names(cnt)
            names(cnt) = ws.Name
        End If
    Next ws
    If cnt > 0 Then
        SortStringArray names, 1, cnt
        For i = 1 To cnt
            Worksheets(names(i)).Move After:=Worksheets(pos + i - 1)
        Next i
        pos = pos + cnt
    End If

    ' 4. 評価b2劣化事象_* シート群
    cnt = 0
    ReDim names(0)
    For Each ws In Worksheets
        If Left(ws.Name, 8) = "評価b2劣化事象" Then
            cnt = cnt + 1
            ReDim Preserve names(cnt)
            names(cnt) = ws.Name
        End If
    Next ws
    If cnt > 0 Then
        SortStringArray names, 1, cnt
        For i = 1 To cnt
            Worksheets(names(i)).Move After:=Worksheets(pos + i - 1)
        Next i
        pos = pos + cnt
    End If

    ' 5. 評価「b2」写真キープラン_* シート群
    cnt = 0
    ReDim names(0)
    For Each ws In Worksheets
        If Left(ws.Name, 13) = "評価「b2」写真キープラン" Then
            cnt = cnt + 1
            ReDim Preserve names(cnt)
            names(cnt) = ws.Name
        End If
    Next ws
    If cnt > 0 Then
        SortStringArray names, 1, cnt
        For i = 1 To cnt
            Worksheets(names(i)).Move After:=Worksheets(pos + i - 1)
        Next i
        pos = pos + cnt
    End If

    ' 6. マッピング
    Set ws = Nothing
    Set ws = Worksheets("マッピング")
    If Not ws Is Nothing Then
        pos = pos + 1
        ws.Move After:=Worksheets(pos - 1)
    End If

    ' 7. KPマッピング
    Set ws = Nothing
    Set ws = Worksheets("KPマッピング")
    If Not ws Is Nothing Then
        pos = pos + 1
        ws.Move After:=Worksheets(pos - 1)
    End If

    On Error GoTo 0
End Sub

'' 文字列配列のバブルソート（1-based）
Private Sub SortStringArray(arr() As String, lb As Long, ub As Long)
    Dim i As Long
    Dim j As Long
    Dim tmp As String
    For i = lb To ub - 1
        For j = lb To ub - (i - lb) - 1
            If arr(j) > arr(j + 1) Then
                tmp = arr(j)
                arr(j) = arr(j + 1)
                arr(j + 1) = tmp
            End If
        Next j
    Next i
End Sub
