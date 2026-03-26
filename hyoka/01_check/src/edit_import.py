#!/usr/bin/env python3
"""Edit DataImport.bas: column shifts + new functions for na, itemSurveyStatus, legalValues"""

INPUT_FILE = "DataImport.bas"
OUTPUT_FILE = "DataImport.bas"

with open(INPUT_FILE, "rb") as f:
    raw = f.read()

content = raw.decode("cp932")
# Normalize to \n for processing, restore \r\r\n at end
content = content.replace("\r\r\n", "\n").replace("\r\n", "\n")
fixes = 0


def fix(content, old, new, label):
    global fixes
    if old in content:
        count = content.count(old)
        content = content.replace(old, new, 1)
        print(f"FIX ({count}x found, replaced 1st): {label}")
        fixes += 1
    else:
        print(f"SKIP: {label}")
    return content


# =================================================================
# 1. GetGroupExistenceMapping: columns 10,11,12 → 11,12,13(有),14(無)
#    Table B shifted: J-M(10-13) → K-N(11-14)
#    Note: the grpName column also shifted: 11→12, yes:12→13, no:13→14
#    But wait - checking original: col 10=groupKey, 11=yes, 12=no
#    After shift: col 11=groupKey, 12=grpName, 13=yes, 14=no
# =================================================================
content = fix(content,
    "Do While mapWs.Cells(r, 10).Value <> \"\"\n\n        Dim grpId As String\n\n        grpId = CStr(mapWs.Cells(r, 10).Value)",
    "Do While mapWs.Cells(r, 11).Value <> \"\"\n\n        Dim grpId As String\n\n        grpId = CStr(mapWs.Cells(r, 11).Value)",
    "GetGroupExistenceMapping col 10→11 (groupKey)")

content = fix(content,
    "If mapWs.Cells(r, 11).Value <> \"\" Then inner(\"yes\") = CStr(mapWs.Cells(r, 11).Value)\n\n        If mapWs.Cells(r, 12).Value <> \"\" Then inner(\"no\") = CStr(mapWs.Cells(r, 12).Value)",
    "If mapWs.Cells(r, 13).Value <> \"\" Then inner(\"yes\") = CStr(mapWs.Cells(r, 13).Value)\n\n        If mapWs.Cells(r, 14).Value <> \"\" Then inner(\"no\") = CStr(mapWs.Cells(r, 14).Value)",
    "GetGroupExistenceMapping cols 11,12→13,14 (yes/no)")


# =================================================================
# 2. GetOptionMapping: columns 14,16 → 15,17
#    Table C shifted: N-Q(14-17) → O-R(15-18)
#    col 14=optionKey → 15, col 16=cellAddr → 17
# =================================================================
content = fix(content,
    "Do While mapWs.Cells(r, 14).Value <> \"\"\n\n        Dim optKey As String\n\n        optKey = CStr(mapWs.Cells(r, 14).Value)\n\n        Dim cellAddr As String\n\n        cellAddr = CStr(mapWs.Cells(r, 16).Value)",
    "Do While mapWs.Cells(r, 15).Value <> \"\"\n\n        Dim optKey As String\n\n        optKey = CStr(mapWs.Cells(r, 15).Value)\n\n        Dim cellAddr As String\n\n        cellAddr = CStr(mapWs.Cells(r, 17).Value)",
    "GetOptionMapping cols 14,16→15,17")


# =================================================================
# 3. GetMaintenanceMapping: columns 18-22 → 19-23
#    Table D shifted: R-W(18-23) → S-X(19-24)
# =================================================================
content = fix(content,
    "Do While mapWs.Cells(r, 18).Value <> \"\"\n\n        Dim maintId As String\n\n        maintId = CStr(mapWs.Cells(r, 18).Value)",
    "Do While mapWs.Cells(r, 19).Value <> \"\"\n\n        Dim maintId As String\n\n        maintId = CStr(mapWs.Cells(r, 19).Value)",
    "GetMaintenanceMapping col 18→19 (maintId)")

content = fix(content,
    "If mapWs.Cells(r, 19).Value <> \"\" Then inner(\"required\") = CStr(mapWs.Cells(r, 19).Value)\n\n        If mapWs.Cells(r, 20).Value <> \"\" Then inner(\"not_required\") = CStr(mapWs.Cells(r, 20).Value)\n\n        If mapWs.Cells(r, 21).Value <> \"\" Then inner(\"good\") = CStr(mapWs.Cells(r, 21).Value)\n\n        If mapWs.Cells(r, 22).Value <> \"\" Then inner(\"defect\") = CStr(mapWs.Cells(r, 22).Value)",
    "If mapWs.Cells(r, 20).Value <> \"\" Then inner(\"required\") = CStr(mapWs.Cells(r, 20).Value)\n\n        If mapWs.Cells(r, 21).Value <> \"\" Then inner(\"not_required\") = CStr(mapWs.Cells(r, 21).Value)\n\n        If mapWs.Cells(r, 22).Value <> \"\" Then inner(\"good\") = CStr(mapWs.Cells(r, 22).Value)\n\n        If mapWs.Cells(r, 23).Value <> \"\" Then inner(\"defect\") = CStr(mapWs.Cells(r, 23).Value)",
    "GetMaintenanceMapping cols 19-22→20-23")


# =================================================================
# 4. GetCategorySurveyMapping: columns 24-26 → 25-27
#    Table E shifted: X-AA(24-27) → Y-AB(25-28)
# =================================================================
content = fix(content,
    "Do While mapWs.Cells(r, 24).Value <> \"\"\n\n        Dim catId As String\n\n        catId = CStr(mapWs.Cells(r, 24).Value)",
    "Do While mapWs.Cells(r, 25).Value <> \"\"\n\n        Dim catId As String\n\n        catId = CStr(mapWs.Cells(r, 25).Value)",
    "GetCategorySurveyMapping col 24→25 (catId)")

content = fix(content,
    "If mapWs.Cells(r, 25).Value <> \"\" Then inner(\"conducted\") = CStr(mapWs.Cells(r, 25).Value)\n\n        If mapWs.Cells(r, 26).Value <> \"\" Then inner(\"not\") = CStr(mapWs.Cells(r, 26).Value)",
    "If mapWs.Cells(r, 26).Value <> \"\" Then inner(\"conducted\") = CStr(mapWs.Cells(r, 26).Value)\n\n        If mapWs.Cells(r, 27).Value <> \"\" Then inner(\"not\") = CStr(mapWs.Cells(r, 27).Value)",
    "GetCategorySurveyMapping cols 25,26→26,27")


# =================================================================
# 5. Add GetNaCellMapping function (after GetSurveyMethodMapping)
#    Table A column 9 = na(対象無)セル
# =================================================================
NEW_GET_NA = """

'' テーブルA: na(対象無)セルマッピング
'' 戻り値: Dictionary - itemId → naセルアドレス
Private Function GetNaCellMapping() As Object
    Dim d As Object
    Set d = New Dictionary

    Dim mapWs As Worksheet
    Set mapWs = GetMappingSheet()
    If mapWs Is Nothing Then
        Set GetNaCellMapping = d
        Exit Function
    End If

    Dim r As Long
    r = 3
    Do While mapWs.Cells(r, 1).Value <> ""
        Dim itemId As String
        itemId = CStr(mapWs.Cells(r, 1).Value)
        Dim naCell As String
        naCell = CStr(mapWs.Cells(r, 9).Value) ' I列: naセル
        If naCell <> "" Then d(itemId) = naCell
        r = r + 1
    Loop

    Set GetNaCellMapping = d
End Function"""

# Insert after GetSurveyMethodMapping's End Function
survey_method_end = "End Function\n\n\n\n'' テーブルB:"
if survey_method_end in content:
    content = content.replace(survey_method_end, "End Function" + NEW_GET_NA + "\n\n\n\n'' テーブルB:", 1)
    print("FIX: Added GetNaCellMapping function")
    fixes += 1
else:
    print("SKIP: GetNaCellMapping insert point not found")
    # Try alternative marker
    alt = "End Function\n\n\n\n'' \x83\x65\x81[\x83\x75\x83\x8bB:"
    print(f"  Looking for alternative...")


# =================================================================
# 6. Update ImportEvaluations: add na map + na handling
# =================================================================
# Add naMap variable after cMap
content = fix(content,
    "    Set cMap = GetCCellMapping()\n\n\n\n    Dim itemId As Variant",
    "    Set cMap = GetCCellMapping()\n    Dim naMap As Object\n    Set naMap = GetNaCellMapping()\n\n\n\n    Dim itemId As Variant",
    "ImportEvaluations: add naMap")

# Add na case in Select Case (after Case "c" block)
content = fix(content,
    "            Case \"c\"\n\n                If cMap.Exists(itemId) Then\n\n                    SetCellValueSafe ws, cMap(itemId), ChrW(&H25A0) ' " + chr(9632) + "\n\n                End If\n\n        End Select",
    "            Case \"c\"\n\n                If cMap.Exists(itemId) Then\n\n                    SetCellValueSafe ws, cMap(itemId), ChrW(&H25A0) ' " + chr(9632) + "\n\n                End If\n            Case \"na\"\n                If naMap.Exists(itemId) Then\n                    SetCellValueSafe ws, naMap(itemId), ChrW(&H25A0) ' " + chr(9632) + "\n                End If\n\n        End Select",
    "ImportEvaluations: add na case")


# =================================================================
# 7. Update GetWorstEvaluation: add na handling
#    Priority: c > b2 > b1 > a > na
#    na is only used if no other evaluation exists
# =================================================================
content = fix(content,
    "                Case \"a\"\n\n                    If worst = \"\" Then worst = \"a\"\n\n            End Select",
    "                Case \"a\"\n\n                    If worst = \"\" Or worst = \"na\" Then worst = \"a\"\n                Case \"na\"\n                    If worst = \"\" Then worst = \"na\"\n\n            End Select",
    "GetWorstEvaluation: add na case")


# =================================================================
# 8. Add new functions: GetItemSurveyMapping, ImportItemSurveyStatus,
#    GetLegalValueMapping, ImportLegalValues
#    Insert before Phase 4 marker
# =================================================================
NEW_FUNCTIONS = """

'' テーブルF: 項目調査状況マッピング (item95鉄筋, item96シュミット)
'' 戻り値: Dictionary - itemId → Dictionary("conducted","not_required","not_conducted","reason"→cellAddr)
Private Function GetItemSurveyMapping() As Object
    Dim d As Object
    Set d = New Dictionary

    Dim mapWs As Worksheet
    Set mapWs = GetMappingSheet()
    If mapWs Is Nothing Then
        Set GetItemSurveyMapping = d
        Exit Function
    End If

    Dim r As Long
    r = 3
    Do While mapWs.Cells(r, 29).Value <> ""
        Dim itemId As String
        itemId = CStr(mapWs.Cells(r, 29).Value)

        Dim inner As Object
        Set inner = New Dictionary
        If mapWs.Cells(r, 30).Value <> "" Then inner("conducted") = CStr(mapWs.Cells(r, 30).Value)
        If mapWs.Cells(r, 31).Value <> "" Then inner("not_required") = CStr(mapWs.Cells(r, 31).Value)
        If mapWs.Cells(r, 32).Value <> "" Then inner("not_conducted") = CStr(mapWs.Cells(r, 32).Value)
        If mapWs.Cells(r, 33).Value <> "" Then inner("reason") = CStr(mapWs.Cells(r, 33).Value)

        If inner.Count > 0 Then Set d(itemId) = inner
        r = r + 1
    Loop

    Set GetItemSurveyMapping = d
End Function



'' 項目調査状況の入力 (item95鉄筋探査, item96シュミットハンマー)
Private Sub ImportItemSurveyStatus(ws As Worksheet, itemSurvey As Object)
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
Private Function GetLegalValueMapping() As Object
    Dim d As Object
    Set d = New Dictionary

    Dim mapWs As Worksheet
    Set mapWs = GetMappingSheet()
    If mapWs Is Nothing Then
        Set GetLegalValueMapping = d
        Exit Function
    End If

    Dim r As Long
    r = 3
    Do While mapWs.Cells(r, 36).Value <> ""
        Dim itemId As String
        itemId = CStr(mapWs.Cells(r, 36).Value)

        Dim inner As Object
        Set inner = New Dictionary
        If mapWs.Cells(r, 37).Value <> "" Then inner("docValue") = CStr(mapWs.Cells(r, 37).Value)
        If mapWs.Cells(r, 38).Value <> "" Then inner("measuredValue") = CStr(mapWs.Cells(r, 38).Value)

        If inner.Count > 0 Then Set d(itemId) = inner
        r = r + 1
    Loop

    Set GetLegalValueMapping = d
End Function



'' 資料値・実測値の入力 (item101)
Private Sub ImportLegalValues(ws As Worksheet, evaluations As Object)
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
End Sub"""

# Insert before Phase 4 marker
phase4_marker = "\n\n'' =============================================\n\n'' Phase 4:"
if phase4_marker in content:
    content = content.replace(phase4_marker, NEW_FUNCTIONS + "\n" + phase4_marker, 1)
    print("FIX: Added GetItemSurveyMapping, ImportItemSurveyStatus, GetLegalValueMapping, ImportLegalValues")
    fixes += 1
else:
    print("SKIP: Phase 4 marker not found")


# =================================================================
# 9. Update ImportToOnsiteSurveySheet: add new calls
#    After ImportCategorySurveyStatus, add ImportItemSurveyStatus and ImportLegalValues
# =================================================================
NEW_CALLS = """

            ' 項目調査状況の入力（鉄筋/シュミット）
            If checklist.Exists("itemSurveyStatus") Then
                ImportItemSurveyStatus ws, checklist("itemSurveyStatus")
            End If

            ' 資料値・実測値の入力（遵法性）
            If checklist.Exists("evaluations") Then
                ImportLegalValues ws, checklist("evaluations")
            End If"""

content = fix(content,
    "                ImportCategorySurveyStatus ws, checklist(\"categorySurveyStatus\")\n\n            End If\n\n        End If\n\n    End If\n\nEnd Sub",
    "                ImportCategorySurveyStatus ws, checklist(\"categorySurveyStatus\")\n\n            End If\n" + NEW_CALLS + "\n\n        End If\n\n    End If\n\nEnd Sub",
    "ImportToOnsiteSurveySheet: add ItemSurveyStatus + LegalValues calls")


# =================================================================
# Write output
# =================================================================
content = content.replace("\n", "\r\r\n")
with open(OUTPUT_FILE, "wb") as f:
    f.write(content.encode("cp932"))

print(f"\n=== Done! {fixes} fixes applied ===")
