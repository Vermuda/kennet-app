/**
 * @file KoyauraGroupInputs.tsx
 * @description 小屋裏・天井点検口グループのグループレベル入力セクション
 * スコープ調査実施、小屋裏・軒裏換気口の設置の2項目を管理する。
 * GroupHeaderの直後、個別検査項目の前に表示される。
 */

import React from 'react';
import {
  YUKASHITA_SCOPE_CHOICES,
  KOYAURA_VENTILATION_CHOICES,
} from './inspectionConstants';

/** グループID定数 */
const GROUP_ID = 'group_koyaura';

/** KoyauraGroupInputs コンポーネントのProps */
interface KoyauraGroupInputsProps {
  /** 項目オプション値を取得 */
  getItemOption: (itemId: string, label: string) => string | string[] | null;
  /** 項目オプション値を更新 */
  updateItemOption: (itemId: string, label: string, value: string | string[]) => void;
}

/**
 * 小屋裏・天井点検口グループ入力セクション
 * @description グループヘッダー直後に表示する2つの共通入力項目。
 * データは PropertyInspectionData.options['group_koyaura'] に保存される。
 */
const KoyauraGroupInputs: React.FC<KoyauraGroupInputsProps> = ({
  getItemOption,
  updateItemOption,
}) => {
  // --- 現在の値を取得 ---
  const scopeSurvey = getItemOption(GROUP_ID, 'スコープ調査実施') as string | null;
  const scopeReason = (getItemOption(GROUP_ID, 'スコープ不可理由') as string) || '';
  const ventilation = getItemOption(GROUP_ID, '換気口設置') as string | null;

  /** 単一選択ピルボタングループのレンダリング */
  const renderSingleSelect = (
    optionKey: string,
    choices: readonly string[],
    currentValue: string | null,
  ) => (
    <div className="flex flex-wrap gap-2">
      {choices.map(choice => {
        const isSelected = currentValue === choice;
        return (
          <button
            key={choice}
            onClick={() => updateItemOption(GROUP_ID, optionKey, choice)}
            className={`px-3 py-1 text-xs rounded-full border-2 transition font-bold ${
              isSelected
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white text-slate-500 border-slate-300 hover:border-emerald-400'
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
      {/* 1. スコープ調査実施 */}
      <div>
        <p className="text-xs text-slate-500 font-medium">
          点検口が使用できない場合、スコープによる調査を実施
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          ※床下内スコープ調査は、北面を優先とし、2面を実施
        </p>
        <div className="mt-1.5">
          {renderSingleSelect('スコープ調査実施', YUKASHITA_SCOPE_CHOICES, scopeSurvey)}
        </div>
        {scopeSurvey === '実施不可' && (
          <div className="mt-2">
            <label className="text-xs text-slate-500">不可理由</label>
            <input
              type="text"
              value={scopeReason}
              onChange={(e) => updateItemOption(GROUP_ID, 'スコープ不可理由', e.target.value)}
              placeholder="不可理由を入力"
              className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* 2. 小屋裏・軒裏換気口の設置 */}
      <div>
        <span className="text-xs text-slate-500 font-medium">小屋裏・軒裏換気口の設置</span>
        <div className="mt-1.5">
          {renderSingleSelect('換気口設置', KOYAURA_VENTILATION_CHOICES, ventilation)}
        </div>
      </div>
    </div>
  );
};

export default KoyauraGroupInputs;
