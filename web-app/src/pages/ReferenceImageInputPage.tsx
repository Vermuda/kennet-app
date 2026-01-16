import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadData, updateData } from '../storage/localStorage';
import { generateId } from '../utils/helpers';
import type { ReferenceImage } from '../types';

const ReferenceImageInputPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { propertyId, imageData, returnPath } = location.state as {
    propertyId: string;
    imageData: string;
    returnPath: string;
  };

  const [memo, setMemo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = loadData();
    const property = data.properties.find((p) => p.id === propertyId);
    if (!property) {
      alert('物件が見つかりません');
      navigate('/properties');
      return;
    }

    const referenceImage: ReferenceImage = {
      id: generateId(),
      propertyId: propertyId,
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
        propertyId,
        returnPath,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white shadow flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(returnPath)}
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ← 戻る
          </button>
          <h1 className="text-sm font-bold whitespace-nowrap">通常撮影登録</h1>
          <div className="w-12"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">撮影画像</h2>
          <img
            src={imageData}
            alt="通常撮影"
            className="w-full h-auto rounded-xl mb-3"
          />
          <button
            onClick={handleRetake}
            className="w-full py-2 border border-emerald-600 text-emerald-600 rounded-xl hover:bg-emerald-50"
          >
            撮影し直す
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メモ（任意）
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                rows={4}
                placeholder="この画像についてのメモを入力"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => navigate(returnPath)}
                className="flex-1 border-2 border-slate-600 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-700 hover:text-white hover:border-slate-700 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95"
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

