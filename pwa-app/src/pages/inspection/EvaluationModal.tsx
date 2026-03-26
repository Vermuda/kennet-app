/**
 * @file EvaluationModal.tsx
 * @description 評価追加モーダルコンポーネント
 * 項目の種類（standard/management/legal/freetext/rebar/schmidt）に応じた
 * 評価ボタンと入力UIを表示し、評価を追加する。
 */

import React from 'react';
import { EVAL_LABELS } from './inspectionConstants';
import { getItemById } from '../../utils/inspectionMaster';
import type {
  StandardEvaluation,
  ManagementEvaluation,
  SurveyMethod,
} from '../../types/inspectionData';

/** EvaluationModal コンポーネントのProps */
interface EvaluationModalProps {
  /** 現在モーダルで開いている項目ID */
  modalItemId: string;
  /** getItemById の結果 */
  modalItem: NonNullable<ReturnType<typeof getItemById>>;
  /** 選択中の評価値 */
  selectedEval: string | null;
  /** 評価値を設定 */
  setSelectedEval: (e: string | null) => void;
  /** 懸念内容（法的評価用） */
  concernDetail: string;
  /** 懸念内容を設定 */
  setConcernDetail: (v: string) => void;
  /** 遵法性 資料値 */
  legalDocValue: string;
  /** 遵法性 資料値を設定 */
  setLegalDocValue: (v: string) => void;
  /** 遵法性 実測値 */
  legalMeasuredValue: string;
  /** 遵法性 実測値を設定 */
  setLegalMeasuredValue: (v: string) => void;
  /** フリーテキスト内容 */
  freetextContent: string;
  /** フリーテキスト内容を設定 */
  setFreetextContent: (v: string) => void;
  /** 備考 */
  remarkText: string;
  /** 備考を設定 */
  setRemarkText: (v: string) => void;
  /** 調査方法 */
  selectedSurveyMethods: SurveyMethod[];
  /** 調査方法を設定 */
  setSelectedSurveyMethods: (v: SurveyMethod[]) => void;
  /** 調査方法エラー */
  surveyMethodError: boolean;
  /** 調査方法エラーを設定 */
  setSurveyMethodError: (v: boolean) => void;
  /** 配筋ピッチ */
  rebarPitch: string;
  /** 配筋ピッチを設定 */
  setRebarPitch: (v: string) => void;
  /** シュミットハンマー測定値 */
  schmidtValues: string[];
  /** シュミットハンマー測定値を設定 */
  setSchmidtValues: (v: string[]) => void;
  /** b2/c が選択されているか */
  isDefectEval: boolean;
  /** 編集モード時のインデックス（null = 新規追加） */
  editingEvalIndex: number | null;
  /** 無効化すべき評価セットを取得 */
  getDisabledEvals: (itemId: string) => Set<string>;
  /** 最重度評価を取得 */
  getWorstEvaluation: (itemId: string) => string | null;
  /** 評価追加ハンドラ */
  onAddEvaluation: (goToDefectCapture?: boolean) => void;
  /** 評価を削除する（編集モード時） */
  onRemoveEvaluation?: (itemId: string, evalIndex: number) => void;
  /** モーダルを閉じる */
  onClose: () => void;
}

/**
 * 評価追加モーダル
 * @description 項目のevalTypeに応じた評価ボタン群と入力UIを表示し、
 * 評価の追加 or 不具合撮影遷移を行うモーダル。
 */
const EvaluationModal: React.FC<EvaluationModalProps> = ({
  modalItemId,
  modalItem,
  selectedEval,
  setSelectedEval,
  concernDetail,
  setConcernDetail,
  legalDocValue,
  setLegalDocValue,
  legalMeasuredValue,
  setLegalMeasuredValue,
  freetextContent,
  setFreetextContent,
  remarkText,
  setRemarkText,
  selectedSurveyMethods,
  setSelectedSurveyMethods,
  surveyMethodError,
  setSurveyMethodError,
  rebarPitch,
  setRebarPitch,
  schmidtValues,
  setSchmidtValues,
  isDefectEval,
  editingEvalIndex,
  getDisabledEvals,
  getWorstEvaluation,
  onAddEvaluation,
  onRemoveEvaluation,
  onClose,
}) => {
  const { item } = modalItem;

  /** 評価ボタンのレンダリング（evalType別） */
  const renderEvalButtons = () => {
    // 選択式評価（item38: 基礎天端高さ等）
    if (item.evalType === 'select' && item.options && item.options.length > 0) {
      const choices = item.options[0].choices;
      return (
        <div className="mb-4">
          <div className="grid gap-2">
            {choices.map(choice => (
              <button
                key={choice}
                onClick={() => setSelectedEval(choice)}
                className={`py-3 px-4 rounded-xl font-bold text-base border-2 transition text-left ${
                  selectedEval === choice
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-blue-50 text-blue-600 border-blue-400'
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // 管理状況評価
    if (item.evalType === 'management') {
      return (
        <div className="mb-4">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {(['S', 'A', 'B', 'C'] as ManagementEvaluation[]).map(e => (
              <button
                key={e}
                onClick={() => setSelectedEval(e)}
                className={`py-3 rounded-xl font-bold text-lg border-2 transition ${
                  selectedEval === e
                    ? (e === 'S' ? 'bg-emerald-500 text-white border-emerald-500' :
                       e === 'A' ? 'bg-blue-500 text-white border-blue-500' :
                       e === 'B' ? 'bg-amber-500 text-white border-amber-500' :
                       'bg-red-500 text-white border-red-500')
                    : (e === 'S' ? 'bg-emerald-50 text-emerald-600 border-emerald-400' :
                       e === 'A' ? 'bg-blue-50 text-blue-600 border-blue-400' :
                       e === 'B' ? 'bg-amber-50 text-amber-600 border-amber-400' :
                       'bg-red-50 text-red-600 border-red-400')
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          {/* 備考 */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">備考</label>
            <textarea
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="備考を入力"
              rows={2}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>
        </div>
      );
    }

    // 違法性関係
    if (item.evalType === 'legal') {
      return (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={() => setSelectedEval('none')}
              className={`py-4 rounded-xl font-bold text-lg border-2 transition ${
                selectedEval === 'none' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-50 text-emerald-600 border-emerald-400'
              }`}
            >
              無
            </button>
            <button
              onClick={() => setSelectedEval('concern')}
              className={`py-4 rounded-xl font-bold text-lg border-2 transition ${
                selectedEval === 'concern' ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-600 border-red-400'
              }`}
            >
              有（懸念あり）
            </button>
          </div>
          {/* 資料値・実測値 入力欄（item101のみ） */}
          {modalItemId === 'item101' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">資料値</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={legalDocValue}
                    onChange={(e) => setLegalDocValue(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 min-w-0 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-base text-right focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-sm text-slate-500 font-bold">m</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">実測値</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={legalMeasuredValue}
                    onChange={(e) => setLegalMeasuredValue(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 min-w-0 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-base text-right focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-sm text-slate-500 font-bold">m</span>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // フリーテキスト
    if (item.evalType === 'freetext') {
      return (
        <div className="mb-4">
          {/* item101: 資料値・実測値の入力欄 */}
          {item.id === 'item101' && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">資料値</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={legalDocValue}
                    onChange={(e) => { setLegalDocValue(e.target.value); setSelectedEval('freetext'); }}
                    placeholder="0.00"
                    className="flex-1 min-w-0 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-base text-right focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-sm text-slate-500 font-bold">m</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">実測値</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={legalMeasuredValue}
                    onChange={(e) => { setLegalMeasuredValue(e.target.value); setSelectedEval('freetext'); }}
                    placeholder="0.00"
                    className="flex-1 min-w-0 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-base text-right focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-sm text-slate-500 font-bold">m</span>
                </div>
              </div>
            </div>
          )}
          {item.id === 'item101' && !legalMeasuredValue && (
            <p className="text-xs text-red-500 mt-1">実測値を入力してください</p>
          )}
          <label className="text-xs text-slate-500 mb-1 block">懸念内容・不適合箇所</label>
          <textarea
            value={freetextContent}
            onChange={(e) => { setFreetextContent(e.target.value); if (e.target.value) setSelectedEval('freetext'); }}
            placeholder="懸念がある場合は内容を記入してください"
            rows={4}
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-emerald-500 focus:outline-none resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">※懸念がない場合は空欄のままにしてください</p>
        </div>
      );
    }

    // 配筋ピッチ
    if (item.evalType === 'rebar') {
      return (
        <div className="mb-4">
          <label className="text-xs text-slate-500 mb-1 block">配筋のピッチ（cm）</label>
          <input
            type="number"
            value={rebarPitch}
            onChange={(e) => { setRebarPitch(e.target.value); setSelectedEval('measured'); }}
            placeholder="例: 20"
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-lg focus:border-emerald-500 focus:outline-none"
          />
        </div>
      );
    }

    // シュミットハンマー
    if (item.evalType === 'schmidt') {
      return (
        <div className="mb-4">
          <label className="text-xs text-slate-500 mb-2 block">測定値（9回）</label>
          <div className="grid grid-cols-3 gap-2">
            {schmidtValues.map((v, i) => (
              <input
                key={i}
                type="number"
                value={v}
                onChange={(e) => {
                  const newVals = [...schmidtValues];
                  newVals[i] = e.target.value;
                  setSchmidtValues(newVals);
                  if (newVals.some(val => val !== '')) setSelectedEval('measured');
                }}
                placeholder={`${i + 1}`}
                className="border-2 border-slate-200 rounded-lg px-3 py-2 text-center focus:border-emerald-500 focus:outline-none"
              />
            ))}
          </div>
          {schmidtValues.some(v => v !== '') && (
            <div className="mt-2 text-sm text-slate-600">
              算定式: Fc = 1.27 × R − 18.0
            </div>
          )}
        </div>
      );
    }

    // 標準評価（デフォルト）
    const disabledEvals = getDisabledEvals(modalItemId);
    const worstEval = getWorstEvaluation(modalItemId);

    return (
      <div className="mb-4">
        <div className="grid grid-cols-5 gap-2 mb-3">
          {(['a', 'b1', 'b2', 'c', 'na'] as StandardEvaluation[]).map(e => {
            const isDisabledByPriority = disabledEvals.has(e);
            return (
              <button
                key={e}
                onClick={() => { if (!isDisabledByPriority) setSelectedEval(e); }}
                disabled={isDisabledByPriority}
                className={`py-3 rounded-xl font-bold flex flex-col items-center border-2 transition ${
                  isDisabledByPriority
                    ? 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed'
                    : selectedEval === e
                      ? (e === 'a' ? 'bg-emerald-500 text-white border-emerald-500' :
                         e === 'b1' ? 'bg-blue-500 text-white border-blue-500' :
                         e === 'b2' ? 'bg-amber-500 text-white border-amber-500' :
                         e === 'c' ? 'bg-red-500 text-white border-red-500' :
                         'bg-slate-400 text-white border-slate-400')
                      : (e === 'a' ? 'bg-emerald-50 text-emerald-600 border-emerald-400' :
                         e === 'b1' ? 'bg-blue-50 text-blue-600 border-blue-400' :
                         e === 'b2' ? 'bg-amber-50 text-amber-600 border-amber-400' :
                         e === 'c' ? 'bg-red-50 text-red-600 border-red-400' :
                         'bg-slate-50 text-slate-600 border-slate-300')
                }`}
              >
                <span className="text-lg">{e === 'na' ? '−' : e}</span>
                <span className="text-[8px] mt-0.5">{e === 'a' ? '良好' : e === 'b1' ? '軽度' : e === 'b2' ? '中度' : e === 'c' ? '重度' : '対象無'}</span>
              </button>
            );
          })}
        </div>
        {worstEval && (worstEval === 'c' || worstEval === 'b2') && (
          <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-3">
            この項目には{EVAL_LABELS[worstEval] || worstEval}の評価があります。出力時は最重度の評価（{EVAL_LABELS[worstEval] || worstEval}）が優先されます
          </p>
        )}
        {/* 調査方法（「対象無」選択時のみ非表示） */}
        {selectedEval !== 'na' && (
          <div className="mb-3">
            <label className="text-xs text-slate-500 mb-1 block">
              調査方法 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {([
                { key: 'visual' as SurveyMethod, label: '目視' },
                { key: 'measurement' as SurveyMethod, label: '計測' },
                { key: 'palpation' as SurveyMethod, label: '触診' },
              ]).map(({ key, label }) => {
                const isActive = selectedSurveyMethods.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      const updated = isActive
                        ? selectedSurveyMethods.filter(m => m !== key)
                        : [...selectedSurveyMethods, key];
                      setSelectedSurveyMethods(updated);
                      if (updated.length > 0) setSurveyMethodError(false);
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition ${
                      isActive
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-indigo-50 text-indigo-600 border-indigo-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {surveyMethodError && (
              <p className="text-xs text-red-500 mt-1">調査方法を選択してください</p>
            )}
          </div>
        )}
        {/* 備考 */}
        <div>
          <label className="text-xs text-slate-500 mb-1 block">備考</label>
          <textarea
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
            placeholder="備考を入力（遵法性の備考欄に自動追記されます）"
            rows={2}
            className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none resize-none"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center">
      <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-5 pb-8 max-h-[85vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4 md:hidden"></div>
        <div className="flex items-start gap-2 mb-2">
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">{item.num}</span>
          <h3 className="text-lg font-bold text-slate-800 flex-1">{item.name}</h3>
          {editingEvalIndex !== null && onRemoveEvaluation && (
            <button
              onClick={() => {
                if (window.confirm('この評価を削除しますか？')) {
                  onRemoveEvaluation(modalItemId, editingEvalIndex);
                  onClose();
                }
              }}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
            >
              削除
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-4 whitespace-pre-line">{item.desc}</p>

        {renderEvalButtons()}

        {item.evalType === 'legal' && selectedEval && (
          <div className="mb-4">
            <label className="text-xs text-slate-500 mb-1 block">
              懸念内容・不整合箇所
              {selectedEval === 'concern' && <span className="text-red-500 ml-1">*</span>}
              {selectedEval === 'none' && <span className="text-slate-400 ml-1">（任意）</span>}
            </label>
            <textarea
              value={concernDetail}
              onChange={(e) => setConcernDetail(e.target.value)}
              placeholder={selectedEval === 'concern' ? '懸念内容を入力してください' : '特記事項があれば入力してください'}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-emerald-500 focus:outline-none h-24"
            />
            {selectedEval === 'concern' && !concernDetail.trim() && (
              <p className="text-xs text-red-500 mt-1">懸念有の場合、懸念内容の入力は必須です</p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border-2 border-slate-300 text-slate-600 py-3 rounded-xl font-bold">
            キャンセル
          </button>
          {item.evalType === 'freetext' ? (
            <button
              onClick={() => onAddEvaluation(false)}
              disabled={item.id === 'item101' && !legalMeasuredValue}
              className={`flex-1 py-3 rounded-xl font-bold transition ${
                item.id === 'item101' && !legalMeasuredValue
                  ? 'bg-slate-300 text-white cursor-not-allowed'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {editingEvalIndex !== null ? '更新' : '保存'}
            </button>
          ) : isDefectEval ? (
            editingEvalIndex !== null ? (
              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={() => onAddEvaluation(false)}
                  disabled={!selectedEval}
                  className={`w-full py-3 rounded-xl font-bold transition ${selectedEval ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-white'}`}
                >
                  更新（テキストのみ）
                </button>
                <button
                  onClick={() => onAddEvaluation(true)}
                  disabled={!selectedEval}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition ${selectedEval ? (selectedEval === 'c' || selectedEval === 'C' ? 'bg-red-600' : 'bg-amber-600') + ' text-white' : 'bg-slate-300 text-white'}`}
                >
                  📷 撮影し直し
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddEvaluation(true)}
                disabled={!selectedEval}
                className={`flex-1 py-3 rounded-xl font-bold transition ${selectedEval ? (selectedEval === 'c' || selectedEval === 'C' ? 'bg-red-600' : 'bg-amber-600') + ' text-white' : 'bg-slate-300 text-white'}`}
              >
                📷 位置選択・撮影へ
              </button>
            )
          ) : (
            <button
              onClick={() => onAddEvaluation(false)}
              disabled={!selectedEval}
              className={`flex-1 py-3 rounded-xl font-bold transition ${selectedEval ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-white'}`}
            >
              {editingEvalIndex !== null ? '更新' : '追加'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;
