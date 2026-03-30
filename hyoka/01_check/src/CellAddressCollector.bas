Attribute VB_Name = "CellAddressCollector"
'' =============================================
'' セルアドレス収集 & マッピングシート管理ツール
''
'' 1. CreateMappingSheet: マッピングシートを新規作成
''    → 既知のセルアドレス(W/Y列)は自動入力
''    → 未知のセルは空欄（後で収集）
''
'' 2. CollectCellAddresses: 空欄セルを対話的に収集
''    → ステータスバーにガイド表示
''    → セルクリック→確認→記録
''    → マッピングシートに直接書き込み
''
'' 3. ValidateMappingSheet: マッピングの空欄チェック
''
'' 使い方:
''   Step1: Alt+F8 → CreateMappingSheet を実行
''   Step2: Alt+F8 → CollectCellAddresses を実行
''   Step3: ステータスバーの指示に従いセルをクリック
''
'' 作成日: 2026-02-19
'' =============================================
Option Explicit

Private Const MAPPING_SHEET As String = "マッピング"
Public Const KP_MAPPING_SHEET As String = "KPマッピング"
Private Const SHEET_PW As String = "2025Ken0129ken"

'' 収集モード状態
Public g_CollectMode As Boolean
Public g_CollectIndex As Long
Public g_CollectItems As Collection  ' Array(sheetName, row, col, description)

'' =============================================
'' Step 1: マッピングシートの作成
'' =============================================
Public Sub CreateMappingSheet()
    ' 既存チェック
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = Worksheets(MAPPING_SHEET)
    On Error GoTo 0

    If Not ws Is Nothing Then
        If MsgBox("「" & MAPPING_SHEET & "」シートは既に存在します。" & vbCrLf & _
                  "再作成しますか？（既存データは削除されます）", _
                  vbYesNo + vbExclamation, "確認") = vbNo Then
            Exit Sub
        End If
        Application.DisplayAlerts = False
        ws.Delete
        Application.DisplayAlerts = True
    End If

    ' 新規シート作成
    Set ws = Worksheets.Add(After:=Worksheets(Worksheets.Count))
    ws.Name = MAPPING_SHEET

    Application.ScreenUpdating = False

    ' ===== テーブルA: 評価セル (A:G) =====
    SetupTableA ws

    ' ===== テーブルB: グループ有無 (K:N) =====
    SetupTableB ws

    ' ===== テーブルC: オプション選択 (O:R) =====
    SetupTableC ws

    ' ===== テーブルD: メンテナンス (S:X) =====
    SetupTableD ws

    ' ===== テーブルE: カテゴリ調査状況 (Y:AB) =====
    SetupTableE ws

    ' ===== テーブルF: 項目調査実施状況 (AC:AH) =====
    SetupTableF ws

    ' ===== テーブルG: 資料値・実測値 (AJ:AM) =====
    SetupTableG ws

    ' ===== テーブルH: 物件基本情報 (AN:AQ) =====
    SetupTableH ws

    ' ===== テーブルI: 備考 (AR:AT) =====
    SetupTableI ws

    ' ===== テーブルJ: 定型写真 (AU:AX) =====
    SetupTableJ ws

    ' ===== テーブルK: 不具合テンプレート (AY:BF) =====
    SetupTableK ws

    ' 列幅調整
    ws.Columns("A:A").ColumnWidth = 10
    ws.Columns("B:B").ColumnWidth = 8
    ws.Columns("C:C").ColumnWidth = 8
    ws.Columns("D:E").ColumnWidth = 12
    ws.Columns("F:F").ColumnWidth = 12
    ws.Columns("I:I").ColumnWidth = 12
    ws.Columns("I:I").ColumnWidth = 12
    ws.Columns("B:C").ColumnWidth = 8
    ws.Columns("D:E").ColumnWidth = 8
    ws.Columns("I:I").ColumnWidth = 30

    ' シートを非表示（後で手動で表示可能）
    ' ws.Visible = xlSheetVeryHidden  ' ← 本番時にコメント解除

    Application.ScreenUpdating = True

    MsgBox "マッピングシートを作成しました！" & vbCrLf & vbCrLf & _
           "テーブルA: 評価セル（" & "既知のb2/cセルは自動入力済み）" & vbCrLf & _
           "テーブルB: グループ有無（要入力）" & vbCrLf & _
           "テーブルC: オプション選択（要入力）" & vbCrLf & _
           "テーブルD: メンテナンス（要入力）" & vbCrLf & _
           "テーブルE: カテゴリ調査状況（要入力）" & vbCrLf & _
           "テーブルH: 物件基本情報（要入力）" & vbCrLf & _
           "テーブルI: 備考（要入力）" & vbCrLf & _
           "テーブルJ: 定型写真（要入力）" & vbCrLf & _
           "テーブルK: 不具合テンプレート（要入力）" & vbCrLf & vbCrLf & _
           "次に CollectCellAddresses を実行して空欄を埋めてください。", _
           vbInformation, "完了"
End Sub

'' ----- ヘルパー: セルアドレスの行番号をオフセット（文字列操作のみ・シート不要）
Private Function OffsetCellRowStr(cellAddress As String, offsetRows As Long) As String
    ' 例: "W24", -1 → "W23" / "AB123", -1 → "AB122"
    Dim col As String
    Dim rowNum As Long
    Dim i As Long
    For i = 1 To Len(cellAddress)
        If IsNumeric(Mid(cellAddress, i, 1)) Then
            col = Left(cellAddress, i - 1)
            rowNum = CLng(Mid(cellAddress, i))
            OffsetCellRowStr = col & CStr(rowNum + offsetRows)
            Exit Function
        End If
    Next i
    OffsetCellRowStr = cellAddress ' パース失敗時はそのまま返す
End Function

'' ----- ヘルパー: テーブルA用1行書き込み -----
Private Sub WriteItemSimple(ws As Worksheet, r As Long, itemId As String, desc As String)
    ws.Cells(r, 1).Value = itemId
    ' B～I列（a/b1/b2/c/目視/計測/触診/na）は全て空欄 → 収集対象
    ws.Cells(r, 10).Value = desc
End Sub

'' ----- テーブルA: 評価セル -----
'' A1:F1 = ヘッダー
'' A列:itemId, B列:aセル(V列), C列:b1セル(X列), D列:b2セル(W列), E列:cセル(Y列), F列:調査方法_目視, G列:調査方法_計測, H列:調査方法_触診, I列:項目名(参考)
Private Sub SetupTableA(ws As Worksheet)
    ' ヘッダー
    ws.Range("A1").Value = "【テーブルA】評価セルマッピング"
    ws.Range("A1").Font.Bold = True
    ws.Range("A1").Font.Size = 11
    ws.Range("A1").Interior.Color = RGB(79, 129, 189)
    ws.Range("A1").Font.Color = RGB(255, 255, 255)

    ws.Range("A2").Value = "itemId"
    ws.Range("B2").Value = "aセル(V列)"
    ws.Range("C2").Value = "b1セル(X列)"
    ws.Range("D2").Value = "b2セル(W列)"
    ws.Range("E2").Value = "cセル(Y列)"
    ws.Range("F2").Value = "目視セル"
    ws.Range("G2").Value = "計測セル"
    ws.Range("H2").Value = "触診セル"
    ws.Range("J2").Value = "項目名（参考）"
    ws.Range("A2:J2").Font.Bold = True
    ws.Range("A2:J2").Interior.Color = RGB(220, 230, 241)

    ' 既知データ: Module1.basのCollectB2CJudgmentsから
    ' 行ごとに直接書き込み（VBA行継続制限を回避）
    Dim r As Long
    r = 3
WriteItemSimple ws, r, "item1", "外部① 敷地及び地盤: 地盤": r = r + 1
    WriteItemSimple ws, r, "item2", "外部① 敷地及び地盤: 敷地": r = r + 1
    WriteItemSimple ws, r, "item3", "外部① 敷地及び地盤: 擁壁": r = r + 1
    WriteItemSimple ws, r, "item4", "外部① 敷地及び地盤: 水抜きパイプ": r = r + 1
    WriteItemSimple ws, r, "item5", "外部① 敷地及び地盤: 駐車場": r = r + 1
    WriteItemSimple ws, r, "item6", "外部① 敷地及び地盤: 駐輪場": r = r + 1
    WriteItemSimple ws, r, "item7", "外部① 敷地及び地盤: 建物の周囲": r = r + 1
    WriteItemSimple ws, r, "item8", "外部② 各点検口内: 床下点検口": r = r + 1
    WriteItemSimple ws, r, "item9", "外部② 各点検口内: スコープ調査": r = r + 1
    WriteItemSimple ws, r, "item10", "外部② 各点検口内: コンクリート劣化": r = r + 1
    WriteItemSimple ws, r, "item11", "外部② 各点検口内: さび汁・白華": r = r + 1
    WriteItemSimple ws, r, "item12", "外部② 各点検口内: 鉄筋露出": r = r + 1
    WriteItemSimple ws, r, "item13", "外部② 各点検口内: 設備配管貫通部": r = r + 1
    WriteItemSimple ws, r, "item14", "外部② 各点検口内: 基礎底盤水染み": r = r + 1
    WriteItemSimple ws, r, "item15", "外部② 各点検口内: 土台・床組": r = r + 1
    WriteItemSimple ws, r, "item16", "外部② 各点検口内: 木部腐朽": r = r + 1
    WriteItemSimple ws, r, "item17", "外部② 各点検口内: 基礎天端隙間": r = r + 1
    WriteItemSimple ws, r, "item18", "外部② 各点検口内: 床組染み跡": r = r + 1
    WriteItemSimple ws, r, "item19", "外部② 各点検口内: 水漏れ・変形": r = r + 1
    WriteItemSimple ws, r, "item20", "外部② 各点検口内: 蟻害": r = r + 1
    WriteItemSimple ws, r, "item21", "外部② 各点検口内: 配管配線接続部": r = r + 1
    WriteItemSimple ws, r, "item22", "外部② 各点検口内: 天井下地材": r = r + 1
    WriteItemSimple ws, r, "item23", "外部② 各点検口内: 小屋組劣化": r = r + 1
    WriteItemSimple ws, r, "item24", "外部② 各点検口内: 横架材欠込み": r = r + 1
    WriteItemSimple ws, r, "item25", "外部② 各点検口内: 雨漏り跡・腐朽": r = r + 1
    WriteItemSimple ws, r, "item26", "外部② 各点検口内: 配管配線接続": r = r + 1
    WriteItemSimple ws, r, "item27", "外部② 各点検口内: ダクト接続": r = r + 1
    WriteItemSimple ws, r, "item28", "外部② 各点検口内: 耐火被覆": r = r + 1
    WriteItemSimple ws, r, "item29", "外部② 各点検口内: 鉄骨部サビ": r = r + 1
    WriteItemSimple ws, r, "item30", "外部③ 建築物外部: コンクリート直仕上げ": r = r + 1
    WriteItemSimple ws, r, "item31", "外部③ 建築物外部: 欠損": r = r + 1
    WriteItemSimple ws, r, "item32", "外部③ 建築物外部: モルタル仕上げひび割れ": r = r + 1
    WriteItemSimple ws, r, "item33", "外部③ 建築物外部: モルタル欠損": r = r + 1
    WriteItemSimple ws, r, "item34", "外部③ 建築物外部: 仕上げ剥離": r = r + 1
    WriteItemSimple ws, r, "item35", "外部③ 建築物外部: その他仕上げ": r = r + 1
    WriteItemSimple ws, r, "item36", "外部③ 建築物外部: 鉄筋露出": r = r + 1
    WriteItemSimple ws, r, "item37", "外部③ 建築物外部: 基礎沈下": r = r + 1
    WriteItemSimple ws, r, "item38", "外部③ 建築物外部: 基礎天端高さ": r = r + 1
    WriteItemSimple ws, r, "item39", "外部③ 建築物外部: 設備配管隙間": r = r + 1
    WriteItemSimple ws, r, "item40", "外部③ 建築物外部: 外壁ひび割れ": r = r + 1
    WriteItemSimple ws, r, "item41", "外部③ 建築物外部: 外壁欠損": r = r + 1
    WriteItemSimple ws, r, "item42", "外部③ 建築物外部: コンクリート劣化": r = r + 1
    WriteItemSimple ws, r, "item43", "外部③ 建築物外部: さび汁・白華": r = r + 1
    WriteItemSimple ws, r, "item44", "外部③ 建築物外部: 鉄筋露出": r = r + 1
    WriteItemSimple ws, r, "item45", "外部③ 建築物外部: 下地材劣化": r = r + 1
    WriteItemSimple ws, r, "item46", "外部③ 建築物外部: タイル劣化": r = r + 1
    WriteItemSimple ws, r, "item47", "外部③ 建築物外部: 鉄筋露出(RC)": r = r + 1
    WriteItemSimple ws, r, "item48", "外部③ 建築物外部: 仕上材せり上がり": r = r + 1
    WriteItemSimple ws, r, "item49", "外部③ 建築物外部: 板状仕上材割れ": r = r + 1
    WriteItemSimple ws, r, "item50", "外部③ 建築物外部: 板状仕上材かけ": r = r + 1
    WriteItemSimple ws, r, "item51", "外部③ 建築物外部: 金属板状仕上材錆": r = r + 1
    WriteItemSimple ws, r, "item52", "外部③ 建築物外部: 鉄筋露出(鉄骨)": r = r + 1
    WriteItemSimple ws, r, "item53", "外部③ 建築物外部: シーリング": r = r + 1
    WriteItemSimple ws, r, "item54", "外部③ 建築物外部: 建具周囲隙間": r = r + 1
    WriteItemSimple ws, r, "item55", "外部③ 建築物外部: 軒裏水染み": r = r + 1
    WriteItemSimple ws, r, "item56", "外部③ 建築物外部: 雨樋破損": r = r + 1
    WriteItemSimple ws, r, "item57", "外部③ 建築物外部: 設備配管外壁貫通部": r = r + 1
    WriteItemSimple ws, r, "item58", "外部③ 建築物外部: 支持部材": r = r + 1
    WriteItemSimple ws, r, "item59", "外部③ 建築物外部: 仕上状況": r = r + 1
    WriteItemSimple ws, r, "item60", "外部③ 建築物外部: 天井シーリング": r = r + 1
    WriteItemSimple ws, r, "item61", "外部③ 建築物外部: 照明器具": r = r + 1
    WriteItemSimple ws, r, "item62", "外部③ 建築物外部: ぐらつき・錆": r = r + 1
    WriteItemSimple ws, r, "item63", "外部③ 建築物外部: 手摺壁ひび割れ": r = r + 1
    WriteItemSimple ws, r, "item64", "外部③ 建築物外部: 手摺壁シーリング": r = r + 1
    WriteItemSimple ws, r, "item65", "外部③ 建築物外部: 手摺笠木": r = r + 1
    WriteItemSimple ws, r, "item66", "外部③ 建築物外部: 仕上ひび割れ": r = r + 1
    WriteItemSimple ws, r, "item67", "外部③ 建築物外部: 防水層": r = r + 1
    WriteItemSimple ws, r, "item68", "外部③ 建築物外部: 排水勾配": r = r + 1
    WriteItemSimple ws, r, "item69", "外部③ 建築物外部: 排水溝よごれ": r = r + 1
    WriteItemSimple ws, r, "item70", "外部③ 建築物外部: 排水溝堆積物": r = r + 1
    WriteItemSimple ws, r, "item71", "外部③ 建築物外部: 床シーリング": r = r + 1
    WriteItemSimple ws, r, "item72", "外部③ 建築物外部: 屋外階段支柱床": r = r + 1
    WriteItemSimple ws, r, "item73", "外部③ 建築物外部: 階段裏側": r = r + 1
    WriteItemSimple ws, r, "item74", "外部③ 建築物外部: 接合部金物": r = r + 1
    WriteItemSimple ws, r, "item75", "外部④ 屋根及び屋上: 屋根劣化": r = r + 1
    WriteItemSimple ws, r, "item76", "外部④ 屋根及び屋上: 屋根ふき材": r = r + 1
    WriteItemSimple ws, r, "item77", "外部④ 屋根及び屋上: 緊結金物": r = r + 1
    WriteItemSimple ws, r, "item78", "外部④ 屋根及び屋上: 軒樋": r = r + 1
    WriteItemSimple ws, r, "item79", "外部④ 屋根及び屋上: アンテナ等": r = r + 1
    WriteItemSimple ws, r, "item80", "外部④ 屋根及び屋上: 軒裏水染み": r = r + 1
    WriteItemSimple ws, r, "item81", "外部④ 屋根及び屋上: 屋上面劣化": r = r + 1
    WriteItemSimple ws, r, "item82", "外部④ 屋根及び屋上: ひび割れ反り": r = r + 1
    WriteItemSimple ws, r, "item83", "外部④ 屋根及び屋上: 伸縮目地材": r = r + 1
    WriteItemSimple ws, r, "item84", "外部④ 屋根及び屋上: 防水層劣化": r = r + 1
    WriteItemSimple ws, r, "item85", "外部④ 屋根及び屋上: パラペット": r = r + 1
    WriteItemSimple ws, r, "item86", "外部④ 屋根及び屋上: 金属笠木": r = r + 1
    WriteItemSimple ws, r, "item87", "外部④ 屋根及び屋上: 手摺ぐらつき": r = r + 1
    WriteItemSimple ws, r, "item88", "外部④ 屋根及び屋上: 笠木結合部": r = r + 1
    WriteItemSimple ws, r, "item89", "外部④ 屋根及び屋上: 排水溝ドレーン": r = r + 1
    WriteItemSimple ws, r, "item90", "外部④ 屋根及び屋上: 水たまり": r = r + 1
    WriteItemSimple ws, r, "item91", "外部④ 屋根及び屋上: 架台支持部": r = r + 1
    WriteItemSimple ws, r, "item92", "外部⑤ 共用部（管理状況）: 内装・郵便受け": r = r + 1
    WriteItemSimple ws, r, "item93", "外部⑤ 共用部（管理状況）: 共用廊下・ごみ置場": r = r + 1
    WriteItemSimple ws, r, "item94", "外部⑤ 共用部（管理状況）: 駐輪場・駐車場": r = r + 1
    WriteItemSimple ws, r, "item95", "鉄筋・シュミットハンマー: 鉄筋確認": r = r + 1
    WriteItemSimple ws, r, "item96", "鉄筋・シュミットハンマー: シュミットハンマー": r = r + 1
    WriteItemSimple ws, r, "item97", "その他 違法性関係: 構造荷重計算不適合": r = r + 1
    WriteItemSimple ws, r, "item98", "その他 違法性関係: 地震倒壊懸念": r = r + 1
    WriteItemSimple ws, r, "item99", "その他 違法性関係: 用途不整合": r = r + 1
    WriteItemSimple ws, r, "item100", "その他 違法性関係: 形状不整合": r = r + 1
    WriteItemSimple ws, r, "item101", "その他 違法性関係: 実測値不整合"

    ' ハイライト: 収集対象セルを黄色にする
    ' item1-91 (行3-93): B-H列全て黄色
    Dim i As Long
    For i = 3 To 93
        ws.Range(ws.Cells(i, 2), ws.Cells(i, 8)).Interior.Color = RGB(255, 255, 200)
    Next i
    ' item92-94 (行94-96): B-F列のみ黄色（外部5: S/A/B/C + 目視のみ）
    For i = 94 To 96
        ws.Range(ws.Cells(i, 2), ws.Cells(i, 6)).Interior.Color = RGB(255, 255, 200)
    Next i
    ' item95-96 (行97-98): ハイライトなし（鉄筋/シュミット）
    ' item97-101 (行99-103): D列のみ黄色（遵法性: 懸念内容セル）
    For i = 99 To 103
        ws.Cells(i, 4).Interior.Color = RGB(255, 255, 200)
    Next i
End Sub
Private Sub WriteOptB(ws As Worksheet, r As Long, groupKey As String, groupName As String)
    ws.Cells(r, 11).Value = groupKey
    ws.Cells(r, 12).Value = groupName
    ' M列: 有セル, N列: 無セル → 収集対象（黄色）
    ws.Cells(r, 13).Interior.Color = RGB(255, 255, 200)
    ws.Cells(r, 14).Interior.Color = RGB(255, 255, 200)
End Sub

'' ----- テーブルB: グループ存在 -----
'' J列:groupKey, K列:グループ名, L列:有セル, M列:無セル
Private Sub SetupTableB(ws As Worksheet)
    ws.Range("K1").Value = "【テーブルB】グループ存在"
    ws.Range("K1").Font.Bold = True
    ws.Range("K1").Interior.Color = RGB(155, 187, 89)
    ws.Range("K1").Font.Color = RGB(255, 255, 255)

    ws.Range("K2").Value = "groupKey"
    ws.Range("L2").Value = "グループ名"
    ws.Range("M2").Value = "有セル"
    ws.Range("N2").Value = "無セル"
    ws.Range("K2:N2").Font.Bold = True
    ws.Range("K2:N2").Interior.Color = RGB(216, 228, 188)

    Dim r As Long
    r = 3
    WriteOptB ws, r, "group_youheki", "擁壁": r = r + 1
    WriteOptB ws, r, "group_parking", "駐車場": r = r + 1
    WriteOptB ws, r, "group_bicycle", "駐輪場": r = r + 1
    WriteOptB ws, r, "group_okugai_kaidan", "屋外階段"
End Sub

Private Sub WriteOptC(ws As Worksheet, r As Long, optKey As String, optLabel As String, desc As String)
    ws.Cells(r, 15).Value = optKey
    ws.Cells(r, 16).Value = optLabel
    ' Q列: セルアドレス → 収集対象（黄色）
    ws.Cells(r, 17).Interior.Color = RGB(255, 255, 200)
    ws.Cells(r, 18).Value = desc
End Sub

'' ----- テーブルC: オプション選択 -----
'' N列:optionKey, O列:選択肢名, P列:セルアドレス, Q列:説明
Private Sub SetupTableC(ws As Worksheet)
    ws.Range("O1").Value = "【テーブルC】オプション選択"
    ws.Range("O1").Font.Bold = True
    ws.Range("O1").Interior.Color = RGB(192, 80, 77)
    ws.Range("O1").Font.Color = RGB(255, 255, 255)

    ws.Range("O2").Value = "optionKey"
    ws.Range("P2").Value = "選択値名"
    ws.Range("Q2").Value = "セルアドレス"
    ws.Range("R2").Value = "説明"
    ws.Range("O2:R2").Font.Bold = True
    ws.Range("O2:R2").Interior.Color = RGB(230, 184, 183)

    ' 行ごとに直接書き込み（VBA行継続制限を回避）
    Dim r As Long
    r = 3
    ' --- 基礎形式 (item14) ---
    WriteOptC ws, r, "foundation_beta", "ベタ基礎", "基礎形式": r = r + 1
    WriteOptC ws, r, "foundation_nuno", "布基礎", "基礎形式": r = r + 1
    WriteOptC ws, r, "foundation_dokuritsu", "独立基礎", "基礎形式": r = r + 1
    WriteOptC ws, r, "foundation_kui", "杭基礎", "基礎形式": r = r + 1
    WriteOptC ws, r, "foundation_unknown", "不明", "基礎形式": r = r + 1
    WriteOptC ws, r, "foundation_other", "その他", "基礎形式": r = r + 1
    ' --- 換気方法 (item17) ---
    WriteOptC ws, r, "vent_port", "換気口", "換気方法": r = r + 1
    WriteOptC ws, r, "vent_packing", "基礎パッキン", "換気方法": r = r + 1
    WriteOptC ws, r, "vent_none", "無", "換気方法": r = r + 1
    ' --- 断熱工法 (item19) ---
    WriteOptC ws, r, "insulation_floor", "床断熱工法", "断熱工法": r = r + 1
    WriteOptC ws, r, "insulation_foundation", "基礎断熱工法", "断熱工法": r = r + 1
    WriteOptC ws, r, "insulation_none", "無", "断熱工法": r = r + 1
    WriteOptC ws, r, "insulation_unknown", "不明", "断熱工法": r = r + 1
    ' --- 小屋裏換気口 (item26) ---
    WriteOptC ws, r, "koyaura_vent_yes", "設置有", "小屋裏換気口": r = r + 1
    WriteOptC ws, r, "koyaura_vent_no", "設置無", "小屋裏換気口": r = r + 1
    WriteOptC ws, r, "koyaura_vent_unknown", "不明", "小屋裏換気口": r = r + 1
    ' --- 高さ (item38) ---
    WriteOptC ws, r, "height_lt30", "30cm＞", "基礎天端高さ": r = r + 1
    WriteOptC ws, r, "height_gte30", "30cm≦", "基礎天端高さ": r = r + 1
    WriteOptC ws, r, "height_gte40", "40cm≦", "基礎天端高さ": r = r + 1
    ' --- 外壁の種類 (item40) ---
    WriteOptC ws, r, "wall_type_fukitsuke", "吹付タイル", "外壁の種類": r = r + 1
    WriteOptC ws, r, "wall_type_mortar", "モルタル塗り", "外壁の種類": r = r + 1
    WriteOptC ws, r, "wall_type_siding", "サイディングボード", "外壁の種類": r = r + 1
    WriteOptC ws, r, "wall_type_other_board", "その他板状", "外壁の種類": r = r + 1
    WriteOptC ws, r, "wall_type_tile", "タイル貼り", "外壁の種類": r = r + 1
    ' --- 柱サイズ (item44) ---
    WriteOptC ws, r, "pillar_gt105", "105≧", "柱サイズ": r = r + 1
    WriteOptC ws, r, "pillar_gte105", "105＜", "柱サイズ": r = r + 1
    WriteOptC ws, r, "pillar_gte120", "120≦", "柱サイズ": r = r + 1
    ' --- 外壁通気 (item45) ---
    WriteOptC ws, r, "wall_air_none", "通気無", "外壁通気": r = r + 1
    WriteOptC ws, r, "wall_air_flow", "通気工法", "外壁通気": r = r + 1
    WriteOptC ws, r, "wall_air_wet", "湿式", "外壁通気": r = r + 1
    WriteOptC ws, r, "wall_air_dry", "乾式", "外壁通気": r = r + 1
    ' --- コンクリート面仕上材 (item47) ---
    WriteOptC ws, r, "concrete_bare", "コンクリート打放（増打無）", "コンクリート面仕上材": r = r + 1
    WriteOptC ws, r, "concrete_fukitsuke", "吹付タイル", "コンクリート面仕上材": r = r + 1
    WriteOptC ws, r, "concrete_mortar", "モルタル塗り（15mm以上）", "コンクリート面仕上材": r = r + 1
    WriteOptC ws, r, "concrete_tile", "タイル貼り", "コンクリート面仕上材": r = r + 1
    WriteOptC ws, r, "concrete_stone", "石貼り", "コンクリート面仕上材": r = r + 1
    ' --- 外壁の種類 鉄骨 (item51) ---
    WriteOptC ws, r, "steel_wall_pc", "PCパネル", "外壁の種類(鉄骨)": r = r + 1
    WriteOptC ws, r, "steel_wall_alc_fuki", "ALC板吹付仕上", "外壁の種類(鉄骨)": r = r + 1
    WriteOptC ws, r, "steel_wall_curtain", "カーテンウォール", "外壁の種類(鉄骨)": r = r + 1
    WriteOptC ws, r, "steel_wall_other_wet", "その他湿式工法", "外壁の種類(鉄骨)": r = r + 1
    WriteOptC ws, r, "steel_wall_dry", "乾式工法", "外壁の種類(鉄骨)": r = r + 1
    WriteOptC ws, r, "steel_wall_alc_tile", "ALC板タイル貼仕上", "外壁の種類(鉄骨)": r = r + 1
    ' --- 庇の出 (item54) ---
    WriteOptC ws, r, "eave_lt300", "300＞", "庇の出": r = r + 1
    WriteOptC ws, r, "eave_gte300", "300≦", "庇の出": r = r + 1
    WriteOptC ws, r, "eave_gte450", "450≦", "庇の出": r = r + 1
    WriteOptC ws, r, "eave_gte900", "900≦", "庇の出": r = r + 1
    ' --- 軒の出 (item56) ---
    WriteOptC ws, r, "cornice_lt300", "300＞", "軒の出": r = r + 1
    WriteOptC ws, r, "cornice_gte300", "300≦", "軒の出": r = r + 1
    WriteOptC ws, r, "cornice_gte450", "450≦", "軒の出": r = r + 1
    WriteOptC ws, r, "cornice_gte900", "900≦", "軒の出": r = r + 1
    ' --- 屋根仕様 (item75) ---
    WriteOptC ws, r, "roof_flat", "陸屋根", "屋根仕様": r = r + 1
    WriteOptC ws, r, "roof_metal", "金属板葺き", "屋根仕様": r = r + 1
    WriteOptC ws, r, "roof_tin", "トタン", "屋根仕様": r = r + 1
    WriteOptC ws, r, "roof_slate", "スレート瓦屋根", "屋根仕様": r = r + 1
    WriteOptC ws, r, "roof_tile", "桟瓦葺き", "屋根仕様": r = r + 1
    WriteOptC ws, r, "roof_other", "その他", "屋根仕様": r = r + 1
    ' --- 撮影棒確認 (item78) ---
    WriteOptC ws, r, "camera_rod_yes", "実施可", "撮影棒確認": r = r + 1
    WriteOptC ws, r, "camera_rod_no", "実施不可", "撮影棒確認": r = r + 1
    ' --- 防水工法 ---
    WriteOptC ws, r, "wp_asphalt", "アスファルト防水", "防水工法": r = r + 1
    WriteOptC ws, r, "wp_sheet", "シート防水", "防水工法": r = r + 1
    WriteOptC ws, r, "wp_coating", "塗膜防水", "防水工法": r = r + 1
    WriteOptC ws, r, "wp_frp", "FRP防水", "防水工法": r = r + 1
    WriteOptC ws, r, "wp_other", "その他", "防水工法": r = r + 1
    ' --- 確認方法 (item86) ---
    WriteOptC ws, r, "check_visual", "屋上にて目視確認", "確認方法": r = r + 1
    WriteOptC ws, r, "check_camera_rod", "撮影棒による画像確認", "確認方法": r = r + 1
    WriteOptC ws, r, "check_impossible", "実施不可", "確認方法": r = r + 1
    ' --- 仕上材の種類（過半部） ---
    WriteOptC ws, r, "finish_main_concrete", "コンクリート直仕上げ", "仕上材の種類": r = r + 1
    WriteOptC ws, r, "finish_main_mortar", "モルタル仕上げ・その他塗り仕上げ", "仕上材の種類": r = r + 1
    WriteOptC ws, r, "finish_main_other", "その他仕上げ", "仕上材の種類": r = r + 1
End Sub

'' ----- テーブルD: メンテナンス -----
'' R列:maintId, S列:要セル, T列:不要セル, U列:良好セル, V列:特に問題無セル, W列:説明
Private Sub SetupTableD(ws As Worksheet)
    ws.Range("S1").Value = "【テーブルD】メンテナンス状況"
    ws.Range("S1").Font.Bold = True
    ws.Range("S1").Interior.Color = RGB(128, 100, 162)
    ws.Range("S1").Font.Color = RGB(255, 255, 255)

    ws.Range("S2").Value = "maintId"
    ws.Range("T2").Value = "要セル"
    ws.Range("U2").Value = "不要セル"
    ws.Range("V2").Value = "良好セル"
    ws.Range("W2").Value = "特に問題無セル"
    ws.Range("X2").Value = "説明"
    ws.Range("S2:X2").Font.Bold = True
    ws.Range("S2:X2").Interior.Color = RGB(204, 192, 218)

    Dim maints As Variant
    maints = Array( _
        Array("cat1", "敷地及び地盤"), _
        Array("cat2", "各点検口内"), _
        Array("cat3", "建築物外部"), _
        Array("cat4", "屋根及び屋上"), _
        Array("cat5", "共用部内装") _
    )

    Dim r As Long
    r = 3
    Dim i As Long
    For i = LBound(maints) To UBound(maints)
        ws.Cells(r, 19).Value = maints(i)(0)  ' maintId
        ws.Cells(r, 24).Value = maints(i)(1)  ' 説明
        ' S,T,U,V列 は空欄 → 収集対象
        Dim c As Long
        For c = 20 To 23
            ws.Cells(r, c).Interior.Color = RGB(255, 255, 200)
        Next c
        r = r + 1
    Next i
End Sub

'' ----- テーブルE: カテゴリ調査状況 -----
'' X列:catId, Y列:実施セル, Z列:不可セル, AA列:カテゴリ名
Private Sub SetupTableE(ws As Worksheet)
    ws.Range("Y1").Value = "【テーブルE】カテゴリ調査状況"
    ws.Range("Y1").Font.Bold = True
    ws.Range("Y1").Interior.Color = RGB(75, 172, 198)
    ws.Range("Y1").Font.Color = RGB(255, 255, 255)

    ws.Range("Y2").Value = "catId/groupId"
    ws.Range("Z2").Value = "実施セル"
    ws.Range("AA2").Value = "不可セル"
    ws.Range("AB2").Value = "不可理由セル"
    ws.Range("Y2:AB2").Font.Bold = True
    ws.Range("Y2:AB2").Interior.Color = RGB(183, 222, 232)

    Dim cats As Variant
    cats = Array( _
        Array("group_yukashita", "床下点検口※1"), _
        Array("group_koyaura", "小屋裏・天井点検口※1"), _
        Array("group_kiso", "基礎"), _
        Array("group_gaiheki", "外壁"), _
        Array("group_kyoyobu", "共用部廊下等"), _
        Array("cat4", "屋根及び屋上"), _
        Array("cat5", "共用部(管理状況)") _
    )

    Dim r As Long
    r = 3
    Dim i As Long
    For i = LBound(cats) To UBound(cats)
        ws.Cells(r, 25).Value = cats(i)(0)  ' catId or groupId
        ' Z,AA,AB列 は空欄 → 収集対象（実施セル, 不可セル, 不可理由セル）
        ws.Cells(r, 26).Interior.Color = RGB(255, 255, 200)
        ws.Cells(r, 27).Interior.Color = RGB(255, 255, 200)
        ws.Cells(r, 28).Interior.Color = RGB(255, 255, 200)
        r = r + 1
    Next i
End Sub

'' ----- テーブルF: 項目単位の調査実施状況 -----
'' AC列:itemId, AD列:実施セル, AE列:不要セル, AF列:不可セル, AG列:不可理由セル, AH列:項目名
Private Sub SetupTableF(ws As Worksheet)
    ws.Range("AC1").Value = "【テーブルF】項目調査実施状況"
    ws.Range("AC1").Font.Bold = True
    ws.Range("AC1").Interior.Color = RGB(218, 150, 48)
    ws.Range("AC1").Font.Color = RGB(255, 255, 255)

    ws.Range("AC2").Value = "itemId"
    ws.Range("AD2").Value = "実施セル"
    ws.Range("AE2").Value = "不要セル"
    ws.Range("AF2").Value = "不可セル"
    ws.Range("AG2").Value = "不可理由セル"
    ws.Range("AH2").Value = "項目名"
    ws.Range("AC2:AH2").Font.Bold = True
    ws.Range("AC2:AH2").Interior.Color = RGB(237, 212, 157)

    Dim r As Long
    r = 3
    ' item95: 鉄筋確認
    ws.Cells(r, 29).Value = "item95"
    ws.Cells(r, 34).Value = "鉄筋確認"
    Dim c As Long
    For c = 30 To 33
        ws.Cells(r, c).Interior.Color = RGB(255, 255, 200)
    Next c
    r = r + 1
    ' item96: シュミットハンマー
    ws.Cells(r, 29).Value = "item96"
    ws.Cells(r, 34).Value = "シュミットハンマー"
    For c = 30 To 33
        ws.Cells(r, c).Interior.Color = RGB(255, 255, 200)
    Next c
End Sub

'' ----- テーブルG: 対法性 資料値・実測値 -----
'' AJ列:itemId, AK列:資料値セル, AL列:実測値セル, AM列:項目名
Private Sub SetupTableG(ws As Worksheet)
    ws.Range("AJ1").Value = "【テーブルG】資料値・実測値"
    ws.Range("AJ1").Font.Bold = True
    ws.Range("AJ1").Interior.Color = RGB(89, 89, 89)
    ws.Range("AJ1").Font.Color = RGB(255, 255, 255)

    ws.Range("AJ2").Value = "itemId"
    ws.Range("AK2").Value = "資料値セル"
    ws.Range("AL2").Value = "実測値セル"
    ws.Range("AM2").Value = "項目名"
    ws.Range("AJ2:AM2").Font.Bold = True
    ws.Range("AJ2:AM2").Interior.Color = RGB(191, 191, 191)

    Dim r As Long
    r = 3
    ' item101: 実測値不整合
    ws.Cells(r, 36).Value = "item101"
    ws.Cells(r, 39).Value = "実測値不整合"
    ws.Cells(r, 37).Interior.Color = RGB(255, 255, 200)
    ws.Cells(r, 38).Interior.Color = RGB(255, 255, 200)
    r = r + 1
    ' item95_pitch: 鉄筋ピッチ（実測値セルのみ）
    ws.Cells(r, 36).Value = "item95_pitch"
    ws.Cells(r, 39).Value = "鉄筋ピッチ(cm)"
    ws.Cells(r, 38).Interior.Color = RGB(255, 255, 200)
    r = r + 1
    ' item96: シュミットハンマー測定値1-9 + 算定結果
    Dim si As Long
    For si = 1 To 9
        ws.Cells(r, 36).Value = "item96_val" & si
        ws.Cells(r, 39).Value = "シュミット測定値" & si
        ws.Cells(r, 38).Interior.Color = RGB(255, 255, 200)
        r = r + 1
    Next si
    ws.Cells(r, 36).Value = "item96_result"
    ws.Cells(r, 39).Value = "シュミット算定結果"
    ws.Cells(r, 38).Interior.Color = RGB(255, 255, 200)
End Sub

'' ----- テーブルH: 物件基本情報 -----
'' AN列:fieldKey, AO列:フィールド名, AP列:セルアドレス, AQ列:説明
Private Sub SetupTableH(ws As Worksheet)
    ws.Range("AN1").Value = "【テーブルH】物件基本情報"
    ws.Range("AN1").Font.Bold = True
    ws.Range("AN1").Interior.Color = RGB(56, 118, 29)
    ws.Range("AN1").Font.Color = RGB(255, 255, 255)

    ws.Range("AN2").Value = "fieldKey"
    ws.Range("AO2").Value = "フィールド名"
    ws.Range("AP2").Value = "セルアドレス"
    ws.Range("AQ2").Value = "説明"
    ws.Range("AN2:AQ2").Font.Bold = True
    ws.Range("AN2:AQ2").Interior.Color = RGB(182, 215, 168)

    Dim r As Long
    r = 3
    ' prop_name: 物件名称
    ws.Cells(r, 40).Value = "prop_name"
    ws.Cells(r, 41).Value = "物件名称"
    ws.Cells(r, 43).Value = "現地調査シート"
    ws.Cells(r, 42).Interior.Color = RGB(255, 255, 200)
    r = r + 1
    ' prop_date_year: 調査日(年)
    ws.Cells(r, 40).Value = "prop_date_year"
    ws.Cells(r, 41).Value = "調査日(年)"
    ws.Cells(r, 43).Value = "現地調査シート"
    ws.Cells(r, 42).Interior.Color = RGB(255, 255, 200)
    r = r + 1
    ' prop_date_month: 調査日(月)
    ws.Cells(r, 40).Value = "prop_date_month"
    ws.Cells(r, 41).Value = "調査日(月)"
    ws.Cells(r, 43).Value = "現地調査シート"
    ws.Cells(r, 42).Interior.Color = RGB(255, 255, 200)
    r = r + 1
    ' prop_date_day: 調査日(日)
    ws.Cells(r, 40).Value = "prop_date_day"
    ws.Cells(r, 41).Value = "調査日(日)"
    ws.Cells(r, 43).Value = "現地調査シート"
    ws.Cells(r, 42).Interior.Color = RGB(255, 255, 200)
    r = r + 1
    ' prop_weather: 天候(晴セル)
    ws.Cells(r, 40).Value = "prop_weather"
    ws.Cells(r, 41).Value = "天候(晴セル)"
    ws.Cells(r, 43).Value = "晴セルを指定。曇/雨/雪はオフセット計算"
    ws.Cells(r, 42).Interior.Color = RGB(255, 255, 200)
    r = r + 1
    ' prop_time_start: 調査開始時間
    ws.Cells(r, 40).Value = "prop_time_start"
    ws.Cells(r, 41).Value = "調査開始時間"
    ws.Cells(r, 43).Value = "現地調査シート"
    ws.Cells(r, 42).Interior.Color = RGB(255, 255, 200)
    r = r + 1
    ' prop_time_end: 調査終了時間
    ws.Cells(r, 40).Value = "prop_time_end"
    ws.Cells(r, 41).Value = "調査終了時間"
    ws.Cells(r, 43).Value = "現地調査シート"
    ws.Cells(r, 42).Interior.Color = RGB(255, 255, 200)
End Sub

'' ----- テーブルI: 備考 -----
'' AR列:remarkKey, AS列:セルアドレス, AT列:説明
Private Sub SetupTableI(ws As Worksheet)
    ws.Range("AR1").Value = "【テーブルI】備考"
    ws.Range("AR1").Font.Bold = True
    ws.Range("AR1").Interior.Color = RGB(103, 78, 167)
    ws.Range("AR1").Font.Color = RGB(255, 255, 255)

    ws.Range("AR2").Value = "remarkKey"
    ws.Range("AS2").Value = "セルアドレス"
    ws.Range("AT2").Value = "説明"
    ws.Range("AR2:AT2").Font.Bold = True
    ws.Range("AR2:AT2").Interior.Color = RGB(194, 184, 219)

    Dim r As Long
    r = 3
    ws.Cells(r, 44).Value = "remarks_general"
    ws.Cells(r, 46).Value = "現地調査シート 備考テキスト"
    ws.Cells(r, 45).Interior.Color = RGB(255, 255, 200)
End Sub

'' ----- テーブルJ: 定型写真 -----
'' AU列:photoType, AV列:写真名, AW列:画像挿入先セル, AX列:備考
Private Sub SetupTableJ(ws As Worksheet)
    ws.Range("AU1").Value = "【テーブルJ】定型写真"
    ws.Range("AU1").Font.Bold = True
    ws.Range("AU1").Interior.Color = RGB(11, 83, 148)
    ws.Range("AU1").Font.Color = RGB(255, 255, 255)

    ws.Range("AU2").Value = "photoType"
    ws.Range("AV2").Value = "写真名"
    ws.Range("AW2").Value = "画像挿入先セル"
    ws.Range("AX2").Value = "備考"
    ws.Range("AU2:AX2").Font.Bold = True
    ws.Range("AU2:AX2").Interior.Color = RGB(164, 194, 244)

    Dim r As Long
    Dim photoNames As Variant
    photoNames = Array("", _
        "調査員自身撮影", "建物全景", "建物館銘板等", "敷地及び地盤", _
        "各点検口内(床下)", "各点検口内(小屋裏)", "基礎", "外壁", _
        "外壁(2)", "共用廊下等", "共用廊下等(2)", "屋外階段", _
        "屋根又は屋上", "郵便受等", "鉄筋の有無", "非破壊圧縮強度")

    Dim pt As Long
    For pt = 1 To 16
        r = pt + 2  ' 行3～18
        ws.Cells(r, 47).Value = pt
        ws.Cells(r, 48).Value = photoNames(pt)
        ws.Cells(r, 50).Value = "定形写真シート"
        ws.Cells(r, 49).Interior.Color = RGB(255, 255, 200)
    Next pt
End Sub

'' ----- テーブルK: 不具合テンプレート -----
'' AY列:templateKey, AZ列:シート名, BA列:場所セル(左1件目), BB列:部位セル(左1件目)
'' BC列:劣化状況セル(左1件目), BD列:評価セル(左1件目), BE列:補修方法セル(左1件目), BF列:画像セル(左1件目)
Private Sub SetupTableK(ws As Worksheet)
    ws.Range("AY1").Value = "【テーブルK】不具合テンプレート"
    ws.Range("AY1").Font.Bold = True
    ws.Range("AY1").Interior.Color = RGB(204, 0, 0)
    ws.Range("AY1").Font.Color = RGB(255, 255, 255)

    ws.Range("AY2").Value = "templateKey"
    ws.Range("AZ2").Value = "シート名"
    ws.Range("BA2").Value = "場所セル(左)"
    ws.Range("BB2").Value = "部位セル(左)"
    ws.Range("BC2").Value = "劣化状況セル(左)"
    ws.Range("BD2").Value = "評価セル(左)"
    ws.Range("BE2").Value = "補修方法セル(左)"
    ws.Range("BF2").Value = "画像セル(左)"
    ws.Range("BG2").Value = "カテゴリ名セル(左)"
    ws.Range("AY2:BG2").Font.Bold = True
    ws.Range("AY2:BG2").Interior.Color = RGB(244, 199, 195)

    Dim r As Long
    Dim c As Long
    ' tmpl_c: 評価c劣化事象
    r = 3
    ws.Cells(r, 51).Value = "tmpl_c"
    ws.Cells(r, 52).Value = "評価c劣化事象"
    For c = 53 To 59
        ws.Cells(r, c).Interior.Color = RGB(255, 255, 200)
    Next c

    ' tmpl_b2: 評価b2劣化事象（補修方法セル BE列=col57 は無し）
    r = 4
    ws.Cells(r, 51).Value = "tmpl_b2"
    ws.Cells(r, 52).Value = "評価b2劣化事象"
    For c = 53 To 59
        If c <> 57 Then ws.Cells(r, c).Interior.Color = RGB(255, 255, 200)
    Next c
End Sub

Private Sub SetupTableL(ws As Worksheet)
    ws.Range("BH1").Value = "【テーブルL】キープランテンプレート"
    ws.Range("BH1").Font.Bold = True
    ws.Range("BH1").Interior.Color = RGB(128, 0, 128)
    ws.Range("BH1").Font.Color = RGB(255, 255, 255)

    ws.Range("BH2").Value = "templateKey"
    ws.Range("BI2").Value = "シート名"
    ws.Range("BJ2").Value = "フロア名セル"
    ws.Range("BK2").Value = "図面画像セル"
    ws.Range("BL2").Value = "事象1_場所セル"
    ws.Range("BM2").Value = "事象1_部位セル"
    ws.Range("BN2").Value = "事象1_劣化状況セル"
    ws.Range("BO2").Value = "事象1_評価セル"
    ws.Range("BP2").Value = "事象1_補修方法セル"
    ws.Range("BQ2").Value = "事象1_画像セル"
    ws.Range("BR2").Value = "事象2_場所セル"
    ws.Range("BH2:BR2").Font.Bold = True
    ws.Range("BH2:BR2").Interior.Color = RGB(230, 210, 230)

    Dim r As Long
    Dim c As Long
    ' kp_c: 評価c写真キープラン
    r = 3
    ws.Cells(r, 60).Value = "kp_c"
    ws.Cells(r, 61).Value = "評価「ｃ」　写真キープラン"
    ' BJ-BR列を黄色（収集対象）
    For c = 62 To 70
        ws.Cells(r, c).Interior.Color = RGB(255, 255, 200)
    Next c

    ' kp_b2: 評価b2写真キープラン
    r = 4
    ws.Cells(r, 60).Value = "kp_b2"
    ws.Cells(r, 61).Value = "評価「ｂ２」　写真キープラン"
    ' BJ-BR列を黄色（収集対象）、BP列(補修方法)はb2対象外
    For c = 62 To 70
        If c <> 68 Then ws.Cells(r, c).Interior.Color = RGB(255, 255, 200)
    Next c
End Sub


'' =============================================
'' Step 2: セルアドレスの対話的収集
'' =============================================
Public Sub CollectCellAddresses()
    ' マッピングシートの存在チェック
    Dim mapWs As Worksheet
    On Error Resume Next
    Set mapWs = Worksheets(MAPPING_SHEET)
    On Error GoTo 0

    If mapWs Is Nothing Then
        MsgBox "先に CreateMappingSheet を実行してマッピングシートを作成してください。", vbCritical
        Exit Sub
    End If

    ' 収集対象（黄色セル）をリストアップ
    Set g_CollectItems = New Collection
    BuildCollectList mapWs

    If g_CollectItems.Count = 0 Then
        MsgBox "収集対象の空欄セルがありません。" & vbCrLf & _
               "マッピングシートは全て入力済みです。", vbInformation
        Exit Sub
    End If

    ' 説明
    MsgBox "空欄セルの収集を開始します。" & vbCrLf & vbCrLf & _
           "対象: " & g_CollectItems.Count & "件" & vbCrLf & vbCrLf & _
           "手順:" & vbCrLf & _
           "1. 「現地調査」シートに切り替え" & vbCrLf & _
           "2. ステータスバーの指示を読む" & vbCrLf & _
           "3. 該当セルをクリック" & vbCrLf & _
           "4. 確認ダイアログで「はい」" & vbCrLf & vbCrLf & _
           "中断: Alt+F8 → StopCollecting", _
           vbInformation, "セルアドレス収集"

    ' 現地調査シートに移動
    On Error Resume Next
    Worksheets("現地調査").Activate
    On Error GoTo 0

    g_CollectMode = True
    g_CollectIndex = 1
    ShowCurrentPrompt
End Sub

'' =============================================
'' 自動入力: グループの残りアイテムを間隔計算で埋める
'' CollectCellAddresses完了後に自動実行
'' =============================================
Public Sub AutoFillRemainingCells()
    Dim mapWs As Worksheet
    On Error Resume Next
    Set mapWs = Worksheets(MAPPING_SHEET)
    On Error GoTo 0
    
    If mapWs Is Nothing Then
        MsgBox "マッピングシートが存在しません。", vbCritical
        Exit Sub
    End If
    
    ' グループ定義
    Dim grpStarts(1 To 11) As Long
    Dim grpCounts(1 To 11) As Long
    grpStarts(1) = 3: grpCounts(1) = 7
    grpStarts(2) = 10: grpCounts(2) = 14
    grpStarts(3) = 24: grpCounts(3) = 8
    grpStarts(4) = 32: grpCounts(4) = 10
    grpStarts(5) = 42: grpCounts(5) = 18
    grpStarts(6) = 60: grpCounts(6) = 17
    grpStarts(7) = 77: grpCounts(7) = 17
    grpStarts(8) = 94: grpCounts(8) = 3
    grpStarts(9) = 97: grpCounts(9) = 1
    grpStarts(10) = 98: grpCounts(10) = 1
    grpStarts(11) = 99: grpCounts(11) = 5
    
    Dim filledCount As Long
    filledCount = 0
    
    Dim g As Long
    For g = 1 To 11
        Dim startRow As Long
        startRow = grpStarts(g)
        Dim cnt As Long
        cnt = grpCounts(g)
        
        If cnt < 2 Then GoTo NextGroup ' 1アイテムのグループはスキップ
        If g >= 9 Then GoTo NextGroup  ' 鉄筋/シュミット/遵法性はセル収集不要
        
        ' 先頭のaセルと2番目のaセルから間隔を算出
        Dim firstA As String
        firstA = CStr(mapWs.Cells(startRow, 2).Value)
        Dim secondA As String
        secondA = CStr(mapWs.Cells(startRow + 1, 2).Value)
        
        If firstA = "" Or secondA = "" Then GoTo NextGroup
        
        ' 行番号を抽出して間隔を計算
        Dim firstCol As String, firstRowNum As Long
        Dim secondCol As String, secondRowNum As Long
        ExtractColRow firstA, firstCol, firstRowNum
        ExtractColRow secondA, secondCol, secondRowNum
        
        If firstRowNum = 0 Or secondRowNum = 0 Then GoTo NextGroup
        
        Dim rowInterval As Long
        rowInterval = secondRowNum - firstRowNum
        
        If rowInterval <= 0 Then GoTo NextGroup
        
        ' グループごとの有効列で自動計算
        Dim maxCol As Long
        If g <= 7 Then maxCol = 9 Else maxCol = 6  ' 外部1-4:B-I, 外部5:B-F
        Dim cc As Long
        For cc = 2 To maxCol
            Dim baseAddr As String
            baseAddr = CStr(mapWs.Cells(startRow, cc).Value)
            If baseAddr = "" Then GoTo NextCol
            
            Dim baseCol As String, baseRowNum2 As Long
            ExtractColRow baseAddr, baseCol, baseRowNum2
            If baseRowNum2 = 0 Then GoTo NextCol
            
            ' 2番目以降のアイテムを自動入力
            Dim i As Long
            For i = 1 To cnt - 1
                Dim targetRow As Long
                targetRow = startRow + i
                
                ' 既に値がある場合はスキップ
                If mapWs.Cells(targetRow, cc).Value = "" Then
                    Dim newAddr As String
                    newAddr = baseCol & CStr(baseRowNum2 + rowInterval * i)
                    mapWs.Cells(targetRow, cc).Value = newAddr
                    mapWs.Cells(targetRow, cc).Interior.Color = RGB(198, 239, 206) ' 緑 = 自動入力済み
                    filledCount = filledCount + 1
                End If
            Next i
NextCol:
        Next cc
NextGroup:
    Next g
    
    MsgBox "自動入力が完了しました！" & vbCrLf & vbCrLf & _
           "自動入力: " & filledCount & "セル" & vbCrLf & vbCrLf & _
           "ValidateMappingSheet で確認してください。", _
           vbInformation, "完了"
End Sub

'' セルアドレスから列文字と行番号を分離
Private Sub ExtractColRow(addr As String, ByRef colPart As String, ByRef rowPart As Long)
    Dim i As Long
    colPart = ""
    rowPart = 0
    For i = 1 To Len(addr)
        If IsNumeric(Mid(addr, i, 1)) Then
            colPart = Left(addr, i - 1)
            rowPart = CLng(Mid(addr, i))
            Exit Sub
        End If
    Next i
End Sub

'' 黄色セル（空欄）をリストアップ
'' グループ先頭 + 2番目のaセルのみ手動収集、残りは自動計算
Private Sub BuildCollectList(mapWs As Worksheet)
    Dim r As Long, c As Long
    
    ' グループ定義: Array(先頭itemの行, アイテム数)
    ' 行番号はテーブルAの行（3始まり）
    Dim grpStarts(1 To 11) As Long
    Dim grpCounts(1 To 11) As Long
    ' グループ1: 外部1 敷地及び地盤 (item1-7)
    grpStarts(1) = 3: grpCounts(1) = 7
    ' グループ2: 外部2 床下点検口 (item8-21)
    grpStarts(2) = 10: grpCounts(2) = 14
    ' グループ3: 外部2 小屋裏 (item22-29)
    grpStarts(3) = 24: grpCounts(3) = 8
    ' グループ4: 外部3 基礎 (item30-39)
    grpStarts(4) = 32: grpCounts(4) = 10
    ' グループ5: 外部3 外壁 (item40-57)
    grpStarts(5) = 42: grpCounts(5) = 18
    ' グループ6: 外部3 共用部 (item58-74)
    grpStarts(6) = 60: grpCounts(6) = 17
    ' グループ7: 外部4 屋根及び屋上 (item75-91)
    grpStarts(7) = 77: grpCounts(7) = 17
    ' グループ8: 外部5 共用部 (item92-94)
    grpStarts(8) = 94: grpCounts(8) = 3
    ' グループ9: 鉄筋確認 (item95)
    grpStarts(9) = 97: grpCounts(9) = 1
    ' グループ10: シュミットハンマー (item96)
    grpStarts(10) = 98: grpCounts(10) = 1
    ' グループ11: 遵法性関係 (item97-101)
    grpStarts(11) = 99: grpCounts(11) = 5
    
    Dim colNames As Variant
    colNames = Array("", "aセル", "b1セル", "b2セル", "cセル", "目視セル", "計測セル", "触診セル")
    
    ' === テーブルA: グループ単位で収集 ===
    Dim g As Long
    For g = 1 To 11
        Dim startRow As Long
        startRow = grpStarts(g)
        Dim cnt As Long
        cnt = grpCounts(g)
        
        Dim grpItemId As String
        grpItemId = mapWs.Cells(startRow, 1).Value
        Dim grpItemName As String
        grpItemName = mapWs.Cells(startRow, 10).Value
        
        ' グループ9-10はセル収集不要（テーブルF/Gで管理）
        If g >= 9 And g <= 10 Then GoTo NextBuildGroup
        
        ' グループ11: 遵法性 item97-101（懸念内容セルのみ収集）
        If g = 11 Then
            Dim legalRow As Long
            Dim legalItemId As String
            Dim legalItemName As String
            Dim li As Long
            For li = 0 To 4
                legalRow = startRow + li
                legalItemId = mapWs.Cells(legalRow, 1).Value
                legalItemName = mapWs.Cells(legalRow, 10).Value
                If mapWs.Cells(legalRow, 4).Value = "" Then
                    g_CollectItems.Add Array(MAPPING_SHEET, legalRow, 4, _
                        "【遵法性/懸念内容セル】" & legalItemId & " " & legalItemName & " ※現地調査シートでクリック")
                End If
            Next li
            GoTo NextBuildGroup
        End If
        
        ' 先頭アイテムの評価セル（B-E）を収集
        Dim evalLabels As Variant
        If g <= 7 Then
            evalLabels = Array("", "aセル", "b1セル", "b2セル", "cセル")
        Else
            evalLabels = Array("", "Sセル", "Aセル", "Bセル", "Cセル")
        End If
        Dim cc As Long
        For cc = 2 To 5
            If mapWs.Cells(startRow, cc).Value = "" Then
                g_CollectItems.Add Array(MAPPING_SHEET, startRow, cc, _
                    "[先頭] 【" & evalLabels(cc - 1) & "】" & grpItemId & " " & grpItemName)
            End If
        Next cc
        
        ' 調査方法セル（グループにより異なる）
        If g <= 7 Then
            ' 外部1-4: 目視(F)/計測(G)/触診(H)
            Dim survCol As Long
            For survCol = 6 To 8
                If mapWs.Cells(startRow, survCol).Value = "" Then
                    g_CollectItems.Add Array(MAPPING_SHEET, startRow, survCol, _
                        "[先頭] 【" & colNames(survCol - 1) & "】" & grpItemId & " " & grpItemName)
                End If
            Next survCol
        ElseIf g = 8 Then
            ' 外部5: 目視(F)のみ
            If mapWs.Cells(startRow, 6).Value = "" Then
                g_CollectItems.Add Array(MAPPING_SHEET, startRow, 6, _
                    "[先頭] 【目視セル】" & grpItemId & " " & grpItemName)
            End If
        End If
        
        ' 2アイテム以上: 2番目の評価1セルを収集（間隔算出用）
        If cnt >= 2 Then
            If mapWs.Cells(startRow + 1, 2).Value = "" Then
                Dim item2Id As String
                item2Id = mapWs.Cells(startRow + 1, 1).Value
                Dim item2Name As String
                item2Name = mapWs.Cells(startRow + 1, 10).Value
                g_CollectItems.Add Array(MAPPING_SHEET, startRow + 1, 2, _
                    "[間隔用] 【評価1セル】" & item2Id & " " & item2Name)
            End If
        End If
NextBuildGroup:
    Next g
    
    ' === テーブルB: L列(有), M列(無) の空 ===
    r = 3
    Do While mapWs.Cells(r, 11).Value <> ""
        Dim grpName As String
        grpName = mapWs.Cells(r, 12).Value  ' L列 = グループ名
        If mapWs.Cells(r, 13).Value = "" Then  ' M列 = 有セル
            g_CollectItems.Add Array(MAPPING_SHEET, r, 13, _
                "【グループ有無/有】" & grpName)
        End If
        If mapWs.Cells(r, 14).Value = "" Then  ' N列 = 無セル
            g_CollectItems.Add Array(MAPPING_SHEET, r, 14, _
                "【グループ有無/無】" & grpName)
        End If
        r = r + 1
    Loop
    
    ' === テーブルC: P列(セルアドレス) の空 ===
    r = 3
    Do While mapWs.Cells(r, 15).Value <> ""
        If mapWs.Cells(r, 17).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 17, _
                "【オプション】" & mapWs.Cells(r, 18).Value & ": " & mapWs.Cells(r, 16).Value)
        End If
        r = r + 1
    Loop
    
    ' === テーブルD: S-V列 の空 ===
    r = 3
    Do While mapWs.Cells(r, 19).Value <> ""
        Dim maintName As String
        maintName = mapWs.Cells(r, 24).Value
        
        If mapWs.Cells(r, 20).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 20, _
                "【メンテナンス/要】" & maintName)
        End If
        If mapWs.Cells(r, 21).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 21, _
                "【メンテナンス/不要】" & maintName)
        End If
        If mapWs.Cells(r, 22).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 22, _
                "【メンテナンス/良好】" & maintName)
        End If
        If mapWs.Cells(r, 23).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 23, _
                "【メンテナンス/特に問題無】" & maintName)
        End If
        r = r + 1
    Loop
    
    ' === テーブルE: Z列(実施), AA列(不可), AB列(不可理由) の空（黄色セルのみ） ===
    r = 3
    Do While mapWs.Cells(r, 25).Value <> ""
        Dim catSurveyId As String
        catSurveyId = mapWs.Cells(r, 25).Value
        
        If mapWs.Cells(r, 26).Value = "" And mapWs.Cells(r, 26).Interior.Color = RGB(255, 255, 200) Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 26, _
                "【調査/実施】" & catSurveyId)
        End If
        If mapWs.Cells(r, 27).Value = "" And mapWs.Cells(r, 27).Interior.Color = RGB(255, 255, 200) Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 27, _
                "【調査/不可】" & catSurveyId)
        End If
        If mapWs.Cells(r, 28).Value = "" And mapWs.Cells(r, 28).Interior.Color = RGB(255, 255, 200) Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 28, _
                "【調査/不可理由】" & catSurveyId)
        End If
        r = r + 1
    Loop

    ' === テーブルF: AD-AG列 の空 ===
    r = 3
    Do While mapWs.Cells(r, 29).Value <> ""
        Dim itemSurvName As String
        itemSurvName = mapWs.Cells(r, 34).Value

        If mapWs.Cells(r, 30).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 30, _
                "【項目調査/実施】" & itemSurvName)
        End If
        If mapWs.Cells(r, 31).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 31, _
                "【項目調査/不要】" & itemSurvName)
        End If
        If mapWs.Cells(r, 32).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 32, _
                "【項目調査/不可】" & itemSurvName)
        End If
        If mapWs.Cells(r, 33).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 33, _
                "【項目調査/不可理由】" & itemSurvName)
        End If
        r = r + 1
    Loop

    ' === テーブルG: AK-AL列 の空（黄色セルのみ収集） ===
    r = 3
    Do While mapWs.Cells(r, 36).Value <> ""
        legalItemName = mapWs.Cells(r, 39).Value

        If mapWs.Cells(r, 37).Value = "" And mapWs.Cells(r, 37).Interior.Color = RGB(255, 255, 200) Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 37, _
                "【資料値】" & legalItemName)
        End If
        If mapWs.Cells(r, 38).Value = "" And mapWs.Cells(r, 38).Interior.Color = RGB(255, 255, 200) Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 38, _
                "【実測値】" & legalItemName)
        End If
        r = r + 1
    Loop

    ' === テーブルH: AP列(セルアドレス) の空 ===
    r = 3
    Do While mapWs.Cells(r, 40).Value <> ""
        If mapWs.Cells(r, 42).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 42, _
                "【物件情報】" & mapWs.Cells(r, 41).Value)
        End If
        r = r + 1
    Loop

    ' === テーブルI: AS列(セルアドレス) の空 ===
    r = 3
    Do While mapWs.Cells(r, 44).Value <> ""
        If mapWs.Cells(r, 45).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 45, _
                "【備考】" & mapWs.Cells(r, 46).Value)
        End If
        r = r + 1
    Loop

    ' === テーブルJ: AW列(画像挿入先セル) の空 ===
    ' ※定形写真シートでのセル収集
    r = 3
    Do While mapWs.Cells(r, 47).Value <> ""
        If mapWs.Cells(r, 49).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 49, _
                "【定型写真】" & mapWs.Cells(r, 48).Value & " ※定形写真シートでクリック")
        End If
        r = r + 1
    Loop

    ' === テーブルK: BA-BF列 の空 ===
    r = 3
    Do While mapWs.Cells(r, 51).Value <> ""
        Dim tmplName As String
        tmplName = mapWs.Cells(r, 52).Value
        Dim tmplLabels As Variant
        tmplLabels = Array("", "", "", "場所セル", "部位セル", "劣化状況セル", "評価セル", "補修方法セル", "画像セル", "カテゴリ名セル")
        Dim tc As Long
        For tc = 53 To 59
            ' tmpl_b2の補修方法セル(col57)は対象外
            If CStr(mapWs.Cells(r, 51).Value) = "tmpl_b2" And tc = 57 Then GoTo NextTC
            If mapWs.Cells(r, tc).Value = "" Then
                g_CollectItems.Add Array(MAPPING_SHEET, r, tc, _
                    "【不具合テンプレート/" & tmplLabels(tc - 50) & "】" & tmplName & " ※該当シートでクリック")
            End If
        NextTC:
        Next tc
        r = r + 1
    Loop

End Sub

'' =============================================
'' キープラン専用マッピングシート
'' =============================================


'' キープラン専用マッピングシートを作成
Public Sub CreateKeyPlanMappingSheet()
    Application.ScreenUpdating = False
    
    ' 既存シートがあれば削除
    On Error Resume Next
    Dim oldWs As Worksheet
    Set oldWs = Worksheets(KP_MAPPING_SHEET)
    If Not oldWs Is Nothing Then
        Application.DisplayAlerts = False
        oldWs.Delete
        Application.DisplayAlerts = True
    End If
    On Error GoTo 0
    
    Dim ws As Worksheet
    Set ws = Worksheets.Add(After:=Worksheets(Worksheets.Count))
    ws.Name = KP_MAPPING_SHEET
    
    ' ヘッダー
    ws.Range("A1").Value = "【テーブルL】キープランテンプレート"
    ws.Range("A1").Font.Bold = True
    ws.Range("A1").Interior.Color = RGB(128, 0, 128)
    ws.Range("A1").Font.Color = RGB(255, 255, 255)
    
    ws.Range("A2").Value = "templateKey"
    ws.Range("B2").Value = "シート名"
    ws.Range("C2").Value = "フロア名セル"
    ws.Range("D2").Value = "図面画像セル"
    ws.Range("E2").Value = "事象1_カテゴリ名セル"
    ws.Range("F2").Value = "事象1_場所セル"
    ws.Range("G2").Value = "事象1_部位セル"
    ws.Range("H2").Value = "事象1_劣化状況セル"
    ws.Range("I2").Value = "事象1_評価セル"
    ws.Range("J2").Value = "事象1_補修方法セル"
    ws.Range("K2").Value = "事象1_画像セル"
    ws.Range("L2").Value = "事象2_カテゴリ名セル"
    ws.Range("A2:L2").Font.Bold = True
    ws.Range("A2:L2").Interior.Color = RGB(230, 210, 230)
    
    ' kp_c
    ws.Cells(3, 1).Value = "kp_c"
    ws.Cells(3, 2).Value = "評価「ｃ」　写真キープラン"
    Dim c As Long
    For c = 3 To 12
        ws.Cells(3, c).Interior.Color = RGB(255, 255, 200)
    Next c
    
    ' kp_b2
    ws.Cells(4, 1).Value = "kp_b2"
    ws.Cells(4, 2).Value = "評価「ｂ２」　写真キープラン"
    For c = 3 To 12
        If c <> 10 Then ws.Cells(4, c).Interior.Color = RGB(255, 255, 200)
    Next c
    
    ' 列幅調整
    ws.Columns("A:A").ColumnWidth = 10
    ws.Columns("B:B").ColumnWidth = 25
    ws.Columns("C:L").ColumnWidth = 18
    
    Application.ScreenUpdating = True
    MsgBox "キープランマッピングシートを作成しました！" & vbCrLf & vbCrLf & _
           "次に CollectKeyPlanAddresses を実行してセルアドレスを収集してください。", _
           vbInformation, "KPマッピングシート作成"
End Sub


'' キープランセルアドレスの収集
Public Sub CollectKeyPlanAddresses()
    Dim mapWs As Worksheet
    On Error Resume Next
    Set mapWs = Worksheets(KP_MAPPING_SHEET)
    On Error GoTo 0
    If mapWs Is Nothing Then
        MsgBox "先に CreateKeyPlanMappingSheet を実行してください。", vbCritical
        Exit Sub
    End If
    
    ' 収集対象をリストアップ
    Set g_CollectItems = New Collection
    
    Dim r As Long
    r = 3
    Do While mapWs.Cells(r, 1).Value <> ""
        Dim tmplName As String
        tmplName = mapWs.Cells(r, 2).Value
        Dim labels As Variant
        labels = Array("", "", "フロア名セル", "図面画像セル", "事象1_カテゴリ名セル", "事象1_場所セル", "事象1_部位セル", "事象1_劣化状況セル", "事象1_評価セル", "事象1_補修方法セル", "事象1_画像セル", "事象2_カテゴリ名セル")
        Dim kc As Long
        For kc = 3 To 12
            ' kp_b2の補修方法セル(col10)は対象外
            If CStr(mapWs.Cells(r, 1).Value) = "kp_b2" And kc = 10 Then GoTo NextKPCol2
            If mapWs.Cells(r, kc).Value = "" Then
                g_CollectItems.Add Array(KP_MAPPING_SHEET, r, kc, _
                    "【KP/" & labels(kc - 1) & "】" & tmplName & " ※該当シートでクリック")
            End If
NextKPCol2:
        Next kc
        r = r + 1
    Loop
    
    If g_CollectItems.Count = 0 Then
        MsgBox "収集対象のセルがありません。全て入力済みです。", vbInformation
        Exit Sub
    End If
    
    MsgBox "キープランセルの収集を開始します。" & vbCrLf & vbCrLf & _
           "対象: " & g_CollectItems.Count & "件" & vbCrLf & vbCrLf & _
           "手順:" & vbCrLf & _
           "1. キープランテンプレートシートに切り替え" & vbCrLf & _
           "2. ステータスバーの指示を読む" & vbCrLf & _
           "3. 該当セルをクリック" & vbCrLf & _
           "4. 確認ダイアログで「はい」", _
           vbInformation, "KPセルアドレス収集"
    
    g_CollectMode = True
    g_CollectIndex = 1
    ShowCurrentPrompt
End Sub

'' KPマッピングシートをテキストファイルにエクスポート
Public Sub ExportKeyPlanMappingSheet()
    Dim mapWs As Worksheet
    On Error Resume Next
    Set mapWs = Worksheets(KP_MAPPING_SHEET)
    On Error GoTo 0
    If mapWs Is Nothing Then
        MsgBox "KPマッピングシートが見つかりません。", vbCritical
        Exit Sub
    End If
    
    Dim filePath As String
    filePath = ThisWorkbook.Path & "/kp_mapping_export.txt"
    
    Dim fn As Integer
    fn = FreeFile
    Open filePath For Output As #fn
    
    ' ヘッダー行
    Dim r As Long
    Dim c As Long
    Dim line As String
    For r = 1 To 4
        line = ""
        For c = 1 To 12
            If c > 1 Then line = line & vbTab
            line = line & CStr(mapWs.Cells(r, c).Value)
        Next c
        Print #fn, line
    Next r
    
    Close #fn
    MsgBox "エクスポート完了: " & filePath, vbInformation
End Sub



'' =============================================
'' セル選択時のハンドラ（ThisWorkbookから呼ぶ）
'' =============================================
Public Sub OnCellSelected(ByVal Target As Range)
    If Not g_CollectMode Then Exit Sub
    If g_CollectIndex > g_CollectItems.Count Then Exit Sub

    ' 選択セルアドレス（Mac互換: MergeAreaエラー回避）
    Dim cellAddr As String
    On Error Resume Next
    cellAddr = Target.MergeArea.Cells(1, 1).Address(False, False)
    If Err.Number <> 0 Then
        Err.Clear
        cellAddr = Target.Cells(1, 1).Address(False, False)
    End If
    On Error GoTo 0

    ' 現在の項目情報
    Dim item As Variant
    item = g_CollectItems(g_CollectIndex)
    Dim desc As String
    desc = item(3)

    ' 確認（4択: InputBox）
    Dim prompt As String
    prompt = desc & vbCrLf & vbCrLf & _
             "選択: " & cellAddr & vbCrLf & _
             "値: " & CStr(Target.Cells(1, 1).Value) & vbCrLf & vbCrLf & _
             "1 = 記録" & vbCrLf & _
             "2 = やり直し" & vbCrLf & _
             "3 = スキップ" & vbCrLf & _
             "4 = チェック（要確認マーク）"

    Dim answer As String
    answer = InputBox(prompt, _
                      "確認 (" & g_CollectIndex & "/" & g_CollectItems.Count & ")", "1")

    ' マッピングシート参照
    Dim mapWs As Worksheet
    Set mapWs = Worksheets(item(0))

    Select Case Trim(answer)
        Case "1"
            ' 記録
            mapWs.Cells(item(1), item(2)).Value = cellAddr
            mapWs.Cells(item(1), item(2)).Interior.Color = RGB(198, 239, 206) ' 緑 = 入力済み
            g_CollectIndex = g_CollectIndex + 1

        Case "4"
            ' チェック（要確認マーク）= 記録するがセルを赤くする
            mapWs.Cells(item(1), item(2)).Value = cellAddr
            mapWs.Cells(item(1), item(2)).Interior.Color = RGB(255, 100, 100) ' 赤 = 要確認
            mapWs.Cells(item(1), item(2)).Font.Color = RGB(255, 255, 255) ' 白文字
            g_CollectIndex = g_CollectIndex + 1

        Case "3"
            ' スキップ
            g_CollectIndex = g_CollectIndex + 1

        Case "2"
            ' やり直し
            ShowCurrentPrompt
            Exit Sub

        Case ""
            ' キャンセル（空文字 = InputBoxのキャンセルボタン）
            ShowCurrentPrompt
            Exit Sub

        Case Else
            ' 無効入力 → やり直し
            MsgBox "1～4の数字を入力してください。", vbExclamation
            ShowCurrentPrompt
            Exit Sub
    End Select

    ' 次へ
    If g_CollectIndex > g_CollectItems.Count Then
        g_CollectMode = False
    #If Not Mac Then
        Application.StatusBar = False
    #End If
        MsgBox "先頭アイテムの収集が完了しました！" & vbCrLf & _
               "残りのアイテムを自動入力します。", vbInformation, "完了"
        AutoFillRemainingCells
    Else
        ShowCurrentPrompt
    End If
End Sub

'' 現在の収集対象をMsgBoxで案内（Mac対応）
Private Sub ShowCurrentPrompt()
    If g_CollectIndex > g_CollectItems.Count Then
        #If Not Mac Then
            Application.StatusBar = False
        #End If
        Exit Sub
    End If

    Dim item As Variant
    item = g_CollectItems(g_CollectIndex)

    Dim msg As String
    msg = "[" & g_CollectIndex & "/" & g_CollectItems.Count & "] " & item(3)

    ' シート切替が必要な項目の案内
    Dim desc As String
    desc = item(3)
    If InStr(desc, "※定形写真シートでクリック") > 0 Then
        MsgBox "次の項目は「定形写真」シートでセルをクリックしてください。" & vbCrLf & vbCrLf & _
               msg, vbInformation, "シート切替案内"
        On Error Resume Next
        Worksheets("定形写真").Activate
        On Error GoTo 0
    ElseIf InStr(desc, "※該当シートでクリック") > 0 Then
        MsgBox "次の項目は該当する不具合シートでセルをクリックしてください。" & vbCrLf & vbCrLf & _
               msg, vbInformation, "シート切替案内"
    End If

    #If Mac Then
        ' Mac: MsgBoxで案内（ステータスバー非対応）
        MsgBox msg & vbCrLf & vbCrLf & _
               "該当するセルをクリックしてください。" & vbCrLf & _
               "（このダイアログを閉じてからクリック）", _
               vbInformation, "セル選択案内"
    #Else
        Application.StatusBar = msg & " → 該当セルをクリック"
    #End If
End Sub

'' 収集を中断
Public Sub StopCollecting()
    g_CollectMode = False
    #If Not Mac Then
        Application.StatusBar = False
    #End If
    MsgBox "収集を中断しました。再開するには CollectCellAddresses を再実行してください。" & vbCrLf & _
           "（入力済みの項目はスキップされます）", vbInformation
End Sub

'' =============================================
'' Step 3: マッピングの入力状況確認
'' =============================================
Public Sub ValidateMappingSheet()
    Dim mapWs As Worksheet
    On Error Resume Next
    Set mapWs = Worksheets(MAPPING_SHEET)
    On Error GoTo 0

    If mapWs Is Nothing Then
        MsgBox "マッピングシートが存在しません。", vbCritical
        Exit Sub
    End If

    Dim emptyCount As Long
    emptyCount = 0

    Dim details As String
    details = ""

    ' テーブルA（グループ別に有効列が異なる）
    Dim r As Long
    r = 3
    Do While mapWs.Cells(r, 1).Value <> ""
        ' 評価列(B-E)は全グループ共通
        Dim vc As Long
        For vc = 2 To 5
            If mapWs.Cells(r, vc).Value = "" Then emptyCount = emptyCount + 1
        Next vc
        ' 調査方法列はグループにより異なる
        If r <= 93 Then
            ' 外部1-4: 目視(F),計測(G),触診(H)
            If mapWs.Cells(r, 6).Value = "" Then emptyCount = emptyCount + 1
            If mapWs.Cells(r, 7).Value = "" Then emptyCount = emptyCount + 1
            If mapWs.Cells(r, 8).Value = "" Then emptyCount = emptyCount + 1
        ElseIf r <= 96 Then
            ' 外部5: 目視(F)のみ
            If mapWs.Cells(r, 6).Value = "" Then emptyCount = emptyCount + 1
        Else
            ' 鉄筋/シュミット/遵法性(行97-103): セル収集不要
        End If
        r = r + 1
    Loop
    details = details & "テーブルA(評価/調査方法): " & emptyCount & "件空欄" & vbCrLf

    Dim prevCount As Long
    prevCount = emptyCount

    ' テーブルB
    r = 3
    Do While mapWs.Cells(r, 11).Value <> ""
        If mapWs.Cells(r, 13).Value = "" Then emptyCount = emptyCount + 1  ' M列=有
        If mapWs.Cells(r, 14).Value = "" Then emptyCount = emptyCount + 1  ' N列=無
        r = r + 1
    Loop
    details = details & "テーブルB(グループ有無): " & (emptyCount - prevCount) & "件空欄" & vbCrLf
    prevCount = emptyCount

    ' テーブルC
    r = 3
    Do While mapWs.Cells(r, 15).Value <> ""
        If mapWs.Cells(r, 17).Value = "" Then emptyCount = emptyCount + 1
        r = r + 1
    Loop
    details = details & "テーブルC(オプション): " & (emptyCount - prevCount) & "件空欄" & vbCrLf
    prevCount = emptyCount

    ' テーブルD
    r = 3
    Do While mapWs.Cells(r, 19).Value <> ""
        Dim c As Long
        For c = 20 To 23
            If mapWs.Cells(r, c).Value = "" Then emptyCount = emptyCount + 1
        Next c
        r = r + 1
    Loop
    details = details & "テーブルD(メンテナンス): " & (emptyCount - prevCount) & "件空欄" & vbCrLf
    prevCount = emptyCount

    ' テーブルE
    r = 3
    Do While mapWs.Cells(r, 25).Value <> ""
        If mapWs.Cells(r, 26).Value = "" Then emptyCount = emptyCount + 1
        If mapWs.Cells(r, 27).Value = "" Then emptyCount = emptyCount + 1
        r = r + 1
    Loop
    details = details & "テーブルE(調査状況): " & (emptyCount - prevCount) & "件空欄" & vbCrLf
    prevCount = emptyCount

    ' テーブルF
    r = 3
    Do While mapWs.Cells(r, 29).Value <> ""
        Dim fc As Long
        For fc = 30 To 33
            If mapWs.Cells(r, fc).Value = "" Then emptyCount = emptyCount + 1
        Next fc
        r = r + 1
    Loop
    details = details & "テーブルF(項目調査状況): " & (emptyCount - prevCount) & "件空欄" & vbCrLf
    prevCount = emptyCount

    ' テーブルG
    r = 3
    Do While mapWs.Cells(r, 36).Value <> ""
        If mapWs.Cells(r, 37).Value = "" Then emptyCount = emptyCount + 1
        If mapWs.Cells(r, 38).Value = "" Then emptyCount = emptyCount + 1
        r = r + 1
    Loop
    details = details & "テーブルG(資料値・実測値): " & (emptyCount - prevCount) & "件空欄" & vbCrLf
    prevCount = emptyCount

    ' テーブルH
    r = 3
    Do While mapWs.Cells(r, 40).Value <> ""
        If mapWs.Cells(r, 42).Value = "" Then emptyCount = emptyCount + 1
        r = r + 1
    Loop
    details = details & "テーブルH(物件基本情報): " & (emptyCount - prevCount) & "件空欄" & vbCrLf
    prevCount = emptyCount

    ' テーブルI
    r = 3
    Do While mapWs.Cells(r, 44).Value <> ""
        If mapWs.Cells(r, 45).Value = "" Then emptyCount = emptyCount + 1
        r = r + 1
    Loop
    details = details & "テーブルI(備考): " & (emptyCount - prevCount) & "件空欄" & vbCrLf
    prevCount = emptyCount

    ' テーブルJ
    r = 3
    Do While mapWs.Cells(r, 47).Value <> ""
        If mapWs.Cells(r, 49).Value = "" Then emptyCount = emptyCount + 1
        r = r + 1
    Loop
    details = details & "テーブルJ(定型写真): " & (emptyCount - prevCount) & "件空欄" & vbCrLf
    prevCount = emptyCount

    ' テーブルK
    r = 3
    Do While mapWs.Cells(r, 51).Value <> ""
        Dim kc As Long
        For kc = 53 To 58
            If mapWs.Cells(r, kc).Value = "" Then emptyCount = emptyCount + 1
        Next kc
        r = r + 1
    Loop

    details = details & "テーブルK(不具合テンプレート): " & (emptyCount - prevCount) & "件空欄" & vbCrLf

    If emptyCount = 0 Then
        MsgBox "マッピングシートは全て入力済みです！" & vbCrLf & _
               "DataImport.ImportJsonData を実行できます。", vbInformation, "検証OK"
    Else
        MsgBox "未入力セルが " & emptyCount & " 件あります。" & vbCrLf & vbCrLf & _
               details & vbCrLf & _
               "CollectCellAddresses で残りを入力してください。", _
               vbExclamation, "検証結果"
    End If
End Sub

Public Sub ExportMappingSheet()
    ' マッピングシートの内容をテキストファイルとして出力
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = Worksheets(MAPPING_SHEET)
    On Error GoTo 0

    If ws Is Nothing Then
        MsgBox "マッピングシートが見つかりません。", vbExclamation
        Exit Sub
    End If

    Dim output As String
    Dim lastRow As Long
    Dim lastCol As Long
    lastRow = ws.UsedRange.Rows.Count + ws.UsedRange.Row - 1
    lastCol = ws.UsedRange.Columns.Count + ws.UsedRange.Column - 1

    Dim r As Long, c As Long
    Dim cellVal As String
    Dim isCheck As Boolean

    For r = 1 To lastRow
        Dim line As String
        line = ""
        For c = 1 To lastCol
            If c > 1 Then line = line & vbTab

            cellVal = CStr(ws.Cells(r, c).Value)

            ' 赤背景（要確認）チェック: RGB(255,100,100) = 6579455
            isCheck = False
            On Error Resume Next
            If ws.Cells(r, c).Interior.Color = RGB(255, 100, 100) Then
                isCheck = True
            End If
            On Error GoTo 0

            If isCheck And Len(cellVal) > 0 Then
                line = line & "[CHECK]" & cellVal
            Else
                line = line & cellVal
            End If
        Next c
        output = output & line & vbCrLf
    Next r

    ' テキストファイルに保存
    Dim filePath As String
    filePath = ThisWorkbook.Path & "/mapping_export.txt"

    Dim fNum As Integer
    fNum = FreeFile
    Open filePath For Output As #fNum
    Print #fNum, output
    Close #fNum

    MsgBox "マッピングシートを出力しました！" & vbCrLf & vbCrLf & _
           filePath & vbCrLf & vbCrLf & _
           "このファイルの内容を貼り付けてください。", _
           vbInformation, "エクスポート完了"
End Sub
