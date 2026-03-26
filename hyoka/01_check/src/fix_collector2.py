#!/usr/bin/env python3
"""Final fixes for CellAddressCollector.bas"""

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
        print(f"SKIP: {label}")
    return content

# Fix 1: SetupTableC duplicate O2 line → shift to P2,Q2,R2
content = fix(content,
    '    ws.Range("O2").Value = "optionKey"\n    ws.Range("O2").Value = "選択肢名"\n    ws.Range("P2").Value = "セルアドレス"\n    ws.Range("Q2").Value = "説明"',
    '    ws.Range("O2").Value = "optionKey"\n    ws.Range("P2").Value = "選択値名"\n    ws.Range("Q2").Value = "セルアドレス"\n    ws.Range("R2").Value = "説明"',
    "SetupTableC fix duplicate O2 → O2,P2,Q2,R2")

# Fix 2: Table E collect - column 25 is catId, should check 26,27 not 25,26
content = fix(content,
    '        If mapWs.Cells(r, 25).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 25, _\n                "【該当/実施】" & catName)\n        End If\n        If mapWs.Cells(r, 26).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 26, _\n                "【該当/不該】" & catName)',
    '        If mapWs.Cells(r, 26).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 26, _\n                "【調査/実施】" & catName)\n        End If\n        If mapWs.Cells(r, 27).Value = "" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 27, _\n                "【調査/不実施】" & catName)',
    "Table E collect 25,26→26,27")

# Fix 3: Remove duplicate Table F/G collection (lines ~941-975)
# The first Table F/G block at L899-939 is correct. The duplicate at L941+ needs removal.
dup_start = '    ' + "' === テーブルF: AD-AG列 の空 ===\n    r = 3\n    Do While mapWs.Cells(r, 29).Value"
# Find the second occurrence
first_idx = content.index(dup_start)
second_idx = content.index(dup_start, first_idx + 1)
# Find where the duplicate block ends (before "End Sub" followed by next section)
end_marker = "End Sub\n\n'' =============================================\n'' セル選択時のハンドラ"
end_idx = content.index(end_marker, second_idx)
# Remove from second occurrence to end of its End Sub
content = content[:second_idx] + content[end_idx:]
print(f"FIX: Removed duplicate Table F/G collection block")
fixes += 1

# Fix 4: Validate section - check current state
# Let's read the validate section
lines = content.split('\n')
for i, line in enumerate(lines):
    if "' テーブルB" in line and i > 1050:
        # Check the Do While after it
        for j in range(i+1, min(i+5, len(lines))):
            l = lines[j].strip()
            if 'Do While' in l:
                print(f"  Validate TableB Do While at L{j}: {l}")
                if 'Cells(r, 10)' in l:
                    lines[j] = lines[j].replace('Cells(r, 10)', 'Cells(r, 11)')
                    fixes += 1
                    print(f"  FIX: 10→11")
                break
        break
content = '\n'.join(lines)
lines = content.split('\n')

# Check Validate TableB cells
for i, line in enumerate(lines):
    if "L列=有" in line or "' L列=有" in line or "' M列=有" in line:
        if i > 1050:
            print(f"  Validate TableB at L{i}: {line.strip()}")

# Find and fix Validate TableB 12,13 → 13,14
content = fix(content,
    "        If mapWs.Cells(r, 12).Value = \"\" Then emptyCount = emptyCount + 1  ' L列=有\n        If mapWs.Cells(r, 13).Value = \"\" Then emptyCount = emptyCount + 1  ' M列=無",
    "        If mapWs.Cells(r, 13).Value = \"\" Then emptyCount = emptyCount + 1  ' M列=有\n        If mapWs.Cells(r, 14).Value = \"\" Then emptyCount = emptyCount + 1  ' N列=無",
    "Validate TableB cells 12,13→13,14")

# Validate TableC 14→15, 16→17
content = fix(content,
    "    Do While mapWs.Cells(r, 14).Value <> \"\"\n        If mapWs.Cells(r, 16).Value = \"\" Then emptyCount = emptyCount + 1",
    "    Do While mapWs.Cells(r, 15).Value <> \"\"\n        If mapWs.Cells(r, 17).Value = \"\" Then emptyCount = emptyCount + 1",
    "Validate TableC 14→15, 16→17")

# Validate TableD 18→19, 19-22→20-23
content = fix(content,
    "    Do While mapWs.Cells(r, 18).Value <> \"\"\n        Dim c As Long\n        For c = 19 To 22",
    "    Do While mapWs.Cells(r, 19).Value <> \"\"\n        Dim c As Long\n        For c = 20 To 23",
    "Validate TableD 18→19, 19-22→20-23")

# Validate TableE 24→25, 25-26→26-27
content = fix(content,
    "    Do While mapWs.Cells(r, 24).Value <> \"\"\n        If mapWs.Cells(r, 25).Value = \"\" Then emptyCount = emptyCount + 1\n        If mapWs.Cells(r, 26).Value = \"\" Then emptyCount = emptyCount + 1",
    "    Do While mapWs.Cells(r, 25).Value <> \"\"\n        If mapWs.Cells(r, 26).Value = \"\" Then emptyCount = emptyCount + 1\n        If mapWs.Cells(r, 27).Value = \"\" Then emptyCount = emptyCount + 1",
    "Validate TableE 24→25, 25-26→26-27")

# Write
content = content.replace("\n", "\r\n")
with open(OUTPUT_FILE, "wb") as f:
    f.write(content.encode("cp932"))
print(f"\n=== Done! {fixes} fixes applied ===")
