import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadData, updateData } from '../storage/localStorage';
import { generateId } from '../utils/helpers';
import type { ReferenceImage } from '../types';

const ReferenceImageInputPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { blueprintId, imageData, returnPath } = location.state as {
    blueprintId: string;
    imageData: string;
    returnPath: string;
  };

  const [memo, setMemo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = loadData();
    const blueprint = data.blueprints.find((b) => b.id === blueprintId);
    if (!blueprint) return;

    const floor = data.floors.find((f) => f.id === blueprint.floorId);
    if (!floor) return;

    const referenceImage: ReferenceImage = {
      id: generateId(),
      propertyId: floor.propertyId,
      floorId: floor.id,
      imageData,
      memo: memo || undefined,
      createdAt: new Date().toISOString(),
    };

    updateData('referenceImages', [...data.referenceImages, referenceImage]);

    // 元の画面に戻る
    navigate(returnPath);
  };

  const handleRetake = () => {
    navigate('/camera/reference', {
      state: {
        blueprintId,
        returnPath,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">参考画像登録</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">撮影画像</h2>
          <img
            src={imageData}
            alt="参考画像"
            className="w-full h-auto rounded-lg mb-3"
          />
          <button
            onClick={handleRetake}
            className="w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            撮影し直す
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メモ（任意）
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="この画像についてのメモを入力"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => navigate(returnPath)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ReferenceImageInputPage;

