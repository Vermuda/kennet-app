#!/usr/bin/env python3
"""
CellAddressCollector.bas からテーブルDのサブグループ行を削除するスクリプト
cat6_yukashita, cat6_koyaura, cat7_yane, cat7_okujou の4行を削除
CP932 + CRLF を維持
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
        print(f"ERROR: not found - {label}")
    return content


# maints配列からサブグループ4行を削除
# Before:
#     maints = Array( _
#         Array("cat1", "敷地及び地盤"), _
#         Array("cat2", "各点検口内"), _
#         Array("cat3", "建築物外部"), _
#         Array("cat4", "屋根及び屋上"), _
#         Array("cat5", "共用部内装"), _
#         Array("cat6_yukashita", "床下_各点検口内1"), _
#         Array("cat6_koyaura", "小屋裏・天井_各点検口内1"), _
#         Array("cat7_yane", "屋根1"), _
#         Array("cat7_okujou", "屋上1") _
#     )
# After:
#     maints = Array( _
#         Array("cat1", "敷地及び地盤"), _
#         Array("cat2", "各点検口内"), _
#         Array("cat3", "建築物外部"), _
#         Array("cat4", "屋根及び屋上"), _
#         Array("cat5", "共用部内装") _
#     )

# cat5行の末尾 ", _" を " _" に変更し、サブグループ4行を削除
# 具体的には cat5 の行末を変えて、cat6〜cat7行を消す

lines = content.split("\n")
new_lines = []
skip_subgroups = False
i = 0
while i < len(lines):
    line = lines[i]
    # cat5行を見つけたら末尾を修正
    if '"cat5"' in line and '"), _' in line:
        # cat5が最後の要素になるので ", _" → " _" に変更
        line = line.replace('"), _', '") _')
        new_lines.append(line)
        changes += 1
        print("OK: cat5行の末尾を修正（最終要素化）")
        # 次の4行（cat6_yukashita, cat6_koyaura, cat7_yane, cat7_okujou）をスキップ
        skipped = 0
        i += 1
        while i < len(lines) and skipped < 4:
            if "cat6_" in lines[i] or "cat7_" in lines[i]:
                print(f"OK: 削除 - {lines[i].strip()}")
                skipped += 1
                changes += 1
            else:
                # 予期しない行 - そのまま追加
                new_lines.append(lines[i])
            i += 1
        continue
    new_lines.append(line)
    i += 1

content = "\n".join(new_lines)

# CRLF に変換して CP932 で保存
output = content.replace("\n", "\r\n")
with open(OUTPUT_FILE, "wb") as f:
    f.write(output.encode("cp932"))

print(f"\nTotal changes: {changes}")
if changes >= 5:
    print("All changes applied successfully!")
else:
    print("WARNING: Some changes may have failed!")
