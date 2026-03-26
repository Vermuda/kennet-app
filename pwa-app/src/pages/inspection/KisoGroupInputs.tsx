/**
 * @file KisoGroupInputs.tsx
 * @description 基礎グループのグループレベル入力セクション
 * 仕上材の種類（複数選択可）を管理する。
 * GroupHeaderの直後、個別検査項目の前に表示される。
 */

import React from "react";
import { KISO_FINISH_MATERIALS } from "./inspectionConstants";

/** グループID定数 */
const GROUP_ID = "group_kiso";

/** KisoGroupInputs コンポーネントのProps */
interface KisoGroupInputsProps {
  /** 仕上げ材選択状態を取得 */
  getFinishMaterials: (groupId: string) => string[];
  /** 仕上げ材選択をトグル */
  toggleFinishMaterial: (groupId: string, material: string) => void;
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
 * 基礎グループ入力セクション
 * @description グループヘッダー直後に表示する仕上材の種類入力。
 * 選択状態は PropertyInspectionData.finishMaterials['group_kiso'] に保存される。
 */
const KisoGroupInputs: React.FC<KisoGroupInputsProps> = ({
  getFinishMaterials,
  toggleFinishMaterial,
  getItemOption,
  updateItemOption,
}) => {
  const selectedMaterials = getFinishMaterials(GROUP_ID);
  const isOtherSelected = selectedMaterials.includes("その他仕上げ");

  return (
    <div className="bg-white px-3 py-3 border-b border-slate-200 space-y-4">
      {/* 仕上材の種類 */}
      <div>
        <span className="text-xs text-slate-500 font-medium">
          仕上材の種類（過半部）
        </span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {KISO_FINISH_MATERIALS.map((material) => {
            const isSelected = selectedMaterials.includes(material);
            return (
              <button
                key={material}
                onClick={() => toggleFinishMaterial(GROUP_ID, material)}
                className={`px-3 py-1 text-xs rounded-full border-2 transition font-bold ${
                  isSelected
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-slate-500 border-slate-300 hover:border-emerald-400"
                }`}
              >
                {material}
              </button>
            );
          })}
        </div>
        {isOtherSelected && (
          <div className="mt-2">
            <input
              type="text"
              value={
                (getItemOption(GROUP_ID, "その他仕上げ詳細") as string) || ""
              }
              onChange={(e) =>
                updateItemOption(GROUP_ID, "その他仕上げ詳細", e.target.value)
              }
              placeholder="仕上げの種類を入力"
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default KisoGroupInputs;
