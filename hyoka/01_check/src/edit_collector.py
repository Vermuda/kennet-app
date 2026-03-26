#!/usr/bin/env python3
"""
CellAddressCollector.bas を編集するスクリプト (v2)
CP932デコード後の実際の日本語文字列を使用
"""

INPUT_FILE = "CellAddressCollector.bas"
OUTPUT_FILE = "CellAddressCollector.bas"

with open(INPUT_FILE, "rb") as f:
    raw = f.read()

content = raw.decode("cp932")
content = content.replace("\r\n", "\n")
changes = 0

def replace_once(content, old, new, label):
    global changes
    if old in content:
        content = content.replace(old, new, 1)
        print(f"OK: {label}")
        changes += 1
    else:
        print(f"ERROR: {label}")
    return content

# ============================================================
# 1. WriteItemSimple: desc列を9→10, コメント更新
# ============================================================
content = replace_once(content,
    "    ' B～H列（a/b1/b2/c/目視/計測/触診）は全て空欄 → 収集対象\n    ws.Cells(r, 9).Value = desc",
    "    ' B～I列（a/b1/b2/c/目視/計測/触診/na）は全て空欄 → 収集対象\n    ws.Cells(r, 10).Value = desc",
    "WriteItemSimple desc col 9→10")

# ============================================================
# 2. Table A ヘッダー: I2に na列追加、desc→J2、Range拡張
# ============================================================
content = replace_once(content,
    '    ws.Range("H2").Value = "触診セル"\n    ws.Range("I2").Value = "項目名（参考）"\n    ws.Range("A2:I2").Font.Bold = True\n    ws.Range("A2:I2").Interior.Color = RGB(220, 230, 241)',
    '    ws.Range("H2").Value = "触診セル"\n    ws.Range("I2").Value = "na(対象無)セル"\n    ws.Range("J2").Value = "項目名（参考）"\n    ws.Range("A2:J2").Font.Bold = True\n    ws.Range("A2:J2").Interior.Color = RGB(220, 230, 241)',
    "Table A header (na at I, desc at J)")

# ============================================================
# 3. Table A ハイライト: item1-91 B-H → B-I
# ============================================================
content = replace_once(content,
    "    For i = 3 To 93\n        ws.Range(ws.Cells(i, 2), ws.Cells(i, 8)).Interior.Color = RGB(255, 255, 200)\n    Next i",
    "    For i = 3 To 93\n        ws.Range(ws.Cells(i, 2), ws.Cells(i, 9)).Interior.Color = RGB(255, 255, 200)\n    Next i",
    "Table A highlight item1-91 B-H→B-I")

# ============================================================
# 4. 列幅: I列追加
# ============================================================
content = replace_once(content,
    '    ws.Columns("F:F").ColumnWidth = 12',
    '    ws.Columns("F:F").ColumnWidth = 12\n    ws.Columns("I:I").ColumnWidth = 12',
    "Column width for I")

# ============================================================
# 5. WriteOptB: columns 10-13 → 11-14
# ============================================================
content = replace_once(content,
    "    ws.Cells(r, 10).Value = groupKey\n    ws.Cells(r, 11).Value = groupName\n    ' L列: 有セル, M列: 無セル → 収集対象（黄色）\n    ws.Cells(r, 12).Interior.Color = RGB(255, 255, 200)\n    ws.Cells(r, 13).Interior.Color = RGB(255, 255, 200)",
    "    ws.Cells(r, 11).Value = groupKey\n    ws.Cells(r, 12).Value = groupName\n    ' M列: 有セル, N列: 無セル → 収集対象（黄色）\n    ws.Cells(r, 13).Interior.Color = RGB(255, 255, 200)\n    ws.Cells(r, 14).Interior.Color = RGB(255, 255, 200)",
    "WriteOptB columns +1")

# ============================================================
# 6. SetupTableB header: J-M → K-N
# ============================================================
content = replace_once(content,
    '    ws.Range("J1").Value = "【テーブルB】グループ存在"\n    ws.Range("J1").Font.Bold = True\n    ws.Range("J1").Interior.Color = RGB(155, 187, 89)\n    ws.Range("J1").Font.Color = RGB(255, 255, 255)\n\n    ws.Range("J2").Value = "groupKey"\n    ws.Range("K2").Value = "グループ名"\n    ws.Range("L2").Value = "有セル"\n    ws.Range("M2").Value = "無セル"\n    ws.Range("J2:M2").Font.Bold = True\n    ws.Range("J2:M2").Interior.Color = RGB(216, 228, 188)',
    '    ws.Range("K1").Value = "【テーブルB】グループ存在"\n    ws.Range("K1").Font.Bold = True\n    ws.Range("K1").Interior.Color = RGB(155, 187, 89)\n    ws.Range("K1").Font.Color = RGB(255, 255, 255)\n\n    ws.Range("K2").Value = "groupKey"\n    ws.Range("L2").Value = "グループ名"\n    ws.Range("M2").Value = "有セル"\n    ws.Range("N2").Value = "無セル"\n    ws.Range("K2:N2").Font.Bold = True\n    ws.Range("K2:N2").Interior.Color = RGB(216, 228, 188)',
    "SetupTableB header J-M→K-N")

# ============================================================
# 7. WriteOptC: columns 14-17 → 15-18
# ============================================================
content = replace_once(content,
    "    ws.Cells(r, 14).Value = optKey\n    ws.Cells(r, 15).Value = optLabel",
    "    ws.Cells(r, 15).Value = optKey\n    ws.Cells(r, 16).Value = optLabel",
    "WriteOptC cols 14,15→15,16")

content = replace_once(content,
    "    ws.Cells(r, 16).Interior.Color = RGB(255, 255, 200)\n    ws.Cells(r, 17).Value = desc\nEnd Sub",
    "    ws.Cells(r, 17).Interior.Color = RGB(255, 255, 200)\n    ws.Cells(r, 18).Value = desc\nEnd Sub",
    "WriteOptC cols 16,17→17,18")

# ============================================================
# 8. SetupTableC header: N-Q → O-R
# ============================================================
content = replace_once(content,
    '    ws.Range("N1").Value = "【テーブルC】オプション選択"\n    ws.Range("N1").Font.Bold = True\n    ws.Range("N1").Interior.Color = RGB(192, 80, 77)\n    ws.Range("N1").Font.Color = RGB(255, 255, 255)',
    '    ws.Range("O1").Value = "【テーブルC】オプション選択"\n    ws.Range("O1").Font.Bold = True\n    ws.Range("O1").Interior.Color = RGB(192, 80, 77)\n    ws.Range("O1").Font.Color = RGB(255, 255, 255)',
    "SetupTableC header N1→O1")

# Find and update the Table C column headers N2-Q2
content = replace_once(content,
    '    ws.Range("N2").Value = "optionKey"',
    '    ws.Range("O2").Value = "optionKey"',
    "SetupTableC N2→O2")

# Now find all other Table C header lines after the optionKey one
# We need to find "O2", "P2", "Q2" and shift them
# Let's find the block - it's: O2=選択値名, P2=セルアドレス, Q2=説明, Range N2:Q2
content = replace_once(content,
    '    ws.Range("O2").Value = "選択値名"\n    ws.Range("P2").Value = "セルアドレス"\n    ws.Range("Q2").Value = "説明"\n    ws.Range("N2:Q2").Font.Bold = True\n    ws.Range("N2:Q2").Interior.Color = RGB(230, 184, 183)',
    '    ws.Range("P2").Value = "選択値名"\n    ws.Range("Q2").Value = "セルアドレス"\n    ws.Range("R2").Value = "説明"\n    ws.Range("O2:R2").Font.Bold = True\n    ws.Range("O2:R2").Interior.Color = RGB(230, 184, 183)',
    "SetupTableC O-Q→P-R columns")

# ============================================================
# 9. SetupTableD: R-W → S-X
# ============================================================
# First read actual content around line 420
lines = content.split('\n')
# Find SetupTableD header
for i, line in enumerate(lines):
    if 'テーブルD】メンテナンス' in line and 'Range' in line:
        print(f"  Found TableD header at line {i}: {line.strip()}")
        break

content = replace_once(content,
    '    ws.Range("R1").Value = "【テーブルD】メンテナンス状況"',
    '    ws.Range("S1").Value = "【テーブルD】メンテナンス状況"',
    "SetupTableD R1→S1")

content = replace_once(content,
    '    ws.Range("R1").Font.Bold = True\n    ws.Range("R1").Interior.Color = RGB(128, 100, 162)\n    ws.Range("R1").Font.Color = RGB(255, 255, 255)',
    '    ws.Range("S1").Font.Bold = True\n    ws.Range("S1").Interior.Color = RGB(128, 100, 162)\n    ws.Range("S1").Font.Color = RGB(255, 255, 255)',
    "SetupTableD R1 style→S1")

content = replace_once(content,
    '    ws.Range("R2").Value = "maintId"\n    ws.Range("S2").Value = "要セル"\n    ws.Range("T2").Value = "不要セル"\n    ws.Range("U2").Value = "良好セル"\n    ws.Range("V2").Value = "特に問題無セル"\n    ws.Range("W2").Value = "説明"\n    ws.Range("R2:W2").Font.Bold = True\n    ws.Range("R2:W2").Interior.Color = RGB(204, 192, 218)',
    '    ws.Range("S2").Value = "maintId"\n    ws.Range("T2").Value = "要セル"\n    ws.Range("U2").Value = "不要セル"\n    ws.Range("V2").Value = "良好セル"\n    ws.Range("W2").Value = "特に問題無セル"\n    ws.Range("X2").Value = "説明"\n    ws.Range("S2:X2").Font.Bold = True\n    ws.Range("S2:X2").Interior.Color = RGB(204, 192, 218)',
    "SetupTableD R2-W2→S2-X2")

content = replace_once(content,
    "        ws.Cells(r, 18).Value = maints(i)(0)  ' maintId\n        ws.Cells(r, 23).Value = maints(i)(1)  ' 説明",
    "        ws.Cells(r, 19).Value = maints(i)(0)  ' maintId\n        ws.Cells(r, 24).Value = maints(i)(1)  ' 説明",
    "SetupTableD data 18,23→19,24")

content = replace_once(content,
    "        For c = 19 To 22\n            ws.Cells(r, c).Interior.Color = RGB(255, 255, 200)\n        Next c\n        r = r + 1\n    Next i\nEnd Sub",
    "        For c = 20 To 23\n            ws.Cells(r, c).Interior.Color = RGB(255, 255, 200)\n        Next c\n        r = r + 1\n    Next i\nEnd Sub",
    "SetupTableD highlight 19-22→20-23")

# ============================================================
# 10. SetupTableE: X-AA → Y-AB
# ============================================================
content = replace_once(content,
    '    ws.Range("X1").Value = "【テーブルE】カテゴリ調査状況"',
    '    ws.Range("Y1").Value = "【テーブルE】カテゴリ調査状況"',
    "SetupTableE X1→Y1")

content = replace_once(content,
    '    ws.Range("X1").Font.Bold = True\n    ws.Range("X1").Interior.Color = RGB(75, 172, 198)\n    ws.Range("X1").Font.Color = RGB(255, 255, 255)',
    '    ws.Range("Y1").Font.Bold = True\n    ws.Range("Y1").Interior.Color = RGB(75, 172, 198)\n    ws.Range("Y1").Font.Color = RGB(255, 255, 255)',
    "SetupTableE X1 style→Y1")

content = replace_once(content,
    '    ws.Range("X2").Value = "catId"\n    ws.Range("Y2").Value = "実施セル"\n    ws.Range("Z2").Value = "不セル"\n    ws.Range("AA2").Value = "カテゴリ名"\n    ws.Range("X2:AA2").Font.Bold = True\n    ws.Range("X2:AA2").Interior.Color = RGB(183, 222, 232)',
    '    ws.Range("Y2").Value = "catId"\n    ws.Range("Z2").Value = "実施セル"\n    ws.Range("AA2").Value = "不セル"\n    ws.Range("AB2").Value = "カテゴリ名"\n    ws.Range("Y2:AB2").Font.Bold = True\n    ws.Range("Y2:AB2").Interior.Color = RGB(183, 222, 232)',
    "SetupTableE X2-AA2→Y2-AB2")

content = replace_once(content,
    "        ws.Cells(r, 24).Value = cats(i)(0)  ' catId\n        ws.Cells(r, 27).Value = cats(i)(1)  ' カテゴリ名",
    "        ws.Cells(r, 25).Value = cats(i)(0)  ' catId\n        ws.Cells(r, 28).Value = cats(i)(1)  ' カテゴリ名",
    "SetupTableE data 24,27→25,28")

content = replace_once(content,
    "        ws.Cells(r, 25).Interior.Color = RGB(255, 255, 200)\n        ws.Cells(r, 26).Interior.Color = RGB(255, 255, 200)\n        r = r + 1\n    Next i\nEnd Sub\n\n'' =============================================\n'' Step 2:",
    "        ws.Cells(r, 26).Interior.Color = RGB(255, 255, 200)\n        ws.Cells(r, 27).Interior.Color = RGB(255, 255, 200)\n        r = r + 1\n    Next i\nEnd Sub\n\n'' ----- テーブルF: 項目単位の調査実施状況 -----\n'' AC列:itemId, AD列:実施セル, AE列:不要セル, AF列:不可セル, AG列:不可理由セル, AH列:項目名\nPrivate Sub SetupTableF(ws As Worksheet)\n    ws.Range(\"AC1\").Value = \"【テーブルF】項目調査実施状況\"\n    ws.Range(\"AC1\").Font.Bold = True\n    ws.Range(\"AC1\").Interior.Color = RGB(218, 150, 48)\n    ws.Range(\"AC1\").Font.Color = RGB(255, 255, 255)\n\n    ws.Range(\"AC2\").Value = \"itemId\"\n    ws.Range(\"AD2\").Value = \"実施セル\"\n    ws.Range(\"AE2\").Value = \"不要セル\"\n    ws.Range(\"AF2\").Value = \"不可セル\"\n    ws.Range(\"AG2\").Value = \"不可理由セル\"\n    ws.Range(\"AH2\").Value = \"項目名\"\n    ws.Range(\"AC2:AH2\").Font.Bold = True\n    ws.Range(\"AC2:AH2\").Interior.Color = RGB(237, 212, 157)\n\n    Dim r As Long\n    r = 3\n    ' item95: 鉄筋確認\n    ws.Cells(r, 29).Value = \"item95\"\n    ws.Cells(r, 34).Value = \"鉄筋確認\"\n    Dim c As Long\n    For c = 30 To 33\n        ws.Cells(r, c).Interior.Color = RGB(255, 255, 200)\n    Next c\n    r = r + 1\n    ' item96: シュミットハンマー\n    ws.Cells(r, 29).Value = \"item96\"\n    ws.Cells(r, 34).Value = \"シュミットハンマー\"\n    For c = 30 To 33\n        ws.Cells(r, c).Interior.Color = RGB(255, 255, 200)\n    Next c\nEnd Sub\n\n'' ----- テーブルG: 資料値・実測値 -----\n'' AJ列:itemId, AK列:資料値セル, AL列:実測値セル, AM列:項目名\nPrivate Sub SetupTableG(ws As Worksheet)\n    ws.Range(\"AJ1\").Value = \"【テーブルG】資料値・実測値\"\n    ws.Range(\"AJ1\").Font.Bold = True\n    ws.Range(\"AJ1\").Interior.Color = RGB(89, 89, 89)\n    ws.Range(\"AJ1\").Font.Color = RGB(255, 255, 255)\n\n    ws.Range(\"AJ2\").Value = \"itemId\"\n    ws.Range(\"AK2\").Value = \"資料値セル\"\n    ws.Range(\"AL2\").Value = \"実測値セル\"\n    ws.Range(\"AM2\").Value = \"項目名\"\n    ws.Range(\"AJ2:AM2\").Font.Bold = True\n    ws.Range(\"AJ2:AM2\").Interior.Color = RGB(191, 191, 191)\n\n    Dim r As Long\n    r = 3\n    ' item101: 実測値不整合\n    ws.Cells(r, 36).Value = \"item101\"\n    ws.Cells(r, 39).Value = \"実測値不整合\"\n    ws.Cells(r, 37).Interior.Color = RGB(255, 255, 200)\n    ws.Cells(r, 38).Interior.Color = RGB(255, 255, 200)\nEnd Sub\n\n'' =============================================\n'' Step 2:",
    "SetupTableE end + insert TableF/G")

# ============================================================
# 11. CreateMappingSheet: Add SetupTableF/G calls, update comments
# ============================================================
content = replace_once(content,
    "    ' ===== テーブルE: カテゴリ調査状況 (Y:AB) =====\n    SetupTableE ws",
    "    ' ===== テーブルE: カテゴリ調査状況 (Y:AB) =====\n    SetupTableE ws\n\n    ' ===== テーブルF: 項目調査実施状況 (AC:AH) =====\n    SetupTableF ws\n\n    ' ===== テーブルG: 資料値・実測値 (AJ:AM) =====\n    SetupTableG ws",
    "CreateMappingSheet add TableF/G calls")

# Update range comments
content = content.replace(
    "' ===== テーブルB: グループ有無 (I:K) =====",
    "' ===== テーブルB: グループ有無 (K:N) ====="
)
content = content.replace(
    "' ===== テーブルB: グループ有無 (K:N) =====",
    "' ===== テーブルB: グループ有無 (K:N) =====",
    1  # just ensure no duplicate
)
content = content.replace(
    "' ===== テーブルC: オプション選択 (M:P) =====",
    "' ===== テーブルC: オプション選択 (O:R) ====="
)
content = content.replace(
    "' ===== テーブルD: メンテナンス (R:V) =====",
    "' ===== テーブルD: メンテナンス (S:X) ====="
)
# Table E comment already correct from previous edit
print("OK: CreateMappingSheet range comments updated")

# ============================================================
# 12. BuildCollectList: colNames に na追加
# ============================================================
content = replace_once(content,
    'colNames = Array("", "aセル", "b1セル", "b2セル", "cセル", "目視セル", "計測セル", "触診セル")',
    'colNames = Array("", "aセル", "b1セル", "b2セル", "cセル", "目視セル", "計測セル", "触診セル", "naセル")',
    "BuildCollectList colNames +na")

# desc column 9→10
content = replace_once(content,
    "        grpItemName = mapWs.Cells(startRow, 9).Value",
    "        grpItemName = mapWs.Cells(startRow, 10).Value",
    "BuildCollectList grpItemName 9→10")

content = replace_once(content,
    "                item2Name = mapWs.Cells(startRow + 1, 9).Value",
    "                item2Name = mapWs.Cells(startRow + 1, 10).Value",
    "BuildCollectList item2Name 9→10")

# Survey method columns: 6 To 8 → 6 To 9
content = replace_once(content,
    "            For survCol = 6 To 8",
    "            For survCol = 6 To 9",
    "BuildCollectList survCol 6-8→6-9")

# Table B in BuildCollectList: 10→11, 11→12, 12→13, 13→14
content = replace_once(content,
    "    ' === テーブルB: L列(有), M列(無) の空 ===\n    r = 3\n    Do While mapWs.Cells(r, 10).Value <> \"\"",
    "    ' === テーブルB: M列(有), N列(無) の空 ===\n    r = 3\n    Do While mapWs.Cells(r, 11).Value <> \"\"",
    "BuildCollectList TableB start col 10→11")

content = replace_once(content,
    "        grpName = mapWs.Cells(r, 11).Value  ' K列 = グループ名",
    "        grpName = mapWs.Cells(r, 12).Value  ' L列 = グループ名",
    "BuildCollectList TableB grpName 11→12")

content = replace_once(content,
    '        If mapWs.Cells(r, 12).Value = "" Then  \' L列 = 有セル\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 12, _\n                "【グループ有無/有】" & grpName)\n        End If\n        If mapWs.Cells(r, 13).Value = "" Then  \' M列 = 無セル\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 13, _\n                "【グループ有無/無】" & grpName)',
    '        If mapWs.Cells(r, 13).Value = "" Then  \' M列 = 有セル\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 13, _\n                "【グループ有無/有】" & grpName)\n        End If\n        If mapWs.Cells(r, 14).Value = "" Then  \' N列 = 無セル\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 14, _\n                "【グループ有無/無】" & grpName)',
    "BuildCollectList TableB cols 12,13→13,14")

# Table C in BuildCollectList: 14→15, 15→16, 16→17, 17→18
content = replace_once(content,
    "    ' === テーブルC: P列(セルアドレス) の空 ===\n    r = 3\n    Do While mapWs.Cells(r, 14).Value <> \"\"",
    "    ' === テーブルC: Q列(セルアドレス) の空 ===\n    r = 3\n    Do While mapWs.Cells(r, 15).Value <> \"\"",
    "BuildCollectList TableC start 14→15")

content = replace_once(content,
    '        If mapWs.Cells(r, 16).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 16, _\n                "【オプション】" & mapWs.Cells(r, 17).Value & ": " & mapWs.Cells(r, 15).Value)',
    '        If mapWs.Cells(r, 17).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 17, _\n                "【オプション】" & mapWs.Cells(r, 18).Value & ": " & mapWs.Cells(r, 16).Value)',
    "BuildCollectList TableC cols 15,16,17→16,17,18")

# Table D in BuildCollectList: 18→19, 19-22→20-23, 23→24
content = replace_once(content,
    "    ' === テーブルD: S-V列 の空 ===\n    r = 3\n    Do While mapWs.Cells(r, 18).Value <> \"\"",
    "    ' === テーブルD: T-W列 の空 ===\n    r = 3\n    Do While mapWs.Cells(r, 19).Value <> \"\"",
    "BuildCollectList TableD start 18→19")

content = replace_once(content,
    "        maintName = mapWs.Cells(r, 23).Value",
    "        maintName = mapWs.Cells(r, 24).Value",
    "BuildCollectList TableD maintName 23→24")

content = replace_once(content,
    '        If mapWs.Cells(r, 19).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 19, _\n                "【メンテナンス/要】" & maintName)',
    '        If mapWs.Cells(r, 20).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 20, _\n                "【メンテナンス/要】" & maintName)',
    "BuildCollectList TableD col 19→20 (要)")

content = replace_once(content,
    '        If mapWs.Cells(r, 20).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 20, _\n                "【メンテナンス/不要】" & maintName)',
    '        If mapWs.Cells(r, 21).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 21, _\n                "【メンテナンス/不要】" & maintName)',
    "BuildCollectList TableD col 20→21 (不要)")

content = replace_once(content,
    '        If mapWs.Cells(r, 21).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 21, _\n                "【メンテナンス/良好】" & maintName)',
    '        If mapWs.Cells(r, 22).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 22, _\n                "【メンテナンス/良好】" & maintName)',
    "BuildCollectList TableD col 21→22 (良好)")

content = replace_once(content,
    '        If mapWs.Cells(r, 22).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 22, _\n                "【メンテナンス/特に問題無】" & maintName)',
    '        If mapWs.Cells(r, 23).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 23, _\n                "【メンテナンス/特に問題無】" & maintName)',
    "BuildCollectList TableD col 22→23 (特に問題無)")

# Table E in BuildCollectList: 24→25, 25→26, 26→27, 27→28
content = replace_once(content,
    "    ' === テーブルE: Y列(実施), Z列(不実施) の空 ===\n    r = 3\n    Do While mapWs.Cells(r, 24).Value <> \"\"",
    "    ' === テーブルE: Z列(実施), AA列(不実施) の空 ===\n    r = 3\n    Do While mapWs.Cells(r, 25).Value <> \"\"",
    "BuildCollectList TableE start 24→25")

content = replace_once(content,
    "        catName = mapWs.Cells(r, 27).Value",
    "        catName = mapWs.Cells(r, 28).Value",
    "BuildCollectList TableE catName 27→28")

content = replace_once(content,
    '        If mapWs.Cells(r, 25).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 25, _\n                "【調査/実施】" & catName)\n        End If\n        If mapWs.Cells(r, 26).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 26, _\n                "【調査/不実施】" & catName)',
    '        If mapWs.Cells(r, 26).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 26, _\n                "【調査/実施】" & catName)\n        End If\n        If mapWs.Cells(r, 27).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 27, _\n                "【調査/不実施】" & catName)',
    "BuildCollectList TableE cols 25,26→26,27")

# Add Table F/G collection at end of BuildCollectList
content = replace_once(content,
    "        r = r + 1\n    Loop\nEnd Sub\n\n'' =============================================\n'' セル選択時のハンドラ",
    '''        r = r + 1
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

    ' === テーブルG: AK-AL列 の空 ===
    r = 3
    Do While mapWs.Cells(r, 36).Value <> ""
        Dim legalItemName As String
        legalItemName = mapWs.Cells(r, 39).Value

        If mapWs.Cells(r, 37).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 37, _
                "【資料値】" & legalItemName)
        End If
        If mapWs.Cells(r, 38).Value = "" Then
            g_CollectItems.Add Array(MAPPING_SHEET, r, 38, _
                "【実測値】" & legalItemName)
        End If
        r = r + 1
    Loop
End Sub

'' =============================================
'' セル選択時のハンドラ''',
    "BuildCollectList add TableF/G collection")

# ============================================================
# 13. ValidateMappingSheet: Update column refs and add F/G
# ============================================================
# Table A: add na check (column 9 for item1-91)
content = replace_once(content,
    "            If mapWs.Cells(r, 8).Value = \"\" Then emptyCount = emptyCount + 1\n        ElseIf r <= 96 Then",
    "            If mapWs.Cells(r, 8).Value = \"\" Then emptyCount = emptyCount + 1\n            If mapWs.Cells(r, 9).Value = \"\" Then emptyCount = emptyCount + 1\n        ElseIf r <= 96 Then",
    "ValidateMappingSheet TableA add na(I) check")

# Table B: 10→11, 12→13, 13→14
content = replace_once(content,
    "    ' テーブルB\n    r = 3\n    Do While mapWs.Cells(r, 10).Value <> \"\"",
    "    ' テーブルB\n    r = 3\n    Do While mapWs.Cells(r, 11).Value <> \"\"",
    "ValidateMappingSheet TableB 10→11")

content = replace_once(content,
    "        If mapWs.Cells(r, 12).Value = \"\" Then emptyCount = emptyCount + 1  ' L列=有\n        If mapWs.Cells(r, 13).Value = \"\" Then emptyCount = emptyCount + 1  ' M列=無",
    "        If mapWs.Cells(r, 13).Value = \"\" Then emptyCount = emptyCount + 1  ' M列=有\n        If mapWs.Cells(r, 14).Value = \"\" Then emptyCount = emptyCount + 1  ' N列=無",
    "ValidateMappingSheet TableB 12,13→13,14")

# Table C: 14→15, 16→17
content = replace_once(content,
    "    ' テーブルC\n    r = 3\n    Do While mapWs.Cells(r, 14).Value <> \"\"\n        If mapWs.Cells(r, 16).Value = \"\" Then emptyCount = emptyCount + 1",
    "    ' テーブルC\n    r = 3\n    Do While mapWs.Cells(r, 15).Value <> \"\"\n        If mapWs.Cells(r, 17).Value = \"\" Then emptyCount = emptyCount + 1",
    "ValidateMappingSheet TableC 14→15, 16→17")

# Table D: 18→19, 19-22→20-23
content = replace_once(content,
    "    ' テーブルD\n    r = 3\n    Do While mapWs.Cells(r, 18).Value <> \"\"\n        Dim c As Long\n        For c = 19 To 22",
    "    ' テーブルD\n    r = 3\n    Do While mapWs.Cells(r, 19).Value <> \"\"\n        Dim c As Long\n        For c = 20 To 23",
    "ValidateMappingSheet TableD 18→19, 19-22→20-23")

# Table E: 24→25, 25→26, 26→27
content = replace_once(content,
    "    ' テーブルE\n    r = 3\n    Do While mapWs.Cells(r, 24).Value <> \"\"\n        If mapWs.Cells(r, 25).Value = \"\" Then emptyCount = emptyCount + 1\n        If mapWs.Cells(r, 26).Value = \"\" Then emptyCount = emptyCount + 1",
    "    ' テーブルE\n    r = 3\n    Do While mapWs.Cells(r, 25).Value <> \"\"\n        If mapWs.Cells(r, 26).Value = \"\" Then emptyCount = emptyCount + 1\n        If mapWs.Cells(r, 27).Value = \"\" Then emptyCount = emptyCount + 1",
    "ValidateMappingSheet TableE 24→25, 25-26→26-27")

# Add Table F/G after Table E in validation
content = replace_once(content,
    '    details = details & "テーブルE(調査状況): " & (emptyCount - prevCount) & "件空欄" & vbCrLf\n\n    If emptyCount = 0 Then',
    '''    details = details & "テーブルE(調査状況): " & (emptyCount - prevCount) & "件空欄" & vbCrLf
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

    If emptyCount = 0 Then''',
    "ValidateMappingSheet add TableF/G validation")

# ============================================================
# 14. AutoFillRemainingCells: maxCol 8→9
# ============================================================
content = replace_once(content,
    "        If g <= 7 Then maxCol = 8 Else maxCol = 6  ' 外部1-4:B-H, 外部5:B-F",
    "        If g <= 7 Then maxCol = 9 Else maxCol = 6  ' 外部1-4:B-I, 外部5:B-F",
    "AutoFillRemainingCells maxCol 8→9")

# ============================================================
# Write output
# ============================================================
content = content.replace("\n", "\r\n")

with open(OUTPUT_FILE, "wb") as f:
    f.write(content.encode("cp932"))

print(f"\n=== Done! {changes} changes applied to CellAddressCollector.bas ===")
