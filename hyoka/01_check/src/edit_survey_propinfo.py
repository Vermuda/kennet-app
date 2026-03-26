#!/usr/bin/env python3
"""
DataImportSurvey.bas を編集して:
1. ImportPropertyInfo をマッピングシート参照版に置き換え
2. GetPropertyInfoMapping / GetRemarksMapping を DataImportMapping.bas に追加
3. ImportRemarks を DataImportSurvey.bas に追加
4. ImportToOnsiteSurveySheet に ImportRemarks 呼び出しを追加

エンコーディング: CP932, 改行: \r\r\n
"""

import re
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent
SURVEY_FILE = BASE_DIR / "DataImportSurvey.bas"
MAPPING_FILE = BASE_DIR / "DataImportMapping.bas"

ENCODING = "cp932"
DOUBLE_CRLF = "\r\r\n"


def read_bas(filepath: Path) -> str:
    """CP932で.basファイルを読み込み、改行を\nに正規化"""
    with open(filepath, "rb") as f:
        raw = f.read()
    text = raw.decode(ENCODING)
    # \r\r\n → \n に正規化
    text = text.replace("\r\r\n", "\n")
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")
    return text


def write_bas(filepath: Path, text: str) -> None:
    """CP932 + \r\r\n で.basファイルを書き込み"""
    # まず改行を統一
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # \n → \r\r\n
    text = text.replace("\n", DOUBLE_CRLF)
    with open(filepath, "wb") as f:
        f.write(text.encode(ENCODING))


# ============================================================
# 新しい ImportPropertyInfo（マッピングシート参照版）
# ============================================================
NEW_IMPORT_PROPERTY_INFO = """\
Public Sub ImportPropertyInfo(ws As Worksheet, jsonData As Object)
    On Error Resume Next

    ' マッピング取得
    Dim propMap As Object
    Set propMap = GetPropertyInfoMapping()
    If propMap.Count = 0 Then
        m_ErrorLog.Add "WARNING: Table H (物件情報マッピング) が空です"
        On Error GoTo 0
        Exit Sub
    End If

    ' 物件名
    If jsonData.Exists("property") Then
        Dim prop As Object
        Set prop = jsonData("property")

        If prop.Exists("name") Then
            If propMap.Exists("prop_name") Then
                SetCellValueSafe ws, propMap("prop_name"), prop("name")
            End If
        End If

        ' 住所
        If prop.Exists("address") Then
            If propMap.Exists("prop_address") Then
                SetCellValueSafe ws, propMap("prop_address"), prop("address")
            End If
        End If

        ' 調査日 (format: "yyyy-mm-dd")
        If prop.Exists("inspectionDate") Then
            Dim dateStr As String
            dateStr = CStr(prop("inspectionDate"))
            If Len(dateStr) >= 10 Then
                Dim yearPart As String
                Dim monthPart As String
                Dim dayPart As String
                yearPart = Left(dateStr, 4)
                monthPart = Mid(dateStr, 6, 2)
                dayPart = Mid(dateStr, 9, 2)
                ' 先頭の0を除去 (例: "03" → "3")
                If Left(monthPart, 1) = "0" Then monthPart = Mid(monthPart, 2)
                If Left(dayPart, 1) = "0" Then dayPart = Mid(dayPart, 2)

                If propMap.Exists("prop_date_year") Then
                    SetCellValueSafe ws, propMap("prop_date_year"), yearPart
                End If
                If propMap.Exists("prop_date_month") Then
                    SetCellValueSafe ws, propMap("prop_date_month"), monthPart
                End If
                If propMap.Exists("prop_date_day") Then
                    SetCellValueSafe ws, propMap("prop_date_day"), dayPart
                End If
            End If
        End If

        ' 天候
        If prop.Exists("weather") Then
            If propMap.Exists("prop_weather") Then
                Dim weatherCell As String
                weatherCell = propMap("prop_weather")
                Dim weatherVal As String
                weatherVal = CStr(prop("weather"))

                Dim weatherOffset As Long
                Select Case weatherVal
                    Case ChrW(&H6674)  ' 晴
                        weatherOffset = 0
                    Case ChrW(&H66C7)  ' 曇
                        weatherOffset = 1
                    Case ChrW(&H96E8)  ' 雨
                        weatherOffset = 2
                    Case ChrW(&H96EA)  ' 雪
                        weatherOffset = 3
                    Case Else
                        weatherOffset = -1
                End Select

                If weatherOffset >= 0 Then
                    If weatherOffset = 0 Then
                        SetCellValueSafe ws, weatherCell, ChrW(&H25A0)
                    Else
                        ' セルアドレスから列をオフセット
                        Dim weatherRange As Range
                        Set weatherRange = ws.Range(weatherCell)
                        If Not weatherRange Is Nothing Then
                            Dim targetCell As Range
                            Set targetCell = weatherRange.Offset(0, weatherOffset)
                            SetCellValueSafe ws, targetCell.Address(False, False), ChrW(&H25A0)
                        End If
                    End If
                End If
            End If
        End If

        ' 調査開始時間
        If prop.Exists("inspectionStartTime") Then
            If propMap.Exists("prop_time_start") Then
                SetCellValueSafe ws, propMap("prop_time_start"), CStr(prop("inspectionStartTime"))
            End If
        End If

        ' 調査終了時間
        If prop.Exists("inspectionEndTime") Then
            If propMap.Exists("prop_time_end") Then
                SetCellValueSafe ws, propMap("prop_time_end"), CStr(prop("inspectionEndTime"))
            End If
        End If
    End If

    On Error GoTo 0
End Sub"""

# ============================================================
# GetPropertyInfoMapping（DataImportMapping.basに追加）
# ============================================================
GET_PROPERTY_INFO_MAPPING = """\

'' テーブルH: 物件情報マッピング
'' 戻り値: Dictionary - fieldKey → cellAddress
'' columns 40-43 (AN-AQ): fieldKey, fieldName, cellAddress, notes

Public Function GetPropertyInfoMapping() As Object
    Dim d As Object
    Set d = New Dictionary

    Dim mapWs As Worksheet
    Set mapWs = GetMappingSheet()
    If mapWs Is Nothing Then
        Set GetPropertyInfoMapping = d
        Exit Function
    End If

    Dim r As Long
    r = 3
    Do While mapWs.Cells(r, 40).Value <> ""
        Dim fieldKey As String
        fieldKey = CStr(mapWs.Cells(r, 40).Value)
        Dim cellAddr As String
        cellAddr = CStr(mapWs.Cells(r, 42).Value)
        If cellAddr <> "" Then d(fieldKey) = cellAddr
        r = r + 1
    Loop

    Set GetPropertyInfoMapping = d
End Function"""

# ============================================================
# GetRemarksMapping（DataImportMapping.basに追加）
# ============================================================
GET_REMARKS_MAPPING = """\

'' テーブルI: 備考マッピング
'' 戻り値: Dictionary - remarkKey → cellAddress
'' columns 44-46 (AR-AT): remarkKey, remarkName, cellAddress

Public Function GetRemarksMapping() As Object
    Dim d As Object
    Set d = New Dictionary

    Dim mapWs As Worksheet
    Set mapWs = GetMappingSheet()
    If mapWs Is Nothing Then
        Set GetRemarksMapping = d
        Exit Function
    End If

    Dim r As Long
    r = 3
    Do While mapWs.Cells(r, 44).Value <> ""
        Dim remarkKey As String
        remarkKey = CStr(mapWs.Cells(r, 44).Value)
        Dim cellAddr As String
        cellAddr = CStr(mapWs.Cells(r, 46).Value)
        If cellAddr <> "" Then d(remarkKey) = cellAddr
        r = r + 1
    Loop

    Set GetRemarksMapping = d
End Function"""

# ============================================================
# ImportRemarks（DataImportSurvey.basに追加）
# ============================================================
IMPORT_REMARKS = """\


'' 備考の入力

Public Sub ImportRemarks(ws As Worksheet, checklist As Object)
    On Error Resume Next

    ' マッピング取得
    Dim remMap As Object
    Set remMap = GetRemarksMapping()
    If remMap.Count = 0 Then
        m_ErrorLog.Add "WARNING: Table I (備考マッピング) が空です"
        On Error GoTo 0
        Exit Sub
    End If

    ' options.remarks から備考テキストを取得
    If Not checklist.Exists("options") Then
        On Error GoTo 0
        Exit Sub
    End If

    Dim options As Object
    Set options = checklist("options")

    If Not options.Exists("remarks") Then
        On Error GoTo 0
        Exit Sub
    End If

    Dim remarks As Object
    Set remarks = options("remarks")

    ' remarks内の各キーをマッピングと照合して書き込み
    Dim remarkKey As Variant
    For Each remarkKey In remarks.Keys
        Dim remKeyStr As String
        remKeyStr = CStr(remarkKey)

        If remMap.Exists(remKeyStr) Then
            Dim remarkVal As String
            remarkVal = CStr(remarks(remarkKey))
            If remarkVal <> "" Then
                SetCellValueSafe ws, remMap(remKeyStr), remarkVal
            End If
        End If
    Next remarkKey

    On Error GoTo 0
End Sub"""


def main():
    # ============================================================
    # 1. DataImportSurvey.bas を編集
    # ============================================================
    print("Reading DataImportSurvey.bas...")
    survey_text = read_bas(SURVEY_FILE)

    # --- ImportPropertyInfo を置き換え ---
    # 関数の開始と終了を見つける
    pattern = (
        r"Public Sub ImportPropertyInfo\(ws As Worksheet, jsonData As Object\)"
        r".*?"
        r"End Sub"
    )
    match = re.search(pattern, survey_text, re.DOTALL)
    if not match:
        print("ERROR: ImportPropertyInfo が見つかりません", file=sys.stderr)
        sys.exit(1)

    print(f"  ImportPropertyInfo found at position {match.start()}-{match.end()}")
    survey_text = survey_text[:match.start()] + NEW_IMPORT_PROPERTY_INFO + survey_text[match.end():]
    print("  ImportPropertyInfo を置き換えました")

    # --- ImportRemarks を追加 ---
    # ImportCategorySurveyStatus の End Sub の後、次の関数の前に挿入
    # ImportItemSurveyStatus の前がちょうどいい位置
    # ただし、既に ImportRemarks があるかチェック
    if "Public Sub ImportRemarks" in survey_text:
        print("  ImportRemarks は既に存在します。スキップ。")
    else:
        # ImportToOnsiteSurveySheet 内に ImportRemarks 呼び出しを追加
        # categorySurveyStatus の後に追加
        insert_marker = "            ' 備考の入力\n"
        insert_marker_alt = "            ' 調査法規値の入力（法規値）\n"

        # ImportLegalValues の呼び出しの後に ImportRemarks 呼び出しを追加
        legal_call_pattern = (
            r"(            ' 調査法規値の入力.*?\n"
            r"            If checklist\.Exists\(\"evaluations\"\) Then\n"
            r"                ImportLegalValues ws, checklist\(\"evaluations\"\)\n"
            r"            End If)"
        )
        # より汎用的に: ImportLegalValues の End If の後に追加
        legal_pattern = r'(                ImportLegalValues ws, checklist\("evaluations"\)\n            End If)'
        legal_match = re.search(legal_pattern, survey_text)

        if legal_match:
            remarks_call = (
                '\n\n            \' 備考の入力\n'
                '            If checklist.Exists("options") Then\n'
                '                ImportRemarks ws, checklist\n'
                '            End If'
            )
            insert_pos = legal_match.end()
            survey_text = survey_text[:insert_pos] + remarks_call + survey_text[insert_pos:]
            print("  ImportRemarks 呼び出しを ImportToOnsiteSurveySheet に追加しました")
        else:
            print("  WARNING: ImportLegalValues 呼び出し箇所が見つかりません。手動追加が必要です。")

        # ImportRemarks 関数本体を追加（ファイル末尾、最後の関数の後に）
        # Phase 4 コメントの前に挿入
        phase4_marker = "'' =============================================\n\n'' Phase 4:"
        if phase4_marker in survey_text:
            survey_text = survey_text.replace(
                phase4_marker,
                IMPORT_REMARKS + "\n\n\n" + phase4_marker
            )
            print("  ImportRemarks 関数を Phase 4 コメントの前に追加しました")
        else:
            # ファイル末尾に追加
            survey_text = survey_text.rstrip("\n") + "\n" + IMPORT_REMARKS + "\n"
            print("  ImportRemarks 関数をファイル末尾に追加しました")

    # --- '' 物件情報入力 コメントの維持 ---
    # 元のコメントは '' 物件情報入力 で始まっていた
    # 新しい関数の前にコメントがあるか確認
    if "'' 物件情報入力" not in survey_text:
        survey_text = survey_text.replace(
            "Public Sub ImportPropertyInfo",
            "'' 物件情報入力（マッピングシート参照版）\n\n\nPublic Sub ImportPropertyInfo"
        )

    # 書き込み
    print("Writing DataImportSurvey.bas...")
    write_bas(SURVEY_FILE, survey_text)
    print("  完了")

    # ============================================================
    # 2. DataImportMapping.bas を編集
    # ============================================================
    print("\nReading DataImportMapping.bas...")
    mapping_text = read_bas(MAPPING_FILE)

    # GetPropertyInfoMapping を追加（まだ存在しない場合）
    if "Public Function GetPropertyInfoMapping" in mapping_text:
        print("  GetPropertyInfoMapping は既に存在します。スキップ。")
    else:
        mapping_text = mapping_text.rstrip("\n") + "\n" + GET_PROPERTY_INFO_MAPPING + "\n"
        print("  GetPropertyInfoMapping を追加しました")

    # GetRemarksMapping を追加（まだ存在しない場合）
    if "Public Function GetRemarksMapping" in mapping_text:
        print("  GetRemarksMapping は既に存在します。スキップ。")
    else:
        mapping_text = mapping_text.rstrip("\n") + "\n" + GET_REMARKS_MAPPING + "\n"
        print("  GetRemarksMapping を追加しました")

    # 書き込み
    print("Writing DataImportMapping.bas...")
    write_bas(MAPPING_FILE, mapping_text)
    print("  完了")

    print("\n=== 全ての編集が完了しました ===")


if __name__ == "__main__":
    main()
