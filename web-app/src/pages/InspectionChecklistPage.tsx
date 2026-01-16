import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// localStorage utilities are used via inspectionData state
import { generateId } from '../utils/helpers';
import { inspectionMaster, getItemById, getTotalItemCount } from '../utils/inspectionMaster';
import type { 
  InspectionEvaluation, 
  StandardEvaluation, 
  ManagementEvaluation, 
  LegalEvaluation,
  PropertyInspectionData,
  InspectionCategory,
  InspectionItem
} from '../types/inspectionData';

const STORAGE_KEY = 'kennet_property_inspections';

// LocalStorageから検査データを読み込み
const loadInspectionData = (propertyId: string): PropertyInspectionData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const allData: { [propertyId: string]: PropertyInspectionData } = JSON.parse(data);
      if (allData[propertyId]) return allData[propertyId];
    }
  } catch (e) {
    console.error('Failed to load inspection data:', e);
  }
  return {
    propertyId,
    evaluations: {},
    options: {},
    surveyInfo: { conducted: true },
    updatedAt: new Date().toISOString(),
  };
};

// LocalStorageに検査データを保存
const saveInspectionData = (data: PropertyInspectionData) => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    const allData: { [propertyId: string]: PropertyInspectionData } = existing ? JSON.parse(existing) : {};
    allData[data.propertyId] = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  } catch (e) {
    console.error('Failed to save inspection data:', e);
  }
};

const InspectionChecklistPage: React.FC = () => {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const [inspectionData, setInspectionData] = useState<PropertyInspectionData | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [modalItemId, setModalItemId] = useState<string | null>(null);
  const [selectedEval, setSelectedEval] = useState<string | null>(null);
  const [locationMemo, setLocationMemo] = useState('');
  const [concernDetail, setConcernDetail] = useState('');
  const [rebarPitch, setRebarPitch] = useState('');
  const [schmidtValues, setSchmidtValues] = useState<string[]>(Array(9).fill(''));
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768);
  const [showToast, setShowToast] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  // 画面サイズ監視
  useEffect(() => {
    const handleResize = () => setIsTablet(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // データ読み込み
  useEffect(() => {
    if (propertyId) {
      const data = loadInspectionData(propertyId);
      setInspectionData(data);
    }
  }, [propertyId]);

  // カテゴリの進捗を計算
  const getCategoryProgress = useCallback((category: InspectionCategory) => {
    if (!inspectionData) return { done: 0, total: category.items.length };
    let done = 0;
    category.items.forEach(item => {
      const evals = inspectionData.evaluations[item.id];
      if (evals && evals.length > 0) done++;
    });
    return { done, total: category.items.length };
  }, [inspectionData]);

  // 全体の進捗を計算
  const getTotalProgress = useCallback(() => {
    let done = 0;
    const total = getTotalItemCount();
    inspectionMaster.forEach(cat => {
      const p = getCategoryProgress(cat);
      done += p.done;
    });
    return { done, total, percent: Math.round((done / total) * 100) };
  }, [getCategoryProgress]);

  // 評価追加
  const handleAddEvaluation = (goToDefectCapture = false) => {
    if (!modalItemId || !selectedEval || !inspectionData) return;
    
    const itemInfo = getItemById(modalItemId);
    if (!itemInfo) return;

    const newEval: InspectionEvaluation = {
      id: generateId(),
      eval: selectedEval as StandardEvaluation | ManagementEvaluation | LegalEvaluation,
      memo: locationMemo,
      timestamp: Date.now(),
    };

    // 特殊入力の処理
    if (itemInfo.item.evalType === 'legal' && selectedEval === 'concern') {
      newEval.concernDetail = concernDetail;
    }
    if (itemInfo.item.evalType === 'rebar' && rebarPitch) {
      newEval.rebarPitch = parseFloat(rebarPitch);
    }
    if (itemInfo.item.evalType === 'schmidt') {
      const values = schmidtValues.map(v => parseFloat(v) || 0).filter(v => v > 0);
      if (values.length > 0) {
        newEval.schmidtValues = values;
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        newEval.schmidtResult = Math.round((1.27 * avg - 18) * 100) / 100;
      }
    }

    const newData = {
      ...inspectionData,
      evaluations: {
        ...inspectionData.evaluations,
        [modalItemId]: [...(inspectionData.evaluations[modalItemId] || []), newEval],
      },
    };
    
    setInspectionData(newData);
    saveInspectionData(newData);
    closeModal();

    // b2またはcの場合、図面位置選択画面へ遷移
    if (goToDefectCapture && (selectedEval === 'b2' || selectedEval === 'c')) {
      navigate(`/properties/${propertyId}/select-position`, {
        state: {
          propertyId,
          inspectionItemId: modalItemId,
          inspectionItemName: itemInfo.item.name,
          evaluationId: newEval.id,
          evaluationType: selectedEval,
          returnPath: `/properties/${propertyId}/inspection-checklist`,
        },
      });
      toast(`${selectedEval === 'b2' ? '経年変化' : '不具合'}を追加 → 位置選択へ`);
    } else {
      toast('評価を追加しました');
    }
  };

  // b2またはcが選択されているかチェック
  const isDefectEval = selectedEval === 'b2' || selectedEval === 'c';

  // 評価削除
  const handleRemoveEvaluation = (itemId: string, evalIndex: number) => {
    if (!inspectionData) return;
    const newEvals = [...(inspectionData.evaluations[itemId] || [])];
    newEvals.splice(evalIndex, 1);
    
    const newData = {
      ...inspectionData,
      evaluations: {
        ...inspectionData.evaluations,
        [itemId]: newEvals.length > 0 ? newEvals : undefined as any,
      },
    };
    if (newEvals.length === 0) delete newData.evaluations[itemId];
    
    setInspectionData(newData);
    saveInspectionData(newData);
    toast('削除しました');
  };

  // モーダルを開く
  const openModal = (itemId: string) => {
    setModalItemId(itemId);
    setSelectedEval(null);
    setLocationMemo('');
    setConcernDetail('');
    setRebarPitch('');
    setSchmidtValues(Array(9).fill(''));
  };

  // モーダルを閉じる
  const closeModal = () => {
    setModalItemId(null);
    setSelectedEval(null);
  };

  // トースト表示
  const toast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(''), 2000);
  };

  // カテゴリへジャンプ
  const jumpToCategory = (catId: string) => {
    if (isTablet) {
      setSelectedCategoryId(catId);
    } else {
      const el = document.getElementById(catId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 戻る
  const handleBack = () => {
    if (propertyId) {
      navigate(`/properties/${propertyId}`);
    } else {
      navigate(-1);
    }
  };

  if (!inspectionData) return <div className="min-h-screen bg-slate-100 flex items-center justify-center">読み込み中...</div>;

  const progress = getTotalProgress();
  const currentCategory = selectedCategoryId ? inspectionMaster.find(c => c.id === selectedCategoryId) : null;
  const modalItem = modalItemId ? getItemById(modalItemId) : null;

  // スマホ用レイアウト（パターン1: ジャンプナビ）
  const renderMobileLayout = () => (
    <div className="min-h-screen bg-slate-100 pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 bg-gray-800 text-white z-20 shadow">
        <div className="px-3 py-2 flex justify-between items-center">
          <button 
            onClick={handleBack} 
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ← 戻る
          </button>
          <span className="font-bold text-sm whitespace-nowrap">検査チェックシート</span>
          <span className="text-emerald-400 text-xs font-bold">{progress.done}/{progress.total}</span>
        </div>
        
        {/* ジャンプナビ */}
        <div className="flex overflow-x-auto bg-gray-700 scrollbar-hide">
          {inspectionMaster.map((cat) => {
            const p = getCategoryProgress(cat);
            return (
              <button
                key={cat.id}
                onClick={() => jumpToCategory(cat.id)}
                className="px-3 py-2 text-xs whitespace-nowrap flex-shrink-0 border-b-2 border-transparent hover:bg-gray-600"
              >
                <div className="font-bold text-white">{cat.shortName}</div>
                <div className={`text-[10px] ${p.done > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>{p.done}/{p.total}</div>
              </button>
            );
          })}
        </div>
      </header>

      {/* コンテンツ */}
      <div ref={contentRef} className="p-3 space-y-4">
        {inspectionMaster.map(cat => (
          <div key={cat.id} id={cat.id} className="scroll-mt-24">
            <div className={`bg-gradient-to-r ${cat.color} text-white px-4 py-3 rounded-t-xl font-bold flex justify-between items-center`}>
              <span className="text-sm">{cat.name}</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">{getCategoryProgress(cat).done}/{getCategoryProgress(cat).total}</span>
            </div>
            <div className="bg-white rounded-b-xl shadow-sm overflow-hidden divide-y">
              {cat.items.map(item => renderItem(item, cat))}
            </div>
          </div>
        ))}
      </div>

      {/* フッター */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t shadow-lg z-30">
        <button onClick={handleBack} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">
          💾 保存して戻る
        </button>
      </div>
    </div>
  );

  // タブレット用レイアウト（パターン5: 2ペイン）
  const renderTabletLayout = () => (
    <div className="min-h-screen bg-slate-100">
      {/* ヘッダー */}
      <header className="sticky top-0 bg-gray-800 text-white z-20 shadow">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <button 
            onClick={handleBack} 
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ← 戻る
          </button>
          <div className="text-center">
            <div className="text-sm font-bold whitespace-nowrap">検査チェックシート</div>
            <div className="text-xs text-emerald-400">{progress.done}/{progress.total} 完了 ({progress.percent}%)</div>
          </div>
          <button 
            onClick={handleBack} 
            className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-all whitespace-nowrap"
          >
            💾 保存
          </button>
        </div>
      </header>

      {/* 2ペインコンテナ */}
      <div className="flex h-[calc(100vh-52px)]">
        {/* 左ペイン: カテゴリ一覧 */}
        <div className="w-80 lg:w-96 flex-shrink-0 bg-white border-r overflow-y-auto">
          {inspectionMaster.map(cat => {
            const p = getCategoryProgress(cat);
            const isComplete = p.done === p.total;
            const isSelected = selectedCategoryId === cat.id;
            const progressPercent = Math.round((p.done / p.total) * 100);
            
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`w-full text-left p-4 flex items-center gap-3 border-b transition ${isSelected ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''} ${isComplete ? 'bg-emerald-50/50' : ''}`}
              >
                <div className="text-2xl">{cat.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 truncate">{cat.shortName}</span>
                    {isComplete && <span className="text-emerald-500 text-xs">✓完了</span>}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{cat.name}</div>
                  <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${isComplete ? 'bg-emerald-500' : 'bg-blue-500'} rounded-full transition-all`} style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`font-bold text-sm ${isComplete ? 'text-emerald-600' : 'text-slate-700'}`}>{p.done}/{p.total}</div>
                  <div className="text-xs text-slate-400">{progressPercent}%</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 右ペイン: 項目詳細 */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          {currentCategory ? (
            <>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{currentCategory.emoji}</span>
                  <div>
                    <h2 className="font-bold text-lg text-slate-800">{currentCategory.shortName}</h2>
                    <p className="text-xs text-slate-500">{currentCategory.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(getCategoryProgress(currentCategory).done / getCategoryProgress(currentCategory).total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{getCategoryProgress(currentCategory).done}/{getCategoryProgress(currentCategory).total}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {currentCategory.items.map(item => renderItem(item, currentCategory, true))}
              </div>
            </>
          ) : (
            <div className="text-center text-slate-400 py-20">
              <div className="text-5xl mb-4">👈</div>
              <p>左側からカテゴリを選択してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 項目のレンダリング
  const renderItem = (item: InspectionItem, _category: InspectionCategory, isLarge = false) => {
    const evals = inspectionData?.evaluations[item.id] || [];
    const hasEvals = evals.length > 0;
    
    return (
      <div key={item.id} className={`p-3 ${!hasEvals ? 'bg-slate-50/50' : ''} ${isLarge ? 'bg-white rounded-xl shadow-sm mb-2' : ''}`}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 cursor-pointer" onClick={() => openModal(item.id)}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-6 h-6 rounded ${hasEvals ? 'bg-emerald-500' : 'bg-slate-300'} text-white text-xs flex items-center justify-center font-bold`}>{item.num}</span>
              <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
              {hasEvals && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{evals.length}件</span>}
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-8 line-clamp-2">{item.desc}</p>
            {item.sub && <p className="text-xs text-blue-500 mt-0.5 ml-8">{item.sub}</p>}
          </div>
          <button
            onClick={() => openModal(item.id)}
            className={`w-10 h-10 ${hasEvals ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'} rounded-lg flex items-center justify-center text-xl flex-shrink-0`}
          >
            +
          </button>
        </div>
        
        {hasEvals && (
          <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
            {evals.map((e, idx) => {
              const colors: Record<string, string> = { 
                'a': 'bg-emerald-500', 'b1': 'bg-blue-500', 'b2': 'bg-amber-500', 'c': 'bg-red-500', 'na': 'bg-slate-400',
                'S': 'bg-emerald-500', 'A': 'bg-blue-500', 'B': 'bg-amber-500', 'C': 'bg-red-500',
                'none': 'bg-emerald-500', 'concern': 'bg-red-500'
              };
              const label = e.eval === 'na' ? '−' : (e.eval === 'none' ? '無' : (e.eval === 'concern' ? '有' : e.eval));
              return (
                <span key={e.id} className={`${colors[e.eval] || 'bg-slate-400'} text-white text-xs px-2 py-1 rounded-full flex items-center gap-1`}>
                  {label}{e.memo && `: ${e.memo.substring(0, 6)}`}
                  <button onClick={(ev) => { ev.stopPropagation(); handleRemoveEvaluation(item.id, idx); }} className="ml-0.5 opacity-70 hover:opacity-100">×</button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // 評価選択ボタンのレンダリング
  const renderEvalButtons = () => {
    if (!modalItem) return null;
    const { item } = modalItem;

    if (item.evalType === 'management') {
      return (
        <div className="grid grid-cols-4 gap-2 mb-4">
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
      );
    }

    if (item.evalType === 'legal') {
      return (
        <div className="grid grid-cols-2 gap-3 mb-4">
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
      );
    }

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

    // 標準評価
    return (
      <div className="grid grid-cols-5 gap-2 mb-4">
        {(['a', 'b1', 'b2', 'c', 'na'] as StandardEvaluation[]).map(e => (
          <button
            key={e}
            onClick={() => setSelectedEval(e)}
            className={`py-3 rounded-xl font-bold flex flex-col items-center border-2 transition ${
              selectedEval === e 
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
            <span className="text-[8px] mt-0.5">{e === 'a' ? '良好' : e === 'b1' ? '軽度' : e === 'b2' ? '中度' : e === 'c' ? '重度' : '対象外'}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      {isTablet ? renderTabletLayout() : renderMobileLayout()}

      {/* 評価追加モーダル */}
      {modalItemId && modalItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-5 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4 md:hidden"></div>
            <div className="flex items-start gap-2 mb-2">
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">{modalItem.item.num}</span>
              <h3 className="text-lg font-bold text-slate-800">{modalItem.item.name}</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">{modalItem.item.desc}</p>

            {modalItem.item.evalType !== 'rebar' && modalItem.item.evalType !== 'schmidt' && (
              <div className="mb-4">
                <label className="text-xs text-slate-500 mb-1 block">場所メモ（任意）</label>
                <input
                  type="text"
                  value={locationMemo}
                  onChange={(e) => setLocationMemo(e.target.value)}
                  placeholder="例：北側、2階など"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {renderEvalButtons()}

            {modalItem.item.evalType === 'legal' && selectedEval === 'concern' && (
              <div className="mb-4">
                <label className="text-xs text-slate-500 mb-1 block">懸念内容・不整合箇所</label>
                <textarea
                  value={concernDetail}
                  onChange={(e) => setConcernDetail(e.target.value)}
                  placeholder="懸念内容を入力してください"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-emerald-500 focus:outline-none h-24"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 border-2 border-slate-300 text-slate-600 py-3 rounded-xl font-bold">
                キャンセル
              </button>
              {isDefectEval ? (
                // b2/cの場合は撮影必須なので「撮影へ」ボタンのみ
                <button
                  onClick={() => handleAddEvaluation(true)}
                  disabled={!selectedEval}
                  className={`flex-1 py-3 rounded-xl font-bold transition ${selectedEval ? (selectedEval === 'c' ? 'bg-red-600' : 'bg-amber-600') + ' text-white' : 'bg-slate-300 text-white'}`}
                >
                  📷 位置選択・撮影へ
                </button>
              ) : (
                <button
                  onClick={() => handleAddEvaluation(false)}
                  disabled={!selectedEval}
                  className={`flex-1 py-3 rounded-xl font-bold transition ${selectedEval ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-white'}`}
                >
                  追加
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* トースト */}
      {showToast && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-72 bg-slate-800 text-white px-4 py-3 rounded-xl text-sm text-center z-50 animate-slide-up">
          {showToast}
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; }
        @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.3s ease; }
      `}</style>
    </>
  );
};

export default InspectionChecklistPage;
