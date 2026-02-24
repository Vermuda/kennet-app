import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadData, updateData, getPropertyInspectionData } from '../storage/indexedDB';
import { generateId } from '../utils/helpers';
import { inspectionMaster } from '../utils/inspectionMaster';
import ReferencePhotoButton from '../components/ReferencePhotoButton';
import type { Property, Floor } from '../types';
import type { InspectionCategory, InspectionItem } from '../types/inspectionData';
import { MAINTENANCE_ITEMS } from './inspection/inspectionConstants';

const PropertyDetailPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [showMissingItemsModal, setShowMissingItemsModal] = useState(false);
  const [missingItems, setMissingItems] = useState<{ item: InspectionItem; category: InspectionCategory }[]>([]);
  const [missingMaintenanceLabels, setMissingMaintenanceLabels] = useState<string[]>([]);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPropertyData = async () => {
      const data = await loadData();
    const prop = data.properties.find((p) => p.id === propertyId);
    if (!prop) {
      navigate('/properties');
      return;
    }
    setProperty(prop);

    // 初回アクセス時、検査日が未設定なら日付・天候入力ページへ自動遷移
    if (!prop.inspectionDate) {
      navigate(`/properties/${propertyId}/date-weather`);
      return;
    }

    const propertyFloors = data.floors
      .filter((f) => f.propertyId === propertyId)
      .sort((a, b) => a.order - b.order);
    setFloors(propertyFloors);
    };
    loadPropertyData();
  }, [propertyId, navigate]);

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await loadData();
    const maxOrder = floors.length > 0 ? Math.max(...floors.map((f) => f.order)) : 0;

    const newFloor: Floor = {
      id: generateId(),
      propertyId: propertyId!,
      name: newFloorName,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };

    const updatedFloors = [...data.floors, newFloor];
    updateData('floors', updatedFloors);
    setFloors([...floors, newFloor].sort((a, b) => a.order - b.order));

    setNewFloorName('');
    setShowAddModal(false);
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (window.confirm('この階層を削除してもよろしいですか？')) {
      const data = await loadData();
      const updatedFloors = data.floors.filter((f) => f.id !== floorId);
      updateData('floors', updatedFloors);
      setFloors(floors.filter((f) => f.id !== floorId));

      // 関連する図面も削除
      data.blueprints = data.blueprints.filter((b) => b.floorId !== floorId);
      updateData('blueprints', data.blueprints);
    }
  };

  const handleExportData = async () => {
    const data = await loadData();

    // 方位情報を含む図面データを取得
    const blueprintsWithOrientation = data.blueprints
      .filter((b) => floors.some((f) => f.id === b.floorId))
      .map((b) => ({
        id: b.id,
        floorId: b.floorId,
        imageData: b.imageData,
        orientation: b.orientation,
        orientationIconX: b.orientationIconX,
        orientationIconY: b.orientationIconY,
        orientationIconScale: b.orientationIconScale,
        createdAt: b.createdAt,
      }));

    // 検査チェックシートのデータを取得（IndexedDBから）
    const inspectionChecklist = await getPropertyInspectionData(propertyId!);

    // 検査チェックシートの進捗を計算
    let checklistProgress = { total: 0, completed: 0 };
    if (inspectionChecklist?.evaluations) {
      const evalCount = Object.keys(inspectionChecklist.evaluations).length;
      checklistProgress = { total: 101, completed: evalCount }; // 101項目
    }

    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        version: '2.0',
        description: '現地チェックシートアプリ - データエクスポート',
      },
      property,
      floors,
      blueprints: blueprintsWithOrientation,
      markers: data.markers.filter((m) =>
        data.blueprints.some((b) => b.id === m.blueprintId && floors.some((f) => f.id === b.floorId))
      ),
      // 検査チェックシート（101項目の評価データ）
      inspectionChecklist,
      // 旧形式の検査データ（互換性のため）
      inspections: data.inspections,
      defects: data.defects,
      referenceImages: data.referenceImages.filter((r) => r.propertyId === propertyId),
    };

    console.log('[Export] データエクスポート:', {
      blueprintCount: blueprintsWithOrientation.length,
      hasInspectionChecklist: !!inspectionChecklist,
      checklistProgress,
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${property?.name}_${new Date().toISOString().split('T')[0]}_data.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert(`データをエクスポートしました\n\n図面: ${blueprintsWithOrientation.length}件\n検査チェックシート: ${checklistProgress.completed}/${checklistProgress.total}項目`);
  };

  // 検査終了バリデーション: 未入力の検査項目をチェック
  const handleInspectionComplete = useCallback(async () => {
    if (!propertyId) return;
    setIsCheckingCompletion(true);

    try {
      // 検査データを取得
      const inspectionData = await getPropertyInspectionData(propertyId);

      // 未入力項目を収集
      const missing: { item: InspectionItem; category: InspectionCategory }[] = [];

      for (const category of inspectionMaster) {
        // カテゴリが「調査実施不可」の場合はスキップ
        const catStatus = inspectionData?.categorySurveyStatus?.[category.id];
        if (catStatus && !catStatus.conducted) {
          continue;
        }

        for (const item of category.items) {
          // グループが「無」に設定されている場合はスキップ
          if (item.groupId) {
            const groupStatus = inspectionData?.groupExistence?.[item.groupId];
            if (groupStatus && groupStatus.exists === false) {
              continue;
            }
          }

          // 項目単位の調査実施不可の場合はスキップ（item95: 鉄筋探査、item96: シュミット）
          const itemSurvey = inspectionData?.itemSurveyStatus?.[item.id];
          if (itemSurvey && !itemSurvey.conducted) {
            continue;
          }

          // 評価データがあるかチェック
          const evals = inspectionData?.evaluations?.[item.id];
          if (!evals || evals.length === 0) {
            missing.push({ item, category });
          }
        }
      }

      // メンテナンス状況チェック
      const missingMaintenance: string[] = [];
      for (const maint of MAINTENANCE_ITEMS) {
        const status = inspectionData?.maintenanceStatus?.[maint.id];
        if (!status || status.need === null) {
          missingMaintenance.push(maint.label);
        }
      }

      if (missing.length > 0 || missingMaintenance.length > 0) {
        // 未入力項目がある場合はモーダルで表示
        setMissingItems(missing);
        setMissingMaintenanceLabels(missingMaintenance);
        setShowMissingItemsModal(true);
      } else {
        // 全項目入力済み: 検査終了時刻を記録
        const now = new Date().toISOString();
        const data = await loadData();
        const updatedProperties = data.properties.map((p) =>
          p.id === propertyId ? { ...p, inspectionEndTime: now, updatedAt: now } : p
        );
        await updateData('properties', updatedProperties);
        setProperty((prev) => prev ? { ...prev, inspectionEndTime: now, updatedAt: now } : prev);
        alert('検査が完了しました。');
      }
    } catch (error) {
      console.error('検査終了チェックに失敗しました:', error);
      alert('検査終了チェック中にエラーが発生しました。');
    } finally {
      setIsCheckingCompletion(false);
    }
  }, [propertyId]);

  // 未入力項目をタップして検査チェックシートへ遷移
  const handleNavigateToMissingItem = useCallback((categoryId: string) => {
    setShowMissingItemsModal(false);
    // 検査チェックシートページへ遷移（カテゴリIDをstateで渡す）
    navigate(`/properties/${propertyId}/inspection-checklist`, {
      state: { scrollToCategoryId: categoryId },
    });
  }, [propertyId, navigate]);

  if (!property) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-28">
      {/* ヘッダー - 統一スタイル */}
      <header className="sticky top-0 bg-gray-800 text-white shadow z-30 flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate('/properties')}
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ← 戻る
          </button>
          <h1 className="text-sm font-bold whitespace-nowrap truncate flex-1 text-center">
            {property.name}
          </h1>
          <button
            onClick={() => navigate('/settings')}
            className="p-1.5 border border-white text-white rounded hover:bg-white hover:text-slate-900 transition-all"
            title="設定"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* 物件情報カード - コンパクト2カラム */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-emerald-400 font-bold text-sm">物件情報</h2>
            <button
              onClick={handleExportData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              データ出力
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-700/50 rounded-lg p-2.5">
              <div className="text-emerald-300/80 mb-0.5">住所</div>
              <div className="text-white truncate">{property.address}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-2.5">
              <div className="text-emerald-300/80 mb-0.5">検査日</div>
              <div className="text-white">
                {property.inspectionDate
                  ? new Date(property.inspectionDate).toLocaleDateString('ja-JP')
                  : '未設定'}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-2.5">
              <div className="text-emerald-300/80 mb-0.5">天候</div>
              <div className="text-white">{property.weather || '未設定'}</div>
            </div>
            <button
              onClick={() => navigate(`/properties/${propertyId}/standard-photos`)}
              className="bg-emerald-600 hover:bg-emerald-500 rounded-lg p-2.5 text-left transition-colors shadow-md"
            >
              <div className="text-white/90 mb-0.5 flex items-center gap-1 font-medium">
                定形写真
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="text-white font-bold">{property.standardPhotos?.length || 0}/16枚</div>
            </button>
          </div>
        </div>

        {/* 階層一覧 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800">階層一覧</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              + 追加
            </button>
          </div>

          {floors.length > 0 ? (
            <div className="space-y-2">
              {floors.map((floor) => (
                <div
                  key={floor.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-800">{floor.name}</h3>
                    <p className="text-xs text-slate-400">
                      {new Date(floor.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/floors/${floor.id}`)}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
                    >
                      図面
                    </button>
                    <button
                      onClick={() => handleDeleteFloor(floor.id)}
                      className="px-3 py-1.5 border border-red-400 text-red-500 rounded-lg text-xs font-medium"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              階層が登録されていません
            </div>
          )}
        </div>
      </main>

      {/* 階層追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">階層追加</h2>
            <form onSubmit={handleAddFloor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  階層名
                </label>
                <input
                  type="text"
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="例: 1F, 2F, 屋上"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-medium"
                >
                  追加
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewFloorName('');
                  }}
                  className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-xl font-medium"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 検査終了ボタン（固定位置 - 左下） */}
      {property.inspectionEndTime ? (
        <button
          disabled
          className="group fixed bottom-8 left-8
            bg-slate-500
            text-white px-4 py-3 rounded-2xl
            shadow-2xl shadow-slate-500/50
            z-50
            ring-4 ring-slate-200/50
            border-2 border-white/20
            backdrop-blur-sm
            flex flex-col items-center gap-1
            opacity-80"
          title="検査完了"
          aria-label="検査完了"
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-bold whitespace-nowrap">
            完了{' '}
            {new Date(property.inspectionEndTime).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </button>
      ) : (
        <button
          onClick={handleInspectionComplete}
          disabled={isCheckingCompletion}
          className="group fixed bottom-8 left-8
            bg-red-600
            text-white px-4 py-3 rounded-2xl
            shadow-2xl shadow-red-600/50
            hover:shadow-[0_0_40px_rgba(220,38,38,0.6)]
            transition-all duration-300 ease-out
            hover:scale-110 active:scale-95
            z-50
            ring-4 ring-red-200/50 hover:ring-red-300/70
            border-2 border-white/20
            backdrop-blur-sm
            hover:bg-red-700
            flex flex-col items-center gap-1
            disabled:opacity-60 disabled:hover:scale-100"
          title="検査終了"
          aria-label="検査終了"
        >
          {isCheckingCompletion ? (
            <>
              <svg className="h-7 w-7 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs font-bold whitespace-nowrap">確認中</span>
            </>
          ) : (
            <>
              <svg className="h-7 w-7 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-bold whitespace-nowrap">検査終了</span>
            </>
          )}
        </button>
      )}

      {/* 検査入力ボタン（固定位置 - 中央下） */}
      <button
        onClick={() => navigate(`/properties/${propertyId}/inspection-checklist`)}
        className="group fixed bottom-8 left-1/2 -translate-x-1/2
          bg-blue-600
          text-white px-5 py-3 rounded-2xl
          shadow-2xl shadow-blue-600/50
          hover:shadow-[0_0_40px_rgba(37,99,235,0.6)]
          transition-all duration-300 ease-out
          hover:scale-110 active:scale-95
          z-50
          ring-4 ring-blue-200/50 hover:ring-blue-300/70
          border-2 border-white/20
          backdrop-blur-sm
          hover:bg-blue-700
          flex flex-col items-center gap-1"
        title="検査入力"
        aria-label="検査入力"
      >
        <svg className="h-7 w-7 transition-transform duration-300 group-hover:rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <span className="text-xs font-bold whitespace-nowrap">検査入力</span>
      </button>

      {/* 未入力項目モーダル */}
      {showMissingItemsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* モーダルヘッダー */}
            <div className="px-5 pt-5 pb-3 border-b flex-shrink-0">
              <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                未入力の検査項目があります
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {missingItems.length + missingMaintenanceLabels.length}件の項目が未入力です。
                {missingItems.length > 0 && 'タップすると該当カテゴリへ移動します。'}
              </p>
            </div>

            {/* 未入力項目リスト */}
            <div className="overflow-y-auto flex-1 p-3">
              {(() => {
                // カテゴリごとにグループ化
                const grouped: { category: InspectionCategory; items: InspectionItem[] }[] = [];
                for (const { item, category } of missingItems) {
                  const existing = grouped.find((g) => g.category.id === category.id);
                  if (existing) {
                    existing.items.push(item);
                  } else {
                    grouped.push({ category, items: [item] });
                  }
                }

                return (
                  <>
                    {grouped.map(({ category, items }) => (
                      <div key={category.id} className="mb-3">
                        <button
                          onClick={() => handleNavigateToMissingItem(category.id)}
                          className="w-full text-left"
                        >
                          <div className={`bg-gradient-to-r ${category.color} text-white px-3 py-2 rounded-t-xl text-sm font-bold flex items-center justify-between`}>
                            <span>{category.name}</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{items.length}件</span>
                          </div>
                        </button>
                        <div className="bg-red-50 border border-red-200 rounded-b-xl divide-y divide-red-100">
                          {items.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleNavigateToMissingItem(category.id)}
                              className="w-full text-left px-3 py-2 hover:bg-red-100 transition-colors flex items-center gap-2"
                            >
                              <span className="w-6 h-6 rounded bg-red-400 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                                {item.num}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-slate-800">{item.name}</div>
                                <div className="text-xs text-slate-500 truncate">{item.desc}</div>
                              </div>
                              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {/* メンテナンス未入力 */}
                    {missingMaintenanceLabels.length > 0 && (
                      <div className="mb-3">
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-2 rounded-t-xl text-sm font-bold flex items-center justify-between">
                          <span>メンテナンス状況</span>
                          <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{missingMaintenanceLabels.length}件</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-b-xl divide-y divide-amber-100">
                          {missingMaintenanceLabels.map((label) => (
                            <div
                              key={label}
                              className="px-3 py-2 flex items-center gap-2"
                            >
                              <span className="w-6 h-6 rounded bg-amber-400 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">!</span>
                              <div className="text-sm font-medium text-slate-800">{label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* モーダルフッター */}
            <div className="px-5 py-4 border-t flex-shrink-0">
              <button
                onClick={() => setShowMissingItemsModal(false)}
                className="w-full border-2 border-slate-300 text-slate-600 py-3 rounded-xl font-bold"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 通常撮影ボタン */}
      {propertyId && <ReferencePhotoButton propertyId={propertyId} />}
    </div>
  );
};

export default PropertyDetailPage;
