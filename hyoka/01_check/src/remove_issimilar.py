#!/usr/bin/env python3
"""
DataImport.bas から isSimilar / c類似 関連コードを削除するスクリプト
CP932エンコーディング、ダブルCR改行コード(\r\r\n)を維持

削除対象:
1. TEMPLATE_C_SIMILAR 定数
2. GetDefectIsSimilar 関数全体
3. CreateDefectSheets 内の isSimilar 分岐ロジック → c評価は全てcDefectsへ
4. CreateDefectSheets 内の c類似シート作成ループ
5. cSimilarDefects 変数の宣言・初期化
6. inspectionMap 関連（isSimilar取得用マップ）→ 他で使われていなければ削除
7. GenerateImageRows の TEMPLATE_C_SIMILAR 参照
"""

INPUT_FILE = "DataImport.bas"
OUTPUT_FILE = "DataImport.bas"

with open(INPUT_FILE, "rb") as f:
    raw = f.read()

content = raw.decode("cp932")
# 作業用に統一改行
content = content.replace("\r\r\n", "\n").replace("\r\n", "\n")
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

def replace_all(content, old, new, label):
    global changes
    count = content.count(old)
    if count > 0:
        content = content.replace(old, new)
        print(f"OK: {label} ({count} occurrences)")
        changes += 1
    else:
        print(f"ERROR: not found - {label}")
    return content

# ============================================================
# 1. TEMPLATE_C_SIMILAR 定数を削除
# ============================================================
content = replace_once(content,
    "Private Const TEMPLATE_C_SIMILAR As String = \"評価c類似\"  ' Sheet8テンプレート\n\n",
    "",
    "Remove TEMPLATE_C_SIMILAR constant")

# ============================================================
# 2. GetDefectIsSimilar 関数全体を削除
# ============================================================
content = replace_once(content,
    "'' 不具合のisSimilarフラグを取得\n\n"
    "Private Function GetDefectIsSimilar(defect As Object, inspectionMap As Object) As Boolean\n\n"
    "    GetDefectIsSimilar = False\n\n\n\n"
    "    ' defectに直接フラグがある場合\n\n"
    "    If defect.Exists(\"isSimilar\") Then\n\n"
    "        GetDefectIsSimilar = CBool(defect(\"isSimilar\"))\n\n"
    "        Exit Function\n\n"
    "    End If\n\n\n\n"
    "    ' inspectionから取得\n\n"
    "    If defect.Exists(\"inspectionId\") Then\n\n"
    "        If inspectionMap.Exists(defect(\"inspectionId\")) Then\n\n"
    "            Dim insp As Object\n\n"
    "            Set insp = inspectionMap(defect(\"inspectionId\"))\n\n"
    "            If insp.Exists(\"isSimilar\") Then\n\n"
    "                GetDefectIsSimilar = CBool(insp(\"isSimilar\"))\n\n"
    "            End If\n\n"
    "        End If\n\n"
    "    End If\n\n"
    "End Function\n\n\n\n",
    "",
    "Remove GetDefectIsSimilar function")

# ============================================================
# 3. CreateDefectSheets 内: inspectionMap 関連を削除
#    （isSimilar取得のために使っていたマップ）
# ============================================================
content = replace_once(content,
    "    ' 検査データからisSimilarフラグを取得するためのマップ\n\n"
    "    Dim inspectionMap As Object\n\n"
    "    Set inspectionMap = BuildInspectionMap(jsonData)\n\n\n\n",
    "",
    "Remove inspectionMap from CreateDefectSheets")

# ============================================================
# 4. CreateDefectSheets 内: 分類コメントとcSimilarDefects変数を削除
# ============================================================
content = replace_once(content,
    "    ' 不具合を分類: カテゴリ(c/c類似/b2) × 階層名\n\n"
    "    Dim cDefects As Object  ' floorName → Collection of defects\n\n"
    "    Set cDefects = New Dictionary\n\n\n\n"
    "    Dim cSimilarDefects As Object\n\n"
    "    Set cSimilarDefects = New Dictionary\n\n\n\n"
    "    Dim b2Defects As Object\n\n"
    "    Set b2Defects = New Dictionary\n",
    "    ' 不具合を分類: カテゴリ(c/b2) × 階層名\n\n"
    "    Dim cDefects As Object  ' floorName → Collection of defects\n\n"
    "    Set cDefects = New Dictionary\n\n\n\n"
    "    Dim b2Defects As Object\n\n"
    "    Set b2Defects = New Dictionary\n",
    "Remove cSimilarDefects variable")

# ============================================================
# 5. CreateDefectSheets 内: isSimilar分岐→c評価は全てcDefectsへ
# ============================================================
content = replace_once(content,
    "        ' 評価を取得（defectにevalが含まれるか検査データから取得）\n\n"
    "        Dim evalValue As String\n\n"
    "        evalValue = GetDefectEvaluation(defect, inspectionMap)\n\n\n\n"
    "        ' isSimilarフラグ確認\n\n"
    "        Dim isSimilar As Boolean\n\n"
    "        isSimilar = GetDefectIsSimilar(defect, inspectionMap)\n\n\n\n"
    "        ' 分類\n\n"
    "        If evalValue = \"c\" Then\n\n"
    "            If isSimilar Then\n\n"
    "                AddDefectToCategory cSimilarDefects, floorName, defect\n\n"
    "            Else\n\n"
    "                AddDefectToCategory cDefects, floorName, defect\n\n"
    "            End If\n\n"
    "        ElseIf evalValue = \"b2\" Then\n\n"
    "            AddDefectToCategory b2Defects, floorName, defect\n\n"
    "        End If\n",
    "        ' 評価を取得\n\n"
    "        Dim evalValue As String\n\n"
    "        evalValue = GetDefectEvaluation(defect, inspectionMap)\n\n\n\n"
    "        ' 分類\n\n"
    "        If evalValue = \"c\" Then\n\n"
    "            AddDefectToCategory cDefects, floorName, defect\n\n"
    "        ElseIf evalValue = \"b2\" Then\n\n"
    "            AddDefectToCategory b2Defects, floorName, defect\n\n"
    "        End If\n",
    "Simplify c/b2 classification (remove isSimilar branch)")

# ============================================================
# 6. CreateDefectSheets 内: c類似シート作成ループを削除
# ============================================================
content = replace_once(content,
    "    ' 評価c類似シート\n\n"
    "    For Each floorKey In cSimilarDefects.Keys\n\n"
    "        CreateDefectSheetsForFloor TEMPLATE_C_SIMILAR, CStr(floorKey), cSimilarDefects(floorKey)\n\n"
    "    Next floorKey\n\n\n\n",
    "",
    "Remove c類似 sheet creation loop")

# ============================================================
# 7. GenerateImageRows: TEMPLATE_C_SIMILAR 参照を削除
# ============================================================
content = replace_once(content,
    "        Case TEMPLATE_C, TEMPLATE_C_SIMILAR\n",
    "        Case TEMPLATE_C\n",
    "Remove TEMPLATE_C_SIMILAR from GenerateImageRows")

# ============================================================
# 8. GetDefectEvaluation の inspectionMap 引数は残す
#    （inspectionMapはCreateDefectSheetsから削除したが、
#     GetDefectEvaluationでも使っているので確認）
# ============================================================
# inspectionMapはGetDefectEvaluationでも使われている。
# CreateDefectSheetsから inspectionMap を削除してしまったので、
# GetDefectEvaluation の呼び出し元で inspectionMap が必要。
# → inspectionMap は残す必要がある。戻す。

# 実は Step 3 で inspectionMap を削除してしまったが、
# GetDefectEvaluation(defect, inspectionMap) で使われている。
# Step 3 を取り消して、コメントだけ変更する。

# Already applied Step 3, so we need to add back inspectionMap
# but without the isSimilar comment
content = replace_once(content,
    "    ' マーカー→図面マップを構築\n\n"
    "    Dim markerBpMap As Object ' markerId → blueprintId\n\n"
    "    Set markerBpMap = BuildMarkerBlueprintMap(jsonData)\n\n\n\n"
    "    ' 不具合を分類: カテゴリ(c/b2) × 階層名\n",
    "    ' マーカー→図面マップを構築\n\n"
    "    Dim markerBpMap As Object ' markerId → blueprintId\n\n"
    "    Set markerBpMap = BuildMarkerBlueprintMap(jsonData)\n\n\n\n"
    "    ' 検査データマップ構築（評価値取得用）\n\n"
    "    Dim inspectionMap As Object\n\n"
    "    Set inspectionMap = BuildInspectionMap(jsonData)\n\n\n\n"
    "    ' 不具合を分類: カテゴリ(c/b2) × 階層名\n",
    "Re-add inspectionMap with updated comment (needed by GetDefectEvaluation)")

# ============================================================
# 最終出力: ダブルCR改行コードに変換して CP932 で保存
# ============================================================
# DataImport.bas は \r\r\n
output = content.replace("\n", "\r\r\n")
with open(OUTPUT_FILE, "wb") as f:
    f.write(output.encode("cp932"))

print(f"\nTotal changes: {changes}")
if changes >= 7:
    print("All changes applied successfully!")
else:
    print("WARNING: Some changes may have failed!")
