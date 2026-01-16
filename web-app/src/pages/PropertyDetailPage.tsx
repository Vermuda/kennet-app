import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadData, updateData } from '../storage/localStorage';
import { generateId } from '../utils/helpers';
import ReferencePhotoButton from '../components/ReferencePhotoButton';
import type { Property, Floor } from '../types';

const PropertyDetailPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const data = loadData();
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
  }, [propertyId, navigate]);

  const handleAddFloor = (e: React.FormEvent) => {
    e.preventDefault();
    const data = loadData();
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

  const handleDeleteFloor = (floorId: string) => {
    if (window.confirm('この階層を削除してもよろしいですか？')) {
      const data = loadData();
      const updatedFloors = data.floors.filter((f) => f.id !== floorId);
      updateData('floors', updatedFloors);
      setFloors(floors.filter((f) => f.id !== floorId));

      // 関連する図面も削除
      data.blueprints = data.blueprints.filter((b) => b.floorId !== floorId);
      updateData('blueprints', data.blueprints);
    }
  };

  const handleExportData = () => {
    const data = loadData();

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

    // 検査チェックシートのデータを取得
    let inspectionChecklist = null;
    try {
      const checklistData = localStorage.getItem('kennet_property_inspections');
      if (checklistData) {
        const allChecklist = JSON.parse(checklistData);
        if (allChecklist[propertyId!]) {
          inspectionChecklist = allChecklist[propertyId!];
        }
      }
    } catch (e) {
      console.error('Failed to load inspection checklist:', e);
    }

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

    alert(`✅ データをエクスポートしました\n\n図面: ${blueprintsWithOrientation.length}件\n検査チェックシート: ${checklistProgress.completed}/${checklistProgress.total}項目`);
    setShowMenu(false);
  };

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
          <h1 className="text-sm font-bold whitespace-nowrap truncate max-w-[180px]">
            {property.name}
          </h1>
          
          {/* メニューボタン */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-white/20 rounded"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {/* ドロップダウンメニュー */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      navigate(`/properties/${propertyId}/standard-photos`);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-emerald-50 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    定形写真管理
                  </button>
                  <button
                    onClick={handleExportData}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-teal-50 flex items-center gap-2 border-t"
                  >
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    データエクスポート
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* 物件情報カード - コンパクト2カラム */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 shadow-lg">
          <h2 className="text-emerald-400 font-bold text-sm mb-3">物件情報</h2>
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
            <div className="bg-slate-700/50 rounded-lg p-2.5">
              <div className="text-emerald-300/80 mb-0.5">定形写真</div>
              <div className="text-white">{property.standardPhotos?.length || 0}/16枚</div>
            </div>
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

      {/* 通常撮影ボタン */}
      {propertyId && <ReferencePhotoButton propertyId={propertyId} />}
    </div>
  );
};

export default PropertyDetailPage;
