/**
 * @file OkujouGroupInputs.tsx
 * @description 屋上グループのグループレベル入力セクション
 * 防水工法と確認方法の2項目を管理する。
 * GroupHeaderの直後、個別検査項目の前に表示される。
 */

import React from "react";

/** グループID定数 */
const GROUP_ID = "group_okujou";

/** 防水工法の選択肢 */
const WATERPROOF_METHODS = [
  "アスファルト防水",
  "シート防水",
  "塗膜防水",
  "FRP防水",
  "その他",
] as const;

/** 確認方法の選択肢 */
const INSPECTION_METHODS = [
  "屋上にて目視確認",
  "撮影棒による画像確認",
  "実施不可",
] as const;

/** OkujouGroupInputs コンポーネントのProps */
interface OkujouGroupInputsProps {
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
 * 屋上グループ入力セクション
 * @description グループヘッダー直後に表示する防水工法と確認方法の入力。
 * データは PropertyInspectionData.options['group_okujou'] に保存される。
 */
const OkujouGroupInputs: React.FC<OkujouGroupInputsProps> = ({
  getItemOption,
  updateItemOption,
}) => {
  const waterproof = getItemOption(GROUP_ID, "防水工法") as string | null;
  const waterproofOther =
    (getItemOption(GROUP_ID, "防水工法その他") as string) || "";
  const inspectionMethod = getItemOption(GROUP_ID, "確認方法") as string | null;
  const inspectionReason =
    (getItemOption(GROUP_ID, "確認不可理由") as string) || "";

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

  return (
    <div className="bg-white px-3 py-3 border-b border-slate-200 space-y-4">
      {/* 1. 防水工法 */}
      <div>
        <span className="text-xs text-slate-500 font-medium">
          防水工法（主たる工法）
        </span>
        <div className="mt-1.5">
          {renderSingleSelect("防水工法", WATERPROOF_METHODS, waterproof)}
        </div>
        {waterproof === "その他" && (
          <div className="mt-2">
            <input
              type="text"
              value={waterproofOther}
              onChange={(e) =>
                updateItemOption(GROUP_ID, "防水工法その他", e.target.value)
              }
              placeholder="防水工法の内容を入力"
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* 2. 確認方法 */}
      <div>
        <p className="text-xs text-slate-500 font-medium">
          階段から屋上に登れる場合は目視での調査
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          不可の場合は撮影棒による共用廊下等からの画像確認
        </p>
        <div className="mt-1.5">
          {renderSingleSelect("確認方法", INSPECTION_METHODS, inspectionMethod)}
        </div>
        {inspectionMethod === "実施不可" && (
          <div className="mt-2">
            <label className="text-xs text-slate-500">不可理由</label>
            <input
              type="text"
              value={inspectionReason}
              onChange={(e) =>
                updateItemOption(GROUP_ID, "確認不可理由", e.target.value)
              }
              placeholder="不可理由を入力"
              className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OkujouGroupInputs;
