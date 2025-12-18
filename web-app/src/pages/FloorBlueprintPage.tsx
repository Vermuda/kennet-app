import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadData, updateData, logStorageUsage, getStorageWarningLevel } from '../storage/localStorage';
import { generateId, convertImageToBase64 } from '../utils/helpers';
import { compressImage, formatSize, getBase64Size } from '../utils/imageCompression';
import type { Floor, Blueprint } from '../types';

const FloorBlueprintPage: React.FC = () => {
  const { floorId } = useParams<{ floorId: string }>();
  const [floor, setFloor] = useState<Floor | null>(null);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const data = loadData();
    const floorData = data.floors.find((f) => f.id === floorId);
    if (!floorData) {
      navigate('/properties');
      return;
    }
    setFloor(floorData);

    const floorBlueprints = data.blueprints.filter((b) => b.floorId === floorId);
    setBlueprints(floorBlueprints);
  }, [floorId, navigate]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // まず元の画像を読み込み
      const originalImageData = await convertImageToBase64(file);
      const originalSize = getBase64Size(originalImageData);
      
      console.log('[FloorBlueprint] Original image loaded:', {
        fileName: file.name,
        size: formatSize(originalSize),
      });
      
      // LocalStorageの使用状況をチェック
      logStorageUsage();
      const warningLevel = getStorageWarningLevel();
      
      if (warningLevel === 'critical') {
        alert('⚠️ LocalStorageの容量が不足しています。\n古いデータを削除するか、データをエクスポートしてください。');
        return;
      } else if (warningLevel === 'warning') {
        const proceed = window.confirm(
          '⚠️ LocalStorageの使用量が多くなっています。\n' +
          'このまま追加しますか？\n\n' +
          '（データエクスポートを推奨します）'
        );
        if (!proceed) return;
      }
      
      // WebP 80%で圧縮
      const compressed = await compressImage(originalImageData, {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'webp',
      });
      
      console.log('[FloorBlueprint] Image compressed:', {
        format: compressed.format,
        originalSize: formatSize(compressed.originalSize),
        compressedSize: formatSize(compressed.compressedSize),
        compressionRatio: `${compressed.compressionRatio.toFixed(1)}% reduction`,
        dimensions: `${compressed.width}x${compressed.height}`,
      });
      
      const data = loadData();

      const newBlueprint: Blueprint = {
        id: generateId(),
        floorId: floorId!,
        imageData: compressed.dataUrl,
        createdAt: new Date().toISOString(),
      };

      const updatedBlueprints = [...data.blueprints, newBlueprint];
      updateData('blueprints', updatedBlueprints);
      setBlueprints([...blueprints, newBlueprint]);
      
      // 完了後の使用状況をログ
      logStorageUsage();
    } catch (error) {
      console.error('Failed to load image:', error);
      alert('画像の読み込みまたは圧縮に失敗しました');
    }
  };

  const handleDeleteBlueprint = (blueprintId: string) => {
    if (window.confirm('この図面を削除してもよろしいですか？')) {
      const data = loadData();
      const updatedBlueprints = data.blueprints.filter((b) => b.id !== blueprintId);
      updateData('blueprints', updatedBlueprints);
      setBlueprints(blueprints.filter((b) => b.id !== blueprintId));

      // 関連するマーカーも削除
      data.markers = data.markers.filter((m) => m.blueprintId !== blueprintId);
      updateData('markers', data.markers);
    }
  };

  const handleViewBlueprint = (blueprintId: string) => {
    navigate(`/blueprints/${blueprintId}`);
  };

  const goBack = () => {
    if (floor) {
      const data = loadData();
      const property = data.properties.find((p) =>
        data.floors.some((f) => f.id === floorId && f.propertyId === p.id)
      );
      if (property) {
        navigate(`/properties/${property.id}`);
      } else {
        navigate('/properties');
      }
    }
  };

  if (!floor) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={goBack} className="text-gray-600 hover:text-gray-800">
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{floor.name} - 図面管理</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <label className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 cursor-pointer inline-block">
            + 図面を追加
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {blueprints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blueprints.map((blueprint) => (
              <div
                key={blueprint.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition duration-200 overflow-hidden"
              >
                <div className="aspect-video bg-gray-200 relative">
                  <img
                    src={blueprint.imageData}
                    alt="図面"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-500 mb-4">
                    登録日: {new Date(blueprint.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewBlueprint(blueprint.id)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      開く
                    </button>
                    <button
                      onClick={() => handleDeleteBlueprint(blueprint.id)}
                      className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            図面が登録されていません。図面を追加してください。
          </div>
        )}
      </main>
    </div>
  );
};

export default FloorBlueprintPage;

