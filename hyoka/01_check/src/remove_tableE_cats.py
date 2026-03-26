#!/usr/bin/env python3
"""
CellAddressCollector.bas のテーブルEからcat1, cat6, cat7を削除するスクリプト
アプリ側で調査実施/不可トグルがないカテゴリ
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


# テーブルE の cats 配列から cat1, cat6, cat7 を削除
# Before:
#     cats = Array( _
#         Array("cat1", "敷地及び地盤"), _
#         Array("cat2", "各点検口内"), _
#         Array("cat3", "建築物外部"), _
#         Array("cat4", "管理状況"), _
#         Array("cat5", "屋根及び屋上") _
#         Array("cat6", "違法性関係"), _
#         Array("cat7", "共用部") _
#     )
# After:
#     cats = Array( _
#         Array("cat2", "各点検口内"), _
#         Array("cat3", "建築物外部"), _
#         Array("cat4", "管理状況"), _
#         Array("cat5", "屋根及び屋上") _
#     )

lines = content.split("\n")
new_lines = []
in_table_e_array = False
i = 0

while i < len(lines):
    line = lines[i]

    # テーブルE の cats = Array( を検出
    if "cats = Array(" in line and not in_table_e_array:
        # 前方にテーブルE関連コードがあるか確認（SetupTableE内）
        # この配列をフィルタリングする
        in_table_e_array = True
        new_lines.append(line)
        i += 1

        # 配列要素を収集
        array_lines = []
        while i < len(lines):
            aline = lines[i]
            if "Array(" in aline and '"cat' in aline:
                array_lines.append(aline)
                i += 1
            else:
                break

        # cat1, cat6, cat7 を除外
        filtered = []
        for al in array_lines:
            if '"cat1"' in al or '"cat6"' in al or '"cat7"' in al:
                print(f"OK: 削除 - {al.strip()}")
                changes += 1
            else:
                filtered.append(al)

        # 最後の要素の末尾を修正
        if filtered:
            # 全要素の末尾を ", _" に統一し、最後だけ " _" にする
            for j in range(len(filtered)):
                fl = filtered[j]
                if j < len(filtered) - 1:
                    # 中間要素: "), _" が必要
                    if '") _' in fl and '"), _' not in fl:
                        fl = fl.replace('") _', '"), _')
                else:
                    # 最終要素: ") _" が必要（閉じ括弧前）
                    if '"), _' in fl:
                        fl = fl.replace('"), _', '") _')
                filtered[j] = fl

            for fl in filtered:
                new_lines.append(fl)

        in_table_e_array = False
        continue

    new_lines.append(line)
    i += 1

content = "\n".join(new_lines)

# CRLF に変換して CP932 で保存
output = content.replace("\n", "\r\n")
with open(OUTPUT_FILE, "wb") as f:
    f.write(output.encode("cp932"))

print(f"\nTotal changes: {changes}")
if changes >= 2:
    print("All changes applied successfully!")
else:
    print("WARNING: Some changes may have failed!")
