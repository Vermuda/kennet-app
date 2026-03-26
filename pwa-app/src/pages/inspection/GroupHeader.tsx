/**
 * @file GroupHeader.tsx
 * @description グループヘッダー（有/無選択UI + 調査実施/不可トグル）コンポーネント
 * 擁壁、駐車場等の有無選択、基礎グループの仕上げ材選択、屋外階段の設置有無、
 * およびグループ単位の調査実施/不可トグルを表示する。
 */

import React from 'react';
import type { CategorySurveyStatus } from '../../types/inspectionData';

/** GroupHeader コンポーネントのProps */
interface GroupHeaderProps {
  /** グループID */
  groupId: string;
  /** グループ表示ラベル */
  groupLabel: string;
  /** グループの有無選択状態（null = 未選択） */
  groupExistence: { exists: boolean } | null;
  /** グループ有無を更新 */
  onUpdateGroupExistence: (groupId: string, exists: boolean) => void;
  /** 項目オプション値を取得 */
  getItemOption: (itemId: string, label: string) => string | string[] | null;
  /** 項目オプション値を更新 */
  updateItemOption: (itemId: string, label: string, value: string | string[]) => void;
  /** グループ単位の調査実施/不可トグルが必要か */
  needsSurveyToggle?: boolean;
  /** グループの調査実施状況 */
  surveyStatus?: CategorySurveyStatus;
  /** 調査実施/不可を切り替え */
  onToggleSurveyConducted?: (groupId: string, conducted: boolean) => void;
  /** 不可理由の編集を開始 */
  onEditSurveyReason?: (groupId: string, currentReason: string) => void;
  /** トースト表示 */
  toast?: (msg: string) => void;
}

/**
 * 調査実施/不可のコンパクトトグルUI
 */
const SurveyToggleButtons: React.FC<{
  groupId: string;
  groupLabel: string;
  surveyStatus: CategorySurveyStatus;
  onToggleConducted: (groupId: string, conducted: boolean) => void;
  onEditReason: (groupId: string, currentReason: string) => void;
  toast?: (msg: string) => void;
}> = ({ groupId, groupLabel, surveyStatus, onToggleConducted, onEditReason, toast }) => {
  const isDisabled = !surveyStatus.conducted;

  const handleToggle = (conducted: boolean) => {
    if (conducted) {
      if (isDisabled) {
        if (!window.confirm(`${groupLabel}の調査実施に変更しますか？`)) return;
      }
      onToggleConducted(groupId, true);
      toast?.(`${groupLabel}: 調査実施に変更`);
    } else {
      onEditReason(groupId, surveyStatus.notConductedReason || '');
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-slate-500 font-medium">調査</span>
      <button
        onClick={() => handleToggle(true)}
        className={`px-2 py-0.5 text-[10px] rounded-full border transition font-bold ${
          !isDisabled
            ? 'bg-emerald-500 text-white border-emerald-500'
            : 'bg-white text-slate-400 border-slate-300 hover:border-emerald-400'
        }`}
      >
        実施
      </button>
      <button
        onClick={() => handleToggle(false)}
        className={`px-2 py-0.5 text-[10px] rounded-full border transition font-bold ${
          isDisabled
            ? 'bg-red-500 text-white border-red-500'
            : 'bg-white text-slate-400 border-slate-300 hover:border-red-400'
        }`}
      >
        不可
      </button>
      {isDisabled && surveyStatus.notConductedReason && (
        <button
          onClick={(e) => { e.stopPropagation(); onEditReason(groupId, surveyStatus.notConductedReason || ''); }}
          className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded truncate max-w-[80px]"
          title={surveyStatus.notConductedReason}
        >
          {surveyStatus.notConductedReason}
        </button>
      )}
    </div>
  );
};

/**
 * グループヘッダーコンポーネント
 */
const GroupHeader: React.FC<GroupHeaderProps> = ({
  groupId,
  groupLabel,
  groupExistence,
  onUpdateGroupExistence,
  getItemOption,
  updateItemOption,
  needsSurveyToggle = false,
  surveyStatus,
  onToggleSurveyConducted,
  onEditSurveyReason,
  toast,
}) => {
  const isOkugaiKaidan = groupId === 'group_okugai_kaidan';
  const isKiso = groupId === 'group_kiso';
  const isExists = groupExistence?.exists ?? null;

  const surveyToggle = needsSurveyToggle && surveyStatus && onToggleSurveyConducted && onEditSurveyReason ? (
    <SurveyToggleButtons
      groupId={groupId}
      groupLabel={groupLabel}
      surveyStatus={surveyStatus}
      onToggleConducted={onToggleSurveyConducted}
      onEditReason={onEditSurveyReason}
      toast={toast}
    />
  ) : null;

  // 屋外階段グループ: 設置の該当有/該当無 専用UI（トグルなし）
  if (isOkugaiKaidan) {
    const settingVal = getItemOption('item72', '設置') as string | null;
    return (
      <div key={`group-header-${groupId}`} className="bg-slate-100 px-3 py-2 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 text-sm">{groupLabel}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">設置</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateItemOption('item72', '設置', '該当有')}
              className={`px-3 py-1 text-xs rounded-full border-2 transition font-bold ${
                settingVal === '該当有'
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white text-slate-500 border-slate-300 hover:border-emerald-400'
              }`}
            >
              該当有
            </button>
            <button
              onClick={() => updateItemOption('item72', '設置', '該当無')}
              className={`px-3 py-1 text-xs rounded-full border-2 transition font-bold ${
                settingVal === '該当無'
                  ? 'bg-slate-500 text-white border-slate-500'
                  : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400'
              }`}
            >
              該当無
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 基礎・外壁グループ: ラベル + 調査トグル（詳細入力は専用コンポーネントで行う）
  if (isKiso || groupId === 'group_gaiheki') {
    return (
      <div key={`group-header-${groupId}`} className="bg-slate-100 px-3 py-2 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 text-sm">{groupLabel}</span>
          {surveyToggle}
        </div>
      </div>
    );
  }

  // 共用部廊下等グループ: ラベル + 調査トグル（有無選択なし）
  if (groupId === 'group_kyoyobu') {
    return (
      <div key={`group-header-${groupId}`} className="bg-slate-100 px-3 py-2 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 text-sm">{groupLabel}</span>
          {surveyToggle}
        </div>
      </div>
    );
  }

  // 通常グループ: 有/無選択 + 調査トグル
  return (
    <div key={`group-header-${groupId}`} className="bg-slate-100 px-3 py-2 border-b border-slate-200">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-700 text-sm">{groupLabel}</span>
        <div className="flex items-center gap-3">
          {surveyToggle}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateGroupExistence(groupId, true)}
              className={`px-3 py-1 text-xs rounded-full border-2 transition font-bold ${
                isExists === true
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white text-slate-500 border-slate-300 hover:border-emerald-400'
              }`}
            >
              有
            </button>
            <button
              onClick={() => onUpdateGroupExistence(groupId, false)}
              className={`px-3 py-1 text-xs rounded-full border-2 transition font-bold ${
                isExists === false
                  ? 'bg-slate-500 text-white border-slate-500'
                  : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400'
              }`}
            >
              無
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupHeader;
