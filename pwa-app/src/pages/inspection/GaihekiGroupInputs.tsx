/**
 * @file GaihekiGroupInputs.tsx
 * @description 外壁グループのグループレベル入力セクション
 * 構造種別（木造/鉄筋コンクリート造/鉄骨）の選択と、
 * それに応じた外壁の種類・柱サイズ・工法等の入力を管理する。
 * GroupHeaderの直後、個別検査項目の前に表示される。
 */

import React from "react";

/** グループID定数 */
const GROUP_ID = "group_gaiheki";

/** 構造種別の選択肢 */
const STRUCTURE_TYPES = ["木造", "鉄筋コンクリート造", "鉄骨"] as const;

/** 木造: 外壁の種類 */
const MOKUZOU_WALL_TYPES = [
  "吹付タイル",
  "モルタル塗り",
  "サイディングボード",
  "その他板状",
  "タイル貼り",
] as const;

/** 木造: 柱サイズ */
const PILLAR_SIZES = ["105≧", "105＜", "120≦"] as const;

/** 木造: 外壁工法 */
const WALL_METHODS = ["通気無", "通気工法", "湿式", "乾式"] as const;

/** RC: コンクリート面仕上材 */
const RC_FINISH_TYPES = [
  "コンクリート打放(増打無)",
  "吹付タイル",
  "モルタル塗り(15mm以上)",
  "タイル貼り",
  "石貼り",
] as const;

/** 鉄骨: 外壁の種類 */
const STEEL_WALL_TYPES = [
  "PCパネル",
  "ALC板吹付仕上",
  "カーテンウォール",
  "その他湿式工法(モルタル等)",
  "乾式工法(サイディング等)",
  "ALC板タイル貼仕上",
] as const;

/** 共通: 庇の出 */
const EAVE_DEPTHS = ["300＞", "300≦", "450≦", "900≦"] as const;

/** 共通: 軒の出 */
const SOFFIT_DEPTHS = ["300＞", "300≦", "450≦", "900≦"] as const;

/** GaihekiGroupInputs コンポーネントのProps */
interface GaihekiGroupInputsProps {
  /** 項目オプション値を取得 */
  getItemOption: (itemId: string, label: string) => string | string[] | null;
  /** 項目オプション値を更新 */
  updateItemOption: (
    itemId: string,
    label: string,
    value: string | string[],
  ) => void;
}

/**
 * 外壁グループ入力セクション
 * @description グループヘッダー直後に表示する構造種別と関連入力項目。
 * データは PropertyInspectionData.options['group_gaiheki'] に保存される。
 */
const GaihekiGroupInputs: React.FC<GaihekiGroupInputsProps> = ({
  getItemOption,
  updateItemOption,
}) => {
  // --- 現在の値を取得 ---
  const structureType = getItemOption(GROUP_ID, "構造種別") as string | null;
  const mokuzouWalls =
    (getItemOption(GROUP_ID, "外壁の種類_木造") as string[] | null) || [];
  const pillarSize = getItemOption(GROUP_ID, "柱サイズ") as string | null;
  const wallMethod = getItemOption(GROUP_ID, "外壁工法") as string | null;
  const rcFinish =
    (getItemOption(GROUP_ID, "仕上材_RC") as string[] | null) || [];
  const steelWalls =
    (getItemOption(GROUP_ID, "外壁の種類_鉄骨") as string[] | null) || [];
  const eaveDepth = getItemOption(GROUP_ID, "庇の出") as string | null;
  const soffitDepth = getItemOption(GROUP_ID, "軒の出") as string | null;

  /** 単一選択ピルボタン */
  const renderSingleSelect = (
    optionKey: string,
    choices: readonly string[],
    currentValue: string | null,
  ) => (
    <div className="flex flex-wrap gap-2">
      {choices.map((choice) => {
        const isSelected = currentValue === choice;
        return (
          <button
            key={choice}
            onClick={() => updateItemOption(GROUP_ID, optionKey, choice)}
            className={`px-3 py-1 text-xs rounded-full border-2 transition font-bold ${
              isSelected
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-white text-slate-500 border-slate-300 hover:border-emerald-400"
            }`}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );

  /** 複数選択ピルボタン */
  const renderMultiSelect = (
    optionKey: string,
    choices: readonly string[],
    currentValues: string[],
  ) => (
    <div className="flex flex-wrap gap-2">
      {choices.map((choice) => {
        const isSelected = currentValues.includes(choice);
        return (
          <button
            key={choice}
            onClick={() => {
              const updated = isSelected
                ? currentValues.filter((v) => v !== choice)
                : [...currentValues, choice];
              updateItemOption(GROUP_ID, optionKey, updated);
            }}
            className={`px-3 py-1 text-xs rounded-full border-2 transition font-bold ${
              isSelected
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-slate-500 border-slate-300 hover:border-blue-400"
            }`}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white px-3 py-3 border-b border-slate-200 space-y-4">
      {/* 1. 構造種別 */}
      <div>
        <span className="text-xs text-slate-500 font-medium">構造種別</span>
        <div className="mt-1.5">
          {renderSingleSelect("構造種別", STRUCTURE_TYPES, structureType)}
        </div>
      </div>

      {/* 2. 木造の場合 */}
      {structureType === "木造" && (
        <div className="ml-2 border-l-2 border-emerald-200 pl-3 space-y-3">
          <div>
            <span className="text-xs text-slate-500 font-medium">
              外壁の種類（過半部）
            </span>
            <div className="mt-1.5">
              {renderMultiSelect(
                "外壁の種類_木造",
                MOKUZOU_WALL_TYPES,
                mokuzouWalls,
              )}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">
              柱サイズ（不明の場合は空欄）
            </span>
            <div className="mt-1.5">
              {renderSingleSelect("柱サイズ", PILLAR_SIZES, pillarSize)}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">外壁</span>
            <div className="mt-1.5">
              {renderSingleSelect("外壁工法", WALL_METHODS, wallMethod)}
            </div>
          </div>
        </div>
      )}

      {/* 3. 鉄筋コンクリート造の場合 */}
      {structureType === "鉄筋コンクリート造" && (
        <div className="ml-2 border-l-2 border-emerald-200 pl-3">
          <div>
            <span className="text-xs text-slate-500 font-medium">
              コンクリート面仕上材の種類（過半部）
            </span>
            <div className="mt-1.5">
              {renderMultiSelect("仕上材_RC", RC_FINISH_TYPES, rcFinish)}
            </div>
          </div>
        </div>
      )}

      {/* 4. 鉄骨の場合 */}
      {structureType === "鉄骨" && (
        <div className="ml-2 border-l-2 border-emerald-200 pl-3">
          <div>
            <span className="text-xs text-slate-500 font-medium">
              外壁の種類（過半部）
            </span>
            <div className="mt-1.5">
              {renderMultiSelect(
                "外壁の種類_鉄骨",
                STEEL_WALL_TYPES,
                steelWalls,
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. 共通（複数箇所の平均） */}
      <div>
        <p className="text-xs text-slate-400 font-medium mb-2">
          共通（複数箇所の平均）
        </p>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-slate-500 font-medium">
              庇の出（目測）
            </span>
            <div className="mt-1.5">
              {renderSingleSelect("庇の出", EAVE_DEPTHS, eaveDepth)}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">
              軒の出（目測）
            </span>
            <div className="mt-1.5">
              {renderSingleSelect("軒の出", SOFFIT_DEPTHS, soffitDepth)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GaihekiGroupInputs;
