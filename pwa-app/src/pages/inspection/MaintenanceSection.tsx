/**
 * @file MaintenanceSection.tsx
 * @description メンテナンスの有無・補修改修実施状況セクションコンポーネント
 *
 * 検査チェックシートにおけるメンテナンス状況の入力UIを提供する。
 * 各項目について「補修・改修の要/不要」と「実施済の場合の状態（良好/問題無/不備有）」を選択できる。
 * 点検口・屋根・屋上のサブ項目は調査実施可/不可に連動したチェック表示を持つ。
 */

import { MAINTENANCE_ITEMS } from './inspectionConstants';
import type { MaintenanceItem } from './inspectionConstants';
import type { CategoryMaintenanceStatus } from '../../types/inspectionData';

/**
 * MaintenanceSectionコンポーネントのProps
 */
interface MaintenanceSectionProps {
  /** 指定IDのメンテナンス状況を取得する */
  getMaintenanceStatus: (id: string) => CategoryMaintenanceStatus;
  /** 指定IDのメンテナンス状況を更新する */
  updateMaintenanceStatus: (id: string, updates: Partial<CategoryMaintenanceStatus>) => void;
  /** グループの有無選択状態を取得する（メンテナンスチェック連動用） */
  getGroupExistence?: (groupId: string) => { exists: boolean } | null;
}

/**
 * 調査実施チェックボックスを描画する
 * @param conducted - 実施済みかどうか
 */
function ConductedCheckbox({ conducted }: { conducted: boolean }) {
  return (
    <span className={`inline-block w-3.5 h-3.5 border-2 rounded-sm flex-shrink-0 ${
      conducted
        ? 'bg-emerald-500 border-emerald-500'
        : 'border-slate-300 bg-white'
    }`}>
      {conducted && (
        <svg className="w-full h-full" viewBox="0 0 14 14" fill="none">
          <path d="M3 7l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </span>
  );
}

/**
 * 補修・改修ボタングループを描画する
 */
function MaintenanceButtons({ id, status, updateMaintenanceStatus }: {
  id: string;
  status: CategoryMaintenanceStatus;
  updateMaintenanceStatus: (id: string, updates: Partial<CategoryMaintenanceStatus>) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {/* 補修・改修の要・不要 */}
      <div className="flex items-center gap-1">
        <span className="text-slate-500 text-xs mr-1">補修・改修:</span>
        <button
          onClick={() => updateMaintenanceStatus(id, { need: 'required' })}
          className={`px-3 py-1 rounded border transition text-xs font-bold ${
            status.need === 'required'
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-white text-slate-600 border-slate-300'
          }`}
        >
          要
        </button>
        <button
          onClick={() => updateMaintenanceStatus(id, { need: 'not_required' })}
          className={`px-3 py-1 rounded border transition text-xs font-bold ${
            status.need === 'not_required'
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-white text-slate-600 border-slate-300'
          }`}
        >
          不要
        </button>
      </div>
      {/* 補修・改修を実施済である場合 */}
      <div className="flex items-center gap-1">
        <span className="text-slate-500 text-xs mr-1">実施済:</span>
        <button
          onClick={() => updateMaintenanceStatus(id, { condition: 'good' })}
          className={`px-2 py-1 rounded border transition text-xs font-bold ${
            status.condition === 'good'
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-white text-slate-600 border-slate-300'
          }`}
        >
          良好
        </button>
        <button
          onClick={() => updateMaintenanceStatus(id, { condition: 'no_issue' })}
          className={`px-2 py-1 rounded border transition text-xs font-bold ${
            status.condition === 'no_issue'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-slate-600 border-slate-300'
          }`}
        >
          問題無
        </button>
      </div>
    </div>
  );
}

/**
 * メンテナンス項目の1行を表示するコンポーネント
 */
function MaintenanceRow({ item, status, updateMaintenanceStatus, getGroupExistence }: {
  item: MaintenanceItem;
  status: CategoryMaintenanceStatus;
  updateMaintenanceStatus: (id: string, updates: Partial<CategoryMaintenanceStatus>) => void;
  getGroupExistence?: (groupId: string) => { exists: boolean } | null;
}) {
  const hasSubGroups = item.subGroups && item.subGroups.length > 0;

  return (
    <div className="border-b border-slate-200 py-3 px-4">
      <div className="flex flex-col gap-2">
        {/* ラベル行 */}
        <div className="font-bold text-slate-700 text-sm">
          {item.label}
          {item.subLabel && (
            <span className="text-slate-500 font-normal ml-2 text-xs">{item.subLabel}</span>
          )}
        </div>

        {/* サブグループのチェックボックス（点検口・屋根・屋上） */}
        {hasSubGroups && (
          <div className="flex flex-col gap-1 ml-2">
            {item.subGroups!.map(sub => {
              const conducted = getGroupExistence
                ? getGroupExistence(sub.groupId)?.exists === true
                : false;
              return (
                <div key={sub.groupId} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ConductedCheckbox conducted={conducted} />
                  <span>{sub.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* 補修・改修ボタン */}
        <MaintenanceButtons
          id={item.id}
          status={status}
          updateMaintenanceStatus={updateMaintenanceStatus}
        />
      </div>
    </div>
  );
}

/**
 * メンテナンスの有無・補修改修実施状況セクション
 *
 * 全メンテナンス項目を一覧表示し、各項目の補修・改修の要否と
 * 実施済の場合の状態を入力できるUIを提供する。
 * 点検口・屋根・屋上のサブ項目には調査実施チェックが連動表示される。
 */
function MaintenanceSection({ getMaintenanceStatus, updateMaintenanceStatus, getGroupExistence }: MaintenanceSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3">
        <h3 className="font-bold text-lg">メンテナンスの有無・補修改修実施状況</h3>
      </div>
      <div>
        {MAINTENANCE_ITEMS.map(item => (
          <MaintenanceRow
            key={item.id}
            item={item}
            status={getMaintenanceStatus(item.id)}
            updateMaintenanceStatus={updateMaintenanceStatus}
            getGroupExistence={getGroupExistence}
          />
        ))}
      </div>
      <div className="px-4 py-2 bg-slate-50 text-[10px] text-slate-400">
        ※補修・改修の要・不要は現地の劣化状況により判断<br />
        ※1 調査実施不可の場合は、チェックボックスが空欄となります。
      </div>
    </div>
  );
}

export default MaintenanceSection;
