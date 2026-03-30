Attribute VB_Name = "DataImportMapping"

'' =============================================
'' DataImportMapping - マッピング取得関数群
'' =============================================

Option Explicit

'' =============================================
'' マッピングシートからセルアドレスを取得する関数群
'' マッピングシートの各テーブル(A～K)を読み取り
'' Dictionaryオブジェクトとして返却する
'' =============================================

Public Function GetB2CellMapping() As Object

    Dim d As Object

    Set d = New Dictionary



    Dim mapWs As Worksheet

    Set mapWs = GetMappingSheet()

    If mapWs Is Nothing Then

        Set GetB2CellMapping = d

        Exit Function

    End If



    Dim r As Long

    r = 3 ' データ開始行

    Do While mapWs.Cells(r, 1).Value <> ""

        Dim itemId As String

        itemId = CStr(mapWs.Cells(r, 1).Value)

        Dim b2Cell As String

        b2Cell = CStr(mapWs.Cells(r, 4).Value) ' D列: b2セル

        If b2Cell <> "" Then

            d(itemId) = b2Cell

        End If

        r = r + 1

    Loop



    Set GetB2CellMapping = d

End Function


'' テーブルA: itemId → aセル(G列) のマッピングを返す

Public Function GetACellMapping() As Object
    Dim d As Object
    Set d = New Dictionary

    Dim mapWs As Worksheet
    Set mapWs = GetMappingSheet()
    If mapWs Is Nothing Then
        Set GetACellMapping = d
        Exit Function
    End If

    Dim r As Long
    r = 3
    Do While mapWs.Cells(r, 1).Value <> ""
        Dim itemId As String
        itemId = CStr(mapWs.Cells(r, 1).Value)
        Dim aCell As String
        aCell = CStr(mapWs.Cells(r, 2).Value) ' B列: aセル
        If aCell <> "" Then d(itemId) = aCell
        r = r + 1
    Loop

    Set GetACellMapping = d
End Function

'' テーブルA: itemId → b1セル(H列) のマッピングを返す

Public Function GetB1CellMapping() As Object
    Dim d As Object
    Set d = New Dictionary

    Dim mapWs As Worksheet
    Set mapWs = GetMappingSheet()
    If mapWs Is Nothing Then
        Set GetB1CellMapping = d
        Exit Function
    End If

    Dim r As Long
    r = 3
    Do While mapWs.Cells(r, 1).Value <> ""
        Dim itemId As String
        itemId = CStr(mapWs.Cells(r, 1).Value)
        Dim b1Cell As String
        b1Cell = CStr(mapWs.Cells(r, 3).Value) ' C列: b1セル
        If b1Cell <> "" Then d(itemId) = b1Cell
        r = r + 1
    Loop

    Set GetB1CellMapping = d
End Function


'' テーブルA: item番号 → c評価セル(Y列) のマッピングを返す


Public Function GetCCellMapping() As Object

    Dim d As Object

    Set d = New Dictionary



    Dim mapWs As Worksheet

    Set mapWs = GetMappingSheet()

    If mapWs Is Nothing Then

        Set GetCCellMapping = d

        Exit Function

    End If



    Dim r As Long

    r = 3

    Do While mapWs.Cells(r, 1).Value <> ""

        Dim itemId As String

        itemId = CStr(mapWs.Cells(r, 1).Value)

        Dim cCell As String

        cCell = CStr(mapWs.Cells(r, 5).Value) ' E列: cセル

        If cCell <> "" Then

            d(itemId) = cCell

        End If

        r = r + 1

    Loop



    Set GetCCellMapping = d

End Function



'' テーブルA: item番号 → 調査方法セル(目視/計測) のマッピングを返す


Public Function GetSurveyMethodMapping() As Object

    ' Dictionary of Dictionary: itemId → {"visual": cellAddr, "measurement": cellAddr, "palpation": cellAddr}

    Dim d As Object

    Set d = New Dictionary



    Dim mapWs As Worksheet

    Set mapWs = GetMappingSheet()

    If mapWs Is Nothing Then

        Set GetSurveyMethodMapping = d

        Exit Function

    End If



    Dim r As Long

    r = 3

    Do While mapWs.Cells(r, 1).Value <> ""

        Dim itemId As String

        itemId = CStr(mapWs.Cells(r, 1).Value)



        Dim inner As Object

        Set inner = New Dictionary

        If mapWs.Cells(r, 6).Value <> "" Then inner("visual") = CStr(mapWs.Cells(r, 6).Value)

        If mapWs.Cells(r, 7).Value <> "" Then inner("measurement") = CStr(mapWs.Cells(r, 7).Value)

        If mapWs.Cells(r, 8).Value <> "" Then inner("palpation") = CStr(mapWs.Cells(r, 8).Value)


        If inner.Count > 0 Then Set d(itemId) = inner

        r = r + 1

    Loop



    Set GetSurveyMethodMapping = d

End Function
'' テーブルB: グループ有無マッピング

'' 戻り値: Dictionary - groupId → Dictionary("yes"→cellAddr, "no"→cellAddr)


Public Function GetGroupExistenceMapping() As Object

    Dim d As Object

    Set d = New Dictionary



    Dim mapWs As Worksheet

    Set mapWs = GetMappingSheet()

    If mapWs Is Nothing Then

        Set GetGroupExistenceMapping = d

        Exit Function

    End If



    Dim r As Long

    r = 3

    Do While mapWs.Cells(r, 11).Value <> ""

        Dim grpId As String

        grpId = CStr(mapWs.Cells(r, 11).Value)



        Dim inner As Object

        Set inner = New Dictionary

        If mapWs.Cells(r, 13).Value <> "" Then inner("yes") = CStr(mapWs.Cells(r, 13).Value)

        If mapWs.Cells(r, 14).Value <> "" Then inner("no") = CStr(mapWs.Cells(r, 14).Value)



        If inner.Count > 0 Then Set d(grpId) = inner

        r = r + 1

    Loop



    Set GetGroupExistenceMapping = d

End Function



'' テーブルC: オプション選択マッピング

'' 戻り値: Dictionary - optionKey → cellAddr


Public Function GetOptionMapping() As Object

    Dim d As Object

    Set d = New Dictionary



    Dim mapWs As Worksheet

    Set mapWs = GetMappingSheet()

    If mapWs Is Nothing Then

        Set GetOptionMapping = d

        Exit Function

    End If



    Dim r As Long

    r = 3

    Do While mapWs.Cells(r, 15).Value <> ""

        Dim optKey As String

        optKey = CStr(mapWs.Cells(r, 15).Value)

        Dim cellAddr As String

        cellAddr = CStr(mapWs.Cells(r, 17).Value)

        If cellAddr <> "" Then d(optKey) = cellAddr

        r = r + 1

    Loop



    Set GetOptionMapping = d

End Function



'' テーブルD: メンテナンスマッピング

'' 戻り値: Dictionary - maintId → Dictionary("required","not_required","good","defect"→cellAddr)


Public Function GetMaintenanceMapping() As Object

    Dim d As Object

    Set d = New Dictionary



    Dim mapWs As Worksheet

    Set mapWs = GetMappingSheet()

    If mapWs Is Nothing Then

        Set GetMaintenanceMapping = d

        Exit Function

    End If



    Dim r As Long

    r = 3

    Do While mapWs.Cells(r, 19).Value <> ""

        Dim maintId As String

        maintId = CStr(mapWs.Cells(r, 19).Value)



        Dim inner As Object

        Set inner = New Dictionary

        If mapWs.Cells(r, 20).Value <> "" Then inner("required") = CStr(mapWs.Cells(r, 20).Value)

        If mapWs.Cells(r, 21).Value <> "" Then inner("not_required") = CStr(mapWs.Cells(r, 21).Value)

        If mapWs.Cells(r, 22).Value <> "" Then inner("good") = CStr(mapWs.Cells(r, 22).Value)

        If mapWs.Cells(r, 23).Value <> "" Then inner("no_issue") = CStr(mapWs.Cells(r, 23).Value)



        If inner.Count > 0 Then Set d(maintId) = inner

        r = r + 1

    Loop



    Set GetMaintenanceMapping = d

End Function



'' テーブルE: カテゴリ調査状況マッピング

'' 戻り値: Dictionary - catId → Dictionary("conducted","not"→cellAddr)


Public Function GetCategorySurveyMapping() As Object

    Dim d As Object

    Set d = New Dictionary



    Dim mapWs As Worksheet

    Set mapWs = GetMappingSheet()

    If mapWs Is Nothing Then

        Set GetCategorySurveyMapping = d

        Exit Function

    End If



    Dim r As Long

    r = 3

    Do While mapWs.Cells(r, 25).Value <> ""

        Dim catId As String

        catId = CStr(mapWs.Cells(r, 25).Value)



        Dim inner As Object

        Set inner = New Dictionary

        If mapWs.Cells(r, 26).Value <> "" Then inner("conducted") = CStr(mapWs.Cells(r, 26).Value)

        If mapWs.Cells(r, 27).Value <> "" Then inner("not") = CStr(mapWs.Cells(r, 27).Value)
        If mapWs.Cells(r, 28).Value <> "" Then inner("reason") = CStr(mapWs.Cells(r, 28).Value)

        If inner.Count > 0 Then Set d(catId) = inner

        r = r + 1

    Loop



    Set GetCategorySurveyMapping = d

End Function



'' =============================================

'' Phase 3: 現地調査シートへのデータ入力

'' =============================================




Public Function GetItemSurveyMapping() As Object
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

Public Function GetLegalValueMapping() As Object
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

'' テーブルH: 物件情報マッピング
'' 戻り値: Dictionary - fieldKey → cellAddress
'' columns 40-43 (AN-AQ): fieldKey, fieldName, cellAddress, notes

Public Function GetPropertyInfoMapping() As Object
    Dim d As Object
    Set d = New Dictionary

    Dim mapWs As Worksheet
    Set mapWs = GetMappingSheet()
    If mapWs Is Nothing Then
        Set GetPropertyInfoMapping = d
        Exit Function
    End If

    Dim r As Long
    r = 3
    Do While mapWs.Cells(r, 40).Value <> ""
        Dim fieldKey As String
        fieldKey = CStr(mapWs.Cells(r, 40).Value)
        Dim cellAddr As String
        cellAddr = CStr(mapWs.Cells(r, 42).Value)
        If cellAddr <> "" Then d(fieldKey) = cellAddr
        r = r + 1
    Loop

    Set GetPropertyInfoMapping = d
End Function

'' テーブルI: 備考マッピング
'' 戻り値: Dictionary - remarkKey → cellAddress
'' columns 44-46 (AR-AT): remarkKey, remarkName, cellAddress

Public Function GetRemarksMapping() As Object
    Dim d As Object
    Set d = New Dictionary

    Dim mapWs As Worksheet
    Set mapWs = GetMappingSheet()
    If mapWs Is Nothing Then
        Set GetRemarksMapping = d
        Exit Function
    End If

    Dim r As Long
    r = 3
    Do While mapWs.Cells(r, 44).Value <> ""
        Dim remarkKey As String
        remarkKey = CStr(mapWs.Cells(r, 44).Value)
        Dim cellAddr As String
        cellAddr = CStr(mapWs.Cells(r, 45).Value)
        If cellAddr <> "" Then d(remarkKey) = cellAddr
        r = r + 1
    Loop

    Set GetRemarksMapping = d
End Function
