Attribute VB_Name = "DataImportSurvey"

'' =============================================
'' DataImportSurvey - 現地調査シートインポート
'' =============================================

Option Explicit

'' =============================================
'' 現地調査シートへのデータインポート
'' 評価値、オプション、メンテナンス状況等
'' =============================================

Public Sub ImportToOnsiteSurveySheet(jsonData As Object)

    Dim ws As Worksheet
    Dim subPhase As String
    subPhase = "ws取得"

    On Error GoTo SurveyError

    Set ws = Worksheets(SURVEY_SHEET)



    ' 物件情報の入力

    ImportPropertyInfo ws, jsonData



    ' 検査チェックシートがある場合

    If jsonData.Exists("inspectionChecklist") Then

        If Not jsonData("inspectionChecklist") Is Nothing Then

            Dim checklist As Object

            Set checklist = jsonData("inspectionChecklist")



            ' 評価値の入力

            If checklist.Exists("evaluations") Then

                subPhase = "ImportEvaluations"
                ImportEvaluations ws, checklist("evaluations")

            End If



            ' グループ有無の入力

            If checklist.Exists("groupExistence") Then

                subPhase = "ImportGroupExistence"
                ImportGroupExistence ws, checklist("groupExistence")

            End If



            ' 仕上げ材の入力

            If checklist.Exists("finishMaterials") Then

                subPhase = "ImportFinishMaterials"
                ImportFinishMaterials ws, checklist("finishMaterials")

            End If



            ' オプション選択の入力

            If checklist.Exists("options") Then

                subPhase = "ImportOptions"
                ImportOptions ws, checklist("options")

            End If



            ' メンテナンス状況の入力

            If checklist.Exists("maintenanceStatus") Then

                subPhase = "ImportMaintenanceStatus"
                ImportMaintenanceStatus ws, checklist("maintenanceStatus")

            End If



            ' カテゴリ調査状況の入力

            If checklist.Exists("categorySurveyStatus") Then

                subPhase = "ImportCategorySurveyStatus"
                ImportCategorySurveyStatus ws, checklist("categorySurveyStatus")

            End If


            ' 項目調査状況の入力（鉄筋/シュミット）
            If checklist.Exists("itemSurveyStatus") Then
                subPhase = "ImportItemSurveyStatus"
                ImportItemSurveyStatus ws, checklist("itemSurveyStatus")
            End If

            ' 資料値・実測値の入力（遵法性）
            If checklist.Exists("evaluations") Then
                subPhase = "ImportLegalValues"
                ImportLegalValues ws, checklist("evaluations")
                ' 鉄筋ピッチ・シュミット測定値の入力
                subPhase = "ImportRebarSchmidt"
                ImportRebarSchmidt ws, checklist("evaluations")
                ' 遵法性 懸念内容の入力（item97-101）
                subPhase = "ImportConcernDetails"
                ImportConcernDetails ws, checklist("evaluations")
            End If

            ' 備考の入力
            If checklist.Exists("options") Then
                subPhase = "ImportRemarks"
                ImportRemarks ws, checklist
            End If

        End If

    End If

    Exit Sub

SurveyError:
    MsgBox "ImportToOnsiteSurveySheetでエラー:" & vbCrLf & _
           "サブフェーズ: " & subPhase & vbCrLf & _
           "エラー番号: " & Err.Number & vbCrLf & _
           "内容: " & Err.Description, vbCritical, "Phase3 エラー詳細"
End Sub



'' 物件情報入力


Public Sub ImportPropertyInfo(ws As Worksheet, jsonData As Object)
    On Error Resume Next

    ' マッピング取得
    Dim propMap As Object
    Set propMap = GetPropertyInfoMapping()
    If propMap.Count = 0 Then
        m_ErrorLog.Add "WARNING: Table H (物件情報マッピング) が空です"
        On Error GoTo 0
        Exit Sub
    End If

    ' 物件名
    If jsonData.Exists("property") Then
        Dim prop As Object
        Set prop = jsonData("property")

        If prop.Exists("name") Then
            If propMap.Exists("prop_name") Then
                SetCellValueSafe ws, propMap("prop_name"), prop("name")
            End If
        End If

        ' 住所
        If prop.Exists("address") Then
            If propMap.Exists("prop_address") Then
                SetCellValueSafe ws, propMap("prop_address"), prop("address")
            End If
        End If

        ' 調査日 (format: "yyyy-mm-dd")
        If prop.Exists("inspectionDate") Then
            Dim dateStr As String
            dateStr = CStr(prop("inspectionDate"))
            If Len(dateStr) >= 10 Then
                Dim yearPart As String
                Dim monthPart As String
                Dim dayPart As String
                yearPart = Left(dateStr, 4)
                monthPart = Mid(dateStr, 6, 2)
                dayPart = Mid(dateStr, 9, 2)
                ' 先頭の0を除去 (例: "03" → "3")
                If Left(monthPart, 1) = "0" Then monthPart = Mid(monthPart, 2)
                If Left(dayPart, 1) = "0" Then dayPart = Mid(dayPart, 2)

                If propMap.Exists("prop_date_year") Then
                    SetCellValueSafe ws, propMap("prop_date_year"), yearPart
                End If
                If propMap.Exists("prop_date_month") Then
                    SetCellValueSafe ws, propMap("prop_date_month"), monthPart
                End If
                If propMap.Exists("prop_date_day") Then
                    SetCellValueSafe ws, propMap("prop_date_day"), dayPart
                End If
            End If
        End If

        ' 天候
        If prop.Exists("weather") Then
            If propMap.Exists("prop_weather") Then
                Dim weatherCell As String
                weatherCell = propMap("prop_weather")
                Dim weatherVal As String
                weatherVal = CStr(prop("weather"))

                Dim weatherOffset As Long
                Select Case weatherVal
                    Case ChrW(&H6674)  ' 晴
                        weatherOffset = 0
                    Case ChrW(&H66C7)  ' 曇
                        weatherOffset = 1
                    Case ChrW(&H96E8)  ' 雨
                        weatherOffset = 2
                    Case ChrW(&H96EA)  ' 雪
                        weatherOffset = 3
                    Case Else
                        weatherOffset = -1
                End Select

                If weatherOffset >= 0 Then
                    If weatherOffset = 0 Then
                        SetCellValueSafe ws, weatherCell, ChrW(&H25A0)
                    Else
                        ' セルアドレスから列をオフセット
                        Dim weatherRange As Range
                        Set weatherRange = ws.Range(weatherCell)
                        If Not weatherRange Is Nothing Then
                            Dim targetCell As Range
                            Set targetCell = weatherRange.Offset(0, weatherOffset)
                            SetCellValueSafe ws, targetCell.Address(False, False), ChrW(&H25A0)
                        End If
                    End If
                End If
            End If
        End If

        ' 調査開始時間
        If prop.Exists("inspectionStartTime") Then
            If propMap.Exists("prop_time_start") Then
                SetCellValueSafe ws, propMap("prop_time_start"), CStr(prop("inspectionStartTime"))
            End If
        End If

        ' 調査終了時間
        If prop.Exists("inspectionEndTime") Then
            If propMap.Exists("prop_time_end") Then
                SetCellValueSafe ws, propMap("prop_time_end"), CStr(prop("inspectionEndTime"))
            End If
        End If
    End If

    On Error GoTo 0
End Sub



'' 評価値の入力


Public Sub ImportEvaluations(ws As Worksheet, evaluations As Object)

    Dim b2Map As Object

    Set b2Map = GetB2CellMapping()

    Dim aMap As Object
    Set aMap = GetACellMapping()
    Dim b1Map As Object
    Set b1Map = GetB1CellMapping()


    Dim cMap As Object

    Set cMap = GetCCellMapping()



    Dim itemId As Variant

    For Each itemId In evaluations.Keys

        Dim evalList As Object

        Set evalList = evaluations(itemId)



        ' 最悪の評価値を取得

        Dim worstEval As String

        worstEval = GetWorstEvaluation(evalList)



        ' 調査方法の入力

        WriteSurveyMethods ws, CStr(itemId), evalList



        ' 評価値に応じたセルにチェックマーク入力
        ' a=aMap, b1=b1Map, b2=b2Map, c=cMap（マッピングシートG/H/B/C列）
        Select Case worstEval
            Case "a"
                If aMap.Exists(itemId) Then
                    SetCellValueSafe ws, aMap(itemId), ChrW(&H25A0)
                End If
            Case "b1"
                If b1Map.Exists(itemId) Then
                    SetCellValueSafe ws, b1Map(itemId), ChrW(&H25A0)
                End If
            Case "b2"
                If b2Map.Exists(itemId) Then
                    SetCellValueSafe ws, b2Map(itemId), ChrW(&H25A0) ' ■
                End If
            Case "c"
                If cMap.Exists(itemId) Then
                    SetCellValueSafe ws, cMap(itemId), ChrW(&H25A0) ' ■
                End If
        End Select
    Next itemId

End Sub



'' 評価リストから最悪の評価値を取得


Public Function GetWorstEvaluation(evalList As Object) As String

    Dim worst As String

    worst = ""



    Dim i As Long

    For i = 1 To evalList.Count

        Dim evalObj As Object

        Set evalObj = evalList(i)



        If evalObj.Exists("eval") Then

            Dim ev As String

            ev = CStr(evalObj("eval"))



            Select Case ev

                Case "c"

                    worst = "c"

                Case "b2"

                    If worst <> "c" Then worst = "b2"

                Case "b1"

                    If worst <> "c" And worst <> "b2" Then worst = "b1"

                Case "a"

                    If worst = "" Or worst = "na" Then worst = "a"
                Case "na"
                    If worst = "" Then worst = "na"

            End Select

        End If

    Next i



    GetWorstEvaluation = worst

End Function



'' 調査方法の入力（目視/計測/触診）


Public Sub WriteSurveyMethods(ws As Worksheet, itemId As String, evalList As Object)

    Dim surveyMap As Object

    Set surveyMap = GetSurveyMethodMapping()



    If Not surveyMap.Exists(itemId) Then Exit Sub



    ' evalListから調査方法を集約

    Dim hasVisual As Boolean, hasMeasure As Boolean, hasPalp As Boolean

    Dim i As Long

    For i = 1 To evalList.Count

        Dim evalObj As Object

        Set evalObj = evalList(i)

        If evalObj.Exists("surveyMethods") Then

            Dim methods As Object

            Set methods = evalObj("surveyMethods")

            Dim j As Long

            For j = 1 To methods.Count

                Select Case CStr(methods(j))

                    Case "visual": hasVisual = True

                    Case "measurement": hasMeasure = True

                    Case "palpation": hasPalp = True

                End Select

            Next j

        End If

    Next i



    Dim inner As Object

    Set inner = surveyMap(itemId)



    ' チェックマーク入力

    If hasVisual And inner.Exists("visual") Then

        SetCellValueSafe ws, inner("visual"), ChrW(&H25A0) ' ■

    End If

    If hasMeasure And inner.Exists("measurement") Then

        SetCellValueSafe ws, inner("measurement"), ChrW(&H25A0) ' ■

    End If

    If hasPalp And inner.Exists("palpation") Then
        SetCellValueSafe ws, inner("palpation"), ChrW(&H25A0) ' ■
    End If
End Sub



'' グループ有無の入力


Public Sub ImportGroupExistence(ws As Worksheet, groupExistence As Object)

    Dim grpMap As Object

    Set grpMap = GetGroupExistenceMapping()



    Dim groupId As Variant

    For Each groupId In groupExistence.Keys

        If grpMap.Exists(CStr(groupId)) Then

            Dim status As Object

            Set status = groupExistence(groupId)



            Dim inner As Object

            Set inner = grpMap(CStr(groupId))



            If status.Exists("exists") Then

                If CBool(status("exists")) Then

                    ' 有

                    If inner.Exists("yes") Then

                        SetCellValueSafe ws, inner("yes"), ChrW(&H25A0)

                    End If

                Else

                    ' 無

                    If inner.Exists("no") Then

                        SetCellValueSafe ws, inner("no"), ChrW(&H25A0)

                    End If

                End If

            End If

        End If

    Next groupId

End Sub



'' 仕上げ材の入力


Public Sub ImportFinishMaterials(ws As Worksheet, finishMaterials As Object)

    Dim optMap As Object

    Set optMap = GetOptionMapping()



    ' finishMaterials: { groupId: string[] }

    ' 例: { "group_kiso": ["モルタル仕上", "タイル仕上"] }

    Dim groupId As Variant

    For Each groupId In finishMaterials.Keys

        Dim materials As Object

        Set materials = finishMaterials(groupId)



        Dim i As Long

        For i = 1 To materials.Count

            ' optionKeyを構築: "finish_kiso_mortar" 等

            ' マッピングシートのoptionKeyと照合

            Dim matName As String

            matName = CStr(materials(i))



            Dim optKey As String

            optKey = BuildFinishMaterialKey(CStr(groupId), matName)



            If optMap.Exists(optKey) Then

                SetCellValueSafe ws, optMap(optKey), ChrW(&H25A0)

            End If

        Next i

    Next groupId

End Sub



'' 仕上げ材のoptionKeyを構築


Public Function BuildFinishMaterialKey(groupId As String, matName As String) As String

    ' group_kiso + モルタル仕上 → finish_kiso_mortar

    Dim prefix As String

    Select Case groupId

        Case "group_kiso": prefix = "finish_kiso_"

        Case "group_gaiheki": prefix = "finish_gaiheki_"

        Case Else: prefix = "finish_" & Replace(groupId, "group_", "") & "_"

    End Select



    Dim suffix As String

    Select Case matName

        Case "モルタル仕上": suffix = "mortar"

        Case "打ちっぱなし": suffix = "exposed"

        Case "タイル仕上": suffix = "tile"

        Case "石張り": suffix = "stone"

        Case "サイディング": suffix = "siding"

        Case "ALC": suffix = "alc"

        Case "ボード": suffix = "board"

        Case Else: suffix = "other"

    End Select



    BuildFinishMaterialKey = prefix & suffix

End Function



'' オプション選択の入力


Public Sub ImportOptions(ws As Worksheet, options As Object)

    Dim optMap As Object

    Set optMap = GetOptionMapping()



    ' options: { itemId: { label: value|value[] } }

    Dim itemId As Variant

    For Each itemId In options.Keys

        Dim itemOpts As Object

        Set itemOpts = options(itemId)



        Dim label As Variant

        For Each label In itemOpts.Keys

            Dim val As Variant
            If IsObject(itemOpts(label)) Then
                Set val = itemOpts(label)
            Else
                val = itemOpts(label)
            End If



            ' optionKeyを構築

            Dim optKey As String

            optKey = BuildOptionKey(CStr(label), val)



            If optMap.Exists(optKey) Then

                SetCellValueSafe ws, optMap(optKey), ChrW(&H25A0)

            End If

        Next label

    Next itemId

End Sub



'' オプションのoptionKeyを構築


Public Function BuildOptionKey(label As String, val As Variant) As String
    ' ラベル+値からマッピングシートのキーを推定
    Dim valStr As String
    If IsObject(val) Then
        ' 配列の場合は最初の値
        If val.Count > 0 Then valStr = CStr(val(1)) Else valStr = ""
    Else
        valStr = CStr(val)
    End If

    Select Case label
        Case "基礎形式"
            Select Case valStr
                Case "ベタ基礎": BuildOptionKey = "foundation_beta"
                Case "布基礎": BuildOptionKey = "foundation_nuno"
                Case "独立基礎": BuildOptionKey = "foundation_dokuritsu"
                Case "杭基礎": BuildOptionKey = "foundation_kui"
                Case "不明": BuildOptionKey = "foundation_unknown"
                Case Else: BuildOptionKey = "foundation_other"
            End Select
        Case "換気方法"
            Select Case valStr
                Case "換気口": BuildOptionKey = "vent_port"
                Case "基礎パッキン": BuildOptionKey = "vent_packing"
                Case "無": BuildOptionKey = "vent_none"
                Case Else: BuildOptionKey = ""
            End Select
        Case "断熱工法"
            Select Case valStr
                Case "床断熱工法": BuildOptionKey = "insulation_floor"
                Case "基礎断熱工法": BuildOptionKey = "insulation_foundation"
                Case "無": BuildOptionKey = "insulation_none"
                Case "不明": BuildOptionKey = "insulation_unknown"
                Case Else: BuildOptionKey = ""
            End Select
        Case "小屋裏・軒裏換気口の設置"
            Select Case valStr
                Case "設置有": BuildOptionKey = "koyaura_vent_yes"
                Case "設置無": BuildOptionKey = "koyaura_vent_no"
                Case "不明": BuildOptionKey = "koyaura_vent_unknown"
                Case Else: BuildOptionKey = ""
            End Select
        Case "高さ"
            Select Case valStr
                Case "30cm＞": BuildOptionKey = "height_lt30"
                Case "30cm≦": BuildOptionKey = "height_gte30"
                Case "40cm≦": BuildOptionKey = "height_gte40"
                Case Else: BuildOptionKey = ""
            End Select
        Case "外壁の種類"
            Select Case valStr
                Case "吹付タイル": BuildOptionKey = "wall_type_fukitsuke"
                Case "モルタル塗り": BuildOptionKey = "wall_type_mortar"
                Case "サイディングボード": BuildOptionKey = "wall_type_siding"
                Case "その他板状": BuildOptionKey = "wall_type_other_board"
                Case "タイル貼り": BuildOptionKey = "wall_type_tile"
                Case "PCパネル": BuildOptionKey = "steel_wall_pc"
                Case "ALC板吹付仕上": BuildOptionKey = "steel_wall_alc_fuki"
                Case "カーテンウォール": BuildOptionKey = "steel_wall_curtain"
                Case "その他湿式工法": BuildOptionKey = "steel_wall_other_wet"
                Case "乾式工法": BuildOptionKey = "steel_wall_dry"
                Case "ALC板タイル貼仕上": BuildOptionKey = "steel_wall_alc_tile"
                Case Else: BuildOptionKey = ""
            End Select
        Case "柱サイズ"
            Select Case valStr
                Case "105≧": BuildOptionKey = "pillar_gt105"
                Case "105＜": BuildOptionKey = "pillar_gte105"
                Case "120≦": BuildOptionKey = "pillar_gte120"
                Case Else: BuildOptionKey = ""
            End Select
        Case "外壁"
            Select Case valStr
                Case "通気無": BuildOptionKey = "wall_air_none"
                Case "通気工法": BuildOptionKey = "wall_air_flow"
                Case "湿式": BuildOptionKey = "wall_air_wet"
                Case "乾式": BuildOptionKey = "wall_air_dry"
                Case Else: BuildOptionKey = ""
            End Select
        Case "コンクリート面仕上材"
            Select Case valStr
                Case "コンクリート打放（増打無）": BuildOptionKey = "concrete_bare"
                Case "吹付タイル": BuildOptionKey = "concrete_fukitsuke"
                Case "モルタル塗り（15mm以上）": BuildOptionKey = "concrete_mortar"
                Case "タイル貼り": BuildOptionKey = "concrete_tile"
                Case "石貼り": BuildOptionKey = "concrete_stone"
                Case Else: BuildOptionKey = ""
            End Select
        Case "庇の出（目測）"
            Select Case valStr
                Case "300＞": BuildOptionKey = "eave_lt300"
                Case "300≦": BuildOptionKey = "eave_gte300"
                Case "450≦": BuildOptionKey = "eave_gte450"
                Case "900≦": BuildOptionKey = "eave_gte900"
                Case Else: BuildOptionKey = ""
            End Select
        Case "軒の出（目測）"
            Select Case valStr
                Case "300＞": BuildOptionKey = "cornice_lt300"
                Case "300≦": BuildOptionKey = "cornice_gte300"
                Case "450≦": BuildOptionKey = "cornice_gte450"
                Case "900≦": BuildOptionKey = "cornice_gte900"
                Case Else: BuildOptionKey = ""
            End Select
        Case "設置"
            ' 屋外階段の該当有/無はテーブルB(グループ有無)で処理するためスキップ
            BuildOptionKey = ""
        Case "屋根仕様"
            Select Case valStr
                Case "陸屋根": BuildOptionKey = "roof_flat"
                Case "金属板葺き": BuildOptionKey = "roof_metal"
                Case "トタン": BuildOptionKey = "roof_tin"
                Case "スレート瓦屋根": BuildOptionKey = "roof_slate"
                Case "桟瓦葺き": BuildOptionKey = "roof_tile"
                Case Else: BuildOptionKey = "roof_other"
            End Select
        Case "撮影棒による画像確認"
            Select Case valStr
                Case "実施可": BuildOptionKey = "camera_rod_yes"
                Case "実施不可": BuildOptionKey = "camera_rod_no"
                Case Else: BuildOptionKey = ""
            End Select
        Case "防水工法"
            Select Case valStr
                Case "アスファルト防水": BuildOptionKey = "wp_asphalt"
                Case "シート防水": BuildOptionKey = "wp_sheet"
                Case "塗膜防水": BuildOptionKey = "wp_coating"
                Case "FRP防水": BuildOptionKey = "wp_frp"
                Case Else: BuildOptionKey = "wp_other"
            End Select
        Case "確認方法"
            Select Case valStr
                Case "屋上にて目視確認": BuildOptionKey = "check_visual"
                Case "撮影棒による画像確認": BuildOptionKey = "check_camera_rod"
                Case "実施不可": BuildOptionKey = "check_impossible"
                Case Else: BuildOptionKey = ""
            End Select
        Case "仕上材の種類"
            Select Case valStr
                Case "コンクリート直仕上げ": BuildOptionKey = "finish_main_concrete"
                Case "モルタル仕上げ", "その他塗り仕上げ", "モルタル仕上げ・その他塗り仕上げ": BuildOptionKey = "finish_main_mortar"
                Case "その他仕上げ": BuildOptionKey = "finish_main_other"
                Case Else: BuildOptionKey = ""
            End Select
        Case Else
            BuildOptionKey = ""
    End Select
End Function



'' メンテナンス状況の入力


Public Sub ImportMaintenanceStatus(ws As Worksheet, maintStatus As Object)

    Dim maintMap As Object

    Set maintMap = GetMaintenanceMapping()



    Dim catId As Variant

    For Each catId In maintStatus.Keys

        If maintMap.Exists(CStr(catId)) Then

            Dim status As Object

            Set status = maintStatus(catId)



            Dim inner As Object

            Set inner = maintMap(CStr(catId))



            ' need: "required" / "not_required" / null

            If status.Exists("need") Then

                If Not IsNull(status("need")) Then

                    Dim need As String

                    need = CStr(status("need"))

                    If need = "required" And inner.Exists("required") Then

                        SetCellValueSafe ws, inner("required"), ChrW(&H25A0)

                    ElseIf need = "not_required" And inner.Exists("not_required") Then

                        SetCellValueSafe ws, inner("not_required"), ChrW(&H25A0)

                    End If

                End If

            End If



            ' condition: "good" / "no_issue" / "defect_found" / null

            If status.Exists("condition") Then

                If Not IsNull(status("condition")) Then

                    Dim cond As String

                    cond = CStr(status("condition"))

                    If (cond = "good" Or cond = "no_issue") And inner.Exists("good") Then

                        SetCellValueSafe ws, inner("good"), ChrW(&H25A0)

                    ElseIf cond = "defect_found" And inner.Exists("defect") Then

                        SetCellValueSafe ws, inner("defect"), ChrW(&H25A0)

                    End If

                End If

            End If

        End If

    Next catId

End Sub



'' カテゴリ調査状況の入力


Public Sub ImportCategorySurveyStatus(ws As Worksheet, catSurvey As Object)

    Dim catMap As Object

    Set catMap = GetCategorySurveyMapping()



    Dim catId As Variant

    For Each catId In catSurvey.Keys

        If catMap.Exists(CStr(catId)) Then

            Dim status As Object

            Set status = catSurvey(catId)



            Dim inner As Object

            Set inner = catMap(CStr(catId))



            If status.Exists("conducted") Then

                If CBool(status("conducted")) Then

                    ' 調査実施

                    If inner.Exists("conducted") Then

                        SetCellValueSafe ws, inner("conducted"), ChrW(&H25A0)

                    End If

                Else

                    ' 調査実施不可
                    If inner.Exists("not") Then
                        SetCellValueSafe ws, inner("not"), ChrW(&H25A0)
                    End If
                    ' 不可理由の入力
                    If status.Exists("notConductedReason") Then
                        If inner.Exists("reason") Then
                            SetCellValueSafe ws, inner("reason"), CStr(status("notConductedReason"))
                        End If
                    End If
                End If

            End If

        End If

    Next catId

End Sub



'' テーブルF: 項目調査状況マッピング (item95鉄筋, item96シュミット)
'' 戻り値: Dictionary - itemId → Dictionary("conducted","not_required","not_conducted","reason"→cellAddr)

Public Sub ImportItemSurveyStatus(ws As Worksheet, itemSurvey As Object)
    Dim survMap As Object
    Set survMap = GetItemSurveyMapping()

    Dim itemId As Variant
    For Each itemId In itemSurvey.Keys
        If survMap.Exists(CStr(itemId)) Then
            Dim status As Object
            Set status = itemSurvey(itemId)
            Dim inner As Object
            Set inner = survMap(CStr(itemId))

            If status.Exists("surveyState") Then
                Dim state As String
                state = CStr(status("surveyState"))

                Select Case state
                    Case "conducted"
                        If inner.Exists("conducted") Then
                            SetCellValueSafe ws, inner("conducted"), ChrW(&H25A0)
                        End If
                    Case "not_required"
                        If inner.Exists("not_required") Then
                            SetCellValueSafe ws, inner("not_required"), ChrW(&H25A0)
                        End If
                    Case "not_conducted"
                        If inner.Exists("not_conducted") Then
                            SetCellValueSafe ws, inner("not_conducted"), ChrW(&H25A0)
                        End If
                        ' 不可理由の入力
                        If status.Exists("reason") Then
                            If inner.Exists("reason") Then
                                SetCellValueSafe ws, inner("reason"), CStr(status("reason"))
                            End If
                        End If
                End Select
            End If
        End If
    Next itemId
End Sub



'' テーブルG: 資料値・実測値マッピング (item101)
'' 戻り値: Dictionary - itemId → Dictionary("docValue","measuredValue"→cellAddr)

Public Sub ImportLegalValues(ws As Worksheet, evaluations As Object)
    Dim legalMap As Object
    Set legalMap = GetLegalValueMapping()

    Dim itemId As Variant
    For Each itemId In legalMap.Keys
        ' evaluations から該当itemの最初の評価を取得
        If evaluations.Exists(itemId) Then
            Dim evalList As Object
            Set evalList = evaluations(itemId)

            If evalList.Count >= 1 Then
                Dim evalObj As Object
                Set evalObj = evalList(1)

                Dim inner As Object
                Set inner = legalMap(itemId)

                ' 資料値
                If evalObj.Exists("legalDocValue") Then
                    If inner.Exists("docValue") Then
                        SetCellValueSafe ws, inner("docValue"), CStr(evalObj("legalDocValue"))
                    End If
                End If

                ' 実測値
                If evalObj.Exists("legalMeasuredValue") Then
                    If inner.Exists("measuredValue") Then
                        SetCellValueSafe ws, inner("measuredValue"), CStr(evalObj("legalMeasuredValue"))
                    End If
                End If
            End If
        End If
    Next itemId
End Sub




'' 備考の入力

Public Sub ImportRemarks(ws As Worksheet, checklist As Object)
    On Error Resume Next

    ' マッピング取得
    Dim remMap As Object
    Set remMap = GetRemarksMapping()
    If remMap.Count = 0 Then
        m_ErrorLog.Add "WARNING: Table I (備考マッピング) が空です"
        On Error GoTo 0
        Exit Sub
    End If

    ' options.remarks から備考テキストを取得
    If Not checklist.Exists("options") Then
        On Error GoTo 0
        Exit Sub
    End If

    Dim options As Object
    Set options = checklist("options")

    If Not options.Exists("remarks") Then
        On Error GoTo 0
        Exit Sub
    End If

    Dim remarks As Object
    Set remarks = options("remarks")

    ' remarks内の各キーをマッピングと照合して書き込み
    Dim remarkKey As Variant
    For Each remarkKey In remarks.Keys
        Dim remKeyStr As String
        remKeyStr = CStr(remarkKey)

        If remMap.Exists(remKeyStr) Then
            Dim remarkVal As String
            remarkVal = CStr(remarks(remarkKey))
            If remarkVal <> "" Then
                SetCellValueSafe ws, remMap(remKeyStr), remarkVal
            End If
        End If
    Next remarkKey

    On Error GoTo 0
End Sub


'' =============================================

'' Phase 4: 劣化事象シート作成

'' =============================================

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

    ' standardPhotos の存在チェック（トップレベルまたはproperty配下）
    Dim photos As Object
    If jsonData.Exists("standardPhotos") Then
        Set photos = jsonData("standardPhotos")
    ElseIf jsonData.Exists("property") Then
        Dim prop As Object
        Set prop = jsonData("property")
        If prop.Exists("standardPhotos") Then
            Set photos = prop("standardPhotos")
        Else
            Exit Sub
        End If
    Else
        Exit Sub
    End If
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

        If photo.Exists("photoType") And (photo.Exists("imageFile") Or photo.Exists("imageData")) Then
            Dim pType As Long
            pType = CLng(photo("photoType"))

            ' マッピングからセルアドレスを取得
            If photoMap.Exists(pType) Then
                Dim targetCell As String
                targetCell = photoMap(pType)

                Dim imgPath As String
                imgPath = ""
                
                ' 新形式: imageFileパスから直接参照
                If photo.Exists("imageFile") Then
                    imgPath = DataImport.ResolveImagePath(CStr(photo("imageFile")))
                ElseIf photo.Exists("imageData") Then
                    ' 旧形式: Base64デコード
                    Dim imgData As String
                    imgData = CStr(photo("imageData"))
                    If imgData <> "" Then
                        imgPath = DataImport.DecodeBase64ToTempFile(imgData)
                    End If
                End If

                If imgPath <> "" Then

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


'' 遵法性 懸念内容の入力（item97-101）
'' item97-100 (legal): concernDetail → 懸念内容セル
'' item101 (freetext): freetextContent → 懸念内容セル
'' マッピング: Table A D列（b2セル列を再利用）
Public Sub ImportConcernDetails(ws As Worksheet, evaluations As Object)
    Dim b2Map As Object
    Set b2Map = GetB2CellMapping()
    
    Dim legalItems As Variant
    legalItems = Array("item97", "item98", "item99", "item100", "item101")
    
    Dim idx As Long
    For idx = LBound(legalItems) To UBound(legalItems)
        Dim itemId As String
        itemId = legalItems(idx)
        
        If Not evaluations.Exists(itemId) Then GoTo NextConcernItem
        If Not b2Map.Exists(itemId) Then GoTo NextConcernItem
        
        Dim evalList As Object
        Set evalList = evaluations(itemId)
        If evalList.Count = 0 Then GoTo NextConcernItem
        
        ' 最初の評価を取得
        Dim evalObj As Object
        Set evalObj = evalList(1)
        
        Dim concernText As String
        concernText = ""
        
        ' legal型 (item97-100): concernDetail
        If evalObj.Exists("concernDetail") Then
            concernText = CStr(evalObj("concernDetail"))
        End If
        
        ' freetext型 (item101): freetextContent
        If evalObj.Exists("freetextContent") Then
            If CStr(evalObj("freetextContent")) <> "" Then
                concernText = CStr(evalObj("freetextContent"))
            End If
        End If
        
        ' 懸念内容セルに書き込み
        If concernText <> "" Then
            SetCellValueSafe ws, b2Map(itemId), concernText
        End If
        
NextConcernItem:
    Next idx
End Sub

'' 鉄筋ピッチ・シュミットハンマー測定値のインポート
'' テーブルGのマッピングを使用（item95_pitch, item96_val1-9, item96_result）
Public Sub ImportRebarSchmidt(ws As Worksheet, evaluations As Object)
    Dim legalMap As Object
    Set legalMap = GetLegalValueMapping()

    ' item95: 鉄筋ピッチ
    If evaluations.Exists("item95") Then
        Dim evalList95 As Object
        Set evalList95 = evaluations("item95")
        If evalList95.Count >= 1 Then
            Dim eval95 As Object
            Set eval95 = evalList95(1)
            If eval95.Exists("rebarPitch") Then
                If legalMap.Exists("item95_pitch") Then
                    Dim pitchInner As Object
                    Set pitchInner = legalMap("item95_pitch")
                    If pitchInner.Exists("measuredValue") Then
                        SetCellValueSafe ws, pitchInner("measuredValue"), CStr(eval95("rebarPitch"))
                    End If
                End If
            End If
        End If
    End If

    ' item96: シュミットハンマー測定値1-9 + 算定結果
    If evaluations.Exists("item96") Then
        Dim evalList96 As Object
        Set evalList96 = evaluations("item96")
        If evalList96.Count >= 1 Then
            Dim eval96 As Object
            Set eval96 = evalList96(1)
            If eval96.Exists("schmidtValues") Then
                Dim vals As Object
                Set vals = eval96("schmidtValues")
                Dim vi As Long
                For vi = 1 To vals.Count
                    Dim valKey As String
                    valKey = "item96_val" & vi
                    If legalMap.Exists(valKey) Then
                        Dim valInner As Object
                        Set valInner = legalMap(valKey)
                        If valInner.Exists("measuredValue") Then
                            SetCellValueSafe ws, valInner("measuredValue"), CStr(vals(vi))
                        End If
                    End If
                Next vi
            End If
            If eval96.Exists("schmidtResult") Then
                If legalMap.Exists("item96_result") Then
                    Dim resInner As Object
                    Set resInner = legalMap("item96_result")
                    If resInner.Exists("measuredValue") Then
                        SetCellValueSafe ws, resInner("measuredValue"), CStr(eval96("schmidtResult"))
                    End If
                End If
            End If
        End If
    End If
End Sub
