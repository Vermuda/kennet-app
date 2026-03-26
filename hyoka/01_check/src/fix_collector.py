#!/usr/bin/env python3
"""Fix remaining issues in CellAddressCollector.bas after partial edits"""

INPUT_FILE = "CellAddressCollector.bas"
OUTPUT_FILE = "CellAddressCollector.bas"

with open(INPUT_FILE, "rb") as f:
    raw = f.read()
content = raw.decode("cp932")
content = content.replace("\r\n", "\n")
fixes = 0

def fix(content, old, new, label):
    global fixes
    if old in content:
        content = content.replace(old, new, 1)
        print(f"FIX: {label}")
        fixes += 1
    else:
        print(f"SKIP (already fixed or not found): {label}")
    return content

# Fix 1: Table A highlight (was already changed by v1 script, needs B-I not B-H)
# Already done, verify
if "ws.Cells(i, 9)).Interior" in content:
    print("OK: Table A highlight already at B-I")
else:
    content = fix(content,
        "ws.Cells(i, 8)).Interior.Color = RGB(255, 255, 200)",
        "ws.Cells(i, 9)).Interior.Color = RGB(255, 255, 200)",
        "Table A highlight B-I")

# Fix 2: WriteOptC - already changed by v1 to cols 15-18
if "ws.Cells(r, 15).Value = optKey" in content:
    print("OK: WriteOptC already shifted")

# Fix 3: SetupTableC - O2 has duplicate, need to fix
# Current state: O2=optionKey (from v2), then O2=選択肢名 (original P2)
content = fix(content,
    '    ws.Range("O2").Value = "optionKey"\n    ws.Range("O2").Value = "選択値名"\n    ws.Range("P2").Value = "セルアドレス"\n    ws.Range("Q2").Value = "説明"',
    '    ws.Range("O2").Value = "optionKey"\n    ws.Range("P2").Value = "選択値名"\n    ws.Range("Q2").Value = "セルアドレス"\n    ws.Range("R2").Value = "説明"',
    "SetupTableC fix O2 duplicate→P2,Q2,R2")

# Check if Range N2:Q2 or O2:R2
content = fix(content,
    '    ws.Range("N2:Q2").Font.Bold = True\n    ws.Range("N2:Q2").Interior.Color = RGB(230, 184, 183)',
    '    ws.Range("O2:R2").Font.Bold = True\n    ws.Range("O2:R2").Interior.Color = RGB(230, 184, 183)',
    "SetupTableC range N2:Q2→O2:R2")

# Fix 4: SetupTableD already shifted by v1 script (S1,S2-X2 correct)
if 'ws.Range("S1").Value = "【テーブルD】メンテナンス状況"' in content:
    print("OK: SetupTableD already at S")

# But data col 18→19 and 23→24 may have been done by v2
# Check: maintId should be at column 19
if "ws.Cells(r, 19).Value = maints(i)(0)" in content:
    print("OK: SetupTableD data already at 19,24")

# Fix 5: SetupTableE - X2 should be Y2
# Current: Y1=correct, but X2=catId (should be Y2)
content = fix(content,
    '    ws.Range("X2").Value = "catId"\n    ws.Range("Y2").Value = "実施セル"\n    ws.Range("Z2").Value = "不可セル"\n    ws.Range("AA2").Value = "カテゴリ名"\n    ws.Range("X2:AA2").Font.Bold = True\n    ws.Range("X2:AA2").Interior.Color = RGB(183, 222, 232)',
    '    ws.Range("Y2").Value = "catId"\n    ws.Range("Z2").Value = "実施セル"\n    ws.Range("AA2").Value = "不可セル"\n    ws.Range("AB2").Value = "カテゴリ名"\n    ws.Range("Y2:AB2").Font.Bold = True\n    ws.Range("Y2:AB2").Interior.Color = RGB(183, 222, 232)',
    "SetupTableE X2→Y2, Y→Z, Z→AA, AA→AB, range→Y2:AB2")

# Fix 6: SetupTableE data - catId at 25 correct, but highlight at 25,26 should be 26,27
content = fix(content,
    "        ' Y,Z列 は空欄 → 収集対象\n        ws.Cells(r, 25).Interior.Color = RGB(255, 255, 200)\n        ws.Cells(r, 26).Interior.Color = RGB(255, 255, 200)",
    "        ' Z,AA列 は空欄 → 収集対象\n        ws.Cells(r, 26).Interior.Color = RGB(255, 255, 200)\n        ws.Cells(r, 27).Interior.Color = RGB(255, 255, 200)",
    "SetupTableE highlight 25,26→26,27")

# Fix 7: SetupTableD comment
content = fix(content,
    "'' S,T,U,V列 は空欄 → 収集対象",
    "'' T,U,V,W列 は空欄 → 収集対象",
    "SetupTableD comment update")

# Fix 8: Now fix BuildCollectList - ALL these were already changed by v1 script
# Need to read and find actual current state
import re

# Find colNames line
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'colNames = Array' in line and 'aセル' in line:
        print(f"  colNames at L{i}: {line.strip()}")
        if 'naセル' not in line:
            # Need to add na
            lines[i] = line.replace('"触診セル")', '"触診セル", "naセル")')
            print(f"  FIX: added naセル")
            fixes += 1
        else:
            print(f"  OK: already has naセル")
        break
content = '\n'.join(lines)

# Fix 9: BuildCollectList grpItemName - check current column
for i, line in enumerate(lines):
    if 'grpItemName = mapWs.Cells(startRow,' in line:
        print(f"  grpItemName at L{i}: {line.strip()}")
        if ', 9)' in line:
            lines[i] = line.replace(', 9)', ', 10)')
            print(f"  FIX: 9→10")
            fixes += 1
        elif ', 10)' in line:
            print(f"  OK: already at 10")
        break
content = '\n'.join(lines)

for i, line in enumerate(lines):
    if 'item2Name = mapWs.Cells(startRow + 1,' in line:
        print(f"  item2Name at L{i}: {line.strip()}")
        if ', 9)' in line:
            lines[i] = line.replace(', 9)', ', 10)')
            print(f"  FIX: 9→10")
            fixes += 1
        elif ', 10)' in line:
            print(f"  OK: already at 10")
        break
content = '\n'.join(lines)

# Fix 10: survCol range
for i, line in enumerate(lines):
    if 'For survCol = 6 To' in line:
        print(f"  survCol at L{i}: {line.strip()}")
        if 'To 8' in line:
            lines[i] = line.replace('To 8', 'To 9')
            print(f"  FIX: 8→9")
            fixes += 1
        elif 'To 9' in line:
            print(f"  OK: already 9")
        break
content = '\n'.join(lines)

# Fix 11-20: BuildCollectList Table B/C/D/E columns
# These need careful line-by-line fixes based on current state
# Let me find the exact lines

# Find "テーブルB:" in BuildCollectList
for i, line in enumerate(lines):
    if 'テーブルB:' in line and 'の空' in line:
        print(f"\n  Table B collect at L{i}: {line.strip()}")
        # Next lines are r=3, Do While...
        j = i + 2  # Do While line
        if j < len(lines):
            wl = lines[j].strip()
            print(f"  Do While at L{j}: {wl}")
            if 'Cells(r, 10)' in wl:
                lines[j] = lines[j].replace('Cells(r, 10)', 'Cells(r, 11)')
                fixes += 1
                print(f"  FIX: 10→11")
            elif 'Cells(r, 11)' in wl:
                print(f"  OK: already 11")
        break

# grpName
for i, line in enumerate(lines):
    if 'grpName = mapWs.Cells(r, 11)' in line and 'グループ名' in line:
        lines[i] = line.replace('Cells(r, 11)', 'Cells(r, 12)')
        fixes += 1
        print(f"  FIX: grpName 11→12")
        break
    elif 'grpName = mapWs.Cells(r, 12)' in line and 'グループ名' in line:
        print(f"  OK: grpName already 12")
        break
content = '\n'.join(lines)

# 有セル/無セル in Table B collect
content = fix(content,
    '        If mapWs.Cells(r, 12).Value = "" Then  \' L列 = 有セル\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 12, _\n                "【グループ有無/有】" & grpName)\n        End If\n        If mapWs.Cells(r, 13).Value = "" Then  \' M列 = 無セル\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 13, _\n                "【グループ有無/無】" & grpName)',
    '        If mapWs.Cells(r, 13).Value = "" Then  \' M列 = 有セル\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 13, _\n                "【グループ有無/有】" & grpName)\n        End If\n        If mapWs.Cells(r, 14).Value = "" Then  \' N列 = 無セル\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 14, _\n                "【グループ有無/無】" & grpName)',
    "BuildCollectList TableB 12,13→13,14")

# Table C collect
content = fix(content,
    '    Do While mapWs.Cells(r, 14).Value <> ""',
    '    Do While mapWs.Cells(r, 15).Value <> ""',
    "BuildCollectList TableC Do While 14→15")

content = fix(content,
    '        If mapWs.Cells(r, 16).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 16, _\n                "【オプション】" & mapWs.Cells(r, 17).Value & ": " & mapWs.Cells(r, 15).Value)',
    '        If mapWs.Cells(r, 17).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 17, _\n                "【オプション】" & mapWs.Cells(r, 18).Value & ": " & mapWs.Cells(r, 16).Value)',
    "BuildCollectList TableC 16,17,15→17,18,16")

# Table D collect
content = fix(content,
    '    Do While mapWs.Cells(r, 18).Value <> ""',
    '    Do While mapWs.Cells(r, 19).Value <> ""',
    "BuildCollectList TableD Do While 18→19")

content = fix(content,
    '        maintName = mapWs.Cells(r, 23).Value',
    '        maintName = mapWs.Cells(r, 24).Value',
    "BuildCollectList TableD maintName 23→24")

content = fix(content,
    '        If mapWs.Cells(r, 19).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 19, _\n                "【メンテナンス/要】" & maintName)',
    '        If mapWs.Cells(r, 20).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 20, _\n                "【メンテナンス/要】" & maintName)',
    "BuildCollectList TableD 19→20 (要)")

content = fix(content,
    '        If mapWs.Cells(r, 20).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 20, _\n                "【メンテナンス/不要】" & maintName)',
    '        If mapWs.Cells(r, 21).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 21, _\n                "【メンテナンス/不要】" & maintName)',
    "BuildCollectList TableD 20→21 (不要)")

content = fix(content,
    '        If mapWs.Cells(r, 21).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 21, _\n                "【メンテナンス/良好】" & maintName)',
    '        If mapWs.Cells(r, 22).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 22, _\n                "【メンテナンス/良好】" & maintName)',
    "BuildCollectList TableD 21→22 (良好)")

content = fix(content,
    '        If mapWs.Cells(r, 22).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 22, _\n                "【メンテナンス/特に問題無】" & maintName)',
    '        If mapWs.Cells(r, 23).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 23, _\n                "【メンテナンス/特に問題無】" & maintName)',
    "BuildCollectList TableD 22→23 (特に問題無)")

# Table E collect
content = fix(content,
    '    Do While mapWs.Cells(r, 24).Value <> ""',
    '    Do While mapWs.Cells(r, 25).Value <> ""',
    "BuildCollectList TableE Do While 24→25")

content = fix(content,
    '        catName = mapWs.Cells(r, 27).Value',
    '        catName = mapWs.Cells(r, 28).Value',
    "BuildCollectList TableE catName 27→28")

content = fix(content,
    '        If mapWs.Cells(r, 25).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 25, _\n                "【調査/実施】" & catName)\n        End If\n        If mapWs.Cells(r, 26).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 26, _\n                "【調査/不実施】" & catName)',
    '        If mapWs.Cells(r, 26).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 26, _\n                "【調査/実施】" & catName)\n        End If\n        If mapWs.Cells(r, 27).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 27, _\n                "【調査/不実施】" & catName)',
    "BuildCollectList TableE 25,26→26,27")

# Fix ValidateMappingSheet Table B
content = fix(content,
    '    Do While mapWs.Cells(r, 10).Value <> ""\n        If mapWs.Cells(r, 12).Value = "" Then emptyCount = emptyCount + 1  \' L列=有\n        If mapWs.Cells(r, 13).Value = "" Then emptyCount = emptyCount + 1  \' M列=無',
    '    Do While mapWs.Cells(r, 11).Value <> ""\n        If mapWs.Cells(r, 13).Value = "" Then emptyCount = emptyCount + 1  \' M列=有\n        If mapWs.Cells(r, 14).Value = "" Then emptyCount = emptyCount + 1  \' N列=無',
    "ValidateMappingSheet TableB 10→11, 12,13→13,14")

# Table C validation
content = fix(content,
    '    Do While mapWs.Cells(r, 14).Value <> ""\n        If mapWs.Cells(r, 16).Value = "" Then emptyCount = emptyCount + 1',
    '    Do While mapWs.Cells(r, 15).Value <> ""\n        If mapWs.Cells(r, 17).Value = "" Then emptyCount = emptyCount + 1',
    "ValidateMappingSheet TableC 14→15, 16→17")

# Table D validation
content = fix(content,
    '    Do While mapWs.Cells(r, 18).Value <> ""\n        Dim c As Long\n        For c = 19 To 22',
    '    Do While mapWs.Cells(r, 19).Value <> ""\n        Dim c As Long\n        For c = 20 To 23',
    "ValidateMappingSheet TableD 18→19, 19-22→20-23")

# Table E validation
content = fix(content,
    '    Do While mapWs.Cells(r, 24).Value <> ""\n        If mapWs.Cells(r, 25).Value = "" Then emptyCount = emptyCount + 1\n        If mapWs.Cells(r, 26).Value = "" Then emptyCount = emptyCount + 1',
    '    Do While mapWs.Cells(r, 25).Value <> ""\n        If mapWs.Cells(r, 26).Value = "" Then emptyCount = emptyCount + 1\n        If mapWs.Cells(r, 27).Value = "" Then emptyCount = emptyCount + 1',
    "ValidateMappingSheet TableE 24→25, 25-26→26-27")

# Fix AutoFill maxCol - check current
if 'maxCol = 9' in content:
    print("OK: AutoFill maxCol already 9")
elif 'maxCol = 8' in content:
    content = fix(content,
        'maxCol = 8 Else maxCol = 6',
        'maxCol = 9 Else maxCol = 6',
        "AutoFill maxCol 8→9")

# Write
content = content.replace("\n", "\r\n")
with open(OUTPUT_FILE, "wb") as f:
    f.write(content.encode("cp932"))
print(f"\n=== Done! {fixes} fixes applied ===")
