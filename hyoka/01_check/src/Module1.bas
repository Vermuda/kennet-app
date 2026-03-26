'' =============================================
'' 定数定義
'' =============================================
'' HEX_YELLOW: 未入力セルの背景色として使用するHEXカラーコード（薄い黄色）
Public Const HEX_YELLOW = "FFE699"

'' B2C判定で色付けされたセルのリストを保持するグローバル変数（廃止予定）
'' 現在は背景色検索方式を使用
Public g_B2CHighlightedCells As Collection

'' =============================================
'' データクリア処理
''
'' 対象シート:
''   - 机上チェックシート
''   - 現地調査
''
'' 動作:
''   未入力チェック対象セルの値をクリアし、背景色もクリアする
'' =============================================

Sub ClearAllInputData()
    Dim startTime As Double
    startTime = Timer
    
    ' 確認ダイアログ
    If MsgBox("入力データをすべてクリアします。" & vbCrLf & vbCrLf & _
              "この操作は元に戻すことができません。" & vbCrLf & _
              "実行してもよろしいですか？", _
              vbYesNo + vbExclamation + vbDefaultButton2, _
              "データクリア確認") = vbNo Then
        Exit Sub
    End If
    
    ' 画面更新停止
    Application.ScreenUpdating = False
    Application.EnableEvents = False
    
    On Error GoTo ErrorHandler
    
    ' 机上チェックシートのクリア
    Call ClearDesktopSurveySheet
    
    ' 現地調査シートのクリア
    Call ClearOnsiteSurveySheet
    
    ' 画面更新再開
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    
    ' 完了メッセージ
    Dim processingTime As String
    processingTime = Format(Timer - startTime, "0.00")
    MsgBox "データクリア処理が完了しました。" & vbCrLf & _
           "処理時間: " & processingTime & "秒", vbInformation, "処理完了"
    
    Exit Sub
    
ErrorHandler:
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    MsgBox "エラーが発生しました: " & Err.Description, vbCritical, "エラー"
End Sub

Private Sub ValidateDesktopSimple(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Set ws = Worksheets("机上チェックシート")
    ' 単純必須チェック
    ValidateSimple ws, invalidFirstCell, Array("CO6")
    ValidateSimple ws, invalidFirstCell, Array("CO14", "DI14", "DW14")
    ValidateSimple ws, invalidFirstCell, Array("CF19", "CZ19")
    ValidateSimple ws, invalidFirstCell, Array("G19")
    ValidateSimple ws, invalidFirstCell, Array("CP42", "DC42", "DP42")
    ValidateSimple ws, invalidFirstCell, Array("CI57")
    ValidateSimple ws, invalidFirstCell, Array("CI66")
    ValidateSimple ws, invalidFirstCell, Array("CT76")
    ValidateSimple ws, invalidFirstCell, Array("CT82")
    ValidateSimple ws, invalidFirstCell, Array("CI108")
    ' ValidateSimple ws, invalidFirstCell, Array("CI126", "CX126")
    ValidateSimple ws, invalidFirstCell, Array("DE156", "DE161")
    ValidateSimple ws, invalidFirstCell, Array("BS181", "DO181", "BS187", "DO187", "CR193", "DL193", "DZ193")
    ValidateSimple ws, invalidFirstCell, Array("BS199", "DO199", "BS205", "DO205", "CR211", "DL211", "DZ211")
    ValidateSimple ws, invalidFirstCell, Array("CI375", "DH375")
    If ws.Range("M502").Value <> "■" Then
        ValidateSimple ws, invalidFirstCell, Array("AT469", "AT475", "AT481", "AT487")
        ValidateSimple ws, invalidFirstCell, Array("AT493", "AT499", "AT505", "AT511")
        ValidateSimple ws, invalidFirstCell, Array("AT517", "AT523", "AT529", "AT535")
    Else
        ' 入力チェックはスキップするが、背景色はリセットする
        SetCellBackgroundColor ws, "AT469", ""
        SetCellBackgroundColor ws, "AT475", ""
        SetCellBackgroundColor ws, "AT481", ""
        SetCellBackgroundColor ws, "AT487", ""
        SetCellBackgroundColor ws, "AT493", ""
        SetCellBackgroundColor ws, "AT499", ""
        SetCellBackgroundColor ws, "AT505", ""
        SetCellBackgroundColor ws, "AT511", ""
        SetCellBackgroundColor ws, "AT517", ""
        SetCellBackgroundColor ws, "AT523", ""
        SetCellBackgroundColor ws, "AT529", ""
        SetCellBackgroundColor ws, "AT535", ""
    End If
    ' ValidateSimple ws, invalidFirstCell, Array("AK629", "BB629")
    ValidateSimple ws, invalidFirstCell, Array("AQ714", "DF715")
    ValidateCondition ws, invalidFirstCell, "DA117", "■", Array("CI126", "CX126"), "input", ""
End Sub

Private Sub ValidateDesktopGroupsA(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Set ws = Worksheets("机上チェックシート")
    ' ラジオボタングループ形式必須入力チェック（前半）
    ValidateGroup ws, invalidFirstCell, Array("CI131", "DA131", "CI136", "DF136", "CI141"), "■", "DA131", "■", Array("CI146", "CY146", "DP146"), "CI141", "■", Array("DG141")
    ValidateGroup ws, invalidFirstCell, Array("M70", "M75"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("M88", "M93"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("F98", "F103"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("CI117", "DA117"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("M133", "M138"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("CT151", "DI151"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("M199", "M204"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("M318", "M323"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("M348", "M353"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("CI282", "DF282", "CI292", "DF292"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("CI307", "DF307"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("CI320", "DF320"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("CS360", "DD360", "DM360"), "■", "", "", Array(), "", "", Array("CT365")
    ValidateGroup ws, invalidFirstCell, Array("M422", "M427"), "■", "", "", Array(), "", "", Array()
    If ws.Range("M427").Value <> "■" Then
        ValidateGroup ws, invalidFirstCell, Array("BQ386", "CN386", "BQ391", "CC391"), "■", "CN386", "■", Array("DF386", "CN391", "DK391"), "", "", Array()
        ValidateGroup ws, invalidFirstCell, Array("CI396", "CI401", "CI406", "CI411", "CI416"), "■", "", "", Array(), "", "", Array()
        ValidateGroup ws, invalidFirstCell, Array("CI421", "CI426"), "■", "", "", Array(), "", "", Array()
        ValidateGroup ws, invalidFirstCell, Array("CI432", "CX432", "DM432"), "■", "", "", Array(), "", "", Array()
        ValidateGroup ws, invalidFirstCell, Array("CI443", "CI448"), "■", "", "", Array(), "", "", Array()
        ValidateGroup ws, invalidFirstCell, Array("DQ443", "DQ448"), "■", "", "", Array(), "", "", Array()
        ValidateGroup ws, invalidFirstCell, Array("CI453", "CW453", "DK453", "DY453"), "■", "", "", Array(), "", "", Array()
        ValidateGroup ws, invalidFirstCell, Array("CI458", "CW458", "DK458", "DY458"), "■", "", "", Array(), "", "", Array()
    Else
        ' 入力チェックはスキップするが、背景色はリセットする
        SetCellBackgroundColor ws, "BQ386", ""
        SetCellBackgroundColor ws, "CN386", ""
        SetCellBackgroundColor ws, "BQ391", ""
        SetCellBackgroundColor ws, "CC391", ""
        SetCellBackgroundColor ws, "DF386", ""
        SetCellBackgroundColor ws, "CN391", ""
        SetCellBackgroundColor ws, "DK391", ""
        SetCellBackgroundColor ws, "CI396", ""
        SetCellBackgroundColor ws, "CI401", ""
        SetCellBackgroundColor ws, "CI406", ""
        SetCellBackgroundColor ws, "CI411", ""
        SetCellBackgroundColor ws, "CI416", ""
        SetCellBackgroundColor ws, "CI421", ""
        SetCellBackgroundColor ws, "CI426", ""
        SetCellBackgroundColor ws, "CI432", ""
        SetCellBackgroundColor ws, "CX432", ""
        SetCellBackgroundColor ws, "DM432", ""
        SetCellBackgroundColor ws, "CI443", ""
        SetCellBackgroundColor ws, "CI448", ""
        SetCellBackgroundColor ws, "DQ443", ""
        SetCellBackgroundColor ws, "DQ448", ""
        SetCellBackgroundColor ws, "CI453", ""
        SetCellBackgroundColor ws, "CW453", ""
        SetCellBackgroundColor ws, "DK453", ""
        SetCellBackgroundColor ws, "DY453", ""
        SetCellBackgroundColor ws, "CI458", ""
        SetCellBackgroundColor ws, "CW458", ""
        SetCellBackgroundColor ws, "DK458", ""
        SetCellBackgroundColor ws, "DY458", ""
    End If
End Sub

Private Sub ValidateDesktopGroupsB(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Set ws = Worksheets("机上チェックシート")
    ' ラジオボタングループ形式必須入力チェック（後半）
    ValidateGroup ws, invalidFirstCell, Array("M497", "M502"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("M507", "M512"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("M553", "M558"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("M571", "M576"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("M589", "M594"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("M616", "M621"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("M632", "M637"), "■", "", "", Array(), "", "", Array()
    ' 複合評価項目群
    ValidateGroup ws, invalidFirstCell, Array("BP655", "BP658"), "■", "", "", Array(), "BP655", "■", Array("BZ657")
    ValidateGroup ws, invalidFirstCell, Array("DE655", "DO655"), "■", "", "", Array(), "DE655", "■", Array("DG658", "DQ658")
    ValidateGroup ws, invalidFirstCell, Array("DX655", "EF655"), "■", "", "", Array(), "DX655", "■", Array("DY658", "EF658")
    ValidateGroup ws, invalidFirstCell, Array("BP661", "BP664"), "■", "", "", Array(), "BP661", "■", Array("BZ663")
    ValidateGroup ws, invalidFirstCell, Array("DE661", "DO661"), "■", "", "", Array(), "DE661", "■", Array("DG664", "DQ664")
    ValidateGroup ws, invalidFirstCell, Array("DX661", "EF661"), "■", "", "", Array(), "DX661", "■", Array("DY664", "EF664")
    ValidateGroup ws, invalidFirstCell, Array("BP668", "BP671"), "■", "", "", Array(), "BP668", "■", Array("BZ670")
    ValidateGroup ws, invalidFirstCell, Array("DE668", "DO668"), "■", "", "", Array(), "DE668", "■", Array("DG671", "DQ671")
    ValidateGroup ws, invalidFirstCell, Array("DX668", "EF668"), "■", "", "", Array(), "DX668", "■", Array("DY671", "EF671")
    ValidateGroup ws, invalidFirstCell, Array("BP675", "BP678"), "■", "", "", Array(), "BP675", "■", Array("BZ677")
    ValidateGroup ws, invalidFirstCell, Array("DE675", "DO675"), "■", "", "", Array(), "DE675", "■", Array("DG678", "DQ678")
    ValidateGroup ws, invalidFirstCell, Array("DX675", "EF675"), "■", "", "", Array(), "DX675", "■", Array("DY678", "EF678")
    ValidateGroup ws, invalidFirstCell, Array("BP681", "BP684"), "■", "", "", Array(), "BP681", "■", Array("BZ683")
    ValidateGroup ws, invalidFirstCell, Array("DE681", "DO681"), "■", "", "", Array(), "DE681", "■", Array("DG684", "DQ684")
    ValidateGroup ws, invalidFirstCell, Array("DX681", "EF681"), "■", "", "", Array(), "DX681", "■", Array("DY684", "EF684")
    ValidateGroup ws, invalidFirstCell, Array("AQ719", "AY719"), "■", "", "", Array(), "AY719", "■", Array("BP719")
    ValidateGroup ws, invalidFirstCell, Array("AQ727", "AY727"), "■", "", "", Array(), "AY727", "■", Array("BP727")
    ValidateGroup ws, invalidFirstCell, Array("AQ735", "AY735"), "■", "", "", Array(), "AY735", "■", Array("BP735")
End Sub

Private Sub ValidateDesktopConditional(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Set ws = Worksheets("机上チェックシート")
    ' 条件付き必須入力チェック
    ValidateCondition ws, invalidFirstCell, "CI166", "□", Array("DA166"), "input", ""
    ValidateCondition ws, invalidFirstCell, "M632", "■", Array("AK629", "BB629"), "input", ""
End Sub

Private Sub ValidateDesktopChecks(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Set ws = Worksheets("机上チェックシート")
    Call ValidateDesktopSimple(invalidFirstCell)
    Call ValidateDesktopGroupsA(invalidFirstCell)
    Call ValidateDesktopGroupsB(invalidFirstCell)
    Call ValidateDesktopConditional(invalidFirstCell)
End Sub

Private Sub ValidateOnsiteBaseChecks(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Dim exteriorGroups As Variant
    Set ws = Worksheets("現地調査")
    ' 単純必須チェック
    ValidateSimple ws, invalidFirstCell, Array("C4", "N4", "T4", "Y4")
    ValidateSimple ws, invalidFirstCell, Array("F8", "I8", "K8", "O8", "T8", "X8")
    ValidateSimple ws, invalidFirstCell, Array("U475")
    ValidateSimple ws, invalidFirstCell, Array("U480")
    ' ラジオボタングループ形式必須入力チェック
    ValidateGroup ws, invalidFirstCell, Array("I60", "N60"), "■", "", "", Array(), "N60", "■", Array("V60"), "D9E1F2"
    ValidateGroup ws, invalidFirstCell, Array("D86", "D88", "D89", "D90", "D92"), "■", "", "", Array(), "D92", "■", Array("D93")
    ValidateGroup ws, invalidFirstCell, Array("D98", "D100", "D101"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("D105", "D106", "D108", "D109"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("J133", "N133"), "■", "", "", Array(), "N133", "■", Array("V133"), "D9E1F2"
    ValidateGroup ws, invalidFirstCell, Array("D147", "D148", "D149"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("D154", "D155"), "■", "", "", Array(), "D155", "■", Array("D157")
    ValidateGroup ws, invalidFirstCell, Array("J174", "N174"), "■", "", "", Array(), "N174", "■", Array("V174"), "D9E1F2"
    ValidateGroup ws, invalidFirstCell, Array("J251", "N251"), "■", "", "", Array(), "N251", "■", Array("V251"), "D9E1F2"
    ' 複数グループのいずれか入力必須
    exteriorGroups = Array( _
        Array("D256", "D257", "D258", "D259", "D260", "D268", "D269", "D270", "D271"), _
        Array("D275", "D277", "D278", "D280", "D281"), _
        Array("D285", "D286", "D287", "D288", "D290") _
    )
    ValidateGroupOr ws, invalidFirstCell, exteriorGroups
    ValidateGroup ws, invalidFirstCell, Array("D297", "D298", "D299", "D300"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("D303", "D304", "D305", "D306"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("J327", "N327"), "■", "", "", Array(), "N327", "■", Array("V327"), "D9E1F2"
    ValidateGroup ws, invalidFirstCell, Array("J395", "N395"), "■", "", "", Array(), "N395", "■", Array("V395"), "D9E1F2"
    ValidateGroup ws, invalidFirstCell, Array("D398", "D399", "D400", "D401", "D402", "D403"), "■", "", "", Array(), "D403", "■", Array("D404")
    ValidateGroup ws, invalidFirstCell, Array("D416", "D417", "D418", "D419", "D420"), "■", "", "", Array(), "D420", "■", Array("D421")
    ValidateGroup ws, invalidFirstCell, Array("J463", "N463"), "■", "", "", Array(), "N463", "■", Array("V463"), "D9E1F2"
    ValidateGroup ws, invalidFirstCell, Array("K522", "O522"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("K526", "O526"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("K530", "O530"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("K534", "O534"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("K538", "O538"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W464", "Y464", "W465", "Y465"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W467", "Y467", "W468", "Y468"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W470", "Y470", "W471", "Y471"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W23", "Y23", "W24", "Y24"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W26", "Y26", "W27", "Y27"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W41", "Y41", "W42", "Y42"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W193", "Y193", "W194", "Y194"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W196", "Y196", "W197", "Y197"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W199", "W200", "W201"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W202", "Y202", "W203", "Y203"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W293", "Y293", "W294", "Y294"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W296", "Y296", "W297", "Y297"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W299", "Y299", "W300", "Y300"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W302", "Y302", "W303", "Y303"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W305", "Y305", "W306", "Y306"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W328", "Y328", "W329", "Y329"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W331", "Y331", "W332", "Y332"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W334", "Y334", "W335", "Y335"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W337", "Y337", "W338", "Y338"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W340", "Y340", "W341", "Y341"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W343", "Y343", "W344", "Y344"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W346", "Y346", "W347", "Y347"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W349", "Y349", "W350", "Y350"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W352", "Y352", "W353", "Y353"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W355", "Y355", "W356", "Y356"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W358", "Y358", "W359", "Y359"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W361", "Y361", "W362", "Y362"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W364", "Y364", "W365", "Y365"), "■", "", "", Array(), "", "", Array()
    ValidateGroup ws, invalidFirstCell, Array("W367", "Y367", "W368", "Y368"), "■", "", "", Array(), "", "", Array()
    ' 条件付き必須入力チェック
    ValidateCondition ws, invalidFirstCell, "U23", "有", Array("S23", "S24", "S25"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U26", "有", Array("S26", "S27", "S28"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U41", "有", Array("S41", "S42", "S43"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U193", "有", Array("S193", "S194", "S195"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U196", "有", Array("S196", "S197", "S198"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U199", "有", Array("S199", "S200", "S201"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U202", "有", Array("S202", "S203", "S205"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U293", "有", Array("S293", "S294", "S295"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U296", "有", Array("S296", "S297", "S298"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U299", "有", Array("S299", "S300", "S301"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U302", "有", Array("S302", "S303", "S304"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U305", "有", Array("S305", "S306", "S307"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U328", "有", Array("S328", "S329", "S330"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U331", "有", Array("S331", "S332", "S333"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U334", "有", Array("S334", "S335", "S336"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U337", "有", Array("S337", "S338", "S339"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U340", "有", Array("S340", "S341", "S342"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U343", "有", Array("S343", "S344", "S345"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U346", "有", Array("S346", "S347", "S348"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U349", "有", Array("S349", "S350", "S351"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U352", "有", Array("S352", "S353", "S354"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U355", "有", Array("S355", "S356", "S357"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U358", "有", Array("S358", "S359", "S360"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U361", "有", Array("S361", "S362", "S363"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U364", "有", Array("S364", "S365", "S366"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U367", "有", Array("S367", "S368", "S369"), "radio", "■"
    ValidateCondition ws, invalidFirstCell, "U475", "有", Array("X476"), "input", ""
    ValidateCondition ws, invalidFirstCell, "U480", "有", Array("X482"), "input", ""
    ValidateCondition ws, invalidFirstCell, "U489", "有", Array("X489"), "input", ""
    ValidateCondition ws, invalidFirstCell, "U492", "有", Array("X492"), "input", ""
    ValidateCondition ws, invalidFirstCell, "U495", "有", Array("X495"), "input", ""
    ValidateCondition ws, invalidFirstCell, "U498", "有", Array("X498"), "input", ""
    ValidateCondition ws, invalidFirstCell, "U501", "有", Array("X501"), "input", ""
End Sub

Private Sub ValidateOnsiteSpecialPatterns1(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Dim groupCells As Variant
    Dim selectedAddress As String
    Dim i As Integer
    Set ws = Worksheets("現地調査")
    ' 擁壁
    groupCells = Array( _
        "C31", "E31", _
        "S29", "S30", "S31", _
        "S32", "S33", "S34", _
        "W29", "Y29", "W30", "Y30", _
        "W32", "Y32", "W33", "Y33" _
    )
    For i = LBound(groupCells) To UBound(groupCells)
        SetCellBackgroundColor ws, groupCells(i), ""
    Next i
    ValidateGroup ws, invalidFirstCell, Array("C31", "E31"), "■", "", "", Array(), "", "", Array()
    selectedAddress = HasSelectedRadioOption(ws, Array("C31", "E31"), "■")
    Select Case selectedAddress
        Case "C31":
            ValidateCondition ws, invalidFirstCell, "U29", "有", Array("S29", "S30", "S31"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U32", "有", Array("S32", "S33", "S34"), "radio", "■"
            ValidateGroup ws, invalidFirstCell, Array("W29", "Y29", "W30", "Y30"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W32", "Y32", "W33", "Y33"), "■", "", "", Array(), "", "", Array()
    End Select
    ' 駐車場
    groupCells = Array( _
        "C36", "E36", _
        "S35", "S36", "S37", _
        "W35", "Y35", "W36", "Y36" _
    )
    For i = LBound(groupCells) To UBound(groupCells)
        SetCellBackgroundColor ws, groupCells(i), ""
    Next i
    ValidateGroup ws, invalidFirstCell, Array("C36", "E36"), "■", "", "", Array(), "", "", Array()
    selectedAddress = HasSelectedRadioOption(ws, Array("C36", "E36"), "■")
    Select Case selectedAddress
        Case "C36":
            ValidateCondition ws, invalidFirstCell, "U35", "有", Array("S35", "S36", "S37"), "radio", "■"
            ValidateGroup ws, invalidFirstCell, Array("W35", "Y35", "W36", "Y36"), "■", "", "", Array(), "", "", Array()
    End Select
    ' 駐輪場
    groupCells = Array( _
        "C39", "E39", _
        "S38", "S39", "S40", _
        "W38", "Y38", "W39", "Y39" _
    )
    For i = LBound(groupCells) To UBound(groupCells)
        SetCellBackgroundColor ws, groupCells(i), ""
    Next i
    ValidateGroup ws, invalidFirstCell, Array("C39", "E39"), "■", "", "", Array(), "", "", Array()
    selectedAddress = HasSelectedRadioOption(ws, Array("C39", "E39"), "■")
    Select Case selectedAddress
        Case "C39":
            ValidateCondition ws, invalidFirstCell, "U38", "有", Array("S38", "S39", "S40"), "radio", "■"
            ValidateGroup ws, invalidFirstCell, Array("W38", "Y38", "W39", "Y39"), "■", "", "", Array(), "", "", Array()
    End Select
End Sub

Private Sub ValidateOnsiteSpecialPatterns2(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Dim groupCells As Variant
    Dim selectedAddress As String
    Dim i As Integer
    Set ws = Worksheets("現地調査")
    ' 現地調査チェックシート(2/8)
    groupCells = Array( _
        "D71", "D73", _
        "C81", "E81", "C82", "E82", _
        "P61", "P63", "P65", "P67", "P69", "P71", "P73", "P75", "P77", "P79", "P81", "P83", "P85", "P87", "P89", "P91", "P93", "P95", "P97", "P99", "P101", "P103", "P105", "P107", "P109", "P111", "P113", "P115", _
        "S61", "S62", "S64", "S65", "S66", "S68", "S69", "S70", "S72", "S73", "S74", "S76", "S77", "S78", "S80", "S81", "S82", "S84", "S85", "S86", "S88", "S89", "S90", "S92", "S93", "S94", "S96", "S97", "S98", "S100", "S101", "S102", "S104", "S105", "S106", "S108", "S109", "S110", "S112", "S113", "S114", "S116", _
        "W61", "Y61", "W62", "Y62", "W65", "Y65", "W66", "Y66", "W69", "Y69", "W70", "Y70", "W73", "Y73", "W74", "Y74", "W77", "Y77", "W78", "Y78", "W81", "Y81", "W82", "Y82", "W85", "Y85", "W86", "Y86", "W89", "Y89", "W90", "Y90", "W93", "Y93", "W94", "Y94", "W97", "Y97", "W98", "Y98", "W101", "Y101", "W102", "Y102", "W105", "Y105", "W106", "Y106", "W109", "Y109", "W110", "Y110", "W113", "Y113", "W114", "Y114" _
    )
    For i = LBound(groupCells) To UBound(groupCells)
        SetCellBackgroundColor ws, groupCells(i), ""
    Next i
    ValidateGroup ws, invalidFirstCell, Array("D71", "D73"), "■", "D71", "■", Array("C81", "E81", "C82", "E82"), "D73", "■", Array("D76")
    selectedAddress = HasSelectedRadioOption(ws, Array("D71", "D73"), "■")
    Select Case selectedAddress
        Case "D71":
            ValidateSimple ws, invalidFirstCell, Array("P61", "P63")
            ValidateSimple ws, invalidFirstCell, Array("P65", "P67")
            ValidateSimple ws, invalidFirstCell, Array("P69", "P71")
            ValidateSimple ws, invalidFirstCell, Array("P73", "P75")
            ValidateSimple ws, invalidFirstCell, Array("P77", "P79")
            ValidateSimple ws, invalidFirstCell, Array("P81", "P83")
            ValidateSimple ws, invalidFirstCell, Array("P85", "P87")
            ValidateSimple ws, invalidFirstCell, Array("P89", "P91")
            ValidateSimple ws, invalidFirstCell, Array("P93", "P95")
            ValidateSimple ws, invalidFirstCell, Array("P97", "P99")
            ValidateSimple ws, invalidFirstCell, Array("P101", "P103")
            ValidateSimple ws, invalidFirstCell, Array("P105", "P107")
            ValidateSimple ws, invalidFirstCell, Array("P109", "P111")
            ValidateSimple ws, invalidFirstCell, Array("P113", "P115")
            ValidateCondition ws, invalidFirstCell, "U61", "有", Array("S61", "S62", "S64"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U65", "有", Array("S65", "S66", "S68"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U69", "有", Array("S69", "S70", "S72"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U73", "有", Array("S73", "S74", "S76"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U77", "有", Array("S77", "S78", "S80"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U81", "有", Array("S81", "S82", "S84"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U85", "有", Array("S85", "S86", "S88"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U89", "有", Array("S89", "S90", "S92"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U93", "有", Array("S93", "S94", "S96"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U97", "有", Array("S97", "S98", "S100"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U101", "有", Array("S101", "S102", "S104"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U105", "有", Array("S105", "S106", "S108"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U109", "有", Array("S109", "S110", "S112"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U113", "有", Array("S113", "S114", "S116"), "radio", "■"
            ValidateGroup ws, invalidFirstCell, Array("W61", "Y61", "W62", "Y62"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W65", "Y65", "W66", "Y66"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W69", "Y69", "W70", "Y70"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W73", "Y73", "W74", "Y74"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W77", "Y77", "W78", "Y78"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W81", "Y81", "W82", "Y82"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W85", "Y85", "W86", "Y86"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W89", "Y89", "W90", "Y90"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W93", "Y93", "W94", "Y94"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W97", "Y97", "W98", "Y98"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W101", "Y101", "W102", "Y102"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W105", "Y105", "W106", "Y106"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W109", "Y109", "W110", "Y110"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W113", "Y113", "W114", "Y114"), "■", "", "", Array(), "", "", Array()
    End Select
End Sub

Private Sub ValidateOnsiteSpecialPatterns3(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Dim groupCells As Variant
    Dim selectedAddress As String
    Dim i As Integer
    Set ws = Worksheets("現地調査")
    ' 現地調査チェックシート(3/8)
    groupCells = Array( _
        "D139", "D140", _
        "S134", "S135", "S136", _
        "S137", "S138", "S139", _
        "S140", "S141", "S142", _
        "S143", "S144", "S145", _
        "S146", "S147", "S148", _
        "S149", "S150", "S151", _
        "S152", "S153", "S154", _
        "S155", "S156", "S157", _
        "W134", "Y134", "W135", "Y135", _
        "W137", "Y137", "W138", "Y138", _
        "W140", "Y140", "W141", "Y141", _
        "W143", "Y143", "W144", "Y144", _
        "W146", "Y146", "W147", "Y147", _
        "W149", "Y149", "W150", "Y150", _
        "W152", "Y152", "W153", "Y153", _
        "W155", "Y155", "W156", "Y156" _
    )
    For i = LBound(groupCells) To UBound(groupCells)
        SetCellBackgroundColor ws, groupCells(i), ""
    Next i
    ValidateGroup ws, invalidFirstCell, Array("D139", "D140"), "■", "", "", Array(), "D140", "■", Array("D142")
    selectedAddress = HasSelectedRadioOption(ws, Array("D139", "D140"), "■")
    Select Case selectedAddress
        Case "D139":
            ValidateCondition ws, invalidFirstCell, "U134", "有", Array("S134", "S135", "S136"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U137", "有", Array("S137", "S138", "S139"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U140", "有", Array("S140", "S141", "S142"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U143", "有", Array("S143", "S144", "S145"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U146", "有", Array("S146", "S147", "S148"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U149", "有", Array("S149", "S150", "S151"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U152", "有", Array("S152", "S153", "S154"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U155", "有", Array("S155", "S156", "S157"), "radio", "■"
            ValidateGroup ws, invalidFirstCell, Array("W134", "Y134", "W135", "Y135"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W137", "Y137", "W138", "Y138"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W140", "Y140", "W141", "Y141"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W143", "Y143", "W144", "Y144"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W146", "Y146", "W147", "Y147"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W149", "Y149", "W150", "Y150"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W152", "Y152", "W153", "Y153"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W155", "Y155", "W156", "Y156"), "■", "", "", Array(), "", "", Array()
    End Select
End Sub

Private Sub ValidateOnsiteSpecialPatterns4(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Dim groupCells As Variant
    Dim selectedAddress As String
    Dim i As Integer
    Set ws = Worksheets("現地調査")
    ' 現地調査チェックシート(4/8)
    groupCells = Array( _
        "D177", "D179", "D181", "D182", _
        "S175", "S176", "S177", _
        "S178", "S179", "S180", _
        "S181", "S182", "S183", _
        "S184", "S185", "S186", _
        "S187", "S188", "S189", _
        "S190", "S191", "S192", _
        "W175", "Y175", "W176", "Y176", _
        "W178", "Y178", "W179", "Y179", _
        "W181", "Y181", "W182", "Y182", _
        "W184", "Y184", "W185", "Y185", _
        "W187", "Y187", "W188", "Y188", _
        "W190", "Y190", "W191", "Y191" _
    )
    For i = LBound(groupCells) To UBound(groupCells)
        SetCellBackgroundColor ws, groupCells(i), ""
    Next i
    ValidateGroup ws, invalidFirstCell, Array("D177", "D179", "D181"), "■", "", "", Array(), "D181", "■", Array("D182")
    selectedAddress = HasSelectedRadioOption(ws, Array("D177", "D179", "D181"), "■")
    Select Case selectedAddress
        Case "D177":
            ValidateGroup ws, invalidFirstCell, Array("S175", "S176", "S177"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("S178", "S179", "S180"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W175", "Y175", "W176", "Y176"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W178", "Y178", "W179", "Y179"), "■", "", "", Array(), "", "", Array()
        Case "D179":
            ValidateGroup ws, invalidFirstCell, Array("S181", "S182", "S183"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("S184", "S185", "S186"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("S187", "S188", "S189"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W181", "Y181", "W182", "Y182"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W184", "Y184", "W185", "Y185"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W187", "Y187", "W188", "Y188"), "■", "", "", Array(), "", "", Array()
        Case "D181":
            ValidateGroup ws, invalidFirstCell, Array("S190", "S191", "S192"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W190", "Y190", "W191", "Y191"), "■", "", "", Array(), "", "", Array()
    End Select
End Sub

Private Sub ValidateOnsiteSpecialPatterns5(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Dim groupCells As Variant
    Dim selectedAddress As String
    Dim i As Integer
    Set ws = Worksheets("現地調査")
    ' 現地調査チェックシート(5/8)
    groupCells = Array( _
        "I263", "I277", "I289", _
        "S252", "S253", "S254", _
        "S255", "S256", "S257", _
        "S258", "S259", "S260", _
        "S261", "S262", "S263", _
        "S264", "S265", "S266", _
        "S267", "S268", "S269", _
        "S270", "S271", "S272", _
        "S273", "S274", "S275", _
        "S276", "S277", "S278", _
        "W252", "Y252", "W253", "Y253", _
        "W255", "Y255", "W256", "Y256", _
        "W258", "Y258", "W259", "Y259", _
        "W261", "Y261", "W262", "Y262", _
        "W264", "Y264", "W265", "Y265", _
        "W267", "Y267", "W268", "Y268", _
        "W270", "Y270", "W271", "Y271", _
        "W273", "Y273", "W274", "Y274", _
        "W276", "Y276", "W277", "Y277", _
        "W281", "Y281", "W282", "Y282", _
        "W284", "Y284", "W285", "Y285", _
        "W287", "Y287", "W288", "Y288", _
        "W290", "Y290", "W291", "Y291" _
    )
    For i = LBound(groupCells) To UBound(groupCells)
        SetCellBackgroundColor ws, groupCells(i), ""
    Next i
    ValidateGroup ws, invalidFirstCell, Array("I263", "I277", "I289"), "■", "", "", Array(), "", "", Array()
    selectedAddress = HasSelectedRadioOption(ws, Array("I263", "I277", "I289"), "■")
    Select Case selectedAddress
        Case "I263":
            ValidateGroup ws, invalidFirstCell, Array("S252", "S253", "S254"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("S255", "S256", "S257"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("S258", "S259", "S260"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("S261", "S262", "S263"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("S264", "S265", "S266"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W252", "Y252", "W253", "Y253"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W255", "Y255", "W256", "Y256"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W258", "Y258", "W259", "Y259"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W261", "Y261", "W262", "Y262"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W264", "Y264", "W265", "Y265"), "■", "", "", Array(), "", "", Array()
        Case "I277":
            ValidateGroup ws, invalidFirstCell, Array("S267", "S268", "S269"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("S270", "S271", "S272"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("S273", "S274", "S275"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("S276", "S277", "S278"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W267", "Y267", "W268", "Y268"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W270", "Y270", "W271", "Y271"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W273", "Y273", "W274", "Y274"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W276", "Y276", "W277", "Y277"), "■", "", "", Array(), "", "", Array()
        Case "I289":
            ValidateGroup ws, invalidFirstCell, Array("S281", "S282", "S283"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("S284", "S285", "S286"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("S287", "S288", "S289"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("S290", "S291", "S292"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W281", "Y281", "W282", "Y282"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W284", "Y284", "W285", "Y285"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W287", "Y287", "W288", "Y288"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W290", "Y290", "W291", "Y291"), "■", "", "", Array(), "", "", Array()
    End Select
End Sub

Private Sub ValidateOnsiteSpecialPatterns6(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Dim groupCells As Variant
    Dim selectedAddress As String
    Dim i As Integer
    Set ws = Worksheets("現地調査")
    ' 現地調査チェックシート(6/8)
    groupCells = Array( _
        "D373", "D374", _
        "S370", "S371", "S372", _
        "S373", "S374", "S375", _
        "S376", "S377", "S378", _
        "W370", "Y370", "W371", "Y371", _
        "W373", "Y373", "W374", "Y374", _
        "W376", "Y376", "W377", "Y377" _
    )
    For i = LBound(groupCells) To UBound(groupCells)
        SetCellBackgroundColor ws, groupCells(i), ""
    Next i
    ValidateGroup ws, invalidFirstCell, Array("D373", "D374"), "■", "", "", Array(), "", "", Array()
    selectedAddress = HasSelectedRadioOption(ws, Array("D373", "D374"), "■")
    Select Case selectedAddress
        Case "D373":
            ValidateCondition ws, invalidFirstCell, "U370", "有", Array("S370", "S371", "S372"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U373", "有", Array("S373", "S374", "S375"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U376", "有", Array("S376", "S377", "S378"), "radio", "■"
            ValidateGroup ws, invalidFirstCell, Array("W370", "Y370", "W371", "Y371"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W373", "Y373", "W374", "Y374"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W376", "Y376", "W377", "Y377"), "■", "", "", Array(), "", "", Array()
    End Select
End Sub

Private Sub ValidateOnsiteSpecialPatterns7(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Dim groupCells As Variant
    Dim selectedAddress As String
    Dim i As Integer
    Set ws = Worksheets("現地調査")
    ' 現地調査チェックシート(7/8) 屋根
    groupCells = Array( _
        "D407", "D408", _
        "S396", "S397", "S398", _
        "S399", "S400", "S401", _
        "S402", "S403", "S404", _
        "S405", "S406", "S407", _
        "S408", "S409", "S410", _
        "S411", "S412", "S413", _
        "W396", "Y396", "W397", "Y397", _
        "W399", "Y399", "W400", "Y400", _
        "W402", "Y402", "W403", "Y403", _
        "W405", "Y405", "W406", "Y406", _
        "W408", "Y408", "W409", "Y409", _
        "W411", "Y411", "W412", "Y412" _
    )
    For i = LBound(groupCells) To UBound(groupCells)
        SetCellBackgroundColor ws, groupCells(i), ""
    Next i
    ValidateGroup ws, invalidFirstCell, Array("D407", "D408"), "■", "", "", Array(), "D408", "■", Array("D410")
    selectedAddress = HasSelectedRadioOption(ws, Array("D407", "D408"), "■")
    Select Case selectedAddress
        Case "D407":
            ValidateCondition ws, invalidFirstCell, "U396", "有", Array("S396", "S397", "S398"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U399", "有", Array("S399", "S400", "S401"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U402", "有", Array("S402", "S403", "S404"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U405", "有", Array("S405", "S406", "S407"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U408", "有", Array("S408", "S409", "S410"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U411", "有", Array("S411", "S412", "S413"), "radio", "■"
            ValidateGroup ws, invalidFirstCell, Array("W396", "Y396", "W397", "Y397"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W399", "Y399", "W400", "Y400"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W402", "Y402", "W403", "Y403"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W405", "Y405", "W406", "Y406"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W408", "Y408", "W409", "Y409"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W411", "Y411", "W412", "Y412"), "■", "", "", Array(), "", "", Array()
    End Select
End Sub

Private Sub ValidateOnsiteSpecialPatterns8(ByRef invalidFirstCell As Range)
    Dim ws As Worksheet
    Dim groupCells As Variant
    Dim selectedAddress As String
    Dim i As Integer
    Set ws = Worksheets("現地調査")
    ' 現地調査チェックシート(8/8) 屋上
    groupCells = Array( _
        "C428", "C429", "C430", _
        "S414", "S415", "S416", _
        "S417", "S418", "S419", _
        "S420", "S421", "S422", _
        "S423", "S424", "S425", _
        "S426", "S427", "S428", _
        "S429", "S430", "S431", _
        "S432", "S433", "S434", _
        "S435", "S436", "S437", _
        "S438", "S439", "S440", _
        "S441", "S442", "S443", _
        "S444", "S445", "S446", _
        "W414", "Y414", "W415", "Y415", _
        "W417", "Y417", "W418", "Y418", _
        "W420", "Y420", "W421", "Y421", _
        "W423", "Y423", "W424", "Y424", _
        "W426", "Y426", "W427", "Y427", _
        "W429", "Y429", "W430", "Y430", _
        "W432", "Y432", "W433", "Y433", _
        "W435", "Y435", "W436", "Y436", _
        "W438", "Y438", "W439", "Y439", _
        "W441", "Y441", "W442", "Y442", _
        "W444", "Y444", "W445", "Y445" _
    )
    For i = LBound(groupCells) To UBound(groupCells)
        SetCellBackgroundColor ws, groupCells(i), ""
    Next i
    ValidateGroup ws, invalidFirstCell, Array("C428", "C429", "C430"), "■", "", "", Array(), "C430", "■", Array("D432")
    selectedAddress = HasSelectedRadioOption(ws, Array("C428", "C429", "C430"), "■")
    Select Case selectedAddress
        Case "C428", "C429":
            ValidateCondition ws, invalidFirstCell, "U414", "有", Array("S414", "S415", "S416"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U417", "有", Array("S417", "S418", "S419"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U420", "有", Array("S420", "S421", "S422"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U423", "有", Array("S423", "S424", "S425"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U426", "有", Array("S426", "S427", "S428"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U429", "有", Array("S429", "S430", "S431"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U432", "有", Array("S432", "S433", "S434"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U435", "有", Array("S435", "S436", "S437"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U438", "有", Array("S438", "S439", "S440"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U441", "有", Array("S441", "S442", "S443"), "radio", "■"
            ValidateCondition ws, invalidFirstCell, "U444", "有", Array("S444", "S445", "S446"), "radio", "■"
            ValidateGroup ws, invalidFirstCell, Array("W414", "Y414", "W415", "Y415"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W417", "Y417", "W418", "Y418"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W420", "Y420", "W421", "Y421"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W423", "Y423", "W424", "Y424"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W426", "Y426", "W427", "Y427"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W429", "Y429", "W430", "Y430"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W432", "Y432", "W433", "Y433"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W435", "Y435", "W436", "Y436"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W438", "Y438", "W439", "Y439"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W441", "Y441", "W442", "Y442"), "■", "", "", Array(), "", "", Array()
            ValidateGroup ws, invalidFirstCell, Array("W444", "Y444", "W445", "Y445"), "■", "", "", Array(), "", "", Array()
    End Select
End Sub

'' =============================================
'' フォーム必須入力チェック
''
'' 対象シート:
''   - 机上チェックシート
''   - 現地調査
''
'' 動作:
''   フォームの必須入力チェックを行い、未入力の項目がある場合は以下動作を行う
''   - ダイアログ表示「未入力箇所があります、ご確認ください」
''   - セル背景色を黄色に強調
''   - 保護解除→保護実行処理追加
'' =============================================
Sub ValidateCheck()
    Dim ws As Worksheet
    Dim invalidFirstCell As Range

    On Error GoTo Finally   ' ← 保険（超重要）

    '=== シート保護解除 ===
    'Worksheets("机上チェックシート").Unprotect Password:="2025Ken0129ken"
    'Worksheets("現地調査").Unprotect Password:="2025Ken0129ken"

    '=== 既存処理 ===
    Set ws = Worksheets("机上チェックシート")
    Call ValidateDesktopChecks(invalidFirstCell)

    Set ws = Worksheets("現地調査")
    Call ValidateOnsiteBaseChecks(invalidFirstCell)

    Call ValidateOnsiteSpecialPatterns1(invalidFirstCell)
    Call ValidateOnsiteSpecialPatterns2(invalidFirstCell)
    Call ValidateOnsiteSpecialPatterns3(invalidFirstCell)
    Call ValidateOnsiteSpecialPatterns4(invalidFirstCell)
    Call ValidateOnsiteSpecialPatterns5(invalidFirstCell)
    Call ValidateOnsiteSpecialPatterns6(invalidFirstCell)
    Call ValidateOnsiteSpecialPatterns7(invalidFirstCell)
    Call ValidateOnsiteSpecialPatterns8(invalidFirstCell)

    Call ValidateB2CHighlightedCells(invalidFirstCell)

    If invalidFirstCell Is Nothing Then
        MsgBox "入力チェックOK"
    Else
        MsgBox "未入力箇所があります、ご確認ください"
        invalidFirstCell.Worksheet.Activate
        invalidFirstCell.Activate
    End If

Finally:
    '=== シート再保護（図形操作を許可）===
    'Worksheets("机上チェックシート").Protect Password:="2025Ken0129ken", DrawingObjects:=False
    'Worksheets("現地調査").Protect Password:="2025Ken0129ken", DrawingObjects:=False
End Sub


'' =============================================
'' ValidateB2CHighlightedCells - B2C判定色付けセル未入力チェック
''
'' 引数：
''   invalidFirstCell: 最初に見つけた未入力セルを格納する変数（ByRef）
'' =============================================
Private Sub ValidateB2CHighlightedCells(ByRef invalidFirstCell As Range)
    Dim b2Ws As Worksheet
    Dim cWs As Worksheet
    
    ' B2C判定対象シートを取得
    On Error Resume Next
    Set b2Ws = Worksheets("評価b2劣化事象")
    Set cWs = Worksheets("評価c劣化事象")
    On Error GoTo 0
    
    ' 各シートで黄色の背景色を持つセルを検索してチェック
    If Not b2Ws Is Nothing Then
        Call ValidateYellowCellsInSheet(b2Ws, invalidFirstCell)
    End If
    
    If Not cWs Is Nothing Then
        Call ValidateYellowCellsInSheet(cWs, invalidFirstCell)
    End If
    
    Set b2Ws = Nothing
    Set cWs = Nothing
End Sub

'' =============================================
'' ValidateYellowCellsInSheet - シート内の黄色セル未入力チェック
''
'' 引数：
''   ws: チェック対象のワークシート
''   invalidFirstCell: 最初に見つけた未入力セルを格納する変数（ByRef）
'' =============================================
Private Sub ValidateYellowCellsInSheet(ws As Worksheet, ByRef invalidFirstCell As Range)
    Dim targetColor As Long
    Dim targetRanges As Variant
    Dim i As Integer
    Dim j As Integer
    Dim cell As Range
    
    ' HEX_YELLOWをRGB値に変換
    ' FFE699 = FF(255), E6(230), 99(153)
    targetColor = RGB(255, 230, 153)
    
    ' 対象色を設定
    
    ' HighlightB2CInputCellsで色付けされる列のみに限定
    ' G列、J列、Q列、T列、D列、N列の1-100行目
    targetRanges = Array("G1:G100", "J1:J100", "Q1:Q100", "T1:T100", "D1:D100", "N1:N100")
    
    ' 各範囲をチェック
    For i = LBound(targetRanges) To UBound(targetRanges)
        For Each cell In ws.Range(targetRanges(i))
            ' 結合セルの場合は代表セル（左上セル）のみ処理
            Dim targetCell As Range
            If cell.MergeCells Then
                Set targetCell = cell.mergeArea.cells(1, 1)
                ' 既に処理済みの結合セルはスキップ
                If targetCell.Address <> cell.Address Then
                    GoTo NextCell
                End If
            Else
                Set targetCell = cell
            End If
            
            ' 結合セルを考慮した背景色チェック
            Dim cellColor As Long
            If targetCell.MergeCells Then
                ' 結合セルの場合は結合エリアの色を取得
                cellColor = targetCell.mergeArea.Interior.Color
            Else
                ' 通常のセルの場合
                cellColor = targetCell.Interior.Color
            End If
            
            ' セルの背景色が黄色（HEX_YELLOW）かどうかチェック
            If cellColor = targetColor Then
                ' 黄色のセルが空かどうかチェック
                If IsCellEmpty(ws, targetCell.Address(False, False)) Then
                    ' 空のセルの場合、背景色をエラー色に設定（既に黄色だが確認のため）
                    SetCellBackgroundColor ws, targetCell.Address(False, False), HEX_YELLOW
                    
                    ' 最初に見つけた空のセルを記録
                    If invalidFirstCell Is Nothing Then
                        Set invalidFirstCell = targetCell
                    End If
                Else
                    ' 値が入力されている場合、背景色をクリア（解除）
                    SetCellBackgroundColor ws, targetCell.Address(False, False), ""
                End If
            End If
            
NextCell:
        Next cell
    Next i
End Sub

'' =============================================
'' ValidateSimple - 単純必須入力チェック
''
'' 引数：
''   - ws (Worksheet): チェック対象のワークシート
''   - invalidFirstCell (Range): 最初に見つかった未入力セルを格納する参照変数
''   - cells (Variant): チェック対象セルアドレスの配列
''   - defaultColor (String): 入力済みセルに設定する背景色のHEXコード（省略可）
''
'' 戻り値：
''   - Integer: -1（エラー時）、0（正常終了）
''
'' 動作：
''   1. cells引数が配列かどうかを検証
''   2. 配列内の各セルアドレスに対して空判定を実行
''   3. 空セル：背景色をHEX_YELLOWに設定、最初の未入力セルを記録
''   4. 入力済み：defaultColorを設定またはクリア
''
'' 使用例：
''   ValidateSimple ws, invalidCell, Array("A1", "B2", "C3")
'' =============================================
Function ValidateSimple(ByRef ws As Worksheet, ByRef invalidFirstCell As Range, ByVal cells As Variant, Optional ByVal defaultColor As String = "")
    Dim i As Integer
    Dim cellAddress As String

    ' 配列妥当性チェック
    If Not IsArray(cells) Then
        ValidateSimple = -1
        Exit Function
    End If

    ' 配列をループ処理
    For i = LBound(cells) To UBound(cells)
        cellAddress = cells(i)

        ' セルが空かどうかチェック
        If IsCellEmpty(ws, cellAddress) Then
            ' 空のセルの場合、背景色をエラー色に設定
            SetCellBackgroundColor ws, cellAddress, HEX_YELLOW
            ' 最初に見つけた空のセルを記録
            If invalidFirstCell Is Nothing Then
                Set invalidFirstCell = ws.Range(cellAddress)
            End If
        Else
            ' 値が入力されている場合、指定色または背景色クリア
            SetCellBackgroundColor ws, cellAddress, defaultColor
        End If
    Next i
End Function

'' =============================================
'' ValidateGroup - ラジオボタングループ形式必須入力チェック
''
'' 引数：
''   - ws (Worksheet): チェック対象のワークシート
''   - invalidFirstCell (Range): 最初に見つかった未入力セルを格納する参照変数
''   - cells (Variant): メインのラジオグループのセル座標配列
''   - onStateText (String): ラジオボタンのON状態を示すテキスト（例："■", "○", "●"）
''   - triggerCell (String): 追加ラジオグループチェックをトリガーするセルの座標
''   - triggerValue (String): 追加ラジオグループチェックをトリガーする選択値
''   - triggerRadioCells (Variant): triggerCell=triggerValue時にチェックする追加ラジオグループのセル座標配列
''   - otherCell (String): 「その他」選択肢のセル座標
''   - otherValue (String): 「その他」入力フィールドチェックをトリガーする選択値
''   - otherInputCells (Variant): otherCell=otherValue時にチェックする入力フィールドのセル座標配列
''   - defaultColor (String): 入力済みセルに設定する背景色のHEXコード（省略可）
''
'' 戻り値：
''   - Integer: -1（エラー時）、0（正常終了）
''
'' 動作：
''   1. メインラジオグループの選択状態をチェック
''   2. 未選択の場合：メインラジオグループ全体をエラー表示
''   3. triggerCell条件付きの追加ラジオグループチェック（再帰呼び出し）
''   4. otherCell条件付きの入力フィールドチェック（ValidateCondition使用）
''
'' 使用例：
''   ValidateGroup ws, invalidCell, Array("D1", "D2", "D3", "D4"), "■", "D2", "■", Array("E1", "E2", "E3"), "D4", "■", Array("F1", "F2")
'' =============================================
Function ValidateGroup(ByRef ws As Worksheet, ByRef invalidFirstCell As Range, ByVal cells As Variant, ByVal onStateText As String, ByVal triggerCell As String, ByVal triggerValue As String, ByVal triggerRadioCells As Variant, ByVal otherCell As String, ByVal otherValue As String, ByVal otherInputCells As Variant, Optional ByVal defaultColor As String = "")
    Dim i As Integer
    Dim selectedAddress As String
    Dim hasSelection As Boolean

    ' 配列妥当性チェック
    If Not IsArray(cells) Then
        ValidateGroup = -1
        Exit Function
    End If

    ' メインラジオグループの選択状態をチェック
    selectedAddress = HasSelectedRadioOption(ws, cells, onStateText)
    hasSelection = selectedAddress <> ""
    ' その他チェックボックスがない場合のその他チェック
    If Not hasSelection And otherCell = "" And otherValue = "" And IsArray(otherInputCells) Then
        Dim tmpHasSelection As Boolean
        tmpHasSelection = False
        For i = LBound(otherInputCells) To UBound(otherInputCells)
            tmpHasSelection = tmpHasSelection Or Not IsCellEmpty(ws, otherInputCells(i))
        Next i
        hasSelection = hasSelection Or tmpHasSelection
    End If

    If Not hasSelection Then
        ' メインラジオグループで何も選択されていない場合
        For i = LBound(cells) To UBound(cells)
            SetCellBackgroundColor ws, cells(i), HEX_YELLOW
            If invalidFirstCell Is Nothing Then
                Set invalidFirstCell = ws.Range(cells(i))
            End If
        Next i

        ' targetRadioCells, otherInputCellsの背景色をデフォルトに戻す
        If IsArray(triggerRadioCells) Then
            For i = LBound(triggerRadioCells) To UBound(triggerRadioCells)
                SetCellBackgroundColor ws, triggerRadioCells(i), defaultColor
            Next i
        End If
        ' その他チェックボックスがないタイプのその他が引っかかっている場合は背景色を黄色にする
        Dim otherColorHex As String
        otherColorHex = defaultColor
        If otherCell = "" And otherValue = "" And IsArray(otherInputCells) Then
            otherColorHex = HEX_YELLOW
        End If
        If IsArray(otherInputCells) Then
            For i = LBound(otherInputCells) To UBound(otherInputCells)
                SetCellBackgroundColor ws, otherInputCells(i), otherColorHex
            Next i
        End If
    Else
        ' メインラジオグループの背景色をクリアまたは設定
        For i = LBound(cells) To UBound(cells)
            SetCellBackgroundColor ws, cells(i), defaultColor
        Next i

        ' triggerCell選択時の追加ラジオグループチェック
        If triggerCell <> "" And IsArray(triggerRadioCells) Then
            '' 背景色をデフォルトに戻す
            For i = LBound(triggerRadioCells) To UBound(triggerRadioCells)
                SetCellBackgroundColor ws, triggerRadioCells(i), defaultColor
            Next i

            If ws.Range(triggerCell).Value = triggerValue Then
                ValidateGroup ws, invalidFirstCell, triggerRadioCells, onStateText, "", "", Array(), "", "", Array(), defaultColor
            End If
        End If

        ' 「その他」選択時の入力フィールドチェック
        ValidateCondition ws, invalidFirstCell, otherCell, otherValue, otherInputCells, "input", "", defaultColor
    End If
End Function

'' =============================================
'' ValidateGroupOr - 複数グループのいずれか入力必須チェック
''
'' 引数：
''   - ws (Worksheet): チェック対象のワークシート
''   - invalidFirstCell (Range): 最初に見つかった未入力セルを格納する参照変数
''   - groups (Variant): チェック対象のセルグループの2次元配列
''   - defaultColor (String): 入力済みセルに設定する背景色のHEXコード（省略可）
''
'' 戻り値：
''   - Integer: -1（エラー時）、0（正常終了）
''
'' 動作：
''   1. 各グループ内のセルの入力状況をチェック
''   2. いずれかのグループに入力があればOK（背景色をdefaultColorに設定）
''   3. すべてのグループが未入力の場合はエラー（背景色をHEX_YELLOWに設定）
''
'' 使用例：
''   Dim groups As Variant
''   groups = Array(Array("D256", "D257", "D258"), Array("D275", "D277", "D278"))
''   ValidateGroupOr ws, invalidCell, groups
'' =============================================
Function ValidateGroupOr(ByRef ws As Worksheet, ByRef invalidFirstCell As Range, ByVal groups As Variant, Optional ByVal defaultColor As String = "")
    Dim i As Integer, j As Integer
    Dim hasAnyGroupInput As Boolean
    Dim groupCells As Variant
    
    ' 配列妥当性チェック
    If Not IsArray(groups) Then
        ValidateGroupOr = -1
        Exit Function
    End If
    
    hasAnyGroupInput = False
    
    ' 各グループをチェック
    For i = LBound(groups) To UBound(groups)
        groupCells = groups(i)
        
        ' グループが配列かどうかチェック
        If IsArray(groupCells) Then
            ' グループ内のセルをチェック
            For j = LBound(groupCells) To UBound(groupCells)
                If Not IsCellEmpty(ws, groupCells(j)) Then
                    hasAnyGroupInput = True
                    Exit For
                End If
            Next j
        End If
        
        ' いずれかのグループに入力があれば終了
        If hasAnyGroupInput Then Exit For
    Next i
    
    ' 結果に応じて背景色を設定
    For i = LBound(groups) To UBound(groups)
        groupCells = groups(i)
        
        If IsArray(groupCells) Then
            For j = LBound(groupCells) To UBound(groupCells)
                If hasAnyGroupInput Then
                    ' いずれかのグループに入力がある場合
                    SetCellBackgroundColor ws, groupCells(j), defaultColor
                Else
                    ' すべてのグループが未入力の場合
                    SetCellBackgroundColor ws, groupCells(j), HEX_YELLOW
                    ' 最初に見つけた空のセルを記録
                    If invalidFirstCell Is Nothing Then
                        Set invalidFirstCell = ws.Range(groupCells(j))
                    End If
                End If
            Next j
        End If
    Next i
    
    ValidateGroupOr = 0
End Function

'' =============================================
'' ValidateCondition - 条件付き必須入力チェック
''
'' 引数：
''   - ws (Worksheet): チェック対象のワークシート
''   - invalidFirstCell (Range): 最初に見つかった未入力セルを格納する参照変数
''   - conditionCell (String): 条件判定を行うセルの座標
''   - conditionValue (String): 条件となる値（この値の場合にチェックを実行）
''   - targetCells (Variant): 条件成立時にチェックする対象セルの座標配列
''   - targetType (String): 対象セルの種類（"radio" or "input"）
''   - onStateText (String): targetType = "radio"の場合のみ有効、ラジオボタンのON状態を示すテキスト（例："■", "○", "●"）
''   - defaultColor (String): 入力済みセルに設定する背景色のHEXコード（省略可）
''
'' 戻り値：
''   - Integer: -1（エラー時）、0（正常終了）
''
'' 動作：
''   1. targetCells配列の妥当性を検証
''   2. conditionCellの値がconditionValueと一致するかチェック
''   3. 条件成立時：ValidateSimpleを使用してtargetCellsをチェック後、targetCellsの1番目のセルの背景色を確認してconditionCellの背景色を設定
''      - 1番目のセルが黄色（エラー）：conditionCellをHEX_YELLOWに設定
''      - 1番目のセルが正常色：conditionCellをdefaultColorに設定
''   4. 条件不成立時：conditionCellとtargetCellsの背景色をdefaultColorに設定
''
'' 使用例：
''   ValidateCondition ws, invalidCell, "G1", "その他", Array("H1", "H2")
'' =============================================
Function ValidateCondition(ByRef ws As Worksheet, ByRef invalidFirstCell As Range, ByVal conditionCell As String, ByVal conditionValue As String, ByVal targetCells As Variant, Optional ByVal targetType As String = "input", Optional ByVal onStateText As String = "", Optional ByVal defaultColor As String = "")
    ' 配列妥当性チェック
    If Not IsArray(targetCells) Then
        ValidateCondition = -1
        Exit Function
    End If

    ' 背景色をクリア
    SetCellBackgroundColor ws, conditionCell, defaultColor
    Dim i As Integer
    For i = LBound(targetCells) To UBound(targetCells)
        SetCellBackgroundColor ws, targetCells(i), defaultColor
    Next i

    ' 条件判定
    If conditionCell <> "" And IsArray(targetCells) Then
        If ws.Range(conditionCell).Value = conditionValue Or ws.Range(conditionCell).Value = "―" Then
            If targetType = "radio" Then
                ValidateGroup ws, invalidFirstCell, targetCells, onStateText, "", "", Array(), "", "", Array(), defaultColor
            Else
                ' 条件が成立している場合、対象セルをチェック
                ValidateSimple ws, invalidFirstCell, targetCells, defaultColor
            End If

            ' targetCellsの1番目のセルの背景色でconditionCellの背景色を設定
            If UBound(targetCells) >= LBound(targetCells) Then
                Dim firstTargetCell As String
                firstTargetCell = targetCells(LBound(targetCells))

                ' 1番目のセルの背景色を確認
                If ws.Range(firstTargetCell).Interior.Color = HexToRgb(HEX_YELLOW) Then
                    ' 1番目のセルがエラー状態（黄色）の場合
                    SetCellBackgroundColor ws, conditionCell, HEX_YELLOW
                Else
                    ' 1番目のセルが正常状態の場合
                    SetCellBackgroundColor ws, conditionCell, defaultColor
                End If
            End If
        End If
    End If
End Function

'' ========== 共通ヘルパー関数 ==========

'' =============================================
'' IsCellEmpty - セル空判定
''
'' 引数：
''   - ws (Worksheet): チェック対象のワークシート
''   - cellAddress (String): チェック対象のセルアドレス
''
'' 戻り値：
''   - Boolean: True（セルが空）、False（セルに値あり）
''
'' 動作：
''   セルの値が空文字列("")、Empty値、または□（チェックボックス未選択）の場合にTrueを返す
'' =============================================
Private Function IsCellEmpty(ByRef ws As Worksheet, ByVal cellAddress As String) As Boolean
    Dim cellValue As Variant
    cellValue = Trim(ws.Range(cellAddress).Value)
    ' 空文字列、Empty値、または□（チェックボックス未選択）を未入力として判定
    IsCellEmpty = (cellValue = "" Or IsEmpty(cellValue) Or cellValue = "□")
End Function

'' =============================================
'' SetCellBackgroundColor - セル背景色設定
''
'' 引数：
''   - ws (Worksheet): 対象のワークシート
''   - cellAddress (String): 対象のセルアドレス
''   - colorHex (String): HEXカラーコード（省略時は背景色をクリア）
''
'' 戻り値：
''   なし
''
'' 動作：
''   colorHexが指定されている場合：HexToRgb関数を使用してRGB値に変換後、背景色を設定
''   colorHexが空の場合：背景色をクリア（xlNone）
'' =============================================
Private Sub SetCellBackgroundColor(ByRef ws As Worksheet, ByVal cellAddress As String, Optional ByVal colorHex As String = "")
    If cellAddress <> "" Then
        If colorHex <> "" Then
            ws.Range(cellAddress).Interior.Color = HexToRgb(colorHex)
        Else
            ws.Range(cellAddress).Interior.ColorIndex = xlNone
        End If
    End If
End Sub

'' =============================================
'' HasSelectedRadioOption - ラジオグループ選択状態判定
''
'' 引数：
''   - ws (Worksheet): チェック対象のワークシート
''   - cells (Variant): ラジオグループのセル座標配列
''   - onStateText (String): 選択状態を示すテキスト
''
'' 戻り値：
''   - String: 選択状態のセルアドレス、無選択状態は空文字を返却する
''
'' 動作：
''   配列内のいずれかのセルの値がonStateTextと一致する場合にTrueを返す
'' =============================================
Private Function HasSelectedRadioOption(ByRef ws As Worksheet, ByVal cells As Variant, ByVal onStateText As String) As String
    Dim i As Integer
    HasSelectedRadioOption = ""

    For i = LBound(cells) To UBound(cells)
        If ws.Range(cells(i)).Value = onStateText Then
            HasSelectedRadioOption = cells(i)
            Exit Function
        End If
    Next i
End Function

'' =============================================
'' HexToRgb - HEX文字列をRGB値に変換
''
'' 引数：
''   - hexColor (String): 6桁のHEXカラーコード（例: "FFE699"）
''
'' 戻り値：
''   - Long: RGB値（Excel VBAのRGB関数と同等の形式）
''
'' 動作：
''   1. HEX文字列から赤(R)、緑(G)、青(B)成分を2文字ずつ抽出
''   2. 各成分を16進数から10進数に変換
''   3. VBAのRGB関数を使用してLong型のRGB値を生成
''
'' 使用例：
''   Dim rgbValue As Long
''   rgbValue = HexToRgb("FFE699")  ' 薄い黄色のRGB値を取得
'' =============================================
Private Function HexToRgb(ByVal hexColor As String) As Long
    Dim r As Integer, g As Integer, b As Integer

    ' HEX文字列から各色成分を抽出
    r = Val("&H" & Mid(hexColor, 1, 2))
    g = Val("&H" & Mid(hexColor, 3, 2))
    b = Val("&H" & Mid(hexColor, 5, 2))

    ' RGB値を計算
    HexToRgb = RGB(r, g, b)
End Function

'' =============================================
'' セルのクリアとバックグラウンドカラーのクリア
'' =============================================
Private Sub ClearCellsAndBackground(ws As Worksheet, ByVal cells As Variant)
    Dim i As Integer
    For i = LBound(cells) To UBound(cells)
        Call ClearSingleCell(ws, CStr(cells(i)))
    Next i
End Sub

'' =============================================
'' 複数グループのセルのクリアとバックグラウンドカラーのクリア
'' =============================================
Private Sub ClearGroupOr(ws As Worksheet, ByVal groups As Variant)
    Dim i As Integer, j As Integer
    Dim groupCells As Variant
    
    ' 各グループをクリア
    For i = LBound(groups) To UBound(groups)
        groupCells = groups(i)
        
        ' グループが配列かどうかチェック
        If IsArray(groupCells) Then
            ' グループ内のセルをクリア
            For j = LBound(groupCells) To UBound(groupCells)
                Call ClearSingleCell(ws, CStr(groupCells(j)))
            Next j
        End If
    Next i
End Sub

'' =============================================
'' 単一セルの安全なクリア処理
'' =============================================
Private Sub ClearSingleCell(ws As Worksheet, ByVal cellAddress As String)
    On Error GoTo ErrorHandler
    
    Dim targetRange As Range
    Set targetRange = ws.Range(cellAddress)
    
    ' 結合セルかどうかをチェック
    If targetRange.MergeCells Then
        ' 結合セルの場合は結合を一時的に解除してクリア
        Dim mergeArea As Range
        Set mergeArea = targetRange.mergeArea
        mergeArea.UnMerge
        Call SetCellValueSafely(targetRange)
        targetRange.Interior.ColorIndex = xlNone
        mergeArea.Merge
    Else
        ' 通常のセルの場合
        Call SetCellValueSafely(targetRange)
        targetRange.Interior.ColorIndex = xlNone
    End If
    
    Exit Sub
    
ErrorHandler:
    ' エラーが発生した場合は無視して次に進む
    On Error GoTo 0
End Sub

'' =============================================
'' セル値の安全な設定処理
'' =============================================
Private Sub SetCellValueSafely(targetRange As Range)
    On Error Resume Next
    
    ' 現在の値を確認
    Dim currentValue As String
    currentValue = CStr(targetRange.Value)
    
    ' セルアドレスを取得
    Dim cellAddress As String
    cellAddress = targetRange.Address(False, False)
    
    ' 「特になし」を設定する特別なセルかどうかを判定
    If IsSpecialNothingCell(cellAddress) Then
        ' 特別なセルの場合は「特になし」を設定
        targetRange.Value = "特になし"
    ElseIf IsCheckboxCell(currentValue) Or IsKnownCheckboxCell(cellAddress) Then
        ' チェックボックス形式の場合は□（未チェック状態）に設定
        targetRange.Value = "□"
    Else
        ' 通常のセルの場合は内容をクリア
        targetRange.ClearContents
    End If
    
    On Error GoTo 0
End Sub

'' =============================================
'' チェックボックス形式のセルかどうかを判定
'' =============================================
Private Function IsCheckboxCell(cellValue As String) As Boolean
    ' ■（チェック済み）または□（未チェック）が含まれているかチェック
    If InStr(cellValue, "■") > 0 Then
        IsCheckboxCell = True
    ElseIf InStr(cellValue, "□") > 0 Then
        IsCheckboxCell = True
    Else
        IsCheckboxCell = False
    End If
End Function

'' =============================================
'' 既知のチェックボックスセルかどうかを判定
'' =============================================
Private Function IsKnownCheckboxCell(cellAddress As String) As Boolean
    ' 机上チェックシートのチェックボックスセル（主要なもの）
    Dim checkboxCells As Variant
    checkboxCells = Array( _
        "M70", "M75", "M88", "M93", "F98", "F103", "CI117", "DA117", _
        "M133", "M138", "CT151", "DI151", "M199", "M204", "M318", "M323", _
        "M348", "M353", "CI131", "DA131", "CI136", "DF136", "CI141", _
        "CI146", "CY146", "DP146", "DG141", "CI282", "DF282", "CI292", _
        "DF292", "CI307", "DF307", "CI320", "DF320", "CS360", "DD360", _
        "DM360", "CT365", "M422", "M427", "M497", "M502", "M507", "M512", _
        "M553", "M558", "M571", "M576", "M589", "M594", "M616", "M621", _
        "M632", "M637", "BP655", "BP658", "BZ657", "DE655", "DO655", _
        "DG658", "DQ658", "DX655", "EF655", "DY658", "EF658" _
    )
    
    ' 現地調査シートのチェックボックスセル（主要なもの）
    Dim onsiteCheckboxCells As Variant
    onsiteCheckboxCells = Array( _
        "C31", "E31", "C36", "E36", "C39", "E39", "I60", "N60", "V60", _
        "J133", "N133", "V133", "J174", "N174", "V174", "J251", "N251", _
        "V251", "J327", "N327", "V327", "J395", "N395", "V395", "J463", _
        "N463", "V463", "D71", "D73", "D76", "C81", "E81", "C82", "E82" _
    )
    
    ' 配列内を検索
    Dim i As Integer
    For i = LBound(checkboxCells) To UBound(checkboxCells)
        If UCase(cellAddress) = UCase(CStr(checkboxCells(i))) Then
            IsKnownCheckboxCell = True
            Exit Function
        End If
    Next i
    
    For i = LBound(onsiteCheckboxCells) To UBound(onsiteCheckboxCells)
        If UCase(cellAddress) = UCase(CStr(onsiteCheckboxCells(i))) Then
            IsKnownCheckboxCell = True
            Exit Function
        End If
    Next i
    
    ' W, Y列のセル（現地調査の条件付きチェックボックス）
    If (Left(UCase(cellAddress), 1) = "W" Or Left(UCase(cellAddress), 1) = "Y") And _
       IsNumeric(Mid(cellAddress, 2)) Then
        Dim rowNum As Long
        rowNum = CLng(Mid(cellAddress, 2))
        If rowNum >= 20 And rowNum <= 500 Then
            IsKnownCheckboxCell = True
            Exit Function
        End If
    End If
    
    IsKnownCheckboxCell = False
End Function

'' =============================================
'' 「特になし」を設定する特別なセルかどうかを判定
'' =============================================
Private Function IsSpecialNothingCell(cellAddress As String) As Boolean
    ' 机上チェックシートの特別なセル
    Dim desktopSpecialCells As Variant
    desktopSpecialCells = Array("CL345", "CI613", "A693", "A749", "A776")
    
    ' 現地調査シートの特別なセル
    Dim onsiteSpecialCells As Variant
    onsiteSpecialCells = Array("A507")
    
    ' 配列内を検索
    Dim i As Integer
    For i = LBound(desktopSpecialCells) To UBound(desktopSpecialCells)
        If UCase(cellAddress) = UCase(CStr(desktopSpecialCells(i))) Then
            IsSpecialNothingCell = True
            Exit Function
        End If
    Next i
    
    For i = LBound(onsiteSpecialCells) To UBound(onsiteSpecialCells)
        If UCase(cellAddress) = UCase(CStr(onsiteSpecialCells(i))) Then
            IsSpecialNothingCell = True
            Exit Function
        End If
    Next i
    
    IsSpecialNothingCell = False
End Function

'' =============================================
'' 条件付きセルのクリア（条件セルと対象セルを両方クリア）
'' =============================================
Private Sub ClearConditionalCells(ws As Worksheet, ByVal conditionCell As String, ByVal targetCells As Variant)
    ' 条件セルをクリア
    Call ClearSingleCell(ws, conditionCell)
    
    ' 対象セルをクリア
    Call ClearCellsAndBackground(ws, targetCells)
End Sub

'' =============================================
'' 机上チェックシートのデータクリア処理
'' =============================================
Private Sub ClearDesktopSurveySheet()
    Call ClearDesktopSimpleRequired
    Call ClearDesktopRadioGroups
    Call ClearDesktopRegionAndEnvironment
    Call ClearDesktopStructureAndMaterials
    Call ClearDesktopEvaluations
    Call ClearDesktopComplexGroups
    Call ClearDesktopFinalAndConditional
    Call ClearDesktopSpecialCells
End Sub

Private Sub ClearDesktopSimpleRequired()
    Dim ws As Worksheet
    Set ws = Worksheets("机上チェックシート")
    Call ClearCellsAndBackground(ws, Array("CO6"))
    Call ClearCellsAndBackground(ws, Array("CO14", "DI14", "DW14"))
    Call ClearCellsAndBackground(ws, Array("CF19", "CZ19"))
    Call ClearCellsAndBackground(ws, Array("G19"))
    Call ClearCellsAndBackground(ws, Array("CP42", "DC42", "DP42"))
    Call ClearCellsAndBackground(ws, Array("CI57"))
    Call ClearCellsAndBackground(ws, Array("CI66"))
    Call ClearCellsAndBackground(ws, Array("CT76"))
    Call ClearCellsAndBackground(ws, Array("CT82"))
    Call ClearCellsAndBackground(ws, Array("CI108"))
    Call ClearCellsAndBackground(ws, Array("CI126", "CX126"))
    Call ClearCellsAndBackground(ws, Array("DE156", "DE161"))
    Call ClearCellsAndBackground(ws, Array("BS181", "DO181", "BS187", "DO187", "CR193", "DL193", "DZ193"))
    Call ClearCellsAndBackground(ws, Array("BS199", "DO199", "BS205", "DO205", "CR211", "DL211", "DZ211"))
    Call ClearCellsAndBackground(ws, Array("CI375", "DH375"))
    Call ClearCellsAndBackground(ws, Array("AT469", "AT475", "AT481", "AT487"))
    Call ClearCellsAndBackground(ws, Array("AT493", "AT499", "AT505", "AT511"))
    Call ClearCellsAndBackground(ws, Array("AT517", "AT523", "AT529", "AT535"))
    Call ClearCellsAndBackground(ws, Array("AK629", "BB629"))
    Call ClearCellsAndBackground(ws, Array("AQ714", "DF715"))
End Sub

Private Sub ClearDesktopRadioGroups()
    Dim ws As Worksheet
    Set ws = Worksheets("机上チェックシート")
    ' 構造種別関連
    Call ClearCellsAndBackground(ws, Array("CI131", "DA131", "CI136", "DF136", "CI141", "CI146", "CY146", "DP146", "DG141"))
    ' 各種判定項目
    Call ClearCellsAndBackground(ws, Array("M70", "M75"))
    Call ClearCellsAndBackground(ws, Array("M88", "M93"))
    Call ClearCellsAndBackground(ws, Array("F98", "F103"))
    Call ClearCellsAndBackground(ws, Array("CI117", "DA117"))
    Call ClearCellsAndBackground(ws, Array("M133", "M138"))
    Call ClearCellsAndBackground(ws, Array("CT151", "DI151"))
    Call ClearCellsAndBackground(ws, Array("M199", "M204"))
    Call ClearCellsAndBackground(ws, Array("M318", "M323"))
    Call ClearCellsAndBackground(ws, Array("M348", "M353"))
End Sub

Private Sub ClearDesktopRegionAndEnvironment()
    Dim ws As Worksheet
    Set ws = Worksheets("机上チェックシート")
    Call ClearCellsAndBackground(ws, Array("CI282", "DF282", "CI292", "DF292"))
    Call ClearCellsAndBackground(ws, Array("CI307", "DF307"))
    Call ClearCellsAndBackground(ws, Array("CI320", "DF320"))
    Call ClearCellsAndBackground(ws, Array("CS360", "DD360", "DM360", "CT365"))
End Sub

Private Sub ClearDesktopStructureAndMaterials()
    Dim ws As Worksheet
    Set ws = Worksheets("机上チェックシート")
    Call ClearCellsAndBackground(ws, Array("M422", "M427"))
    Call ClearCellsAndBackground(ws, Array("BQ386", "CN386", "DF386", "BQ391", "CC391", "CN391", "DK391"))
    Call ClearCellsAndBackground(ws, Array("CI396", "CI401", "CI406", "CI411", "CI416"))
    Call ClearCellsAndBackground(ws, Array("CI421", "CI426"))
    Call ClearCellsAndBackground(ws, Array("CI432", "CX432", "DM432"))
    Call ClearCellsAndBackground(ws, Array("CI443", "CI448"))
    Call ClearCellsAndBackground(ws, Array("DQ443", "DQ448"))
    Call ClearCellsAndBackground(ws, Array("CI453", "CW453", "DK453", "DY453"))
    Call ClearCellsAndBackground(ws, Array("CI458", "CW458", "DK458", "DY458"))
End Sub

Private Sub ClearDesktopEvaluations()
    Dim ws As Worksheet
    Set ws = Worksheets("机上チェックシート")
    Call ClearCellsAndBackground(ws, Array("M497", "M502"))
    Call ClearCellsAndBackground(ws, Array("M507", "M512"))
    Call ClearCellsAndBackground(ws, Array("M553", "M558"))
    Call ClearCellsAndBackground(ws, Array("M571", "M576"))
    Call ClearCellsAndBackground(ws, Array("M589", "M594"))
    Call ClearCellsAndBackground(ws, Array("M616", "M621"))
    Call ClearCellsAndBackground(ws, Array("M632", "M637"))
End Sub

Private Sub ClearDesktopComplexGroups()
    Dim ws As Worksheet
    Set ws = Worksheets("机上チェックシート")
    Call ClearCellsAndBackground(ws, Array("BP655", "BP658", "BZ657"))
    Call ClearCellsAndBackground(ws, Array("DE655", "DO655", "DG658", "DQ658"))
    Call ClearCellsAndBackground(ws, Array("DX655", "EF655", "DY658", "EF658"))
    Call ClearCellsAndBackground(ws, Array("BP661", "BP664", "BZ663"))
    Call ClearCellsAndBackground(ws, Array("DE661", "DO661", "DG664", "DQ664"))
    Call ClearCellsAndBackground(ws, Array("DX661", "EF661", "DY664", "EF664"))
    Call ClearCellsAndBackground(ws, Array("BP668", "BP671", "BZ670"))
    Call ClearCellsAndBackground(ws, Array("DE668", "DO668", "DG671", "DQ671"))
    Call ClearCellsAndBackground(ws, Array("DX668", "EF668", "DY671", "EF671"))
    Call ClearCellsAndBackground(ws, Array("BP675", "BP678", "BZ677"))
    Call ClearCellsAndBackground(ws, Array("DE675", "DO675", "DG678", "DQ678"))
    Call ClearCellsAndBackground(ws, Array("DX675", "EF675", "DY678", "EF678"))
    Call ClearCellsAndBackground(ws, Array("BP681", "BP684", "BZ683"))
    Call ClearCellsAndBackground(ws, Array("DE681", "DO681", "DG684", "DQ684"))
    Call ClearCellsAndBackground(ws, Array("DX681", "EF681", "DY684", "EF684"))
End Sub

Private Sub ClearDesktopFinalAndConditional()
    Dim ws As Worksheet
    Set ws = Worksheets("机上チェックシート")
    Call ClearCellsAndBackground(ws, Array("AQ719", "AY719", "BP719"))
    Call ClearCellsAndBackground(ws, Array("AQ727", "AY727", "BP727"))
    Call ClearCellsAndBackground(ws, Array("AQ735", "AY735", "BP735"))
    Call ClearCellsAndBackground(ws, Array("CI166", "DA166"))
End Sub

Private Sub ClearDesktopSpecialCells()
    Dim ws As Worksheet
    Set ws = Worksheets("机上チェックシート")
    Call ClearCellsAndBackground(ws, Array("CL345", "CI613", "A693", "A749", "A776"))
End Sub

'' =============================================
'' 現地調査シートのデータクリア処理
'' =============================================
Private Sub ClearOnsiteSurveySheet()
    Dim ws As Worksheet
    Set ws = Worksheets("現地調査")
    
    ' 単純必須チェック対象セルのクリア
    Call ClearCellsAndBackground(ws, Array("C4", "N4", "T4", "Y4"))
    Call ClearCellsAndBackground(ws, Array("F8", "I8", "K8", "O8", "T8", "X8"))
    
    ' ラジオボタングループ形式必須入力チェック対象セルのクリア
    ' 基本調査項目
    Call ClearCellsAndBackground(ws, Array("C31", "E31"))
    Call ClearCellsAndBackground(ws, Array("C36", "E36"))
    Call ClearCellsAndBackground(ws, Array("C39", "E39"))
    
    ' 点検口関連
    Call ClearCellsAndBackground(ws, Array("I60", "N60", "V60"))
    Call ClearCellsAndBackground(ws, Array("J133", "N133", "V133"))
    Call ClearCellsAndBackground(ws, Array("J174", "N174", "V174"))
    Call ClearCellsAndBackground(ws, Array("J251", "N251", "V251"))
    Call ClearCellsAndBackground(ws, Array("J327", "N327", "V327"))
    Call ClearCellsAndBackground(ws, Array("J395", "N395", "V395"))
    Call ClearCellsAndBackground(ws, Array("J463", "N463", "V463"))
    
    ' 基礎・構造関連
    Call ClearCellsAndBackground(ws, Array("D71", "D73", "D76"))
    Call ClearCellsAndBackground(ws, Array("C81", "E81", "C82", "E82"))
    Call ClearCellsAndBackground(ws, Array("D86", "D88", "D89", "D90", "D92", "D93"))
    Call ClearCellsAndBackground(ws, Array("D98", "D100", "D101"))
    Call ClearCellsAndBackground(ws, Array("D105", "D106", "D108", "D109"))
    
    ' 天井・小屋組関連
    Call ClearCellsAndBackground(ws, Array("D139", "D140", "D142"))
    Call ClearCellsAndBackground(ws, Array("D147", "D148", "D149"))
    Call ClearCellsAndBackground(ws, Array("D154", "D155", "D157"))
    
    ' 外壁仕様関連
    Call ClearCellsAndBackground(ws, Array("D177", "D179", "D181", "D182"))
    
    ' 複数グループのいずれか入力必須項目のクリア例
    ' グループ1: D256-D260 + D268-D271, グループ2: D275,D277,D278,D280,D281, グループ3: D285,D286,D287,D288,D290
    Dim exteriorGroupsForClear As Variant
    exteriorGroupsForClear = Array( _
        Array("D256", "D257", "D258", "D259", "D260", "D268", "D269", "D270", "D271"), _
        Array("D275", "D277", "D278", "D280", "D281"), _
        Array("D285", "D286", "D287", "D288", "D290") _
    )
    Call ClearGroupOr(ws, exteriorGroupsForClear)
    Call ClearCellsAndBackground(ws, Array("I263", "I277", "I289"))
    Call ClearCellsAndBackground(ws, Array("D297", "D298", "D299", "D300"))
    Call ClearCellsAndBackground(ws, Array("D303", "D304", "D305", "D306"))
    
    ' 設備関連
    Call ClearCellsAndBackground(ws, Array("D373", "D374"))
    
    ' 屋根・防水関連
    Call ClearCellsAndBackground(ws, Array("D398", "D399", "D400", "D401", "D402", "D403"))
    Call ClearCellsAndBackground(ws, Array("D407", "D408", "D410"))
    Call ClearCellsAndBackground(ws, Array("D416", "D417", "D418", "D419", "D420", "D421"))
    Call ClearCellsAndBackground(ws, Array("C428", "C429", "C430", "D432"))
    
    ' メンテナンス関連
    Call ClearCellsAndBackground(ws, Array("K522", "O522"))
    Call ClearCellsAndBackground(ws, Array("F526", "F528"))
    Call ClearCellsAndBackground(ws, Array("K526", "O526"))
    Call ClearCellsAndBackground(ws, Array("K530", "O530"))
    Call ClearCellsAndBackground(ws, Array("F534", "F536"))
    Call ClearCellsAndBackground(ws, Array("K534", "O534"))
    Call ClearCellsAndBackground(ws, Array("K538", "O538"))
    
    ' 特別処理項目
    Call ClearCellsAndBackground(ws, Array("W464", "Y464", "W465", "Y465"))
    Call ClearCellsAndBackground(ws, Array("W467", "Y467", "W468", "Y468"))
    Call ClearCellsAndBackground(ws, Array("W470", "Y470", "W471", "Y471"))
    
    ' 条件付きセルのクリア（主要なもののみ、全体は別関数で処理）
    Call ClearOnsiteSurveyConditionalCells
    
    ' 特別なセル（「特になし」を設定）
    Call ClearCellsAndBackground(ws, Array("A507"))
End Sub

'' =============================================
'' 現地調査シートの条件付きセルクリア処理
'' =============================================
Private Sub ClearOnsiteSurveyConditionalCells()
    Dim ws As Worksheet
    Set ws = Worksheets("現地調査")
    
    ' 地盤・敷地関連（7項目）
    Call ClearConditionalCells(ws, "U23", Array("S23", "S24", "S25", "W23", "Y23", "W24", "Y24"))
    Call ClearConditionalCells(ws, "U26", Array("S26", "S27", "S28", "W26", "Y26", "W27", "Y27"))
    Call ClearConditionalCells(ws, "U29", Array("S29", "S30", "S31", "W29", "Y29", "W30", "Y30"))
    Call ClearConditionalCells(ws, "U32", Array("S32", "S33", "S34", "W32", "Y32", "W33", "Y33"))
    Call ClearConditionalCells(ws, "U35", Array("S35", "S36", "S37", "W35", "Y35", "W36", "Y36"))
    Call ClearConditionalCells(ws, "U38", Array("S38", "S39", "S40", "W38", "Y38", "W39", "Y39"))
    Call ClearConditionalCells(ws, "U41", Array("S41", "S42", "S43", "W41", "Y41", "W42", "Y42"))
    
    ' 基礎関連（14項目）
    Call ClearConditionalCells(ws, "U61", Array("S61", "S62", "S64", "W61", "Y61", "W62", "Y62"))
    Call ClearConditionalCells(ws, "U65", Array("S65", "S66", "S68", "W65", "Y65", "W66", "Y66"))
    Call ClearConditionalCells(ws, "U69", Array("S69", "S70", "S72", "W69", "Y69", "W70", "Y70"))
    Call ClearConditionalCells(ws, "U73", Array("S73", "S74", "S76", "W73", "Y73", "W74", "Y74"))
    Call ClearConditionalCells(ws, "U77", Array("S77", "S78", "S80", "W77", "Y77", "W78", "Y78"))
    Call ClearConditionalCells(ws, "U81", Array("S81", "S82", "S84", "W81", "Y81", "W82", "Y82"))
    Call ClearConditionalCells(ws, "U85", Array("S85", "S86", "S88", "W85", "Y85", "W86", "Y86"))
    Call ClearConditionalCells(ws, "U89", Array("S89", "S90", "S92", "W89", "Y89", "W90", "Y90"))
    Call ClearConditionalCells(ws, "U93", Array("S93", "S94", "S96", "W93", "Y93", "W94", "Y94"))
    Call ClearConditionalCells(ws, "U97", Array("S97", "S98", "S100", "W97", "Y97", "W98", "Y98"))
    Call ClearConditionalCells(ws, "U101", Array("S101", "S102", "S104", "W101", "Y101", "W102", "Y102"))
    Call ClearConditionalCells(ws, "U105", Array("S105", "S106", "S108", "W105", "Y105", "W106", "Y106"))
    Call ClearConditionalCells(ws, "U109", Array("S109", "S110", "S112", "W109", "Y109", "W110", "Y110"))
    Call ClearConditionalCells(ws, "U113", Array("S113", "S114", "S116", "W113", "Y113", "W114", "Y114"))
    
    ' 残りの条件付きセルは別関数で処理
    Call ClearOnsiteSurveyConditionalCellsExtended
End Sub

'' =============================================
'' 現地調査シートの条件付きセルクリア処理（拡張）
'' =============================================
Private Sub ClearOnsiteSurveyConditionalCellsExtended()
    Call ClearOnsiteCond_CeilingAndRoofTruss
    Call ClearOnsiteCond_Exterior
    Call ClearOnsiteCond_ExteriorDetails
    Call ClearOnsiteCond_BalconyAndStairs
    Call ClearOnsiteCond_RoofAndRoofTop
    Call ClearOnsiteCond_InputFields
End Sub

Private Sub ClearOnsiteCond_CeilingAndRoofTruss()
    Dim ws As Worksheet
    Set ws = Worksheets("現地調査")
    Call ClearConditionalCells(ws, "U134", Array("S134", "S135", "S136", "W134", "Y134", "W135", "Y135"))
    Call ClearConditionalCells(ws, "U137", Array("S137", "S138", "S139", "W137", "Y137", "W138", "Y138"))
    Call ClearConditionalCells(ws, "U140", Array("S140", "S141", "S142", "W140", "Y140", "W141", "Y141"))
    Call ClearConditionalCells(ws, "U143", Array("S143", "S144", "S145", "W143", "Y143", "W144", "Y144"))
    Call ClearConditionalCells(ws, "U146", Array("S146", "S147", "S148", "W146", "Y146", "W147", "Y147"))
    Call ClearConditionalCells(ws, "U149", Array("S149", "S150", "S151", "W149", "Y149", "W150", "Y150"))
    Call ClearConditionalCells(ws, "U152", Array("S152", "S153", "S154", "W152", "Y152", "W153", "Y153"))
    Call ClearConditionalCells(ws, "U155", Array("S155", "S156", "S157", "W155", "Y155", "W156", "Y156"))
End Sub

Private Sub ClearOnsiteCond_Exterior()
    Dim ws As Worksheet
    Set ws = Worksheets("現地調査")
    Call ClearConditionalCells(ws, "U175", Array("S175", "S176", "S177", "W175", "Y175", "W176", "Y176"))
    Call ClearConditionalCells(ws, "U178", Array("S178", "S179", "S180", "W178", "Y178", "W179", "Y179"))
    Call ClearConditionalCells(ws, "U181", Array("S181", "S182", "S183", "W181", "Y181", "W182", "Y182"))
    Call ClearConditionalCells(ws, "U184", Array("S184", "S185", "S186", "W184", "Y184", "W185", "Y185"))
    Call ClearConditionalCells(ws, "U187", Array("S187", "S188", "S189", "W187", "Y187", "W188", "Y188"))
    Call ClearConditionalCells(ws, "U190", Array("S190", "S191", "S192", "W190", "Y190", "W191", "Y191"))
    Call ClearConditionalCells(ws, "U193", Array("S193", "S194", "S195", "W193", "Y193", "W194", "Y194"))
    Call ClearConditionalCells(ws, "U196", Array("S196", "S197", "S198", "W196", "Y196", "W197", "Y197"))
    Call ClearConditionalCells(ws, "U199", Array("S199", "S200", "S201", "W199", "W200", "W201"))
    Call ClearConditionalCells(ws, "U202", Array("S202", "S203", "S205", "W202", "Y202", "W203", "Y203"))
End Sub

Private Sub ClearOnsiteCond_ExteriorDetails()
    Dim ws As Worksheet
    Set ws = Worksheets("現地調査")
    Call ClearConditionalCells(ws, "U252", Array("S252", "S253", "S254", "W252", "Y252", "W253", "Y253"))
    Call ClearConditionalCells(ws, "U255", Array("S255", "S256", "S257", "W255", "Y255", "W256", "Y256"))
    Call ClearConditionalCells(ws, "U258", Array("S258", "S259", "S260", "W258", "Y258", "W259", "Y259"))
    Call ClearConditionalCells(ws, "U261", Array("S261", "S262", "S263", "W261", "Y261", "W262", "Y262"))
    Call ClearConditionalCells(ws, "U264", Array("S264", "S265", "S266", "W264", "Y264", "W265", "Y265"))
    Call ClearConditionalCells(ws, "U267", Array("S267", "S268", "S269", "W267", "Y267", "W268", "Y268"))
    Call ClearConditionalCells(ws, "U270", Array("S270", "S271", "S272", "W270", "Y270", "W271", "Y271"))
    Call ClearConditionalCells(ws, "U273", Array("S273", "S274", "S275", "W273", "Y273", "W274", "Y274"))
    Call ClearConditionalCells(ws, "U276", Array("S276", "S277", "S278", "W276", "Y276", "W277", "Y277"))
    Call ClearConditionalCells(ws, "U281", Array("S281", "S282", "S283", "W281", "Y281", "W282", "Y282"))
    Call ClearConditionalCells(ws, "U284", Array("S284", "S285", "S286", "W284", "Y284", "W285", "Y285"))
    Call ClearConditionalCells(ws, "U287", Array("S287", "S288", "S289", "W287", "Y287", "W288", "Y288"))
    Call ClearConditionalCells(ws, "U290", Array("S290", "S291", "S292", "W290", "Y290", "W291", "Y291"))
    Call ClearConditionalCells(ws, "U293", Array("S293", "S294", "S295", "W293", "Y293", "W294", "Y294"))
    Call ClearConditionalCells(ws, "U296", Array("S296", "S297", "S298", "W296", "Y296", "W297", "Y297"))
    Call ClearConditionalCells(ws, "U299", Array("S299", "S300", "S301", "W299", "Y299", "W300", "Y300"))
    Call ClearConditionalCells(ws, "U302", Array("S302", "S303", "S304", "W302", "Y302", "W303", "Y303"))
    Call ClearConditionalCells(ws, "U305", Array("S305", "S306", "S307", "W305", "Y305", "W306", "Y306"))
End Sub

Private Sub ClearOnsiteCond_BalconyAndStairs()
    Dim ws As Worksheet
    Set ws = Worksheets("現地調査")
    Call ClearConditionalCells(ws, "U328", Array("S328", "S329", "S330", "W328", "Y328", "W329", "Y329"))
    Call ClearConditionalCells(ws, "U331", Array("S331", "S332", "S333", "W331", "Y331", "W332", "Y332"))
    Call ClearConditionalCells(ws, "U334", Array("S334", "S335", "S336", "W334", "Y334", "W335", "Y335"))
    Call ClearConditionalCells(ws, "U337", Array("S337", "S338", "S339", "W337", "Y337", "W338", "Y338"))
    Call ClearConditionalCells(ws, "U340", Array("S340", "S341", "S342", "W340", "Y340", "W341", "Y341"))
    Call ClearConditionalCells(ws, "U343", Array("S343", "S344", "S345", "W343", "Y343", "W344", "Y344"))
    Call ClearConditionalCells(ws, "U346", Array("S346", "S347", "S348", "W346", "Y346", "W347", "Y347"))
    Call ClearConditionalCells(ws, "U349", Array("S349", "S350", "S351", "W349", "Y349", "W350", "Y350"))
    Call ClearConditionalCells(ws, "U352", Array("S352", "S353", "S354", "W352", "Y352", "W353", "Y353"))
    Call ClearConditionalCells(ws, "U355", Array("S355", "S356", "S357", "W355", "Y355", "W356", "Y356"))
    Call ClearConditionalCells(ws, "U358", Array("S358", "S359", "S360", "W358", "Y358", "W359", "Y359"))
    Call ClearConditionalCells(ws, "U361", Array("S361", "S362", "S363", "W361", "Y361", "W362", "Y362"))
    Call ClearConditionalCells(ws, "U364", Array("S364", "S365", "S366", "W364", "Y364", "W365", "Y365"))
    Call ClearConditionalCells(ws, "U367", Array("S367", "S368", "S369", "W367", "Y367", "W368", "Y368"))
    Call ClearConditionalCells(ws, "U370", Array("S370", "S371", "S372", "W370", "Y370", "W371", "Y371"))
    Call ClearConditionalCells(ws, "U373", Array("S373", "S374", "S375", "W373", "Y373", "W374", "Y374"))
    Call ClearConditionalCells(ws, "U376", Array("S376", "S377", "S378", "W376", "Y376", "W377", "Y377"))
End Sub

Private Sub ClearOnsiteCond_RoofAndRoofTop()
    Dim ws As Worksheet
    Set ws = Worksheets("現地調査")
    Call ClearConditionalCells(ws, "U396", Array("S396", "S397", "S398", "W396", "Y396", "W397", "Y397"))
    Call ClearConditionalCells(ws, "U399", Array("S399", "S400", "S401", "W399", "Y399", "W400", "Y400"))
    Call ClearConditionalCells(ws, "U402", Array("S402", "S403", "S404", "W402", "Y402", "W403", "Y403"))
    Call ClearConditionalCells(ws, "U405", Array("S405", "S406", "S407", "W405", "Y405", "W406", "Y406"))
    Call ClearConditionalCells(ws, "U408", Array("S408", "S409", "S410", "W408", "Y408", "W409", "Y409"))
    Call ClearConditionalCells(ws, "U411", Array("S411", "S412", "S413", "W411", "Y411", "W412", "Y412"))
    Call ClearConditionalCells(ws, "U414", Array("S414", "S415", "S416", "W414", "Y414", "W415", "Y415"))
    Call ClearConditionalCells(ws, "U417", Array("S417", "S418", "S419", "W417", "Y417", "W418", "Y418"))
    Call ClearConditionalCells(ws, "U420", Array("S420", "S421", "S422", "W420", "Y420", "W421", "Y421"))
    Call ClearConditionalCells(ws, "U423", Array("S423", "S424", "S425", "W423", "Y423", "W424", "Y424"))
    Call ClearConditionalCells(ws, "U426", Array("S426", "S427", "S428", "W426", "Y426", "W427", "Y427"))
    Call ClearConditionalCells(ws, "U429", Array("S429", "S430", "S431", "W429", "Y429", "W430", "Y430"))
    Call ClearConditionalCells(ws, "U432", Array("S432", "S433", "S434", "W432", "Y432", "W433", "Y433"))
    Call ClearConditionalCells(ws, "U435", Array("S435", "S436", "S437", "W435", "Y435", "W436", "Y436"))
    Call ClearConditionalCells(ws, "U438", Array("S438", "S439", "S440", "W438", "Y438", "W439", "Y439"))
    Call ClearConditionalCells(ws, "U441", Array("S441", "S442", "S443", "W441", "Y441", "W442", "Y442"))
    Call ClearConditionalCells(ws, "U444", Array("S444", "S445", "S446", "W444", "Y444", "W445", "Y445"))
End Sub

Private Sub ClearOnsiteCond_InputFields()
    Dim ws As Worksheet
    Set ws = Worksheets("現地調査")
    Call ClearConditionalCells(ws, "U475", Array("X476"))
    Call ClearConditionalCells(ws, "U480", Array("X482"))
    Call ClearConditionalCells(ws, "U489", Array("X489"))
    Call ClearConditionalCells(ws, "U492", Array("X492"))
    Call ClearConditionalCells(ws, "U495", Array("X495"))
    Call ClearConditionalCells(ws, "U498", Array("X498"))
    Call ClearConditionalCells(ws, "U501", Array("X501"))
End Sub

'' =============================================
'' B2C判定処理
''
'' 動作:
''   「現地調査」シートの特定セルに■が入力されている場合、
''   その位置に応じて「評価b2劣化事象」または「評価c劣化事象」シートにデータを自動入力する
''
'' 判定ルール:
''   - W列のセル → b2評価として「評価b2劣化事象」シートに入力
''   - Y列のセル → c評価として「評価c劣化事象」シートに入力
'' =============================================
Sub ExecuteB2CJudgment()
    Dim startTime As Double
    startTime = Timer
    
    ' 確認ダイアログ
    If MsgBox("B2C判定処理を実行します。" & vbCrLf & vbCrLf & _
              "「現地調査」シートの■マークを元に" & vbCrLf & _
              "「評価b2劣化事象」「評価c劣化事象」シートに" & vbCrLf & _
              "データを入力します。" & vbCrLf & vbCrLf & _
              "既存データは上書きされます。" & vbCrLf & _
              "実行してもよろしいですか？", _
              vbYesNo + vbQuestion + vbDefaultButton2, _
              "B2C判定処理確認") = vbNo Then
        Exit Sub
    End If
    
    ' 画面更新停止
    Application.ScreenUpdating = False
    Application.EnableEvents = False
    
    On Error GoTo ErrorHandler
    
    ' B2C色付けセルリストを初期化（現在は不要だが互換性のため残す）
    Set g_B2CHighlightedCells = New Collection
    
    ' B2C判定処理実行
    Call ProcessB2CAssessment
    
    ' 画面更新再開
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    
    ' 完了メッセージ
    Dim processingTime As String
    processingTime = Format(Timer - startTime, "0.00")
    MsgBox "B2C判定処理が完了しました。" & vbCrLf & _
           "処理時間: " & processingTime & "秒", vbInformation, "処理完了"
    
    Exit Sub
    
ErrorHandler:
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    MsgBox "エラーが発生しました: " & Err.Description, vbCritical, "エラー"
End Sub

'' =============================================
'' B2C判定メイン処理
'' =============================================
Private Sub ProcessB2CAssessment()
    Dim sourceWs As Worksheet
    Dim b2Ws As Worksheet
    Dim cWs As Worksheet
    
    ' ワークシート取得
    Set sourceWs = Worksheets("現地調査")
    Set b2Ws = Worksheets("評価b2劣化事象")
    Set cWs = Worksheets("評価c劣化事象")
    
    ' 既存データをクリア
    Call ClearB2CSheets(b2Ws, cWs)
    
    ' 判定データを収集
    Dim b2Results As Collection
    Dim cResults As Collection
    Set b2Results = New Collection
    Set cResults = New Collection
    
    Call CollectB2CJudgments(sourceWs, b2Results, cResults)
    
    ' 結果をシートに出力
    Call OutputB2CResults(b2Ws, b2Results, "b2")
    Call OutputB2CResults(cWs, cResults, "c")
End Sub

'' =============================================
'' B2Cシートの既存データクリア
'' =============================================
Private Sub ClearB2CSheets(b2Ws As Worksheet, cWs As Worksheet)
    Dim i As Integer
    Dim locationCell As String
    Dim assessmentCell As String
    
    ' 100個まで対応（動的にセル位置を計算、7個目、13個目等で16行オフセット）
    For i = 1 To 100
        ' セル位置を計算（正しい計算式）
        Dim baseRow As Integer
        
        If i Mod 2 = 1 Then
            ' 奇数番目: C列, K列
            baseRow = 4 + (Int((i - 1) / 2) Mod 3) * 12 + Int((i - 1) / 6) * 40
            locationCell = "C" & baseRow
            assessmentCell = "K" & (baseRow + 1)
        Else
            ' 偶数番目: M列, U列
            baseRow = 4 + (Int((i - 2) / 2) Mod 3) * 12 + Int((i - 1) / 6) * 40
            locationCell = "M" & baseRow
            assessmentCell = "U" & (baseRow + 1)
        End If
        
        ' b2シートクリア（結合セル対応）
        Call ClearCellSafely(b2Ws, locationCell)
        Call ClearCellSafely(b2Ws, assessmentCell)
        
        ' cシートクリア（結合セル対応）
        Call ClearCellSafely(cWs, locationCell)
        Call ClearCellSafely(cWs, assessmentCell)
    Next i
End Sub

'' =============================================
'' B2C判定データ収集
'' =============================================
Private Sub CollectB2CJudgments(sourceWs As Worksheet, b2Results As Collection, cResults As Collection)
    ' 場所別のセル定義
    Dim locations As Variant
    locations = Array( _
        Array("敷地及び地盤", Array("W24", "W27", "W30", "W33", "W36", "W39", "W42"), Array("Y24", "Y27", "Y30", "Y33", "Y36", "Y39", "Y42")), _
        Array("各点検口内", Array("W62", "W66", "W70", "W74", "W78", "W82", "W86", "W90", "W94", "W98", "W102", "W106", "W110", "W114", "W135", "W138", "W141", "W144", "W147", "W150", "W153", "W156"), Array("Y62", "Y66", "Y70", "Y74", "Y78", "Y82", "Y86", "Y90", "Y94", "Y98", "Y102", "Y106", "Y110", "Y114", "Y135", "Y138", "Y141", "Y144", "Y147", "Y150", "Y153", "Y156")), _
        Array("建築物外部", Array("W176", "W179", "W182", "W185", "W188", "W191", "W194", "W197", "W203", "W253", "W256", "W259", "W262", "W265", "W268", "W271", "W274", "W277", "W282", "W285", "W288", "W291", "W294", "W297", "W300", "W303", "W306", "W329", "W332", "W335", "W338", "W341", "W344", "W347", "W350", "W353", "W356", "W359", "W362", "W365", "W368", "W371", "W374", "W377"), Array("Y176", "Y179", "Y182", "Y185", "Y188", "Y191", "Y194", "Y197", "Y203", "Y253", "Y256", "Y259", "Y262", "Y265", "Y268", "Y271", "Y274", "Y277", "Y282", "Y285", "Y288", "Y291", "Y294", "Y297", "Y300", "Y303", "Y306", "Y329", "Y332", "Y335", "Y338", "Y341", "Y344", "Y347", "Y350", "Y353", "Y356", "Y359", "Y362", "Y365", "Y368", "Y371", "Y374", "Y377")), _
        Array("屋根及び屋上", Array("W397", "W400", "W403", "W406", "W409", "W412", "W415", "W418", "W421", "W424", "W427", "W430", "W433", "W436", "W439", "W442", "W445"), Array("Y397", "Y400", "Y403", "Y406", "Y409", "Y412", "Y415", "Y418", "Y421", "Y424", "Y427", "Y430", "Y433", "Y436", "Y439", "Y442", "Y445")), _
        Array("共用部", Array("W465", "W468", "W471"), Array("Y465", "Y468", "Y471")) _
    )
    
    Dim i As Integer, j As Integer
    Dim locationName As String
    Dim b2Cells As Variant
    Dim cCells As Variant
    Dim hasB2 As Boolean
    Dim hasC As Boolean
    
    ' 各場所をチェック
    For i = LBound(locations) To UBound(locations)
        locationName = locations(i)(0)
        b2Cells = locations(i)(1)
        cCells = locations(i)(2)
        
        hasB2 = False
        hasC = False
        
        ' b2判定セルをチェック（個数をカウント）
        Dim b2Count As Integer
        b2Count = 0
        For j = LBound(b2Cells) To UBound(b2Cells)
            If sourceWs.Range(b2Cells(j)).Value = "■" Then
                b2Count = b2Count + 1
            End If
        Next j
        
        ' c判定セルをチェック（個数をカウント）
        Dim cCount As Integer
        cCount = 0
        For j = LBound(cCells) To UBound(cCells)
            If sourceWs.Range(cCells(j)).Value = "■" Then
                cCount = cCount + 1
            End If
        Next j
        
        ' 結果をコレクションに追加（チェック個数分だけ追加）
        Dim k As Integer
        For k = 1 To b2Count
            b2Results.Add locationName
        Next k
        For k = 1 To cCount
            cResults.Add locationName
        Next k
    Next i
End Sub

'' =============================================
'' B2C結果出力
'' =============================================
Private Sub OutputB2CResults(targetWs As Worksheet, results As Collection, assessmentType As String)
    Dim i As Integer
    Dim locationCell As String
    Dim assessmentCell As String
    
    ' 結果を出力（100個まで対応）
    For i = 1 To results.Count
        If i <= 100 Then
            ' セル位置を計算（正しい計算式）
            Dim baseRow As Integer
            
            If i Mod 2 = 1 Then
                ' 奇数番目: C列, K列
                baseRow = 4 + (Int((i - 1) / 2) Mod 3) * 12 + Int((i - 1) / 6) * 40
                locationCell = "C" & baseRow
                assessmentCell = "K" & (baseRow + 1)
            Else
                ' 偶数番目: M列, U列
                baseRow = 4 + (Int((i - 2) / 2) Mod 3) * 12 + Int((i - 1) / 6) * 40
                locationCell = "M" & baseRow
                assessmentCell = "U" & (baseRow + 1)
            End If
            
            ' データを出力（結合セル対応）
            Call SetB2CCellValue(targetWs, locationCell, results(i))
            Call SetB2CCellValue(targetWs, assessmentCell, assessmentType)
            
            ' データ入力時の色付け処理
            Call HighlightB2CInputCells(targetWs, i)
        End If
    Next i
End Sub

'' =============================================
'' セルの安全なクリア処理（B2C判定用）
'' =============================================
Private Sub ClearCellSafely(ws As Worksheet, cellAddress As String)
    On Error Resume Next
    
    Dim targetRange As Range
    Set targetRange = ws.Range(cellAddress)
    
    ' 結合セルかどうかをチェック
    If targetRange.MergeCells Then
        ' 結合セルの場合は結合エリア全体をクリア
        targetRange.mergeArea.ClearContents
    Else
        ' 通常のセルの場合
        targetRange.ClearContents
    End If
    
    On Error GoTo 0
End Sub

'' =============================================
'' セル値の安全な設定処理（B2C判定用）
'' =============================================
Private Sub SetB2CCellValue(ws As Worksheet, cellAddress As String, cellValue As String)
    On Error Resume Next
    
    Dim targetRange As Range
    Set targetRange = ws.Range(cellAddress)
    
    ' 結合セルかどうかをチェック
    If targetRange.MergeCells Then
        ' 結合セルの場合は最初のセルに値を設定
        targetRange.mergeArea.cells(1, 1).Value = cellValue
    Else
        ' 通常のセルの場合
        targetRange.Value = cellValue
    End If
    
    On Error GoTo 0
End Sub

'' =============================================
'' B2Cデータ入力時の色付け処理
'' =============================================
Private Sub HighlightB2CInputCells(targetWs As Worksheet, dataIndex As Integer)
    Dim highlightCells As Variant
    
    ' データの順番に応じて色付け対象セルを決定
    Select Case dataIndex
        Case 1
            ' 1つ目のデータ
            highlightCells = Array("G4", "J4", "D5")
        Case 2
            ' 2つ目のデータ
            highlightCells = Array("Q4", "T4", "N5")
        Case 3
            ' 3つ目のデータ
            highlightCells = Array("G16", "J16", "D17")
        Case 4
            ' 4つ目のデータ
            highlightCells = Array("Q16", "T16", "N17")
        Case Else
            ' 5つ目以降は規則的なパターンで計算（正しい計算式）
            Dim baseRowHighlight As Integer
            
            If dataIndex Mod 2 = 1 Then
                ' 奇数番目: G列, J列, D列
                baseRowHighlight = 4 + (Int((dataIndex - 1) / 2) Mod 3) * 12 + Int((dataIndex - 1) / 6) * 40
                highlightCells = Array("G" & baseRowHighlight, "J" & baseRowHighlight, "D" & (baseRowHighlight + 1))
            Else
                ' 偶数番目: Q列, T列, N列
                baseRowHighlight = 4 + (Int((dataIndex - 2) / 2) Mod 3) * 12 + Int((dataIndex - 1) / 6) * 40
                highlightCells = Array("Q" & baseRowHighlight, "T" & baseRowHighlight, "N" & (baseRowHighlight + 1))
            End If
    End Select
    
    ' 各セルに黄色で色付け
    Dim i As Integer
    For i = LBound(highlightCells) To UBound(highlightCells)
        Call SetB2CCellBackgroundColor(targetWs, CStr(highlightCells(i)), HEX_YELLOW)
        
        ' グローバルコレクションに色付けセルを記録（現在は不要だが互換性のため残す）
        If Not g_B2CHighlightedCells Is Nothing Then
            On Error Resume Next
            g_B2CHighlightedCells.Add targetWs.Name & "!" & CStr(highlightCells(i))
            On Error GoTo 0
        End If
    Next i
End Sub

'' =============================================
'' B2C用セル背景色設定
'' =============================================
Private Sub SetB2CCellBackgroundColor(ws As Worksheet, cellAddress As String, colorHex As String)
    On Error Resume Next
    
    Dim targetRange As Range
    Set targetRange = ws.Range(cellAddress)
    
    ' 結合セルかどうかをチェック
    If targetRange.MergeCells Then
        ' 結合セルの場合は結合エリア全体に色付け
        targetRange.mergeArea.Interior.Color = HexToRgb(colorHex)
    Else
        ' 通常のセルの場合
        targetRange.Interior.Color = HexToRgb(colorHex)
    End If
    
    On Error GoTo 0
End Sub
