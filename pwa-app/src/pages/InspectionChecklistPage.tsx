/**
 * @file InspectionChecklistPage.tsx
 * @description 検査チェックシートページ（メインコンポジション）
 *
 * ビジネスロジックは useInspectionChecklist フックに、
 * 各UIセクションは inspection/ サブディレクトリのコンポーネントに分割済み。
 * このファイルはレイアウト（モバイル/タブレット）の組み立てのみを担当する。
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { inspectionMaster } from '../utils/inspectionMaster';
import {
  DEBUG_MODE,
  ITEMS_WITH_SURVEY_TOGGLE,
  useInspectionChecklist,
  CategorySurveyToggle,
  ReasonModal,
  MaintenanceSection,
  GroupHeader,
  InspectionItemRow,
  EvaluationModal,
  DebugPanel,
  YukashitaGroupInputs,
  KoyauraGroupInputs,
  KisoGroupInputs,
  GaihekiGroupInputs,
  YaneGroupInputs,
  OkujouGroupInputs,
  RemarksSection,
} from './inspection';
import type { InspectionCategory } from '../types/inspectionData';

/**
 * カテゴリ内の項目をグループ化してレンダリングする
 * @param cat - 検査カテゴリ
 * @param hook - useInspectionChecklist の戻り値
 * @param isLarge - タブレット用の大きいカードレイアウト
 * @param isCategoryDisabledFlag - カテゴリ全体が無効化されているか
 */
const renderCategoryItems = (
  cat: InspectionCategory,
  hook: ReturnType<typeof useInspectionChecklist>,
  isLarge: boolean,
  isCategoryDisabledFlag: boolean,
) => {
  const renderedGroups = new Set<string>();
  const result: React.ReactNode[] = [];

  cat.items.forEach(item => {
    // グループヘッダーを先に表示（グループの最初の項目の時のみ）
    if (item.groupId && item.groupLabel && !renderedGroups.has(item.groupId)) {
      renderedGroups.add(item.groupId);
      result.push(
        <GroupHeader
          key={`group-header-${item.groupId}`}
          groupId={item.groupId}
          groupLabel={item.groupLabel}
          groupExistence={hook.getGroupExistence(item.groupId)}
          onUpdateGroupExistence={hook.updateGroupExistence}
          getItemOption={hook.getItemOption}
          updateItemOption={hook.updateItemOption}
        />
      );

      // 屋根グループ: 屋根仕様・撮影棒確認入力セクション
      if (item.groupId === 'group_yane') {
        result.push(
          <YaneGroupInputs
            key="yane-group-inputs"
            getItemOption={hook.getItemOption}
            updateItemOption={hook.updateItemOption}
          />
        );
      }

      // 屋上グループ: 防水工法・確認方法入力セクション
      if (item.groupId === 'group_okujou') {
        result.push(
          <OkujouGroupInputs
            key="okujou-group-inputs"
            getItemOption={hook.getItemOption}
            updateItemOption={hook.updateItemOption}
          />
        );
      }

      // 外壁グループ: 構造種別・外壁詳細入力セクション
      if (item.groupId === 'group_gaiheki') {
        result.push(
          <GaihekiGroupInputs
            key="gaiheki-group-inputs"
            getItemOption={hook.getItemOption}
            updateItemOption={hook.updateItemOption}
          />
        );
      }

      // 基礎グループ: 仕上材の種類入力セクション
      if (item.groupId === 'group_kiso') {
        result.push(
          <KisoGroupInputs
            key="kiso-group-inputs"
            getFinishMaterials={hook.getFinishMaterials}
            toggleFinishMaterial={hook.toggleFinishMaterial}
            getItemOption={hook.getItemOption}
            updateItemOption={hook.updateItemOption}
          />
        );
      }

      // 床下点検口グループ: グループレベル入力セクション
      if (item.groupId === 'group_yukashita') {
        const groupExists = hook.getGroupExistence('group_yukashita');
        if (groupExists?.exists !== false) {
          result.push(
            <YukashitaGroupInputs
              key="yukashita-group-inputs"
              getItemOption={hook.getItemOption}
              updateItemOption={hook.updateItemOption}
            />
          );
        }
      }

      // 小屋裏・天井点検口グループ: グループレベル入力セクション
      if (item.groupId === 'group_koyaura') {
        const groupExists = hook.getGroupExistence('group_koyaura');
        if (groupExists?.exists !== false) {
          result.push(
            <KoyauraGroupInputs
              key="koyaura-group-inputs"
              getItemOption={hook.getItemOption}
              updateItemOption={hook.updateItemOption}
            />
          );
        }
      }
    }

    // 項目単位の調査実施/不可トグル（item95: 鉄筋探査、item96: シュミット）
    if (ITEMS_WITH_SURVEY_TOGGLE.includes(item.id)) {
      const itemSurveyStatus = hook.getItemSurveyStatus(item.id);
      const isItemNotConducted = !itemSurveyStatus.conducted;
      result.push(
        <div key={`item-survey-${item.id}`} className="px-3 py-2 bg-slate-50 border-b">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-600">{item.name}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => hook.updateItemSurveyStatus(item.id, { conducted: true })}
                disabled={isCategoryDisabledFlag}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  !isItemNotConducted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                } disabled:opacity-50`}
              >
                実施
              </button>
              <button
                onClick={() => {
                  hook.setEditingCategoryReason({ catId: `item:${item.id}`, reason: itemSurveyStatus.notConductedReason || '' });
                }}
                disabled={isCategoryDisabledFlag}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  isItemNotConducted
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                } disabled:opacity-50`}
              >
                不可
              </button>
            </div>
          </div>
          {isItemNotConducted && itemSurveyStatus.notConductedReason && (
            <div className="mt-1 text-xs text-red-500">
              理由: {itemSurveyStatus.notConductedReason}
            </div>
          )}
        </div>
      );
    }

    const isItemSurveyDisabled = hook.isItemDisabledBySurvey(item.id);

    result.push(
      <InspectionItemRow
        key={item.id}
        item={item}
        evals={hook.inspectionData?.evaluations[item.id] || []}
        isDisabledByGroup={hook.isItemDisabledByGroupExistence(item)}
        isDisabledByFinish={hook.isItemDisabledByFinishMaterial(item)}
        isDisabledByOption={hook.isItemDisabledByItemOption(item)}
        isCategoryDisabled={isCategoryDisabledFlag || isItemSurveyDisabled}
        isLarge={isLarge}
        onOpenModal={hook.openModal}
        onRemoveEvaluation={hook.handleRemoveEvaluation}
      />
    );
  });

  return result;
};

const InspectionChecklistPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const hook = useInspectionChecklist(propertyId);

  // ローディング
  if (!hook.inspectionData) {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center">読み込み中...</div>;
  }

  const progress = hook.getTotalProgress();

  // ─── スマホ用レイアウト ──────────────────────────────
  const renderMobileLayout = () => (
    <div className="min-h-screen bg-slate-100 pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 bg-gray-800 text-white z-20 shadow">
        <div className="px-3 py-2 flex justify-between items-center">
          <button
            onClick={hook.handleBack}
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
            const p = hook.getCategoryProgress(cat);
            const isSkipped = hook.isCategoryDisabled(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => hook.jumpToCategory(cat.id)}
                className={`px-3 py-2 text-xs whitespace-nowrap flex-shrink-0 border-b-2 border-transparent hover:bg-gray-600 ${isSkipped ? 'opacity-50' : ''}`}
              >
                <div className={`font-bold ${isSkipped ? 'text-gray-400 line-through' : 'text-white'}`}>{cat.shortName}</div>
                <div className={`text-[10px] ${isSkipped ? 'text-red-400' : p.done > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {isSkipped ? '不可' : `${p.done}/${p.total}`}
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* コンテンツ */}
      <div ref={hook.contentRef} className="p-3 space-y-4">
        {inspectionMaster.map(cat => {
          const isSkipped = hook.isCategoryDisabled(cat.id);
          const catProgress = hook.getCategoryProgress(cat);

          return (
            <div key={cat.id} id={cat.id} className="scroll-mt-24">
              {/* カテゴリヘッダー */}
              <div className={`bg-gradient-to-r ${cat.color} ${isSkipped ? 'opacity-70' : ''} text-white px-4 py-3 rounded-t-xl font-bold`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">{cat.name}</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">
                    {isSkipped ? '調査不可' : `${catProgress.done}/${catProgress.total}`}
                  </span>
                </div>
                {hook.needsSurveyToggle(cat.id) && (
                  <CategorySurveyToggle
                    category={cat}
                    compact
                    status={hook.getCategorySurveyStatus(cat.id)}
                    isDisabled={isSkipped}
                    onToggleConducted={(conducted) => {
                      hook.updateCategorySurveyStatus(cat.id, { conducted });
                    }}
                    onEditReason={(catId, reason) => {
                      hook.setEditingCategoryReason({ catId, reason });
                    }}
                    toast={hook.toast}
                  />
                )}
              </div>

              {/* 項目一覧 */}
              <div className="bg-white rounded-b-xl shadow-sm overflow-hidden divide-y relative">
                {isSkipped && (
                  <div className="absolute inset-0 bg-gray-400/40 z-10 pointer-events-auto" />
                )}
                {renderCategoryItems(cat, hook, false, isSkipped)}
              </div>
            </div>
          );
        })}

        {/* 備考セクション */}
        <div id="remarks-section" className="scroll-mt-24">
          <RemarksSection
            getItemOption={hook.getItemOption}
            updateItemOption={hook.updateItemOption}
          />
        </div>

        {/* メンテナンス状況セクション */}
        <div id="maintenance-section" className="scroll-mt-24">
          <MaintenanceSection
            getMaintenanceStatus={hook.getMaintenanceStatus}
            updateMaintenanceStatus={hook.updateMaintenanceStatus}
            getGroupExistence={hook.getGroupExistence}
          />
        </div>
      </div>

      {/* フッター */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t shadow-lg z-30">
        <button onClick={hook.handleBack} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">
          💾 保存して戻る
        </button>
      </div>
    </div>
  );

  // ─── タブレット用レイアウト ──────────────────────────
  const renderTabletLayout = () => (
    <div className="min-h-screen bg-slate-100">
      {/* ヘッダー */}
      <header className="sticky top-0 bg-gray-800 text-white z-20 shadow">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={hook.handleBack}
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ← 戻る
          </button>
          <div className="text-center">
            <div className="text-sm font-bold whitespace-nowrap">検査チェックシート</div>
            <div className="text-xs text-emerald-400">{progress.done}/{progress.total} 完了 ({progress.percent}%)</div>
          </div>
          <button
            onClick={hook.handleBack}
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
            const p = hook.getCategoryProgress(cat);
            const isSkipped = hook.isCategoryDisabled(cat.id);
            const isComplete = !isSkipped && p.done === p.total && p.total > 0;
            const isSelected = hook.selectedCategoryId === cat.id;
            const progressPercent = !isSkipped && p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;

            return (
              <button
                key={cat.id}
                onClick={() => hook.setSelectedCategoryId(cat.id)}
                className={`w-full text-left p-4 flex items-center gap-3 border-b transition ${
                  isSelected ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                } ${isComplete ? 'bg-emerald-50/50' : ''} ${isSkipped ? 'bg-red-50/30' : ''}`}
              >
                <div className={`text-2xl ${isSkipped ? 'opacity-50' : ''}`}>{cat.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm truncate ${isSkipped ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {cat.shortName}
                    </span>
                    {isSkipped && <span className="text-red-500 text-xs">不可</span>}
                    {isComplete && <span className="text-emerald-500 text-xs">✓完了</span>}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{cat.name}</div>
                  {!isSkipped && (
                    <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isComplete ? 'bg-emerald-500' : 'bg-blue-500'} rounded-full transition-all`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                  {isSkipped && (
                    <div className="mt-1 h-1.5 bg-red-200 rounded-full" />
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {isSkipped ? (
                    <div className="text-xs text-red-500 font-bold">調査不可</div>
                  ) : (
                    <>
                      <div className={`font-bold text-sm ${isComplete ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {p.done}/{p.total}
                      </div>
                      <div className="text-xs text-slate-400">{progressPercent}%</div>
                    </>
                  )}
                </div>
              </button>
            );
          })}
          {/* 備考セクション */}
          <button
            onClick={() => hook.setSelectedCategoryId('remarks')}
            className={`w-full text-left p-4 flex items-center gap-3 border-b transition ${
              hook.selectedCategoryId === 'remarks' ? 'bg-slate-100 border-l-4 border-l-slate-500' : ''
            }`}
          >
            <div className="text-2xl">📝</div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm text-slate-800">備考</span>
              <div className="text-xs text-slate-500 truncate">懸念・留意事項等</div>
            </div>
          </button>
          {/* メンテナンス状況セクション */}
          <button
            onClick={() => hook.setSelectedCategoryId('maintenance')}
            className={`w-full text-left p-4 flex items-center gap-3 border-b transition ${
              hook.selectedCategoryId === 'maintenance' ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''
            }`}
          >
            <div className="text-2xl">🔧</div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm text-slate-800">メンテナンス状況</span>
              <div className="text-xs text-slate-500 truncate">補修・改修の有無</div>
            </div>
          </button>
        </div>

        {/* 右ペイン: 項目詳細 */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          {hook.selectedCategoryId === 'remarks' ? (
            <RemarksSection
              getItemOption={hook.getItemOption}
              updateItemOption={hook.updateItemOption}
            />
          ) : hook.selectedCategoryId === 'maintenance' ? (
            <MaintenanceSection
              getMaintenanceStatus={hook.getMaintenanceStatus}
              updateMaintenanceStatus={hook.updateMaintenanceStatus}
            />
          ) : hook.currentCategory ? (
            (() => {
              const isSkipped = hook.isCategoryDisabled(hook.currentCategory.id);
              const catProgress = hook.getCategoryProgress(hook.currentCategory);

              return (
                <>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-3xl ${isSkipped ? 'opacity-50' : ''}`}>{hook.currentCategory.emoji}</span>
                      <div>
                        <h2 className={`font-bold text-lg ${isSkipped ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {hook.currentCategory.shortName}
                        </h2>
                        <p className="text-xs text-slate-500">{hook.currentCategory.name}</p>
                      </div>
                    </div>

                    {/* 調査実施/不可の切り替えUI */}
                    {hook.needsSurveyToggle(hook.currentCategory.id) && (
                      <CategorySurveyToggle
                        category={hook.currentCategory}
                        status={hook.getCategorySurveyStatus(hook.currentCategory.id)}
                        isDisabled={isSkipped}
                        onToggleConducted={(conducted) => {
                          hook.updateCategorySurveyStatus(hook.currentCategory!.id, { conducted });
                        }}
                        onEditReason={(catId, reason) => {
                          hook.setEditingCategoryReason({ catId, reason });
                        }}
                        toast={hook.toast}
                      />
                    )}

                    {!isSkipped && (
                      <div className="flex items-center gap-2 mt-4">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${catProgress.total > 0 ? (catProgress.done / catProgress.total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-emerald-600">
                          {catProgress.done}/{catProgress.total}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 relative">
                    {isSkipped && (
                      <div className="absolute inset-0 bg-gray-400/40 z-10 rounded-xl pointer-events-auto" />
                    )}
                    {renderCategoryItems(hook.currentCategory, hook, true, isSkipped)}
                  </div>
                </>
              );
            })()
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

  return (
    <>
      {/* デバッグモード */}
      {DEBUG_MODE && (
        <DebugPanel
          showDebugPanel={hook.showDebugPanel}
          setShowDebugPanel={hook.setShowDebugPanel}
          isFillingDebug={hook.isFillingDebug}
          onFillAll={hook.handleDebugFillAll}
          onClearAll={hook.handleDebugClearAll}
        />
      )}

      {hook.isTablet ? renderTabletLayout() : renderMobileLayout()}

      {/* 評価追加モーダル */}
      {hook.modalItemId && hook.modalItem && (
        <EvaluationModal
          modalItemId={hook.modalItemId}
          modalItem={hook.modalItem}
          selectedEval={hook.selectedEval}
          setSelectedEval={hook.setSelectedEval}
          concernDetail={hook.concernDetail}
          setConcernDetail={hook.setConcernDetail}
          freetextContent={hook.freetextContent}
          setFreetextContent={hook.setFreetextContent}
          selectedSurveyMethods={hook.selectedSurveyMethods}
          setSelectedSurveyMethods={hook.setSelectedSurveyMethods}
          rebarPitch={hook.rebarPitch}
          setRebarPitch={hook.setRebarPitch}
          schmidtValues={hook.schmidtValues}
          setSchmidtValues={hook.setSchmidtValues}
          surveyMethodError={hook.surveyMethodError}
          setSurveyMethodError={hook.setSurveyMethodError}
          isDefectEval={hook.isDefectEval}
          isStandardMissingSurvey={hook.isStandardMissingSurvey}
          getDisabledEvals={hook.getDisabledEvals}
          getWorstEvaluation={hook.getWorstEvaluation}
          onAddEvaluation={hook.handleAddEvaluation}
          onClose={hook.closeModal}
        />
      )}

      {/* 不可理由入力モーダル */}
      {hook.editingCategoryReason && (() => {
        const editingId = hook.editingCategoryReason!.catId;
        const isItemLevel = editingId.startsWith('item:');
        const actualId = isItemLevel ? editingId.replace('item:', '') : editingId;

        const cat = isItemLevel ? null : inspectionMaster.find(c => c.id === actualId);
        const itemInfo = isItemLevel ? inspectionMaster.flatMap(c => c.items).find(i => i.id === actualId) : null;
        const displayName = isItemLevel ? (itemInfo?.name || actualId) : (cat?.name || '');

        if (!isItemLevel && !cat) return null;

        return (
          <ReasonModal
            categoryName={displayName}
            editingReason={hook.editingCategoryReason!}
            onReasonChange={(reason) => {
              hook.setEditingCategoryReason({ ...hook.editingCategoryReason!, reason });
            }}
            onSave={() => {
              if (!hook.editingCategoryReason!.reason.trim()) {
                hook.toast('不可理由を入力してください');
                return;
              }
              if (isItemLevel) {
                hook.updateItemSurveyStatus(actualId, {
                  conducted: false,
                  notConductedReason: hook.editingCategoryReason!.reason.trim(),
                });
                hook.toast(`${displayName}: 調査実施不可に設定`);
              } else {
                hook.updateCategorySurveyStatus(actualId, {
                  conducted: false,
                  notConductedReason: hook.editingCategoryReason!.reason.trim(),
                });
                hook.toast(`${cat!.shortName}: 調査実施不可に設定`);
              }
              hook.setEditingCategoryReason(null);
            }}
            onCancel={() => hook.setEditingCategoryReason(null)}
          />
        );
      })()}

      {/* トースト */}
      {hook.showToast && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-72 bg-slate-800 text-white px-4 py-3 rounded-xl text-sm text-center z-50 animate-slide-up">
          {hook.showToast}
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
