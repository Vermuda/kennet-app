import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadData, updateData, logStorageUsage, getStorageWarningLevel } from '../storage/localStorage';
import { generateId, convertImageToBase64 } from '../utils/helpers';
import { compressImage, formatSize, getBase64Size } from '../utils/imageCompression';
import ReferencePhotoButton from '../components/ReferencePhotoButton';
import type { Floor, Blueprint } from '../types';

const FloorBlueprintPage: React.FC = () => {
  const { floorId } = useParams<{ floorId: string }>();
  const [floor, setFloor] = useState<Floor | null>(null);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = loadData();
    const floorData = data.floors.find((f) => f.id === floorId);
    if (!floorData) {
      navigate('/properties');
      return;
    }
    setFloor(floorData);
    setPropertyId(floorData.propertyId);

    const floorBlueprints = data.blueprints.filter((b) => b.floorId === floorId);
    setBlueprints(floorBlueprints);
  }, [floorId, navigate]);

  // 検査入力画面へ遷移
  const handleStartInspection = () => {
    if (propertyId) {
      navigate(`/properties/${propertyId}/inspection-checklist`, {
        state: { fromFloor: floorId },
      });
    }
  };

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

      // 方位設定ページへ遷移
      navigate(`/blueprints/${newBlueprint.id}/orientation`, {
        state: { fromUpload: true },
      });
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
      <header className="bg-gray-800 text-white shadow flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={goBack}
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ← 戻る
          </button>
          <h1 className="text-sm font-bold whitespace-nowrap">{floor.name} - 図面管理</h1>
          <div className="w-12"></div>
        </div>
      </header>

      {/* 通常撮影ボタン */}
      <ReferencePhotoButton propertyId={floor.propertyId} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          {/* 図面は1つだけ登録可能 - 0個の場合のみ追加ボタンを表示 */}
          {blueprints.length === 0 && (
            <label className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl cursor-pointer inline-block">
              + 図面を追加
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
          {blueprints.length > 0 && (
            <button
              onClick={handleStartInspection}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              検査入力
            </button>
          )}
          {blueprints.length === 0 && (
            <span className="text-red-600 text-sm font-medium">
              ※ 推奨解像度: 1920×1080px以下（自動で圧縮されます）
            </span>
          )}
        </div>

        {blueprints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blueprints.map((blueprint) => (
              <div
                key={blueprint.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition duration-200 overflow-hidden"
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
                      className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95"
                    >
                      開く
                    </button>
                    <button
                      onClick={() => handleDeleteBlueprint(blueprint.id)}
                      className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300 ease-out transform hover:scale-105 active:scale-95"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
            図面が登録されていません。図面を追加してください。
          </div>
        )}
      </main>
    </div>
  );
};

export default FloorBlueprintPage;

