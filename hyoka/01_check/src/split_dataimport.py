#!/usr/bin/env python3
"""
DataImport.bas を5つのVBAモジュールに分割するスクリプト
CP932エンコーディング、ダブルCR改行コード(\r\r\n)を維持

分割構成:
  DataImport.bas          - メインエントリ + 基盤関数 + 定数 (共通関数含む)
  DataImportMapping.bas   - マッピング取得関数群（GetXxxMapping）
  DataImportSurvey.bas    - 現地調査シートインポート（評価/オプション等）
  DataImportDefects.bas   - 不具合シート作成・画像挿入
  DataImportKeyPlan.bas   - キープランシート作成
"""

INPUT_FILE = "DataImport.bas"

with open(INPUT_FILE, "rb") as f:
    raw = f.read()

content = raw.decode("cp932")
# 作業用に統一改行
content = content.replace("\r\r\n", "\n").replace("\r\n", "\n")
lines = content.split("\n")

def get_lines(start, end):
    """1-indexed inclusive range"""
    return "\n".join(lines[start-1:end])

def write_module(filename, module_name, header_comment, body, is_main=False):
    """VBAモジュールファイルを書き出す"""
    parts = []
    parts.append(f'Attribute VB_Name = "{module_name}"')
    parts.append("")
    parts.append(f"'' =============================================")
    parts.append(f"'' {header_comment}")
    parts.append(f"'' =============================================")
    parts.append("")
    parts.append("Option Explicit")
    parts.append("")
    parts.append(body)

    output = "\n".join(parts)
    # ダブルCR改行コードに変換
    output = output.replace("\n", "\r\r\n")

    with open(filename, "wb") as f:
        f.write(output.encode("cp932"))

    line_count = len(output.split("\r\r\n"))
    print(f"Created: {filename} ({line_count} lines)")


# ============================================================
# 共通定数・変数（全モジュールで参照される）
# → DataImport.bas に Public で定義
# ============================================================

COMMON_CONSTANTS = """'' =============================================
'' 定数定義（Public: 他モジュールから参照）
'' =============================================
Public Const SHEET_PW As String = "2025Ken0129ken"
Public Const SURVEY_SHEET As String = "現地調査"
Public Const MAPPING_SHEET As String = "マッピング"
Public Const TEMPLATE_C As String = "評価c劣化事象"      ' Sheet3テンプレート
Public Const TEMPLATE_B2 As String = "評価b2劣化事象"    ' Sheet4テンプレート
Public Const MAX_IMAGES_PER_SHEET As Long = 12
Public Const PIN_SIZE As Double = 14   ' ピンマーカーサイズ(pt)
Public Const THUMBNAIL_W As Double = 120 ' サムネイル幅(pt)
Public Const THUMBNAIL_H As Double = 90  ' サムネイル高(pt)
Public Const BP_MAX_W As Double = 500  ' 図面最大幅(pt)
Public Const BP_MAX_H As Double = 400  ' 図面最大高(pt)

'' エラーログ（Public: 他モジュールから参照）
Public m_ErrorLog As Collection
'' 一時フォルダパス（Public: 他モジュールから参照）
Public m_TempFolder As String"""


# ============================================================
# Module 1: DataImport.bas - メインエントリ + 基盤関数
# ============================================================

# ImportJsonData (75-312), SelectJsonFile (313-338), ReadUtf8File (339-436),
# CreateTempFolder (437-466), CleanupTempFiles (467-500),
# UnprotectAllSheets (501-518), ReprotectAllSheets (519-538),
# DecodeBase64ToTempFile (539-716), ConvertWebpToJpeg (717-818),
# SetCellValueSafe (819-866), GetMappingSheet (867-888),
# CreateImportButton (3953-4049)

main_body = COMMON_CONSTANTS + "\n\n"

# ImportJsonData - keep as Public
main_body += get_lines(71, 312) + "\n\n"

# SelectJsonFile → Public
func = get_lines(313, 338).replace("Private Function SelectJsonFile", "Public Function SelectJsonFile")
main_body += func + "\n\n"

# ReadUtf8File → Public
func = get_lines(339, 436).replace("Private Function ReadUtf8File", "Public Function ReadUtf8File")
main_body += func + "\n\n"

# CreateTempFolder → Public
func = get_lines(437, 466).replace("Private Sub CreateTempFolder", "Public Sub CreateTempFolder")
main_body += func + "\n\n"

# CleanupTempFiles → Public
func = get_lines(467, 500).replace("Private Sub CleanupTempFiles", "Public Sub CleanupTempFiles")
main_body += func + "\n\n"

# UnprotectAllSheets → Public
func = get_lines(501, 518).replace("Private Sub UnprotectAllSheets", "Public Sub UnprotectAllSheets")
main_body += func + "\n\n"

# ReprotectAllSheets → Public
func = get_lines(519, 538).replace("Private Sub ReprotectAllSheets", "Public Sub ReprotectAllSheets")
main_body += func + "\n\n"

# DecodeBase64ToTempFile → Public
func = get_lines(539, 716).replace("Private Function DecodeBase64ToTempFile", "Public Function DecodeBase64ToTempFile")
main_body += func + "\n\n"

# ConvertWebpToJpeg → Public
func = get_lines(717, 818).replace("Private Function ConvertWebpToJpeg", "Public Function ConvertWebpToJpeg")
main_body += func + "\n\n"

# SetCellValueSafe → Public
func = get_lines(819, 866).replace("Private Sub SetCellValueSafe", "Public Sub SetCellValueSafe")
main_body += func + "\n\n"

# GetMappingSheet → Public
func = get_lines(867, 888).replace("Private Function GetMappingSheet", "Public Function GetMappingSheet")
main_body += func + "\n\n"

# CreateImportButton → already Public
main_body += get_lines(3953, 4049)

write_module("DataImport.bas", "DataImport",
             "DataImport メインモジュール - エントリポイント＋基盤関数",
             main_body, is_main=True)


# ============================================================
# Module 2: DataImportMapping.bas - マッピング取得関数
# ============================================================

mapping_body = """'' =============================================
'' マッピングシートからセルアドレスを取得する関数群
'' マッピングシートの各テーブル(A〜K)を読み取り
'' Dictionaryオブジェクトとして返却する
'' =============================================

"""

# GetB2CellMapping (889-942)
func = get_lines(889, 942).replace("Private Function GetB2CellMapping", "Public Function GetB2CellMapping")
mapping_body += func + "\n\n"

# GetACellMapping (943-968)
func = get_lines(943, 968).replace("Private Function GetACellMapping", "Public Function GetACellMapping")
mapping_body += func + "\n\n"

# GetB1CellMapping (969-996)
func = get_lines(969, 996).replace("Private Function GetB1CellMapping", "Public Function GetB1CellMapping")
mapping_body += func + "\n\n"

# GetCCellMapping (997-1052)
func = get_lines(997, 1052).replace("Private Function GetCCellMapping", "Public Function GetCCellMapping")
mapping_body += func + "\n\n"

# GetSurveyMethodMapping (1053-1113)
func = get_lines(1053, 1113).replace("Private Function GetSurveyMethodMapping", "Public Function GetSurveyMethodMapping")
mapping_body += func + "\n\n"

# GetNaCellMapping (1114-1144)
func = get_lines(1114, 1144).replace("Private Function GetNaCellMapping", "Public Function GetNaCellMapping")
mapping_body += func + "\n\n"

# GetGroupExistenceMapping (1145-1206)
func = get_lines(1145, 1206).replace("Private Function GetGroupExistenceMapping", "Public Function GetGroupExistenceMapping")
mapping_body += func + "\n\n"

# GetOptionMapping (1207-1260)
func = get_lines(1207, 1260).replace("Private Function GetOptionMapping", "Public Function GetOptionMapping")
mapping_body += func + "\n\n"

# GetMaintenanceMapping (1261-1326)
func = get_lines(1261, 1326).replace("Private Function GetMaintenanceMapping", "Public Function GetMaintenanceMapping")
mapping_body += func + "\n\n"

# GetCategorySurveyMapping (1327-1392)
func = get_lines(1327, 1392).replace("Private Function GetCategorySurveyMapping", "Public Function GetCategorySurveyMapping")
mapping_body += func + "\n\n"

# GetItemSurveyMapping (2313-2346)
func = get_lines(2313, 2346).replace("Private Function GetItemSurveyMapping", "Public Function GetItemSurveyMapping")
mapping_body += func + "\n\n"

# GetLegalValueMapping (2392-2423)
func = get_lines(2392, 2423).replace("Private Function GetLegalValueMapping", "Public Function GetLegalValueMapping")
mapping_body += func

write_module("DataImportMapping.bas", "DataImportMapping",
             "DataImportMapping - マッピング取得関数群",
             mapping_body)


# ============================================================
# Module 3: DataImportSurvey.bas - 現地調査シートインポート
# ============================================================

survey_body = """'' =============================================
'' 現地調査シートへのデータインポート
'' 評価値、オプション、メンテナンス状況等
'' =============================================

"""

# ImportToOnsiteSurveySheet (1393-1497) → Public
func = get_lines(1393, 1497).replace("Private Sub ImportToOnsiteSurveySheet", "Public Sub ImportToOnsiteSurveySheet")
survey_body += func + "\n\n"

# ImportPropertyInfo (1498-1565) → Public
func = get_lines(1498, 1565).replace("Private Sub ImportPropertyInfo", "Public Sub ImportPropertyInfo")
survey_body += func + "\n\n"

# ImportEvaluations (1566-1641) → Public
func = get_lines(1566, 1641).replace("Private Sub ImportEvaluations", "Public Sub ImportEvaluations")
survey_body += func + "\n\n"

# GetWorstEvaluation (1642-1703)
func = get_lines(1642, 1703).replace("Private Function GetWorstEvaluation", "Public Function GetWorstEvaluation")
survey_body += func + "\n\n"

# WriteSurveyMethods (1704-1784)
func = get_lines(1704, 1784).replace("Private Sub WriteSurveyMethods", "Public Sub WriteSurveyMethods")
survey_body += func + "\n\n"

# ImportGroupExistence (1785-1846)
func = get_lines(1785, 1846).replace("Private Sub ImportGroupExistence", "Public Sub ImportGroupExistence")
survey_body += func + "\n\n"

# ImportFinishMaterials (1847-1904)
func = get_lines(1847, 1904).replace("Private Sub ImportFinishMaterials", "Public Sub ImportFinishMaterials")
survey_body += func + "\n\n"

# BuildFinishMaterialKey (1905-1954)
func = get_lines(1905, 1954).replace("Private Function BuildFinishMaterialKey", "Public Function BuildFinishMaterialKey")
survey_body += func + "\n\n"

# ImportOptions (1955-2008)
func = get_lines(1955, 2008).replace("Private Sub ImportOptions", "Public Sub ImportOptions")
survey_body += func + "\n\n"

# BuildOptionKey (2009-2164)
func = get_lines(2009, 2164).replace("Private Function BuildOptionKey", "Public Function BuildOptionKey")
survey_body += func + "\n\n"

# ImportMaintenanceStatus (2165-2250)
func = get_lines(2165, 2250).replace("Private Sub ImportMaintenanceStatus", "Public Sub ImportMaintenanceStatus")
survey_body += func + "\n\n"

# ImportCategorySurveyStatus (2251-2312)
func = get_lines(2251, 2312).replace("Private Sub ImportCategorySurveyStatus", "Public Sub ImportCategorySurveyStatus")
survey_body += func + "\n\n"

# ImportItemSurveyStatus (2347-2391)
func = get_lines(2347, 2391).replace("Private Sub ImportItemSurveyStatus", "Public Sub ImportItemSurveyStatus")
survey_body += func + "\n\n"

# ImportLegalValues (2424-2468)
func = get_lines(2424, 2468).replace("Private Sub ImportLegalValues", "Public Sub ImportLegalValues")
survey_body += func

write_module("DataImportSurvey.bas", "DataImportSurvey",
             "DataImportSurvey - 現地調査シートインポート",
             survey_body)


# ============================================================
# Module 4: DataImportDefects.bas - 不具合シート処理
# ============================================================

defects_body = """'' =============================================
'' 不具合（劣化事象）シートの作成
'' b2/c評価の不具合データをテンプレートシートにコピーして展開
'' =============================================

"""

# CreateDefectSheets (2469-2596) → Public
func = get_lines(2469, 2596).replace("Private Sub CreateDefectSheets", "Public Sub CreateDefectSheets")
defects_body += func + "\n\n"

# BuildBlueprintFloorMap (2597-2686)
func = get_lines(2597, 2686).replace("Private Function BuildBlueprintFloorMap", "Public Function BuildBlueprintFloorMap")
defects_body += func + "\n\n"

# BuildMarkerBlueprintMap (2687-2734)
func = get_lines(2687, 2734).replace("Private Function BuildMarkerBlueprintMap", "Public Function BuildMarkerBlueprintMap")
defects_body += func + "\n\n"

# BuildInspectionMap (2735-2782)
func = get_lines(2735, 2782).replace("Private Function BuildInspectionMap", "Public Function BuildInspectionMap")
defects_body += func + "\n\n"

# GetDefectFloorName (2783-2820)
func = get_lines(2783, 2820).replace("Private Function GetDefectFloorName", "Public Function GetDefectFloorName")
defects_body += func + "\n\n"

# GetDefectEvaluation (2821-2872)
func = get_lines(2821, 2872).replace("Private Function GetDefectEvaluation", "Public Function GetDefectEvaluation")
defects_body += func + "\n\n"

# AddDefectToCategory (2873-2888)
func = get_lines(2873, 2888).replace("Private Sub AddDefectToCategory", "Public Sub AddDefectToCategory")
defects_body += func + "\n\n"

# CreateDefectSheetsForFloor (2889-3010)
func = get_lines(2889, 3010).replace("Private Sub CreateDefectSheetsForFloor", "Public Sub CreateDefectSheetsForFloor")
defects_body += func + "\n\n"

# InsertDefectsToSheet (3011-3150)
func = get_lines(3011, 3150).replace("Private Sub InsertDefectsToSheet", "Public Sub InsertDefectsToSheet")
defects_body += func + "\n\n"

# GenerateImageRows (3151-3236)
func = get_lines(3151, 3236).replace("Private Function GenerateImageRows", "Public Function GenerateImageRows")
defects_body += func + "\n\n"

# InsertImageToCell (3237-3322)
func = get_lines(3237, 3322).replace("Private Sub InsertImageToCell", "Public Sub InsertImageToCell")
defects_body += func

write_module("DataImportDefects.bas", "DataImportDefects",
             "DataImportDefects - 不具合シート作成",
             defects_body)


# ============================================================
# Module 5: DataImportKeyPlan.bas - キープランシート処理
# ============================================================

keyplan_body = """'' =============================================
'' キープランシートの作成
'' 図面に不具合マーカーとサムネイルを配置
'' =============================================

"""

# CreateKeyPlanSheets (3323-3506) → Public
func = get_lines(3323, 3506).replace("Private Sub CreateKeyPlanSheets", "Public Sub CreateKeyPlanSheets")
keyplan_body += func + "\n\n"

# CreateSingleKeyPlanSheet (3507-3650)
func = get_lines(3507, 3650).replace("Private Sub CreateSingleKeyPlanSheet", "Public Sub CreateSingleKeyPlanSheet")
keyplan_body += func + "\n\n"

# ScaleShapeToFit (3651-3684)
func = get_lines(3651, 3684).replace("Private Sub ScaleShapeToFit", "Public Sub ScaleShapeToFit")
keyplan_body += func + "\n\n"

# DrawPinsAndThumbnails (3685-3952)
func = get_lines(3685, 3952).replace("Private Sub DrawPinsAndThumbnails", "Public Sub DrawPinsAndThumbnails")
keyplan_body += func

write_module("DataImportKeyPlan.bas", "DataImportKeyPlan",
             "DataImportKeyPlan - キープランシート作成",
             keyplan_body)


# ============================================================
# サマリー
# ============================================================
print("\n=== Split Summary ===")
print("DataImport.bas        - メインエントリ + 基盤関数 + 定数")
print("DataImportMapping.bas - マッピング取得関数群")
print("DataImportSurvey.bas  - 現地調査シートインポート")
print("DataImportDefects.bas - 不具合シート作成")
print("DataImportKeyPlan.bas - キープランシート作成")
print("\nIMPORTANT: VBAエディタで以下の作業が必要:")
print("1. 旧DataImportモジュールを削除")
print("2. 5つの新.basファイルをすべてインポート")
print("3. 定数・変数はDataImport.basにPublicで定義済み")
print("4. 全関数はPublicに変更済み（モジュール間呼び出し対応）")
