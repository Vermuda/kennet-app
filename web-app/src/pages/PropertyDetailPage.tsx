import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadData, updateData } from '../storage/localStorage';
import { generateId } from '../utils/helpers';
import { isB2Configured, uploadToB2 } from '../services/b2Storage';
import type { Property, Floor, B2UploadStatus } from '../types';

const PropertyDetailPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [uploadStatus, setUploadStatus] = useState<B2UploadStatus>({
    isUploading: false,
    progress: 0,
    uploadedCount: 0,
    totalCount: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const data = loadData();
    const prop = data.properties.find((p) => p.id === propertyId);
    if (!prop) {
      navigate('/properties');
      return;
    }
    setProperty(prop);

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
    const exportData = {
      property,
      floors,
      blueprints: data.blueprints.filter((b) =>
        floors.some((f) => f.id === b.floorId)
      ),
      markers: data.markers.filter((m) =>
        data.blueprints.some((b) => b.id === m.blueprintId && floors.some((f) => f.id === b.floorId))
      ),
      inspections: data.inspections,
      defects: data.defects,
      referenceImages: data.referenceImages.filter((r) => r.propertyId === propertyId),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${property?.name}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadToB2 = async () => {
    if (!isB2Configured()) {
      alert('⚠️ Backblaze B2が設定されていません。\n.env.localファイルを確認してください。');
      return;
    }

    if (!window.confirm('すべての画像をBackblaze B2にアップロードしますか？')) {
      return;
    }

    const data = loadData();
    
    // アップロード対象の画像を収集
    const imagesToUpload: Array<{
      id: string;
      floorId: string;
      imageType: 'blueprints' | 'defects' | 'references';
      imageData: string;
    }> = [];

    // 図面
    data.blueprints
      .filter((b) => floors.some((f) => f.id === b.floorId))
      .forEach((blueprint) => {
        imagesToUpload.push({
          id: blueprint.id,
          floorId: blueprint.floorId,
          imageType: 'blueprints',
          imageData: blueprint.imageData,
        });
      });

    // 不具合画像
    data.defects.forEach((defect) => {
      const inspection = data.inspections.find((i) => i.id === defect.inspectionId);
      if (inspection) {
        const marker = data.markers.find((m) => m.id === inspection.markerId);
        if (marker) {
          const blueprint = data.blueprints.find((b) => b.id === marker.blueprintId);
          if (blueprint && floors.some((f) => f.id === blueprint.floorId)) {
            imagesToUpload.push({
              id: defect.id,
              floorId: blueprint.floorId,
              imageType: 'defects',
              imageData: defect.imageData,
            });
          }
        }
      }
    });

    // 参考画像
    data.referenceImages
      .filter((r) => r.propertyId === propertyId && r.floorId)
      .forEach((ref) => {
        imagesToUpload.push({
          id: ref.id,
          floorId: ref.floorId!,
          imageType: 'references',
          imageData: ref.imageData,
        });
      });

    const totalCount = imagesToUpload.length;

    if (totalCount === 0) {
      alert('アップロードする画像がありません。');
      return;
    }

    console.log('[B2Upload] Starting upload:', { totalCount });

    setUploadStatus({
      isUploading: true,
      progress: 0,
      uploadedCount: 0,
      totalCount,
    });

    let uploadedCount = 0;
    const errors: string[] = [];

    for (const image of imagesToUpload) {
      try {
        setUploadStatus((prev) => ({
          ...prev,
          currentFile: `${image.imageType}/${image.id}`,
        }));

        const result = await uploadToB2({
          propertyId: propertyId!,
          floorId: image.floorId,
          imageType: image.imageType,
          imageId: image.id,
          imageData: image.imageData,
        });

        if (result.success) {
          uploadedCount++;
          console.log('[B2Upload] Uploaded:', result.key);
        } else {
          errors.push(`${image.id}: ${result.error}`);
          console.error('[B2Upload] Failed:', image.id, result.error);
        }

        const progress = Math.round((uploadedCount / totalCount) * 100);
        setUploadStatus((prev) => ({
          ...prev,
          progress,
          uploadedCount,
        }));
      } catch (error) {
        errors.push(`${image.id}: ${error}`);
        console.error('[B2Upload] Error:', error);
      }
    }

    setUploadStatus({
      isUploading: false,
      progress: 100,
      uploadedCount,
      totalCount,
    });

    if (errors.length > 0) {
      console.error('[B2Upload] Errors:', errors);
      alert(
        `アップロード完了: ${uploadedCount}/${totalCount}\n\n` +
        `エラー: ${errors.length}件\n` +
        `詳細はコンソールを確認してください。`
      );
    } else {
      alert(`✅ アップロード完了！\n${uploadedCount}/${totalCount}件の画像をアップロードしました。`);
    }
  };

  if (!property) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/properties')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{property.name}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">物件情報</h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-medium">住所:</span> {property.address}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">作成日:</span>{' '}
              {new Date(property.createdAt).toLocaleDateString('ja-JP')}
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleExportData}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              📥 データエクスポート
            </button>
            {isB2Configured() && (
              <button
                onClick={handleUploadToB2}
                disabled={uploadStatus.isUploading}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  uploadStatus.isUploading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {uploadStatus.isUploading ? (
                  <>
                    ⏳ アップロード中... {uploadStatus.progress}%
                  </>
                ) : (
                  '☁️ B2にアップロード'
                )}
              </button>
            )}
          </div>
          
          {/* アップロード進捗表示 */}
          {uploadStatus.isUploading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">
                  {uploadStatus.uploadedCount} / {uploadStatus.totalCount} 完了
                </span>
                <span className="text-gray-600">
                  {uploadStatus.currentFile}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadStatus.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">階層一覧</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + 階層追加
            </button>
          </div>

          {floors.length > 0 ? (
            <div className="space-y-3">
              {floors.map((floor) => (
                <div
                  key={floor.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-semibold text-lg">{floor.name}</h3>
                    <p className="text-sm text-gray-500">
                      作成日: {new Date(floor.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/floors/${floor.id}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      図面管理
                    </button>
                    <button
                      onClick={() => handleDeleteFloor(floor.id)}
                      className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              階層が登録されていません。階層を追加してください。
            </div>
          )}
        </div>
      </main>

      {/* 階層追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">階層追加</h2>
            <form onSubmit={handleAddFloor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  階層名（例: 1F, 2F, 屋上）
                </label>
                <input
                  type="text"
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="1F"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  追加
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewFloorName('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailPage;

