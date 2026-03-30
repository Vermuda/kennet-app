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

    ' 既存シートがあれば削除
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

    ' テンプレートシートをコピー
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
    ws.Name = sheetName

    ' シート保護解除
    On Error Resume Next
    ws.Unprotect Password:=DataImport.SHEET_PW
    On Error GoTo 0

    ' フロア名を書き込み
    DataImport.SetCellValueSafe ws, "AC1", floorName

    ' 図面画像を挿入（最初の図面を使用）
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
            Dim bpShapeName As String
            bpShapeName = InsertImageKeepAspect(ws, bpImgPath, "M10")
        End If
    End If

    ' 各不具合の情報を書き込み
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
        colOfs = side * KP_COL_OFFSET

        ' カテゴリ名
        Dim catName As String
        catName = ""
        If defect.Exists("categoryName") Then catName = CStr(defect("categoryName"))
        DataImport.SetCellValueSafe ws, CellAddr(10 + rowOfs, 3 + colOfs), catName

        ' 場所
        Dim locVal As String
        locVal = ""
        If defect.Exists("location") Then locVal = CStr(defect("location"))
        DataImport.SetCellValueSafe ws, CellAddr(10 + rowOfs, 7 + colOfs), locVal

        ' 部位
        Dim compVal As String
        compVal = ""
        If defect.Exists("component") Then compVal = CStr(defect("component"))
        DataImport.SetCellValueSafe ws, CellAddr(10 + rowOfs, 10 + colOfs), compVal

        ' 劣化状況
        Dim deterVal As String
        deterVal = ""
        If defect.Exists("deterioration") Then deterVal = CStr(defect("deterioration"))
        DataImport.SetCellValueSafe ws, CellAddr(11 + rowOfs, 4 + colOfs), deterVal

        ' 評価
        Dim evalVal As String
        evalVal = ""
        If defect.Exists("evaluationType") Then evalVal = CStr(defect("evaluationType"))
        Dim evalCol As Long
        If colOfs = 0 Then
            evalCol = 11
        Else
            evalCol = 10 + colOfs
        End If
        DataImport.SetCellValueSafe ws, CellAddr(11 + rowOfs, evalCol), evalVal

        ' 補修方法（cのみ）
        If evalType = "c" Then
            Dim repairVal As String
            repairVal = ""
            If defect.Exists("repairMethod") Then repairVal = CStr(defect("repairMethod"))
            DataImport.SetCellValueSafe ws, CellAddr(12 + rowOfs, 7 + colOfs), repairVal
        End If

        ' 画像
        Dim imgPath As String
        imgPath = ""
        If defect.Exists("imageFile") Then
            imgPath = DataImport.ResolveImagePath(CStr(defect("imageFile")))
        ElseIf defect.Exists("imageData") Then
            If Not IsNull(defect("imageData")) And defect("imageData") <> "" Then
                imgPath = DataImport.DecodeBase64ToTempFile(CStr(defect("imageData")))
            End If
        End If
        If imgPath <> "" Then
            Dim imgRow As Long
            If evalType = "c" Then
                imgRow = 14 + rowOfs
            Else
                imgRow = 12 + rowOfs
            End If
            DataImportDefects.InsertImageToCell ws, imgPath, CellAddr(imgRow, 2 + colOfs)
        End If
    Next dIdx

    ' ===== 矢印描画 =====
    ' 図面画像のShapeを名前で取得
    Dim bpShape As Shape
    Set bpShape = Nothing
    If bpShapeName <> "" Then
        On Error Resume Next
        Set bpShape = ws.Shapes(bpShapeName)
        On Error GoTo 0
    End If

    If Not bpShape Is Nothing Then
        Dim dIdx2 As Long
        For dIdx2 = 1 To defectBatch.Count
            Dim def2 As Object
            Set def2 = defectBatch(dIdx2)
            ' ピン座標を取得（0-100%の相対座標）
            Dim posX As Double
            Dim posY As Double
            posX = 50: posY = 50
            If def2.Exists("positionX") Then posX = CDbl(def2("positionX"))
            If def2.Exists("positionY") Then posY = CDbl(def2("positionY"))

            ' ピン位置を図面上の絶対座標に変換
            Dim pinX As Double
            Dim pinY As Double
            pinX = bpShape.Left + (posX / 100) * bpShape.Width
            pinY = bpShape.Top + (posY / 100) * bpShape.Height

            ' 事象サムネイル画像の位置を計算
            Dim zi2 As Long
            zi2 = dIdx2 - 1
            Dim pi2 As Long
            pi2 = zi2 \ 2
            Dim si2 As Long
            si2 = zi2 Mod 2
            Dim ro2 As Long
            ro2 = pi2 * KP_ROW_INTERVAL
            Dim co2 As Long
            co2 = si2 * KP_COL_OFFSET
            Dim thumbRow As Long
            If evalType = "c" Then
                thumbRow = 14 + ro2
            Else
                thumbRow = 12 + ro2
            End If
            Dim thumbCell As Range
            Set thumbCell = ws.Range(CellAddr(thumbRow, 2 + co2))
            Dim thumbCenterX As Double
            Dim thumbCenterY As Double
            Dim thumbMerge As Range
            Set thumbMerge = thumbCell.MergeArea
            If si2 = 0 Then
                ' 左列(1,3,5,7): 画像の右中央から
                thumbCenterX = thumbMerge.Left + thumbMerge.Width
            Else
                ' 右列(2,4,6,8): 画像の左中央から
                thumbCenterX = thumbMerge.Left
            End If
            thumbCenterY = thumbMerge.Top + thumbMerge.Height / 2

            ' 矢印を描画
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





