Attribute VB_Name = "DataImportKeyPlan"

'' =============================================
'' DataImportKeyPlan - キープランシート作成
'' =============================================

Option Explicit

'' =============================================
'' キープランシートの作成
'' 図面に不具合マーカーとサムネイルを配置
'' =============================================

Public Sub CreateKeyPlanSheets(jsonData As Object)

    ' 必要なデータが存在するか確認

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



    ' マーカーマップ（markerId → marker object）

    Dim markerMap As Object

    Set markerMap = New Dictionary

    Dim i As Long

    For i = 1 To markersAll.Count

        Dim mkr As Object

        Set mkr = markersAll(i)

        If mkr.Exists("id") Then

            Set markerMap(mkr("id")) = mkr

        End If

    Next i



    ' 検査データマップ

    Dim inspectionMap As Object

    Set inspectionMap = BuildInspectionMap(jsonData)



    ' 階層ごとにキープランシートを作成

    For i = 1 To floors.Count

        Dim floor As Object

        Set floor = floors(i)



        Dim floorId As String

        floorId = floor("id")

        Dim floorName As String

        floorName = floor("name")



        Application.StatusBar = "キープランシート作成中: " & floorName & "..."



        ' この階層の図面を取得

        Dim floorBlueprints As New Collection

        Dim j As Long

        For j = 1 To blueprints.Count

            Dim bp As Object

            Set bp = blueprints(j)

            If bp.Exists("floorId") Then

                If bp("floorId") = floorId Then

                    floorBlueprints.Add bp

                End If

            End If

        Next j



        ' この階層に不具合があるか確認

        Dim floorDefects As New Collection

        Dim markerBpMap As Object

        Set markerBpMap = BuildMarkerBlueprintMap(jsonData)



        Dim bpFloorMap As Object

        Set bpFloorMap = BuildBlueprintFloorMap(jsonData)



        Dim k As Long

        For k = 1 To defectsAll.Count

            Dim def2 As Object

            Set def2 = defectsAll(k)



            Dim defFloorName As String

            defFloorName = GetDefectFloorName(def2, markerBpMap, bpFloorMap)



            If defFloorName = floorName Then

                floorDefects.Add def2

            End If

        Next k



        ' 不具合がある階層のみシート作成

        If floorDefects.Count > 0 And floorBlueprints.Count > 0 Then

            CreateSingleKeyPlanSheet floorName, floorBlueprints, floorDefects, markerMap, inspectionMap

        End If



        Set floorBlueprints = New Collection

        Set floorDefects = New Collection

    Next i

End Sub



'' 単一キープランシート作成


Public Sub CreateSingleKeyPlanSheet(floorName As String, floorBlueprints As Collection, _
                                      floorDefects As Collection, markerMap As Object, _
                                      inspectionMap As Object)

    Dim sheetName As String

    sheetName = "キープラン_" & floorName



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



    ' 新規シート作成

    Dim ws As Worksheet

    Set ws = Worksheets.Add(After:=Worksheets(Worksheets.Count))

    ws.Name = sheetName



    ' タイトル

    ws.Range("A1").Value = "キープラン - " & floorName

    ws.Range("A1").Font.Size = 14

    ws.Range("A1").Font.Bold = True



    ' 図面ごとに配置

    Dim currentTop As Double

    currentTop = 40 ' タイトル下のオフセット



    Dim bpIdx As Long

    For bpIdx = 1 To floorBlueprints.Count

        Dim bp As Object

        Set bp = floorBlueprints(bpIdx)



        ' 図面画像の挿入

        Dim bpShape As Shape

        If bp.Exists("imageFile") Then
            imagePath = ResolveImagePath(CStr(bp("imageFile")))
        ElseIf bp.Exists("imageData") Then

            If Not IsNull(bp("imageData")) And bp("imageData") <> "" Then

                Dim bpImgPath As String

                bpImgPath = DecodeBase64ToTempFile(CStr(bp("imageData")))



                If bpImgPath <> "" Then

                    Set bpShape = ws.Shapes.AddPicture( _
                        Filename:=bpImgPath, _
                        LinkToFile:=False, _
                        SaveWithDocument:=True, _
                        Left:=10, _
                        Top:=currentTop, _
                        Width:=-1, _
                        Height:=-1)



                    ' アスペクト比保持でリサイズ

                    ScaleShapeToFit bpShape, BP_MAX_W, BP_MAX_H



                    ' この図面に関連する不具合のピンとサムネイルを描画

                    If bp.Exists("id") Then

                        DrawPinsAndThumbnails ws, bpShape, CStr(bp("id")), _
                            floorDefects, markerMap, inspectionMap

                    End If



                    ' 次の図面の配置位置

                    currentTop = bpShape.Top + bpShape.Height + 30

                End If

            End If

        End If

    Next bpIdx

End Sub



'' 図形をアスペクト比保持でリサイズ


Public Sub ScaleShapeToFit(shp As Shape, maxWidth As Double, maxHeight As Double)

    Dim ratio As Double



    If shp.Width > maxWidth Or shp.Height > maxHeight Then

        Dim wRatio As Double

        wRatio = maxWidth / shp.Width

        Dim hRatio As Double

        hRatio = maxHeight / shp.Height



        ratio = Application.WorksheetFunction.Min(wRatio, hRatio)



        shp.LockAspectRatio = msoTrue

        shp.Width = shp.Width * ratio

    End If

End Sub



'' ピンマーカーとサムネイルの描画


Public Sub DrawPinsAndThumbnails(ws As Worksheet, bpShape As Shape, blueprintId As String, _
                                   defectList As Collection, markerMap As Object, _
                                   inspectionMap As Object)

    On Error GoTo ErrHandler



    ' サムネイル配置の開始位置（図面の右側）

    Dim thumbLeft As Double

    thumbLeft = bpShape.Left + bpShape.Width + 20



    Dim thumbTop As Double

    thumbTop = bpShape.Top



    Dim defectNum As Long

    defectNum = 0



    Dim i As Long

    For i = 1 To defectList.Count

        Dim defect As Object

        Set defect = defectList(i)



        ' この図面に属する不具合かチェック

        If Not defect.Exists("markerId") Then GoTo NextDefect



        Dim markerId As String

        markerId = defect("markerId")



        If Not markerMap.Exists(markerId) Then GoTo NextDefect



        Dim marker As Object

        Set marker = markerMap(markerId)



        If Not marker.Exists("blueprintId") Then GoTo NextDefect

        If marker("blueprintId") <> blueprintId Then GoTo NextDefect



        defectNum = defectNum + 1



        ' マーカー座標（パーセンテージ → ピクセル位置）

        Dim markerX As Double

        Dim markerY As Double



        If marker.Exists("x") Then markerX = CDbl(marker("x")) Else markerX = 50

        If marker.Exists("y") Then markerY = CDbl(marker("y")) Else markerY = 50



        Dim pinLeft As Double

        pinLeft = bpShape.Left + (markerX / 100) * bpShape.Width - PIN_SIZE / 2



        Dim pinTop As Double

        pinTop = bpShape.Top + (markerY / 100) * bpShape.Height - PIN_SIZE / 2



        ' 評価値でピン色を決定

        Dim evalValue As String

        evalValue = GetDefectEvaluation(defect, inspectionMap)



        Dim pinColor As Long

        If evalValue = "c" Then

            pinColor = RGB(239, 68, 68)   ' 赤 #EF4444

        Else

            pinColor = RGB(59, 130, 246)  ' 青 #3B82F6

        End If



        ' ピンマーカー（円形）

        Dim pinShape As Shape

        Set pinShape = ws.Shapes.AddShape(msoShapeOval, pinLeft, pinTop, PIN_SIZE, PIN_SIZE)

        pinShape.Fill.ForeColor.RGB = pinColor

        pinShape.Line.ForeColor.RGB = RGB(255, 255, 255)

        pinShape.Line.Weight = 1.5



        ' 番号ラベル（ピン上）

        pinShape.TextFrame.Characters.Text = CStr(defectNum)

        pinShape.TextFrame.Characters.Font.Size = 8

        pinShape.TextFrame.Characters.Font.Color = RGB(255, 255, 255)

        pinShape.TextFrame.Characters.Font.Bold = True

        pinShape.TextFrame.HorizontalAlignment = xlHAlignCenter

        pinShape.TextFrame.VerticalAlignment = xlVAlignCenter



        ' サムネイル画像
        Dim thumbPath As String
        thumbPath = ""
        If defect.Exists("imageFile") Then
            thumbPath = ResolveImagePath(CStr(defect("imageFile")))
        ElseIf defect.Exists("imageData") Then
            If Not IsNull(defect("imageData")) And defect("imageData") <> "" Then
                thumbPath = DecodeBase64ToTempFile(CStr(defect("imageData")))



                If thumbPath <> "" Then

                    Dim thumbShape As Shape

                    Set thumbShape = ws.Shapes.AddPicture( _
                        Filename:=thumbPath, _
                        LinkToFile:=False, _
                        SaveWithDocument:=True, _
                        Left:=thumbLeft, _
                        Top:=thumbTop, _
                        Width:=THUMBNAIL_W, _
                        Height:=THUMBNAIL_H)



                    ' 番号ラベル（サムネイル横）

                    Dim lblShape As Shape

                    Set lblShape = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, _
                        thumbLeft + THUMBNAIL_W + 5, thumbTop + THUMBNAIL_H / 2 - 8, 30, 16)

                    lblShape.TextFrame.Characters.Text = CStr(defectNum)

                    lblShape.TextFrame.Characters.Font.Size = 10

                    lblShape.TextFrame.Characters.Font.Bold = True

                    lblShape.Fill.Visible = msoFalse

                    lblShape.Line.Visible = msoFalse



                    ' 矢印線（ピン中心 → サムネイル左端中央）

                    Dim arrowShape As Shape

                    Set arrowShape = ws.Shapes.AddConnector(msoConnectorStraight, _
                        pinLeft + PIN_SIZE / 2, pinTop + PIN_SIZE / 2, _
                        thumbLeft, thumbTop + THUMBNAIL_H / 2)



                    arrowShape.Line.ForeColor.RGB = pinColor

                    arrowShape.Line.Weight = 1

                    arrowShape.Line.EndArrowheadStyle = msoArrowheadTriangle

                    arrowShape.Line.EndArrowheadLength = msoArrowheadShort

                    arrowShape.Line.EndArrowheadWidth = msoArrowheadNarrow



                    ' 次のサムネイルの位置

                    thumbTop = thumbTop + THUMBNAIL_H + 10

                End If

            End If

        End If



NextDefect:

    Next i



    Exit Sub



ErrHandler:

    m_ErrorLog.Add "キープラン描画エラー: " & Err.Description

End Sub



'' =============================================

'' ユーティリティ: ボタン配置

'' =============================================



'' 現地調査シートに「JSONデータ取り込み」ボタンを配置
