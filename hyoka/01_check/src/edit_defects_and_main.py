#!/usr/bin/env python3
"""
DataImportDefects.bas と DataImport.bas を編集する。
1. DataImportDefects.bas: GetDefectTemplateMapping 追加 + InsertDefectsToSheet を全フィールド対応に修正
2. DataImport.bas: ImportStandardPhotos / ImportRemarks の呼び出しを ImportJsonData に追加

CP932 + \r\r\n (ダブルCR) 改行コードを維持する。
"""

import sys

SRC_DIR = "/Users/kobayashi/develop/03_kennet/kennet-app/hyoka/01_check/src"
DEFECTS_BAS = f"{SRC_DIR}/DataImportDefects.bas"
MAIN_BAS = f"{SRC_DIR}/DataImport.bas"


def read_bas(path: str) -> str:
    """CP932で読み込み、改行を正規化して返す"""
    with open(path, "rb") as f:
        raw = f.read()
    content = raw.decode("cp932")
    content = content.replace("\r\r\n", "\n").replace("\r\n", "\n").replace("\r", "\n")
    return content


def write_bas(path: str, content: str) -> None:
    """改行を \r\r\n に変換してCP932で書き込む"""
    content = content.rstrip("\n") + "\n"
    content = content.replace("\n", "\r\r\n")
    with open(path, "wb") as f:
        f.write(content.encode("cp932"))


# =============================================
# Part 1: DataImportDefects.bas の編集
# =============================================

def edit_defects():
    content = read_bas(DEFECTS_BAS)

    # --- 1a. GetDefectTemplateMapping 関数を追加 ---
    # InsertDefectsToSheet の前(末尾の空 Sub の前)に追加
    get_mapping_func = """

'' テーブルK: 不具合テンプレートマッピング取得
'' マッピングシート列51=templateKey, 列52=sheetName,
'' 列53=locationCell, 列54=componentCell, 列55=deteriorationCell,
'' 列56=evalCell, 列57=repairCell, 列58=imageCell
'' 戻り値: Dictionary - templateKey → Dictionary("location","component","deterioration","eval","repair","image" → cellAddr)

Public Function GetDefectTemplateMapping() As Object
    Dim d As Object
    Set d = New Dictionary

    Dim mapWs As Worksheet
    Set mapWs = GetMappingSheet()
    If mapWs Is Nothing Then
        Set GetDefectTemplateMapping = d
        Exit Function
    End If

    Dim r As Long
    r = 3 ' データ開始行
    Do While mapWs.Cells(r, 51).Value <> ""
        Dim tmplKey As String
        tmplKey = CStr(mapWs.Cells(r, 51).Value)

        Dim inner As Object
        Set inner = New Dictionary
        inner("sheetName") = CStr(mapWs.Cells(r, 52).Value)
        If mapWs.Cells(r, 53).Value <> "" Then inner("location") = CStr(mapWs.Cells(r, 53).Value)
        If mapWs.Cells(r, 54).Value <> "" Then inner("component") = CStr(mapWs.Cells(r, 54).Value)
        If mapWs.Cells(r, 55).Value <> "" Then inner("deterioration") = CStr(mapWs.Cells(r, 55).Value)
        If mapWs.Cells(r, 56).Value <> "" Then inner("eval") = CStr(mapWs.Cells(r, 56).Value)
        If mapWs.Cells(r, 57).Value <> "" Then inner("repair") = CStr(mapWs.Cells(r, 57).Value)
        If mapWs.Cells(r, 58).Value <> "" Then inner("image") = CStr(mapWs.Cells(r, 58).Value)

        Set d(tmplKey) = inner
        r = r + 1
    Loop

    Set GetDefectTemplateMapping = d
End Function
"""

    # --- 1b. InsertDefectsToSheet を修正: 全フィールド対応 ---
    # 現在の InsertDefectsToSheet を新しいバージョンに置換

    old_insert = """Public Sub InsertDefectsToSheet(ws As Worksheet, defectList As Collection, startIdx As Long, endIdx As Long, templateName As String)

    ' 摜行パターンを生成

    Dim imageRows As Collection

    Set imageRows = GenerateImageRows(templateName)



    Dim localIdx As Long

    localIdx = 1



    Dim i As Long

    For i = startIdx To endIdx

        If localIdx > imageRows.Count Then Exit For



        Dim defect As Object

        Set defect = defectList(i)



        Dim targetRow As Long

        targetRow = imageRows(localIdx)



        ' 摜列の決定（奇数＝左、偶数＝右）

        Dim imgCol As String

        If localIdx Mod 2 = 1 Then

            imgCol = "B"

        Else

            imgCol = "L"

        End If



        ' 摜の挿入

        If defect.Exists("imageData") Then

            If Not IsNull(defect("imageData")) And defect("imageData") <> "" Then

                Dim imgPath As String

                imgPath = DecodeBase64ToTempFile(CStr(defect("imageData")))

                If imgPath <> "" Then

                    InsertImageToCell ws, imgPath, imgCol & targetRow

                End If

            End If

        End If



        ' テキストデータの入力（旧OutputB2CResultsのパターン簡略）

        Dim textBaseRow As Long

        Dim locationCol As String

        Dim evalCol As String



        ' baseRow計算: OutputB2CResultsの計算式を使用

        If localIdx Mod 2 = 1 Then

            ' 奇数番: C列(場所名), K列(評価)

            textBaseRow = 4 + (Int((localIdx - 1) / 2) Mod 3) * 12 + Int((localIdx - 1) / 6) * 40

            locationCol = "C"

            evalCol = "K"

        Else

            ' 偶数番: M列(場所名), U列(評価)

            textBaseRow = 4 + (Int((localIdx - 2) / 2) Mod 3) * 12 + Int((localIdx - 1) / 6) * 40

            locationCol = "M"

            evalCol = "U"

        End If



        ' 場所名

        If defect.Exists("location") Then

            SetCellValueSafe ws, locationCol & textBaseRow, defect("location")

        End If



        ' 詳細・評価

        If defect.Exists("detail") Then

            SetCellValueSafe ws, evalCol & (textBaseRow + 1), defect("detail")

        End If



        localIdx = localIdx + 1

    Next i

End Sub"""

    # 現在のInsertDefectsToSheetを見つけるために、実際のCP932デコード済みテキストで検索
    # CP932の文字化けがあるので、関数シグネチャで検索する
    marker_start = "Public Sub InsertDefectsToSheet(ws As Worksheet, defectList As Collection, startIdx As Long, endIdx As Long, templateName As String)"
    marker_end = "End Sub\n\n\n\n'' 摜行パターンの生成"

    # CP932文字はデコード後に正しい日本語になっている（はず）
    # 実際にはCP932でデコードされたバイト列なので、文字化けした状態で検索する

    # 関数の開始位置を見つける
    start_pos = content.find(marker_start)
    if start_pos == -1:
        print(f"ERROR: InsertDefectsToSheet の開始位置が見つかりません")
        # デバッグ: 付近のテキストを出力
        idx = content.find("InsertDefectsToSheet")
        if idx >= 0:
            print(f"  'InsertDefectsToSheet' found at pos {idx}")
            print(f"  Context: {repr(content[idx:idx+200])}")
        sys.exit(1)

    # 関数の終了位置を見つける（End Sub の後の次の関数まで）
    # InsertDefectsToSheet の後の End Sub を探す
    end_sub_marker = "\nEnd Sub\n"
    end_pos = content.find(end_sub_marker, start_pos)
    if end_pos == -1:
        print("ERROR: InsertDefectsToSheet の End Sub が見つかりません")
        sys.exit(1)
    end_pos += len(end_sub_marker)  # End Sub\n まで含む

    # 新しい InsertDefectsToSheet
    new_insert = """Public Sub InsertDefectsToSheet(ws As Worksheet, defectList As Collection, startIdx As Long, endIdx As Long, templateName As String)

    ' テーブルKからテンプレートマッピングを取得
    Dim tmplMap As Object
    Set tmplMap = GetDefectTemplateMapping()

    ' テンプレートキーを決定
    Dim tmplKey As String
    Select Case templateName
        Case TEMPLATE_C
            tmplKey = "tmpl_c"
        Case TEMPLATE_B2
            tmplKey = "tmpl_b2"
        Case Else
            tmplKey = "tmpl_c"
    End Select

    ' マッピングからベースセルアドレスを取得（フォールバック付き）
    Dim baseLocationCol As String
    Dim baseComponentCol As String
    Dim baseDeteriorationCol As String
    Dim baseEvalCol As String
    Dim baseRepairCol As String
    Dim baseImgCol As String
    Dim baseLocationRow As Long
    Dim baseComponentRow As Long
    Dim baseDeteriorationRow As Long
    Dim baseEvalRow As Long
    Dim baseRepairRow As Long
    Dim baseImgRow As Long

    If tmplMap.Exists(tmplKey) Then
        Dim mapping As Object
        Set mapping = tmplMap(tmplKey)

        If mapping.Exists("location") Then
            ParseCellAddress CStr(mapping("location")), baseLocationCol, baseLocationRow
        End If
        If mapping.Exists("component") Then
            ParseCellAddress CStr(mapping("component")), baseComponentCol, baseComponentRow
        End If
        If mapping.Exists("deterioration") Then
            ParseCellAddress CStr(mapping("deterioration")), baseDeteriorationCol, baseDeteriorationRow
        End If
        If mapping.Exists("eval") Then
            ParseCellAddress CStr(mapping("eval")), baseEvalCol, baseEvalRow
        End If
        If mapping.Exists("repair") Then
            ParseCellAddress CStr(mapping("repair")), baseRepairCol, baseRepairRow
        End If
        If mapping.Exists("image") Then
            ParseCellAddress CStr(mapping("image")), baseImgCol, baseImgRow
        End If
    End If

    ' フォールバック: マッピングが空の場合はハードコード値を使用
    If baseLocationCol = "" Then baseLocationCol = "F": baseLocationRow = 4
    If baseComponentCol = "" Then baseComponentCol = "I": baseComponentRow = 4
    If baseDeteriorationCol = "" Then baseDeteriorationCol = "B": baseDeteriorationRow = 5
    If baseEvalCol = "" Then baseEvalCol = "J": baseEvalRow = 5
    If baseImgCol = "" Then baseImgCol = "B": baseImgRow = 8

    ' 右列オフセットの計算（左列と右列の列差分）
    Dim rightLocationCol As String
    Dim rightComponentCol As String
    Dim rightDeteriorationCol As String
    Dim rightEvalCol As String
    Dim rightRepairCol As String
    Dim rightImgCol As String
    rightLocationCol = OffsetColumn(baseLocationCol, 10)    ' 例: F→P
    rightComponentCol = OffsetColumn(baseComponentCol, 10)  ' 例: I→S
    rightDeteriorationCol = OffsetColumn(baseDeteriorationCol, 10) ' 例: B→L
    rightEvalCol = OffsetColumn(baseEvalCol, 10)            ' 例: J→T
    rightRepairCol = OffsetColumn(baseRepairCol, 10)
    rightImgCol = OffsetColumn(baseImgCol, 10)              ' 例: B→L

    ' 行間隔: 12行ごとに次の不具合
    Dim ROW_INTERVAL As Long
    ROW_INTERVAL = 12

    Dim localIdx As Long
    localIdx = 1

    Dim i As Long
    For i = startIdx To endIdx
        Dim defect As Object
        Set defect = defectList(i)

        ' ペアインデックス（0始まり: 0,0,1,1,2,2,...）
        Dim pairIdx As Long
        pairIdx = Int((localIdx - 1) / 2)

        ' 行オフセット計算
        Dim rowOffset As Long
        rowOffset = pairIdx * ROW_INTERVAL

        ' 奇数=左列、偶数=右列
        Dim isLeft As Boolean
        isLeft = (localIdx Mod 2 = 1)

        Dim curLocationCol As String
        Dim curComponentCol As String
        Dim curDeteriorationCol As String
        Dim curEvalCol As String
        Dim curRepairCol As String
        Dim curImgCol As String

        If isLeft Then
            curLocationCol = baseLocationCol
            curComponentCol = baseComponentCol
            curDeteriorationCol = baseDeteriorationCol
            curEvalCol = baseEvalCol
            curRepairCol = baseRepairCol
            curImgCol = baseImgCol
        Else
            curLocationCol = rightLocationCol
            curComponentCol = rightComponentCol
            curDeteriorationCol = rightDeteriorationCol
            curEvalCol = rightEvalCol
            curRepairCol = rightRepairCol
            curImgCol = rightImgCol
        End If

        ' 場所名
        If defect.Exists("location") Then
            SetCellValueSafe ws, curLocationCol & (baseLocationRow + rowOffset), defect("location")
        End If

        ' 部位
        If defect.Exists("component") Then
            SetCellValueSafe ws, curComponentCol & (baseComponentRow + rowOffset), defect("component")
        End If

        ' 劣化状況
        If defect.Exists("deterioration") Then
            SetCellValueSafe ws, curDeteriorationCol & (baseDeteriorationRow + rowOffset), defect("deterioration")
        End If

        ' 評価
        If defect.Exists("evaluationType") Then
            SetCellValueSafe ws, curEvalCol & (baseEvalRow + rowOffset), defect("evaluationType")
        End If

        ' 修繕方法（tmpl_c のみ repair列あり）
        If baseRepairCol <> "" Then
            If defect.Exists("repairMethod") Then
                SetCellValueSafe ws, curRepairCol & (baseRepairRow + rowOffset), defect("repairMethod")
            End If
        End If

        ' 画像の挿入
        If defect.Exists("imageData") Then
            If Not IsNull(defect("imageData")) And defect("imageData") <> "" Then
                Dim imgPath As String
                imgPath = DecodeBase64ToTempFile(CStr(defect("imageData")))
                If imgPath <> "" Then
                    InsertImageToCell ws, imgPath, curImgCol & (baseImgRow + rowOffset)
                End If
            End If
        End If

        localIdx = localIdx + 1
    Next i
End Sub
"""

    # 置換実行
    content = content[:start_pos] + new_insert + content[end_pos:]

    # --- 1c. ParseCellAddress と OffsetColumn ヘルパー関数を追加 ---
    # GenerateImageRows の前に追加
    helper_funcs = """

'' セルアドレスを列名と行番号に分解
'' 例: "F4" → col="F", row=4 / "AB12" → col="AB", row=12

Public Sub ParseCellAddress(cellAddr As String, ByRef colName As String, ByRef rowNum As Long)
    Dim j As Long
    colName = ""
    rowNum = 0
    For j = 1 To Len(cellAddr)
        If IsNumeric(Mid(cellAddr, j, 1)) Then
            colName = Left(cellAddr, j - 1)
            rowNum = CLng(Mid(cellAddr, j))
            Exit Sub
        End If
    Next j
    colName = cellAddr
End Sub


'' 列名をオフセット（例: "B" + 10 → "L", "F" + 10 → "P"）

Public Function OffsetColumn(colName As String, offsetCols As Long) As String
    If colName = "" Then
        OffsetColumn = ""
        Exit Function
    End If

    ' 列名を列番号に変換
    Dim colNum As Long
    Dim k As Long
    colNum = 0
    For k = 1 To Len(colName)
        colNum = colNum * 26 + (Asc(UCase(Mid(colName, k, 1))) - Asc("A") + 1)
    Next k

    ' オフセット適用
    colNum = colNum + offsetCols

    ' 列番号を列名に変換
    Dim result As String
    result = ""
    Do While colNum > 0
        Dim remainder As Long
        remainder = (colNum - 1) Mod 26
        result = Chr(Asc("A") + remainder) & result
        colNum = Int((colNum - 1) / 26)
    Loop
    OffsetColumn = result
End Function

"""

    # GenerateImageRows の前に挿入
    gen_marker = "Public Function GenerateImageRows(templateName As String) As Collection"
    gen_pos = content.find(gen_marker)
    if gen_pos == -1:
        print("ERROR: GenerateImageRows が見つかりません")
        sys.exit(1)

    # GetDefectTemplateMapping を GenerateImageRows の前に挿入
    # ヘルパー関数もGenerateImageRowsの前に挿入
    content = content[:gen_pos] + get_mapping_func + helper_funcs + "\n" + content[gen_pos:]

    write_bas(DEFECTS_BAS, content)
    print(f"OK: {DEFECTS_BAS} を更新しました")
    print("  - GetDefectTemplateMapping 関数を追加")
    print("  - ParseCellAddress / OffsetColumn ヘルパー関数を追加")
    print("  - InsertDefectsToSheet を全フィールド対応に修正")


# =============================================
# Part 2: DataImport.bas の編集
# =============================================

def edit_main():
    content = read_bas(MAIN_BAS)

    # CreateKeyPlanSheets の後に ImportStandardPhotos と ImportRemarks を追加
    # 現在の流れ:
    #   Phase 3: ImportToOnsiteSurveySheet
    #   Phase 4: CreateDefectSheets
    #   Phase 5: CreateKeyPlanSheets
    #   → ReprotectAllSheets

    # CreateKeyPlanSheets jsonData の呼び出し行の後に追加
    old_phase5 = '    CreateKeyPlanSheets jsonData'
    new_phase5_and_6_7 = """    CreateKeyPlanSheets jsonData



    ' Phase 6: 定型写真シートへの入力

    Application.StatusBar = "定型写真を入力中..."

    ImportStandardPhotos jsonData



    ' Phase 7: 備考の入力

    Application.StatusBar = "備考を入力中..."

    ImportRemarks jsonData"""

    if old_phase5 not in content:
        print("ERROR: 'CreateKeyPlanSheets jsonData' が DataImport.bas に見つかりません")
        # デバッグ
        idx = content.find("CreateKeyPlanSheets")
        if idx >= 0:
            print(f"  Found 'CreateKeyPlanSheets' at pos {idx}")
            print(f"  Context: {repr(content[idx:idx+100])}")
        sys.exit(1)

    content = content.replace(old_phase5, new_phase5_and_6_7, 1)

    write_bas(MAIN_BAS, content)
    print(f"OK: {MAIN_BAS} を更新しました")
    print("  - ImportStandardPhotos jsonData 呼び出しを追加 (Phase 6)")
    print("  - ImportRemarks jsonData 呼び出しを追加 (Phase 7)")


def main():
    print("=" * 60)
    print("DataImportDefects.bas / DataImport.bas 編集スクリプト")
    print("=" * 60)
    print()

    edit_defects()
    print()
    edit_main()

    print()
    print("完了しました。")


if __name__ == "__main__":
    main()
