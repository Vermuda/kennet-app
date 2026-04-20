Attribute VB_Name = "DataImportKeyPlan"
'' =============================================
'' DataImportKeyPlan - キープランシート作成
'' マッピングベースのデータ書き込み
'' =============================================

Option Explicit

'' 定数
Public Const KP_MAX_DEFECTS As Long = 8
Public Const KP_ROW_INTERVAL As Long = 14
Public Const KP_COL_OFFSET As Long = 26

'' テンプレートシート名（全角文字）
Public Const KP_TEMPLATE_C As String = "評価「c」写真キープラン"
Public Const KP_TEMPLATE_B2 As String = "評価「b2」写真キープラン"

'' 図面の最大サイズ
Private Const BP_MAX_W As Double = 400
Private Const BP_MAX_H As Double = 350
Private Const PIN_SIZE As Double = 16
Private Const THUMBNAIL_W As Double = 80
Private Const THUMBNAIL_H As Double = 60

'' =============================================
'' キープランシートの作成（評価タイプ別・フロア別・8件上限）
'' =============================================

Public Sub CreateKeyPlanSheets(jsonData As Object)
    If Not jsonData.Exists("floors") Or Not jsonData.Exists("blueprints") Then Exit Sub
    If Not jsonData.Exists("defects") Or Not jsonData.Exists("markers") Then Exit Sub

    Dim floors As Object
    Set floors = jsonData("floors")
    Dim blueprints As Object
    Set blueprints = jsonData("blueprints")
    Dim defectsAll As Object
    Set defectsAll = jsonData("defects")
    Dim markersAll As Object
    Set markersAll = jsonData("markers")
    If defectsAll.Count = 0 Then Exit Sub

    ' マーカーマップ
    Dim markerMap As Object
    Set markerMap = New Dictionary
    Dim i As Long
    For i = 1 To markersAll.Count
        Dim mkr As Object
        Set mkr = markersAll(i)
        If mkr.Exists("id") Then Set markerMap(mkr("id")) = mkr
    Next i

    Dim inspectionMap As Object
    Set inspectionMap = DataImportDefects.BuildInspectionMap(jsonData)
    Dim markerBpMap As Object
    Set markerBpMap = DataImportDefects.BuildMarkerBlueprintMap(jsonData)
    Dim bpFloorMap As Object
    Set bpFloorMap = DataImportDefects.BuildBlueprintFloorMap(jsonData)

    ' 評価タイプ別にループ
    Dim evalTypes As Variant
    evalTypes = Array("c", "b2")
    Dim eIdx As Long
    For eIdx = LBound(evalTypes) To UBound(evalTypes)
        Dim evalType As String
        evalType = evalTypes(eIdx)
        Dim templateName As String
        If evalType = "c" Then templateName = KP_TEMPLATE_C Else templateName = KP_TEMPLATE_B2

        ' フロアごとにループ
        Dim fi As Long
        For fi = 1 To floors.Count
            Dim floor As Object
            Set floor = floors(fi)
            Dim floorId As String
            floorId = floor("id")
            Dim floorName As String
            floorName = floor("name")

            Application.StatusBar = "キープラン作成中: " & evalType & " - " & floorName

            ' このフロアの図面を取得
            Dim floorBps As New Collection
            Dim bi As Long
            For bi = 1 To blueprints.Count
                Dim bp As Object
                Set bp = blueprints(bi)
                If bp.Exists("floorId") Then
                    If bp("floorId") = floorId Then floorBps.Add bp
                End If
            Next bi

            ' このフロア×評価タイプの不具合を取得
            Dim floorDefects As New Collection
            Dim di As Long
            For di = 1 To defectsAll.Count
                Dim def2 As Object
                Set def2 = defectsAll(di)
                Dim defFloor As String
                defFloor = DataImportDefects.GetDefectFloorName(def2, markerBpMap, bpFloorMap)
                If defFloor <> floorName Then GoTo NextDefectKP
                Dim defEval As String
                defEval = DataImportDefects.GetDefectEvaluation(def2, inspectionMap)
                If defEval <> evalType Then GoTo NextDefectKP
                floorDefects.Add def2
NextDefectKP:
            Next di

            ' 不具合がある場合のみシート作成（8件ずつ分割）
            If floorDefects.Count > 0 And floorBps.Count > 0 Then
                Dim sheetsNeeded As Long
                sheetsNeeded = -Int(-(floorDefects.Count / KP_MAX_DEFECTS))
                Dim si As Long
                For si = 1 To sheetsNeeded
                    Dim batch As New Collection
                    Dim batchStart As Long
                    batchStart = (si - 1) * KP_MAX_DEFECTS + 1
                    Dim batchEnd As Long
                    If si * KP_MAX_DEFECTS < floorDefects.Count Then
                        batchEnd = si * KP_MAX_DEFECTS
                    Else
                        batchEnd = floorDefects.Count
                    End If
                    Dim bdi As Long
                    For bdi = batchStart To batchEnd
                        batch.Add floorDefects(bdi)
                    Next bdi

                    Dim sheetName As String
                    sheetName = templateName & "_" & floorName
                    If sheetsNeeded > 1 Then sheetName = sheetName & "_" & si

                    CreateSingleKeyPlanSheet templateName, sheetName, floorName, floorBps, batch, markerMap, inspectionMap, evalType
                    Set batch = New Collection
                Next si
            End If

            Set floorBps = New Collection
            Set floorDefects = New Collection
        Next fi
    Next eIdx
End Sub


'' 単一キープランシート作成（テンプレートコピー＋マッピングベース書込）
Public Sub CreateSingleKeyPlanSheet(templateName As String, sheetName As String, _
    floorName As String, floorBlueprints As Collection, _
    defectBatch As Collection, markerMap As Object, _
    inspectionMap As Object, evalType As String)

    '' 既存シートがあれば削除
    On Error Resume Next
    Dim existingSheet As Worksheet
    Set existingSheet = Worksheets(sheetName)
    If Not existingSheet Is Nothing Then
        Application.DisplayAlerts = False
        existingSheet.Delete
        Application.DisplayAlerts = True
    End If
    Set existingSheet = Nothing
    On Error GoTo 0

    '' テンプレートシートをコピー
    Dim tmplWs As Worksheet
    On Error Resume Next
    Set tmplWs = Worksheets(templateName)
    On Error GoTo 0
    If tmplWs Is Nothing Then
        DataImport.m_ErrorLog.Add "テンプレートが見つかりません: " & templateName
        Exit Sub
    End If
    tmplWs.Copy After:=Worksheets(Worksheets.Count)
    Dim ws As Worksheet
    Set ws = Worksheets(Worksheets.Count)
    '' テンプレートが非表示でも生成シートは表示する
    ws.Visible = xlSheetVisible
    '' シート名のサニタイズ（31文字制限、禁止文字除去）
    sheetName = Replace(sheetName, ":", "")
    sheetName = Replace(sheetName, "/", "")
    sheetName = Replace(sheetName, Chr(92), "")
    sheetName = Replace(sheetName, "?", "")
    sheetName = Replace(sheetName, "*", "")
    sheetName = Replace(sheetName, "[", "")
    sheetName = Replace(sheetName, "]", "")
    If Len(sheetName) > 31 Then sheetName = Left(sheetName, 31)
    ws.Name = sheetName

    '' シート保護解除
    On Error Resume Next
    ws.Unprotect Password:=DataImport.SHEET_PW
    On Error GoTo 0

    '' KPマッピング取得
    Dim kpMap As Object
    Set kpMap = GetKeyPlanMapping()
    Dim tmplKey As String
    tmplKey = "kp_" & evalType
    Dim mapEntry As Object
    Set mapEntry = Nothing
    If kpMap.Exists(tmplKey) Then Set mapEntry = kpMap(tmplKey)

    '' 不具合1の基準セル（マッピング優先、空ならハードコード）
    Dim floorCell As String
    Dim bpCell As String
    Dim cat1Cell As String
    Dim loc1Cell As String
    Dim comp1Cell As String
    Dim deter1Cell As String
    Dim eval1Cell As String
    Dim repair1Cell As String
    Dim img1Cell As String
    Dim cat2Cell As String
    floorCell = "AC1"
    bpCell = "M10"
    cat1Cell = "C10"
    loc1Cell = "G10"
    comp1Cell = "J10"
    deter1Cell = "D11"
    If evalType = "c" Then
        eval1Cell = "K11"
        repair1Cell = "G12"
        img1Cell = "B14"
    Else
        eval1Cell = "J11"
        repair1Cell = ""
        img1Cell = "B12"
    End If
    cat2Cell = ""
    If Not mapEntry Is Nothing Then
        If CStr(mapEntry("floor")) <> "" Then floorCell = CStr(mapEntry("floor"))
        If CStr(mapEntry("blueprint")) <> "" Then bpCell = CStr(mapEntry("blueprint"))
        If CStr(mapEntry("cat1")) <> "" Then cat1Cell = CStr(mapEntry("cat1"))
        If CStr(mapEntry("loc1")) <> "" Then loc1Cell = CStr(mapEntry("loc1"))
        If CStr(mapEntry("comp1")) <> "" Then comp1Cell = CStr(mapEntry("comp1"))
        If CStr(mapEntry("deter1")) <> "" Then deter1Cell = CStr(mapEntry("deter1"))
        If CStr(mapEntry("eval1")) <> "" Then eval1Cell = CStr(mapEntry("eval1"))
        If CStr(mapEntry("repair1")) <> "" Then repair1Cell = CStr(mapEntry("repair1"))
        If CStr(mapEntry("img1")) <> "" Then img1Cell = CStr(mapEntry("img1"))
        cat2Cell = CStr(mapEntry("cat2"))
    End If

    '' 基準セル（row/col）を抽出
    Dim cat1Row As Long, cat1Col As Long
    Dim loc1Row As Long, loc1Col As Long
    Dim comp1Row As Long, comp1Col As Long
    Dim deter1Row As Long, deter1Col As Long
    Dim eval1Row As Long, eval1Col As Long
    Dim repair1Row As Long, repair1Col As Long
    Dim img1Row As Long, img1Col As Long
    ParseCellAddr cat1Cell, cat1Row, cat1Col
    ParseCellAddr loc1Cell, loc1Row, loc1Col
    ParseCellAddr comp1Cell, comp1Row, comp1Col
    ParseCellAddr deter1Cell, deter1Row, deter1Col
    ParseCellAddr eval1Cell, eval1Row, eval1Col
    ParseCellAddr repair1Cell, repair1Row, repair1Col
    ParseCellAddr img1Cell, img1Row, img1Col

    '' 列オフセット（不具合2カテゴリ名セルとの差）。マッピング空ならデフォルト26
    Dim colStep As Long
    colStep = KP_COL_OFFSET
    If cat2Cell <> "" Then
        Dim cat2Row As Long, cat2Col As Long
        ParseCellAddr cat2Cell, cat2Row, cat2Col
        If cat2Col > 0 And cat1Col > 0 Then colStep = cat2Col - cat1Col
    End If

    '' フロア名をセルに書く
    DataImport.SetCellValueSafe ws, floorCell, floorName

    '' 図面画像を挿入（最初の図面を使用）
    Dim bpShapeName As String
    bpShapeName = ""
    If floorBlueprints.Count > 0 Then
        Dim bp As Object
        Set bp = floorBlueprints(1)
        Dim bpImgPath As String
        bpImgPath = ""
        If bp.Exists("imageFile") Then
            bpImgPath = DataImport.ResolveImagePath(CStr(bp("imageFile")))
        ElseIf bp.Exists("imageData") Then
            If Not IsNull(bp("imageData")) And bp("imageData") <> "" Then
                bpImgPath = DataImport.DecodeBase64ToTempFile(CStr(bp("imageData")))
            End If
        End If
        If bpImgPath <> "" Then
            bpShapeName = InsertImageKeepAspect(ws, bpImgPath, bpCell)
        End If

        '' 方位画像を別途挿入（図面の上にオーバーレイ）
        If bp.Exists("compassImageFile") Then
            Dim compassPath As String
            compassPath = DataImport.ResolveImagePath(CStr(bp("compassImageFile")))
            If compassPath <> "" And bpShapeName <> "" Then
                Dim bpSh As Shape
                Set bpSh = ws.Shapes(bpShapeName)
                Dim cmpX As Double
                Dim cmpY As Double
                cmpX = bpSh.Left + bpSh.Width * 0.8
                cmpY = bpSh.Top + bpSh.Height * 0.05
                If bp.Exists("orientationIconX") Then
                    cmpX = bpSh.Left + (CDbl(bp("orientationIconX")) / 100) * bpSh.Width
                End If
                If bp.Exists("orientationIconY") Then
                    cmpY = bpSh.Top + (CDbl(bp("orientationIconY")) / 100) * bpSh.Height
                End If
                Dim cmpScale As Double
                cmpScale = 1#
                If bp.Exists("orientationIconScale") Then cmpScale = CDbl(bp("orientationIconScale"))
                Dim cmpSize As Double
                cmpSize = 40 * cmpScale
                On Error Resume Next
                Dim compassShape As Shape
                Set compassShape = ws.Shapes.AddPicture(compassPath, msoFalse, msoTrue, CSng(cmpX - cmpSize / 2), CSng(cmpY - cmpSize / 2), CSng(cmpSize), CSng(cmpSize))
                If Not compassShape Is Nothing Then
                    compassShape.LockAspectRatio = msoTrue
                    If bp.Exists("orientation") Then
                        compassShape.Rotation = CSng(bp("orientation"))
                    End If
                End If
                On Error GoTo 0
            End If
        End If
    End If

    '' 各不具合情報をマッピング基準セル＋オフセットに書き込み
    Dim dIdx As Long
    For dIdx = 1 To defectBatch.Count
        Dim defect As Object
        Set defect = defectBatch(dIdx)

        Dim zeroIdx As Long
        zeroIdx = dIdx - 1
        Dim pairIdx As Long
        pairIdx = zeroIdx \ 2
        Dim side As Long
        side = zeroIdx Mod 2
        Dim rowOfs As Long
        rowOfs = pairIdx * KP_ROW_INTERVAL
        Dim colOfs As Long
        colOfs = side * colStep

        '' カテゴリ名
        Dim catName As String
        catName = ""
        If defect.Exists("categoryName") Then catName = CStr(defect("categoryName"))
        If cat1Row > 0 Then DataImport.SetCellValueSafe ws, CellAddr(cat1Row + rowOfs, cat1Col + colOfs), catName

        '' 場所
        Dim locVal As String
        locVal = ""
        If defect.Exists("location") Then locVal = CStr(defect("location"))
        If loc1Row > 0 Then DataImport.SetCellValueSafe ws, CellAddr(loc1Row + rowOfs, loc1Col + colOfs), locVal

        '' 部位
        Dim compVal As String
        compVal = ""
        If defect.Exists("component") Then compVal = CStr(defect("component"))
        If comp1Row > 0 Then DataImport.SetCellValueSafe ws, CellAddr(comp1Row + rowOfs, comp1Col + colOfs), compVal

        '' 劣化状況
        Dim deterVal As String
        deterVal = ""
        If defect.Exists("deterioration") Then deterVal = CStr(defect("deterioration"))
        If deter1Row > 0 Then DataImport.SetCellValueSafe ws, CellAddr(deter1Row + rowOfs, deter1Col + colOfs), deterVal

        '' 評価
        Dim evalVal As String
        evalVal = ""
        If defect.Exists("evaluationType") Then evalVal = CStr(defect("evaluationType"))
        If eval1Row > 0 Then DataImport.SetCellValueSafe ws, CellAddr(eval1Row + rowOfs, eval1Col + colOfs), evalVal

        '' 補修方法（cのみ）
        If evalType = "c" And repair1Row > 0 Then
            Dim repairVal As String
            repairVal = ""
            If defect.Exists("repairMethod") Then repairVal = CStr(defect("repairMethod"))
            DataImport.SetCellValueSafe ws, CellAddr(repair1Row + rowOfs, repair1Col + colOfs), repairVal
        End If

        '' 画像
        Dim imgPath As String
        imgPath = ""
        If defect.Exists("imageFile") Then
            imgPath = DataImport.ResolveImagePath(CStr(defect("imageFile")))
        ElseIf defect.Exists("imageData") Then
            If Not IsNull(defect("imageData")) And defect("imageData") <> "" Then
                imgPath = DataImport.DecodeBase64ToTempFile(CStr(defect("imageData")))
            End If
        End If
        If imgPath <> "" And img1Row > 0 Then
            DataImportDefects.InsertImageToCell ws, imgPath, CellAddr(img1Row + rowOfs, img1Col + colOfs)
        End If
    Next dIdx

    '' ===== 引出線描画 =====
    Dim bpShape As Shape
    Set bpShape = Nothing
    If bpShapeName <> "" Then
        On Error Resume Next
        Set bpShape = ws.Shapes(bpShapeName)
        On Error GoTo 0
    End If

    If Not bpShape Is Nothing And img1Row > 0 Then
        Dim dIdx2 As Long
        For dIdx2 = 1 To defectBatch.Count
            Dim def2 As Object
            Set def2 = defectBatch(dIdx2)
            Dim posX As Double
            Dim posY As Double
            posX = 50: posY = 50
            If def2.Exists("positionX") Then posX = CDbl(def2("positionX"))
            If def2.Exists("positionY") Then posY = CDbl(def2("positionY"))

            Dim pinX As Double
            Dim pinY As Double
            pinX = bpShape.Left + (posX / 100) * bpShape.Width
            pinY = bpShape.Top + (posY / 100) * bpShape.Height

            Dim zi2 As Long
            zi2 = dIdx2 - 1
            Dim pi2 As Long
            pi2 = zi2 \ 2
            Dim si2 As Long
            si2 = zi2 Mod 2
            Dim ro2 As Long
            ro2 = pi2 * KP_ROW_INTERVAL
            Dim co2 As Long
            co2 = si2 * colStep
            Dim thumbCell As Range
            Set thumbCell = ws.Range(CellAddr(img1Row + ro2, img1Col + co2))
            Dim thumbCenterX As Double
            Dim thumbCenterY As Double
            Dim thumbMerge As Range
            Set thumbMerge = thumbCell.MergeArea
            If si2 = 0 Then
                thumbCenterX = thumbMerge.Left + thumbMerge.Width
            Else
                thumbCenterX = thumbMerge.Left
            End If
            thumbCenterY = thumbMerge.Top + thumbMerge.Height / 2

            Dim lineShape As Shape
            Set lineShape = ws.Shapes.AddLine(CSng(pinX), CSng(pinY), CSng(thumbCenterX), CSng(thumbCenterY))
            With lineShape.Line
                .ForeColor.RGB = RGB(255, 0, 0)
                .Weight = 1.5
                .BeginArrowheadStyle = msoArrowheadTriangle
            End With
        Next dIdx2
    End If
End Sub


'' =============================================
'' KPマッピングシートからセルアドレスをDictionaryで取得
'' =============================================
'' 戻り値: Dictionary（キー: templateKey "kp_c" / "kp_b2"）
''   各値はDictionaryで、下記キーをもつセルアドレス（文字列）を保持:
''     floor, blueprint, cat1, loc1, comp1, deter1, eval1, repair1, img1, cat2
'' マッピングシート不在／マッピングデータ読込失敗時は空のDictionary
Public Function GetKeyPlanMapping() As Object
    Dim result As Object
    Set result = New Dictionary

    Dim mapWs As Worksheet
    On Error Resume Next
    Set mapWs = Worksheets("KPマッピング")
    On Error GoTo 0
    If mapWs Is Nothing Then
        Set GetKeyPlanMapping = result
        Exit Function
    End If

    Dim r As Long
    r = 3
    Do While mapWs.Cells(r, 1).Value <> ""
        Dim tmplKey As String
        tmplKey = CStr(mapWs.Cells(r, 1).Value)
        Dim entry As Object
        Set entry = New Dictionary
        entry("floor") = CStr(mapWs.Cells(r, 3).Value)
        entry("blueprint") = CStr(mapWs.Cells(r, 4).Value)
        entry("cat1") = CStr(mapWs.Cells(r, 5).Value)
        entry("loc1") = CStr(mapWs.Cells(r, 6).Value)
        entry("comp1") = CStr(mapWs.Cells(r, 7).Value)
        entry("deter1") = CStr(mapWs.Cells(r, 8).Value)
        entry("eval1") = CStr(mapWs.Cells(r, 9).Value)
        entry("repair1") = CStr(mapWs.Cells(r, 10).Value)
        entry("img1") = CStr(mapWs.Cells(r, 11).Value)
        entry("cat2") = CStr(mapWs.Cells(r, 12).Value)
        Set result(tmplKey) = entry
        r = r + 1
    Loop

    Set GetKeyPlanMapping = result
End Function

'' セルアドレス文字列（A1～）から行/列番号を抽出
'' cellAddr = "AB10" → row=10, col=28
Public Sub ParseCellAddr(ByVal cellAddr As String, ByRef rowNum As Long, ByRef colNum As Long)
    rowNum = 0
    colNum = 0
    If Len(cellAddr) = 0 Then Exit Sub

    Dim i As Long
    Dim ch As String
    Dim colPart As String
    Dim rowPart As String
    colPart = ""
    rowPart = ""
    For i = 1 To Len(cellAddr)
        ch = Mid(cellAddr, i, 1)
        If ch >= "A" And ch <= "Z" Then
            colPart = colPart & ch
        ElseIf ch >= "a" And ch <= "z" Then
            colPart = colPart & UCase(ch)
        ElseIf ch >= "0" And ch <= "9" Then
            rowPart = rowPart & ch
        End If
    Next i

    If Len(colPart) = 0 Or Len(rowPart) = 0 Then Exit Sub

    Dim c As Long
    c = 0
    For i = 1 To Len(colPart)
        c = c * 26 + (Asc(Mid(colPart, i, 1)) - Asc("A") + 1)
    Next i
    colNum = c
    rowNum = CLng(rowPart)
End Sub

'' 行番号と列番号からセルアドレス文字列を生成
Public Function CellAddr(rowNum As Long, colNum As Long) As String
    CellAddr = Replace(Cells(rowNum, colNum).Address, "$", "")
End Function

'' 画像をアスペクト比保持で結合セル中央に配置
Public Function InsertImageKeepAspect(ws As Worksheet, imagePath As String, cellAddr As String) As String
    On Error Resume Next
    Dim targetRange As Range
    Set targetRange = ws.Range(cellAddr)
    If targetRange Is Nothing Then Exit Function

    ' 結合セルの範囲を取得
    Dim mergeArea As Range
    Set mergeArea = targetRange.MergeArea

    Dim areaLeft As Double
    Dim areaTop As Double
    Dim areaWidth As Double
    Dim areaHeight As Double
    areaLeft = mergeArea.Left
    areaTop = mergeArea.Top
    areaWidth = mergeArea.Width
    areaHeight = mergeArea.Height

    ' 画像を挿入（元サイズで）
    Dim pic As Shape
    Set pic = ws.Shapes.AddPicture(imagePath, msoFalse, msoTrue, areaLeft, areaTop, -1, -1)
    If pic Is Nothing Then
        On Error GoTo 0
        Exit Function
    End If

    ' アスペクト比を保持してフィット
    pic.LockAspectRatio = msoTrue
    Dim scaleW As Double
    Dim scaleH As Double
    scaleW = areaWidth / pic.Width
    scaleH = areaHeight / pic.Height
    Dim scaleFactor As Double
    If scaleW < scaleH Then
        scaleFactor = scaleW
    Else
        scaleFactor = scaleH
    End If
    pic.Width = pic.Width * scaleFactor

    ' 中央配置
    pic.Left = areaLeft + (areaWidth - pic.Width) / 2
    pic.Top = areaTop + (areaHeight - pic.Height) / 2

        pic.Name = "KP_Blueprint"
    InsertImageKeepAspect = pic.Name

    On Error GoTo 0
End Function





