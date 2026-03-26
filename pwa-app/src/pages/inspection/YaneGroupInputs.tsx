/**
 * @file YaneGroupInputs.tsx
 * @description 屋根グループのグループレベル入力セクション
 * 屋根仕様と撮影棒による画像確認の2項目を管理する。
 * GroupHeaderの直後、個別検査項目の前に表示される。
 */

import React from "react";

/** グループID定数 */
const GROUP_ID = "group_yane";

/** 屋根仕様の選択肢 */
const ROOF_TYPES = [
  "陸屋根",
  "金属板葺き",
  "トタン",
  "スレート瓦屋根",
  "桟瓦葺き",
  "その他",
] as const;

/** 撮影棒確認の選択肢 */
const PHOTO_ROD_CHOICES = ["実施可", "実施不可"] as const;

/** YaneGroupInputs コンポーネントのProps */
interface YaneGroupInputsProps {
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
 * 屋根グループ入力セクション
 * @description グループヘッダー直後に表示する屋根仕様と撮影棒確認の入力。
 * データは PropertyInspectionData.options['group_yane'] に保存される。
 */
const YaneGroupInputs: React.FC<YaneGroupInputsProps> = ({
  getItemOption,
  updateItemOption,
}) => {
  const roofType = getItemOption(GROUP_ID, "屋根仕様") as string | null;
  const roofOther = (getItemOption(GROUP_ID, "屋根仕様その他") as string) || "";
  const photoRod = getItemOption(GROUP_ID, "撮影棒確認") as string | null;
  const photoRodReason =
    (getItemOption(GROUP_ID, "撮影棒不可理由") as string) || "";

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
      {/* 1. 屋根仕様 */}
      <div>
        <span className="text-xs text-slate-500 font-medium">
          屋根仕様（主たる屋根）
        </span>
        <div className="mt-1.5">
          {renderSingleSelect("屋根仕様", ROOF_TYPES, roofType)}
        </div>
        {roofType === "その他" && (
          <div className="mt-2">
            <input
              type="text"
              value={roofOther}
              onChange={(e) =>
                updateItemOption(GROUP_ID, "屋根仕様その他", e.target.value)
              }
              placeholder="屋根仕様の内容を入力"
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* 2. 撮影棒による画像確認 */}
      <div>
        <p className="text-xs text-slate-500 font-medium">
          撮影棒による共用廊下等からの画像確認
        </p>
        <div className="mt-1.5">
          {renderSingleSelect("撮影棒確認", PHOTO_ROD_CHOICES, photoRod)}
        </div>
        {photoRod === "実施不可" && (
          <div className="mt-2">
            <label className="text-xs text-slate-500">不可理由</label>
            <input
              type="text"
              value={photoRodReason}
              onChange={(e) =>
                updateItemOption(GROUP_ID, "撮影棒不可理由", e.target.value)
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

export default YaneGroupInputs;
