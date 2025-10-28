import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadData, updateData } from '../storage/localStorage';
import { generateId } from '../utils/helpers';
import { inspectionCategories, inspectionResultLabels } from '../utils/categoryData';
import type { Marker, Inspection, InspectionResult } from '../types';

const InspectionInputPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { blueprintId, x, y } = location.state as {
    blueprintId: string;
    x: number;
    y: number;
  };

  const [majorCategory, setMajorCategory] = useState('');
  const [middleCategory, setMiddleCategory] = useState('');
  const [minorCategory, setMinorCategory] = useState('');
  const [result, setResult] = useState<InspectionResult | ''>('');

  const middleOptions = majorCategory ? inspectionCategories.middle[majorCategory] || [] : [];
  const minorOptions = middleCategory ? inspectionCategories.minor[middleCategory] || [] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!majorCategory || !middleCategory || !minorCategory || !result) {
      alert('すべての項目を入力してください');
      return;
    }

    const data = loadData();

    // マーカーを作成
    const marker: Marker = {
      id: generateId(),
      blueprintId,
      x,
      y,
      createdAt: new Date().toISOString(),
    };

    // 検査情報を作成
    const inspection: Inspection = {
      id: generateId(),
      markerId: marker.id,
      blueprintId,
      majorCategory,
      middleCategory,
      minorCategory,
      result,
      createdAt: new Date().toISOString(),
    };

    marker.inspectionId = inspection.id;

    // データを保存
    updateData('markers', [...data.markers, marker]);
    updateData('inspections', [...data.inspections, inspection]);

    // b2またはcの場合は撮影画面へ
    if (result === 'b2' || result === 'c') {
      navigate('/camera/defect', {
        state: {
          inspectionId: inspection.id,
          blueprintId,
        },
      });
    } else {
      // aまたはb1の場合は図面表示画面に戻る
      navigate(`/blueprints/${blueprintId}`);
    }
  };

  const handleCancel = () => {
    navigate(`/blueprints/${blueprintId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">検査情報入力</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                大分類 <span className="text-red-500">*</span>
              </label>
              <select
                value={majorCategory}
                onChange={(e) => {
                  setMajorCategory(e.target.value);
                  setMiddleCategory('');
                  setMinorCategory('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">選択してください</option>
                {inspectionCategories.major.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                中分類 <span className="text-red-500">*</span>
              </label>
              <select
                value={middleCategory}
                onChange={(e) => {
                  setMiddleCategory(e.target.value);
                  setMinorCategory('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!majorCategory}
                required
              >
                <option value="">選択してください</option>
                {middleOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                小分類 <span className="text-red-500">*</span>
              </label>
              <select
                value={minorCategory}
                onChange={(e) => setMinorCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!middleCategory}
                required
              >
                <option value="">選択してください</option>
                {minorOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                検査結果 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {(Object.keys(inspectionResultLabels) as InspectionResult[]).map((key) => (
                  <label
                    key={key}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                      result === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="result"
                      value={key}
                      checked={result === key}
                      onChange={(e) => setResult(e.target.value as InspectionResult)}
                      className="mr-3"
                      required
                    />
                    <span className="font-medium">
                      {inspectionResultLabels[key]}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-sm text-gray-600">
                ※ b2またはcを選択した場合、撮影画面に進みます
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                確定
              </button>
              <button
                type="button"
                onClick={handleCancel}
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

export default InspectionInputPage;

