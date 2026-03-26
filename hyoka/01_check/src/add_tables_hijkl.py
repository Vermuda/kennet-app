#!/usr/bin/env python3
"""
CellAddressCollector.bas にテーブルH/I/J/Kを追加するスクリプト
CP932デコード後の実際の日本語文字列を使用

追加テーブル:
  H: 物件基本情報（列AN-AQ = 列40-43）
  I: 備考（列AR-AT = 列44-46）
  J: 定型写真（列AU-AX = 列47-50）
  K: 不具合テンプレート（列AY-BF = 列51-58）
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

# ============================================================
# 1. SetupTableF/G 重複呼び出しを削除 + Table H/I/J/K 呼び出し追加
# ============================================================
content = replace_once(content,
    "    ' ===== テーブルF: 項目調査実施状況 (AC:AH) =====\n    SetupTableF ws\n\n    ' ===== テーブルG: 資料値・実測値 (AJ:AM) =====\n    SetupTableG ws\n\n    ' 列幅調整",
    "    ' ===== テーブルH: 物件基本情報 (AN:AQ) =====\n    SetupTableH ws\n\n    ' ===== テーブルI: 備考 (AR:AT) =====\n    SetupTableI ws\n\n    ' ===== テーブルJ: 定型写真 (AU:AX) =====\n    SetupTableJ ws\n\n    ' ===== テーブルK: 不具合テンプレート (AY:BF) =====\n    SetupTableK ws\n\n    ' 列幅調整",
    "Remove duplicate F/G calls + add H/I/J/K calls")

# ============================================================
# 2. MsgBox の完了メッセージにテーブルH/I/J/K を追加
# ============================================================
content = replace_once(content,
    '           "テーブルE: カテゴリ調査状況（要入力）" & vbCrLf & vbCrLf & _',
    '           "テーブルE: カテゴリ調査状況（要入力）" & vbCrLf & _\n           "テーブルH: 物件基本情報（要入力）" & vbCrLf & _\n           "テーブルI: 備考（要入力）" & vbCrLf & _\n           "テーブルJ: 定型写真（要入力）" & vbCrLf & _\n           "テーブルK: 不具合テンプレート（要入力）" & vbCrLf & vbCrLf & _',
    "MsgBox add H/I/J/K info")

# ============================================================
# 3. SetupTableH 関数を追加（SetupTableG End Sub の後に挿入）
# ============================================================
setup_table_h = '''
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
    ' prop_address: 住所
    ws.Cells(r, 40).Value = "prop_address"
    ws.Cells(r, 41).Value = "住所"
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
End Sub'''

setup_table_i = '''
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
End Sub'''

setup_table_j = '''
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
End Sub'''

setup_table_k = '''
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
    ws.Range("AY2:BF2").Font.Bold = True
    ws.Range("AY2:BF2").Interior.Color = RGB(244, 199, 195)

    Dim r As Long
    Dim c As Long
    ' tmpl_c: 評価c劣化事象
    r = 3
    ws.Cells(r, 51).Value = "tmpl_c"
    ws.Cells(r, 52).Value = "評価c劣化事象"
    For c = 53 To 58
        ws.Cells(r, c).Interior.Color = RGB(255, 255, 200)
    Next c

    ' tmpl_b2: 評価b2劣化事象
    r = 4
    ws.Cells(r, 51).Value = "tmpl_b2"
    ws.Cells(r, 52).Value = "評価b2劣化事象"
    For c = 53 To 58
        ws.Cells(r, c).Interior.Color = RGB(255, 255, 200)
    Next c
End Sub'''

# SetupTableG End Sub の直後に新しいテーブル関数を挿入
insert_marker = "    ws.Cells(r, 37).Interior.Color = RGB(255, 255, 200)\n    ws.Cells(r, 38).Interior.Color = RGB(255, 255, 200)\nEnd Sub"

new_functions = setup_table_h + "\n" + setup_table_i + "\n" + setup_table_j + "\n" + setup_table_k

content = replace_once(content,
    insert_marker,
    insert_marker + "\n" + new_functions,
    "Insert SetupTableH/I/J/K after SetupTableG")

# ============================================================
# 4. BuildCollectList: テーブルH/I/J/K の収集を追加
# ============================================================
build_collect_addition = '''
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
        tmplLabels = Array("", "", "", "場所セル", "部位セル", "劣化状況セル", "評価セル", "補修方法セル", "画像セル")
        Dim tc As Long
        For tc = 53 To 58
            If mapWs.Cells(r, tc).Value = "" Then
                g_CollectItems.Add Array(MAPPING_SHEET, r, tc, _
                    "【不具合テンプレート/" & tmplLabels(tc - 50) & "】" & tmplName & " ※該当シートでクリック")
            End If
        Next tc
        r = r + 1
    Loop
'''

content = replace_once(content,
    "    ' === テーブルG: AK-AL列 の空 ===\n    r = 3\n    Do While mapWs.Cells(r, 36).Value <> \"\"\n        Dim legalItemName As String\n        legalItemName = mapWs.Cells(r, 39).Value\n\n        If mapWs.Cells(r, 37).Value = \"\" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 37, _\n                \"【資料値】\" & legalItemName)\n        End If\n        If mapWs.Cells(r, 38).Value = \"\" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 38, _\n                \"【実測値】\" & legalItemName)\n        End If\n        r = r + 1\n    Loop\n\nEnd Sub",
    "    ' === テーブルG: AK-AL列 の空 ===\n    r = 3\n    Do While mapWs.Cells(r, 36).Value <> \"\"\n        Dim legalItemName As String\n        legalItemName = mapWs.Cells(r, 39).Value\n\n        If mapWs.Cells(r, 37).Value = \"\" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 37, _\n                \"【資料値】\" & legalItemName)\n        End If\n        If mapWs.Cells(r, 38).Value = \"\" Then\n            g_CollectItems.Add Array(MAPPING_SHEET, r, 38, _\n                \"【実測値】\" & legalItemName)\n        End If\n        r = r + 1\n    Loop\n" + build_collect_addition + "\nEnd Sub",
    "BuildCollectList: add Table H/I/J/K collection")

# ============================================================
# 5. ValidateMappingSheet: テーブルH/I/J/K の検証を追加
# ============================================================
validate_addition = '''
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
'''

content = replace_once(content,
    '    details = details & "テーブルG(資料値・実測値): " & (emptyCount - prevCount) & "件空欄" & vbCrLf\n\n    If emptyCount = 0 Then',
    '    details = details & "テーブルG(資料値・実測値): " & (emptyCount - prevCount) & "件空欄" & vbCrLf\n    prevCount = emptyCount\n' + validate_addition + '\n    If emptyCount = 0 Then',
    "ValidateMappingSheet: add Table H/I/J/K validation")

# ============================================================
# 書き出し
# ============================================================
content = content.replace("\n", "\r\n")

with open(OUTPUT_FILE, "wb") as f:
    f.write(content.encode("cp932"))

print(f"\nDone: {changes} changes applied to {OUTPUT_FILE}")
if changes < 5:
    print("WARNING: Expected 5 changes but only applied " + str(changes))
