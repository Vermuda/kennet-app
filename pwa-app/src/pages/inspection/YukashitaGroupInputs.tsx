/**
 * @file YukashitaGroupInputs.tsx
 * @description 床下点検口グループのグループレベル入力セクション
 * スコープ調査実施、スコープ調査方面、基礎形式、換気方法、断熱工法の5項目を管理する。
 * GroupHeaderの直後、個別検査項目の前に表示される。
 */

import React from 'react';
import {
  YUKASHITA_SCOPE_CHOICES,
  YUKASHITA_SCOPE_DIRECTIONS,
  YUKASHITA_FOUNDATION_TYPES,
  YUKASHITA_VENTILATION_METHODS,
  YUKASHITA_INSULATION_METHODS,
} from './inspectionConstants';

/** グループID定数 */
const GROUP_ID = 'group_yukashita';

/** YukashitaGroupInputs コンポーネントのProps */
interface YukashitaGroupInputsProps {
  /** 項目オプション値を取得 */
  getItemOption: (itemId: string, label: string) => string | string[] | null;
  /** 項目オプション値を更新 */
  updateItemOption: (itemId: string, label: string, value: string | string[]) => void;
}

/**
 * 床下点検口グループ入力セクション
 * @description グループヘッダー直後に表示する5つの共通入力項目。
 * データは PropertyInspectionData.options['group_yukashita'] に保存される。
 */
const YukashitaGroupInputs: React.FC<YukashitaGroupInputsProps> = ({
  getItemOption,
  updateItemOption,
}) => {
  // --- 現在の値を取得 ---
  const scopeSurvey = getItemOption(GROUP_ID, 'スコープ調査実施') as string | null;
  const scopeReason = (getItemOption(GROUP_ID, 'スコープ不可理由') as string) || '';
  const scopeDirections = (getItemOption(GROUP_ID, 'スコープ調査方面') as string[] | null) || [];
  const foundationType = getItemOption(GROUP_ID, '基礎形式') as string | null;
  const foundationOther = (getItemOption(GROUP_ID, '基礎形式その他') as string) || '';
  const ventilation = getItemOption(GROUP_ID, '換気方法') as string | null;
  const insulation = getItemOption(GROUP_ID, '断熱工法') as string | null;

  /** スコープ調査方面のトグル（複数選択） */
  const toggleDirection = (dir: string) => {
    const updated = scopeDirections.includes(dir)
      ? scopeDirections.filter(d => d !== dir)
      : [...scopeDirections, dir];
    updateItemOption(GROUP_ID, 'スコープ調査方面', updated);
  };

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

      {/* 2. スコープ調査方面 */}
      <div>
        <span className="text-xs text-slate-500 font-medium">スコープ調査</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {YUKASHITA_SCOPE_DIRECTIONS.map(dir => {
            const isSelected = scopeDirections.includes(dir);
            return (
              <button
                key={dir}
                onClick={() => toggleDirection(dir)}
                className={`px-3 py-1 text-xs rounded-full border-2 transition font-bold ${
                  isSelected
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-500 border-slate-300 hover:border-blue-400'
                }`}
              >
                {dir}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 基礎形式 */}
      <div>
        <span className="text-xs text-slate-500 font-medium">基礎形式</span>
        <div className="mt-1.5">
          {renderSingleSelect('基礎形式', YUKASHITA_FOUNDATION_TYPES, foundationType)}
        </div>
        {foundationType === 'その他' && (
          <div className="mt-2">
            <input
              type="text"
              value={foundationOther}
              onChange={(e) => updateItemOption(GROUP_ID, '基礎形式その他', e.target.value)}
              placeholder="基礎形式の内容を入力"
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* 4. 換気方法 */}
      <div>
        <span className="text-xs text-slate-500 font-medium">換気方法</span>
        <div className="mt-1.5">
          {renderSingleSelect('換気方法', YUKASHITA_VENTILATION_METHODS, ventilation)}
        </div>
      </div>

      {/* 5. 断熱工法 */}
      <div>
        <span className="text-xs text-slate-500 font-medium">断熱工法</span>
        <div className="mt-1.5">
          {renderSingleSelect('断熱工法', YUKASHITA_INSULATION_METHODS, insulation)}
        </div>
      </div>
    </div>
  );
};

export default YukashitaGroupInputs;
