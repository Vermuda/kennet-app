Attribute VB_Name = "DataImportDefects"

'' =============================================
'' DataImportDefects - 不具合シート作成
'' =============================================

Option Explicit

'' =============================================
'' 不具合（劣化事象）シートの作成
'' b2/c評価の不具合データをテンプレートシートにコピーして展開
'' =============================================

Public Sub CreateDefectSheets(jsonData As Object)

    ' 不具合データが存在しない場合はスキップ

    If Not jsonData.Exists("defects") Then Exit Sub



    Dim defects As Object

    Set defects = jsonData("defects")

    If defects.Count = 0 Then Exit Sub



    ' 図面→階層マップを構築

    Dim bpFloorMap As Object ' blueprintId → floorName

    Set bpFloorMap = BuildBlueprintFloorMap(jsonData)



    ' マーカー→図面マップを構築

    Dim markerBpMap As Object ' markerId → blueprintId

    Set markerBpMap = BuildMarkerBlueprintMap(jsonData)



    ' 検査データマップ構築（評価値取得用）

    Dim inspectionMap As Object

    Set inspectionMap = BuildInspectionMap(jsonData)



    ' 不具合を分類: カテゴリ(c/b2) × 階層名

    Dim cDefects As Object  ' floorName → Collection of defects

    Set cDefects = New Dictionary



    Dim b2Defects As Object

    Set b2Defects = New Dictionary



    Dim i As Long

    For i = 1 To defects.Count

        Dim defect As Object

        Set defect = defects(i)



        ' 階層名を取得

        Dim floorName As String

        floorName = GetDefectFloorName(defect, markerBpMap, bpFloorMap)

        If floorName = "" Then floorName = "不明"



        ' 評価を取得

        Dim evalValue As String

        evalValue = GetDefectEvaluation(defect, inspectionMap)



        ' 分類

        If evalValue = "c" Then

            AddDefectToCategory cDefects, floorName, defect

        ElseIf evalValue = "b2" Then

            AddDefectToCategory b2Defects, floorName, defect

        End If

    Next i



    ' 各カテゴリ×階層でシートを作成

    Dim floorKey As Variant



    ' 評価c劣化事象シート

    For Each floorKey In cDefects.Keys

        CreateDefectSheetsForFloor TEMPLATE_C, CStr(floorKey), cDefects(floorKey)

    Next floorKey



    ' 評価b2劣化事象シート

    For Each floorKey In b2Defects.Keys

        CreateDefectSheetsForFloor TEMPLATE_B2, CStr(floorKey), b2Defects(floorKey)

    Next floorKey

End Sub



'' 図面→階層マップ構築


Public Function BuildBlueprintFloorMap(jsonData As Object) As Object

    Dim d As Object

    Set d = New Dictionary



    If Not jsonData.Exists("blueprints") Or Not jsonData.Exists("floors") Then

        Set BuildBlueprintFloorMap = d

        Exit Function

    End If



    ' floors: id → name マップ

    Dim floorMap As Object

    Set floorMap = New Dictionary



    Dim floors As Object

    Set floors = jsonData("floors")

    Dim i As Long

    For i = 1 To floors.Count

        Dim floor As Object

        Set floor = floors(i)

        If floor.Exists("id") And floor.Exists("name") Then

            floorMap.Add floor("id"), floor("name")

        End If

    Next i



    ' blueprints: blueprintId → floorName

    Dim bps As Object

    Set bps = jsonData("blueprints")

    For i = 1 To bps.Count

        Dim bp As Object

        Set bp = bps(i)

        If bp.Exists("id") And bp.Exists("floorId") Then

            Dim bpId As String

            bpId = bp("id")

            Dim floorId As String

            floorId = bp("floorId")

            If floorMap.Exists(floorId) Then

                d(bpId) = floorMap(floorId)

            End If

        End If

    Next i



    Set BuildBlueprintFloorMap = d

End Function



'' マーカー→図面マップ構築


Public Function BuildMarkerBlueprintMap(jsonData As Object) As Object

    Dim d As Object

    Set d = New Dictionary



    If Not jsonData.Exists("markers") Then

        Set BuildMarkerBlueprintMap = d

        Exit Function

    End If



    Dim markers As Object

    Set markers = jsonData("markers")

    Dim i As Long

    For i = 1 To markers.Count

        Dim marker As Object

        Set marker = markers(i)

        If marker.Exists("id") And marker.Exists("blueprintId") Then

            d(marker("id")) = marker("blueprintId")

        End If

    Next i



    Set BuildMarkerBlueprintMap = d

End Function



'' 検査データマップ構築（inspectionId → inspection object）


Public Function BuildInspectionMap(jsonData As Object) As Object

    Dim d As Object

    Set d = New Dictionary



    If Not jsonData.Exists("inspections") Then

        Set BuildInspectionMap = d

        Exit Function

    End If



    Dim inspections As Object

    Set inspections = jsonData("inspections")

    Dim i As Long

    For i = 1 To inspections.Count

        Dim insp As Object

        Set insp = inspections(i)

        If insp.Exists("id") Then

            Set d(insp("id")) = insp

        End If

    Next i



    Set BuildInspectionMap = d

End Function



'' 不具合の階層名を取得


Public Function GetDefectFloorName(defect As Object, markerBpMap As Object, bpFloorMap As Object) As String

    GetDefectFloorName = ""

    ' 新形式: blueprintIdから直接フロア名を取得
    If defect.Exists("blueprintId") Then
        If bpFloorMap.Exists(CStr(defect("blueprintId"))) Then
            GetDefectFloorName = bpFloorMap(CStr(defect("blueprintId")))
            Exit Function
        End If
    End If

    ' 旧形式: markerId経由でフロア名を取得
    If defect.Exists("markerId") Then

        Dim markerId As String

        markerId = defect("markerId")



        If markerBpMap.Exists(markerId) Then

            Dim bpId As String

            bpId = markerBpMap(markerId)



            If bpFloorMap.Exists(bpId) Then

                GetDefectFloorName = bpFloorMap(bpId)

            End If

        End If

    End If

End Function



'' 不具合の評価値を取得


Public Function GetDefectEvaluation(defect As Object, inspectionMap As Object) As String

    GetDefectEvaluation = ""

    ' 新形式: evaluationTypeフィールドから直接取得
    If defect.Exists("evaluationType") Then
        GetDefectEvaluation = CStr(defect("evaluationType"))
        Exit Function
    End If




    ' defectオブジェクトに直接評価が含まれる場合

    If defect.Exists("evaluation") Then

        GetDefectEvaluation = CStr(defect("evaluation"))

        Exit Function

    End If



    ' inspectionIdから検査データを参照

    If defect.Exists("inspectionId") Then

        Dim inspId As String

        inspId = defect("inspectionId")



        If inspectionMap.Exists(inspId) Then

            Dim insp As Object

            Set insp = inspectionMap(inspId)



            If insp.Exists("result") Then

                GetDefectEvaluation = CStr(insp("result"))

            End If

        End If

    End If

End Function



'' カテゴリ辞書に不具合を追加


Public Sub AddDefectToCategory(categoryDict As Object, floorName As String, defect As Object)

    If Not categoryDict.Exists(floorName) Then

        categoryDict.Add floorName, New Collection

    End If

    categoryDict(floorName).Add defect

End Sub



'' 階層ごとの劣化事象シート作成


Public Sub CreateDefectSheetsForFloor(templateName As String, floorName As String, defectList As Collection)

    Dim totalDefects As Long

    totalDefects = defectList.Count



    Dim sheetsNeeded As Long

    sheetsNeeded = Application.WorksheetFunction.Ceiling(totalDefects / MAX_IMAGES_PER_SHEET, 1)

    If sheetsNeeded = 0 Then sheetsNeeded = 1



    Dim sheetIdx As Long

    For sheetIdx = 1 To sheetsNeeded

        ' シート名決定

        Dim newSheetName As String

        newSheetName = templateName & "_" & floorName

        If sheetsNeeded > 1 Then

            newSheetName = newSheetName & "_" & sheetIdx

        End If



        ' 既存シートがあれば削除

        On Error Resume Next

        Dim existingSheet As Worksheet

        Set existingSheet = Worksheets(newSheetName)

        If Not existingSheet Is Nothing Then

            Application.DisplayAlerts = False

            existingSheet.Delete

            Application.DisplayAlerts = True

        End If

        Set existingSheet = Nothing

        On Error GoTo 0



        ' テンプレートシートをコピー

        Dim templateWs As Worksheet

        On Error Resume Next

        Set templateWs = Worksheets(templateName)

        On Error GoTo 0



        If templateWs Is Nothing Then

            m_ErrorLog.Add "テンプレートシート「" & templateName & "」が見つかりません"

            Exit Sub

        End If



        templateWs.Copy After:=Worksheets(Worksheets.Count)

        Dim newWs As Worksheet

        Set newWs = ActiveSheet

        '' テンプレートが非表示でも生成シートは表示する
        newWs.Visible = xlSheetVisible

        ' シート名のサニタイズ
        newSheetName = Replace(newSheetName, ":", "")
        newSheetName = Replace(newSheetName, "/", "")
        newSheetName = Replace(newSheetName, Chr(92), "")
        newSheetName = Replace(newSheetName, "?", "")
        newSheetName = Replace(newSheetName, "*", "")
        newSheetName = Replace(newSheetName, "[", "")
        newSheetName = Replace(newSheetName, "]", "")
        If Len(newSheetName) > 31 Then newSheetName = Left(newSheetName, 31)
        newWs.Name = newSheetName



        ' 保護解除

        On Error Resume Next

        newWs.Unprotect Password:=SHEET_PW

        On Error GoTo 0



        ' 不具合データを入力

        Dim startIdx As Long

        startIdx = (sheetIdx - 1) * MAX_IMAGES_PER_SHEET + 1

        Dim endIdx As Long

        endIdx = Application.WorksheetFunction.Min(sheetIdx * MAX_IMAGES_PER_SHEET, totalDefects)



        InsertDefectsToSheet newWs, defectList, startIdx, endIdx, templateName

    Next sheetIdx

End Sub



'' シートに不具合データを挿入


Public Sub InsertDefectsToSheet(ws As Worksheet, defectList As Collection, startIdx As Long, endIdx As Long, templateName As String)

    ' テーブルKからテンプレートマッピングを取得
    Dim tmplMap As Object
    Set tmplMap = GetDefectTemplateMapping()

    ' テンプレートキーを決定
    Dim tmplKey As String
    Select Case templateName
        Case TEMPLATE_C
            tmplKey = "tmpl_c"
        Case TEMPLATE_B2
            tmplKey = "tmpl_b2"
        Case Else
            tmplKey = "tmpl_c"
    End Select

    ' マッピングからベースセルアドレスを取得（フォールバック付き）
    Dim baseLocationCol As String
    Dim baseComponentCol As String
    Dim baseDeteriorationCol As String
    Dim baseEvalCol As String
    Dim baseRepairCol As String
    Dim baseImgCol As String
    Dim baseLocationRow As Long
    Dim baseComponentRow As Long
    Dim baseDeteriorationRow As Long
    Dim baseEvalRow As Long
    Dim baseRepairRow As Long
    Dim baseImgRow As Long
    Dim baseCatNameCol As String
    Dim baseCatNameRow As Long

    If tmplMap.Exists(tmplKey) Then
        Dim mapping As Object
        Set mapping = tmplMap(tmplKey)

        If mapping.Exists("location") Then
            ParseCellAddress CStr(mapping("location")), baseLocationCol, baseLocationRow
        End If
        If mapping.Exists("component") Then
            ParseCellAddress CStr(mapping("component")), baseComponentCol, baseComponentRow
        End If
        If mapping.Exists("deterioration") Then
            ParseCellAddress CStr(mapping("deterioration")), baseDeteriorationCol, baseDeteriorationRow
        End If
        If mapping.Exists("eval") Then
            ParseCellAddress CStr(mapping("eval")), baseEvalCol, baseEvalRow
        End If
        If mapping.Exists("repair") Then
            ParseCellAddress CStr(mapping("repair")), baseRepairCol, baseRepairRow
        End If
        If mapping.Exists("image") Then
            ParseCellAddress CStr(mapping("image")), baseImgCol, baseImgRow
        End If
        If mapping.Exists("categoryName") Then
            ParseCellAddress CStr(mapping("categoryName")), baseCatNameCol, baseCatNameRow
        End If
    End If

    ' フォールバック: マッピングが空の場合はハードコード値を使用
    If baseLocationCol = "" Then baseLocationCol = "F": baseLocationRow = 4
    If baseComponentCol = "" Then baseComponentCol = "I": baseComponentRow = 4
    If baseDeteriorationCol = "" Then baseDeteriorationCol = "B": baseDeteriorationRow = 5
    If baseEvalCol = "" Then baseEvalCol = "J": baseEvalRow = 5
    If baseImgCol = "" Then baseImgCol = "B": baseImgRow = 8

    ' 右列オフセットの計算（左列と右列の列差分）
    Dim rightLocationCol As String
    Dim rightComponentCol As String
    Dim rightDeteriorationCol As String
    Dim rightEvalCol As String
    Dim rightRepairCol As String
    Dim rightImgCol As String
    rightLocationCol = OffsetColumn(baseLocationCol, 10)    ' 例: F→P
    rightComponentCol = OffsetColumn(baseComponentCol, 10)  ' 例: I→S
    rightDeteriorationCol = OffsetColumn(baseDeteriorationCol, 10) ' 例: B→L
    rightEvalCol = OffsetColumn(baseEvalCol, 10)            ' 例: J→T
    rightRepairCol = OffsetColumn(baseRepairCol, 10)
    rightImgCol = OffsetColumn(baseImgCol, 10)
    Dim rightCatNameCol As String
    If baseCatNameCol <> "" Then rightCatNameCol = OffsetColumn(baseCatNameCol, 10)              ' 例: B→L

    ' 行間隔: 12行ごとに次の不具合
    Dim ROW_INTERVAL As Long
    ROW_INTERVAL = 12

    Dim localIdx As Long
    localIdx = 1

    Dim i As Long
    For i = startIdx To endIdx
        Dim defect As Object
        Set defect = defectList(i)

        ' ペアインデックス（0始まり: 0,0,1,1,2,2,...）
        Dim pairIdx As Long
        pairIdx = Int((localIdx - 1) / 2)

        ' 行オフセット計算
        Dim rowOffset As Long
        rowOffset = pairIdx * ROW_INTERVAL + (pairIdx \ 3) * 4

        ' 奇数=左列、偶数=右列
        Dim isLeft As Boolean
        isLeft = (localIdx Mod 2 = 1)

        Dim curLocationCol As String
        Dim curComponentCol As String
        Dim curDeteriorationCol As String
        Dim curEvalCol As String
        Dim curRepairCol As String
        Dim curImgCol As String

        If isLeft Then
            curLocationCol = baseLocationCol
            curComponentCol = baseComponentCol
            curDeteriorationCol = baseDeteriorationCol
            curEvalCol = baseEvalCol
            curRepairCol = baseRepairCol
            curImgCol = baseImgCol
        Else
            curLocationCol = rightLocationCol
            curComponentCol = rightComponentCol
            curDeteriorationCol = rightDeteriorationCol
            curEvalCol = rightEvalCol
            curRepairCol = rightRepairCol
            curImgCol = rightImgCol
        End If

        ' 場所名
        If defect.Exists("location") Then
            SetCellValueSafe ws, curLocationCol & (baseLocationRow + rowOffset), defect("location")
        End If

        ' 部位
        If defect.Exists("component") Then
            SetCellValueSafe ws, curComponentCol & (baseComponentRow + rowOffset), defect("component")
        End If

        ' 劣化状況
        If defect.Exists("deterioration") Then
            SetCellValueSafe ws, curDeteriorationCol & (baseDeteriorationRow + rowOffset), defect("deterioration")
        End If

        ' 評価
        If defect.Exists("evaluationType") Then
            SetCellValueSafe ws, curEvalCol & (baseEvalRow + rowOffset), defect("evaluationType")
        End If

        ' カテゴリ名
        If baseCatNameCol <> "" Then
            If defect.Exists("categoryName") Then
                Dim curCatNameCol As String
                If isLeft Then
                    curCatNameCol = baseCatNameCol
                Else
                    curCatNameCol = rightCatNameCol
                End If
                SetCellValueSafe ws, curCatNameCol & (baseCatNameRow + rowOffset), defect("categoryName")
            End If
        End If

        ' 修繕方法（tmpl_c のみ repair列あり）
        If baseRepairCol <> "" Then
            If defect.Exists("repairMethod") Then
                SetCellValueSafe ws, curRepairCol & (baseRepairRow + rowOffset), defect("repairMethod")
            End If
        End If

        ' 画像の挿入
        Dim imgPath As String
        imgPath = ""
        If defect.Exists("imageFile") Then
            imgPath = ResolveImagePath(CStr(defect("imageFile")))
        ElseIf defect.Exists("imageData") Then
            If Not IsNull(defect("imageData")) And defect("imageData") <> "" Then
                imgPath = DecodeBase64ToTempFile(CStr(defect("imageData")))
            End If
        End If
        If imgPath <> "" Then
            InsertImageToCell ws, imgPath, curImgCol & (baseImgRow + rowOffset)
        End If

        localIdx = localIdx + 1
    Next i
End Sub



'' 画像行パターンの生成




'' テーブルK: 不具合テンプレートマッピング取得
'' マッピングシート列51=templateKey, 列52=sheetName,
'' 列53=locationCell, 列54=componentCell, 列55=deteriorationCell,
'' 列56=evalCell, 列57=repairCell, 列58=imageCell
'' 戻り値: Dictionary - templateKey → Dictionary("location","component","deterioration","eval","repair","image" → cellAddr)

Public Function GetDefectTemplateMapping() As Object
    Dim d As Object
    Set d = New Dictionary

    Dim mapWs As Worksheet
    Set mapWs = GetMappingSheet()
    If mapWs Is Nothing Then
        Set GetDefectTemplateMapping = d
        Exit Function
    End If

    Dim r As Long
    r = 3 ' データ開始行
    Do While mapWs.Cells(r, 51).Value <> ""
        Dim tmplKey As String
        tmplKey = CStr(mapWs.Cells(r, 51).Value)

        Dim inner As Object
        Set inner = New Dictionary
        inner("sheetName") = CStr(mapWs.Cells(r, 52).Value)
        If mapWs.Cells(r, 53).Value <> "" Then inner("location") = CStr(mapWs.Cells(r, 53).Value)
        If mapWs.Cells(r, 54).Value <> "" Then inner("component") = CStr(mapWs.Cells(r, 54).Value)
        If mapWs.Cells(r, 55).Value <> "" Then inner("deterioration") = CStr(mapWs.Cells(r, 55).Value)
        If mapWs.Cells(r, 56).Value <> "" Then inner("eval") = CStr(mapWs.Cells(r, 56).Value)
        If mapWs.Cells(r, 57).Value <> "" Then inner("repair") = CStr(mapWs.Cells(r, 57).Value)
        If mapWs.Cells(r, 58).Value <> "" Then inner("image") = CStr(mapWs.Cells(r, 58).Value)
        If mapWs.Cells(r, 59).Value <> "" Then inner("categoryName") = CStr(mapWs.Cells(r, 59).Value)

        Set d(tmplKey) = inner
        r = r + 1
    Loop

    Set GetDefectTemplateMapping = d
End Function


'' セルアドレスを列名と行番号に分解
'' 例: "F4" → col="F", row=4 / "AB12" → col="AB", row=12

Public Sub ParseCellAddress(cellAddr As String, ByRef colName As String, ByRef rowNum As Long)
    Dim j As Long
    colName = ""
    rowNum = 0
    For j = 1 To Len(cellAddr)
        If IsNumeric(Mid(cellAddr, j, 1)) Then
            colName = Left(cellAddr, j - 1)
            rowNum = CLng(Mid(cellAddr, j))
            Exit Sub
        End If
    Next j
    colName = cellAddr
End Sub


'' 列名をオフセット（例: "B" + 10 → "L", "F" + 10 → "P"）

Public Function OffsetColumn(colName As String, offsetCols As Long) As String
    If colName = "" Then
        OffsetColumn = ""
        Exit Function
    End If

    ' 列名を列番号に変換
    Dim colNum As Long
    Dim k As Long
    colNum = 0
    For k = 1 To Len(colName)
        colNum = colNum * 26 + (Asc(UCase(Mid(colName, k, 1))) - Asc("A") + 1)
    Next k

    ' オフセット適用
    colNum = colNum + offsetCols

    ' 列番号を列名に変換
    Dim result As String
    result = ""
    Do While colNum > 0
        Dim remainder As Long
        remainder = (colNum - 1) Mod 26
        result = Chr(Asc("A") + remainder) & result
        colNum = Int((colNum - 1) / 26)
    Loop
    OffsetColumn = result
End Function




'' テーブルK: 不具合テンプレートマッピング取得
'' マッピングシート列51=templateKey, 列52=sheetName,
'' 列53=locationCell, 列54=componentCell, 列55=deteriorationCell,
'' 列56=evalCell, 列57=repairCell, 列58=imageCell
Public Function GenerateImageRows(templateName As String) As Collection

    Dim rows As New Collection

    Dim currentRow As Long



    ' テンプレートによって初期行が異なる

    Select Case templateName

        Case TEMPLATE_C

            currentRow = 8   ' Sheet3/Sheet8: 初期行8

        Case TEMPLATE_B2

            currentRow = 6   ' Sheet4: 初期行6

        Case Else

            currentRow = 8

    End Select



    rows.Add currentRow



    ' 2番目: +12

    currentRow = currentRow + 12

    rows.Add currentRow



    ' 3番目: +12

    currentRow = currentRow + 12

    rows.Add currentRow



    ' 以降: {16, 12, 12} パターン繰り返し

    Dim pattern As Variant

    pattern = Array(16, 12, 12)

    Dim patternIdx As Long

    patternIdx = 0



    Dim maxImages As Long

    maxImages = MAX_IMAGES_PER_SHEET



    Do While rows.Count < maxImages

        currentRow = currentRow + pattern(patternIdx)

        rows.Add currentRow

        patternIdx = (patternIdx + 1) Mod 3

    Loop



    Set GenerateImageRows = rows

End Function



'' セル範囲に画像を挿入


Public Sub InsertImageToCell(ws As Worksheet, imagePath As String, cellAddress As String)
    On Error Resume Next
    
    Dim targetRange As Range
    Set targetRange = ws.Range(cellAddress)
    If targetRange Is Nothing Then Exit Sub
    If targetRange.MergeCells Then Set targetRange = targetRange.mergeArea
    
    Dim shp As Shape
    Dim picName As String
    picName = ws.Name & "_" & Replace(cellAddress, "$", "") & "_pic"
    Set shp = ws.Shapes(picName)
    If Not shp Is Nothing Then shp.Delete
    Set shp = Nothing
    Err.Clear
    
    Dim actualPath As String
    
    #If Mac Then
        ' Mac: POSIXパスを一時ファイル経由でMac形式パスに変換
        ' （MacScriptに日本語を直接渡すとエンコーディング破壊される）
        Dim pathFile As String
        pathFile = m_TempFolder & "/pathconv.txt"
        ' 一時ファイルにPOSIXパスを書き込み（tmpフォルダはASCIIなのでOpen可能）
        Dim macPathFile As String
        macPathFile = MacScript("return POSIX file """ & pathFile & """ as text")
        If Err.Number <> 0 Then
            m_ErrorLog.Add "パスファイル変換失敗: " & Err.Description
            Err.Clear
            Exit Sub
        End If
        
        Dim fn As Integer
        fn = FreeFile
        Open macPathFile For Output As #fn
        Print #fn, imagePath
        Close #fn
        If Err.Number <> 0 Then
            m_ErrorLog.Add "パスファイル書込失敗: " & Err.Description
            Err.Clear
            Exit Sub
        End If
        
        ' AppleScriptでファイルからパスを読み取り、POSIX file変換
        Dim script As String
        script = "set f to read POSIX file """ & pathFile & """" & Chr(10)
        script = script & "set f to paragraph 1 of f" & Chr(10)
        script = script & "return POSIX file f as text"
        actualPath = MacScript(script)
        If Err.Number <> 0 Or actualPath = "" Then
            m_ErrorLog.Add "POSIX変換失敗: " & Err.Description & " [" & imagePath & "]"
            Err.Clear
            Exit Sub
        End If
        
        ' デバッグ（最初の1回のみ）
    #Else
        actualPath = imagePath
    #End If
    
    Err.Clear
    Set shp = ws.Shapes.AddPicture(actualPath, False, True, targetRange.Left, targetRange.Top, targetRange.Width, targetRange.Height)
    
    If Err.Number = 0 And Not shp Is Nothing Then
        shp.Name = picName
    Else
        m_ErrorLog.Add "画像挿入エラー (" & cellAddress & "): " & Err.Number & " " & Err.Description & " [" & actualPath & "]"
        Err.Clear
    End If
End Sub



'' =============================================

'' Phase 5: キープランシート作成

'' =============================================
