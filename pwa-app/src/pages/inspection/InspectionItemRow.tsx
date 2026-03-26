/**
 * @file InspectionItemRow.tsx
 * @description 検査項目1行のレンダリングコンポーネント
 * 項目番号、名前、説明、評価バッジの表示と、無効化状態のオーバーレイを管理する。
 */

import React from 'react';
import type { InspectionItem, InspectionEvaluation } from '../../types/inspectionData';

/** InspectionItemRow コンポーネントのProps */
interface InspectionItemRowProps {
  /** 検査項目データ */
  item: InspectionItem;
  /** この項目の現在の評価リスト */
  evals: InspectionEvaluation[];
  /** グループ有無選択で無効化されているか */
  isDisabledByGroup: boolean;
  /** 仕上げ材未選択で無効化されているか */
  isDisabledByFinish: boolean;
  /** オプション選択（屋外階段等）で無効化されているか */
  isDisabledByOption: boolean;
  /** カテゴリ全体が無効化されているか */
  isCategoryDisabled: boolean;
  /** タブレット用の大きいカードレイアウトを使うか */
  isLarge?: boolean;
  /** 項目クリック時に評価モーダルを開く */
  onOpenModal: (itemId: string) => void;
  /** 評価を編集する */
  onEditEvaluation?: (itemId: string, evalIndex: number) => void;
}

/** 評価バッジの背景色マッピング */
const BADGE_COLORS: Record<string, string> = {
  'a': 'bg-emerald-500', 'b1': 'bg-blue-500', 'b2': 'bg-amber-500', 'c': 'bg-red-500', 'na': 'bg-slate-400',
  'S': 'bg-emerald-500', 'A': 'bg-blue-500', 'B': 'bg-amber-500', 'C': 'bg-red-500',
  'none': 'bg-emerald-500', 'concern': 'bg-red-500',
  '30cm＞': 'bg-blue-500', '30cm≦': 'bg-blue-500', '40cm≦': 'bg-emerald-500',
};

/**
 * 評価バッジを1つレンダリングする
 * @param item - 検査項目
 * @param e - 評価データ
 * @param idx - 評価インデックス
 * @param onEdit - 編集コールバック
 */
const renderEvalBadge = (
  item: InspectionItem,
  e: InspectionEvaluation,
  idx: number,
  onEdit?: (itemId: string, evalIndex: number) => void,
) => {
  // シュミットハンマー専用表示
  if (item.evalType === 'schmidt') {
    const schmidtVals = e.schmidtValues || [];
    const isComplete = schmidtVals.length === 9;
    const schmidtLabel = isComplete ? '入力済み' : '入力不足';
    const schmidtColor = isComplete
      ? 'bg-blue-500 text-white'
      : 'border-2 border-yellow-500 bg-yellow-50 text-yellow-700';

    return (
      <span
        key={e.id}
        className={`${schmidtColor} text-xs px-5 py-2.5 rounded-full flex items-center gap-2 cursor-pointer min-h-[40px]`}
        onClick={(ev) => { ev.stopPropagation(); onEdit?.(item.id, idx); }}
      >
        {schmidtLabel}
      </span>
    );
  }

  // item101: 資料値・実測値があれば「入力済」表示
  if (item.id === 'item101' && e.eval === 'freetext') {
    const hasValues = e.legalDocValue !== undefined || e.legalMeasuredValue !== undefined;
    if (hasValues) {
      return (
        <span
          key={e.id}
          className="bg-blue-500 text-white text-xs px-5 py-2.5 rounded-full flex items-center gap-2 cursor-pointer min-h-[40px]"
          onClick={(ev) => { ev.stopPropagation(); onEdit?.(item.id, idx); }}
        >
          入力済{e.freetextContent ? '(懸念有)' : ''}
        </span>
      );
    }
  }

  // 通常の評価バッジ
  const colors: Record<string, string> = {
    ...BADGE_COLORS,
    'freetext': e.freetextContent ? 'bg-red-500' : 'bg-emerald-500',
  };

  let label: string;
  if (item.evalType === 'rebar' && e.eval === 'measured') {
    label = e.rebarPitch ? `${e.rebarPitch}cm` : 'measured';
  } else if (e.eval === 'freetext') {
    label = e.freetextContent ? '懸念有' : '懸念無';
  } else if (e.eval === 'na') {
    label = '−';
  } else if (e.eval === 'none') {
    label = '無';
  } else if (e.eval === 'concern') {
    label = '有';
  } else {
    label = e.eval;
  }

  const displayContent = e.eval === 'freetext' && e.freetextContent
    ? e.freetextContent.substring(0, 10) + (e.freetextContent.length > 10 ? '...' : '')
    : '';

  return (
    <span
      key={e.id}
      className={`${colors[e.eval] || 'bg-slate-400'} text-white text-xs px-5 py-2.5 rounded-full flex items-center gap-2 cursor-pointer min-h-[40px]`}
      onClick={(ev) => { ev.stopPropagation(); onEdit?.(item.id, idx); }}
    >
      {label}{displayContent && `: ${displayContent}`}
    </span>
  );
};

/**
 * 検査項目1行コンポーネント
 * @description 項目番号バッジ、名前、説明、評価バッジ一覧を表示。
 * 無効化状態ではグレーのオーバーレイを重ねる。
 */
const InspectionItemRow: React.FC<InspectionItemRowProps> = ({
  item,
  evals,
  isDisabledByGroup,
  isDisabledByFinish,
  isDisabledByOption,
  isCategoryDisabled,
  isLarge = false,
  onOpenModal,
  onEditEvaluation,
}) => {
  const hasEvals = evals.length > 0;
  const isDisabled = isCategoryDisabled || isDisabledByGroup || isDisabledByFinish || isDisabledByOption;
  const isVisuallyDisabled = isDisabledByGroup || isDisabledByFinish || isDisabledByOption;

  const handleClick = () => {
    if (!isDisabled) onOpenModal(item.id);
  };

  return (
    <div
      id={`inspection-item-${item.id}`}
      className={`p-3 relative ${!hasEvals ? 'bg-slate-50/50' : ''} ${isLarge ? 'bg-white rounded-xl shadow-sm mb-2' : ''}`}
    >
      {isVisuallyDisabled && (
        <div className="absolute inset-0 bg-gray-400/40 z-10 pointer-events-none" />
      )}

      <div className="flex justify-between items-start gap-2">
        <div className={`flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={handleClick}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-6 h-6 rounded ${hasEvals ? 'bg-emerald-500' : isVisuallyDisabled ? 'bg-slate-400' : 'bg-slate-300'} text-white text-xs flex items-center justify-center font-bold`}>{item.num}</span>
            <h4 className={`font-bold text-sm ${isVisuallyDisabled ? 'text-slate-400' : 'text-slate-800'}`}>{item.name}</h4>
            {hasEvals && !isVisuallyDisabled && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{evals.length}件</span>}
          </div>
          <p className={`text-xs mt-1 ml-8 whitespace-pre-line ${isVisuallyDisabled ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
          {item.sub && <p className={`text-xs mt-0.5 ml-8 ${isVisuallyDisabled ? 'text-slate-400' : 'text-blue-500'}`}>{item.sub}</p>}
        </div>
        {!isVisuallyDisabled && (
          <button
            onClick={handleClick}
            disabled={isDisabled}
            className={`w-10 h-10 ${hasEvals ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'} rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${isDisabled ? 'cursor-not-allowed' : ''}`}
          >
            +
          </button>
        )}
      </div>

      {hasEvals && !(isDisabledByGroup || isDisabledByOption) && (
        <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
          {evals.map((e, idx) => renderEvalBadge(item, e, idx, onEditEvaluation))}
        </div>
      )}
    </div>
  );
};

export default InspectionItemRow;
