import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadData, updateData } from '../storage/localStorage';
import { generateId } from '../utils/helpers';
import { inspectionCategories, inspectionResultLabels } from '../utils/categoryData';
import ReferencePhotoButton from '../components/ReferencePhotoButton';
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
  const [propertyId, setPropertyId] = useState<string | null>(null);

  const middleOptions = majorCategory ? inspectionCategories.middle[majorCategory] || [] : [];
  const minorOptions = middleCategory ? inspectionCategories.minor[middleCategory] || [] : [];

  useEffect(() => {
    const data = loadData();
    const blueprint = data.blueprints.find((b) => b.id === blueprintId);
    if (blueprint) {
      const floor = data.floors.find((f) => f.id === blueprint.floorId);
      if (floor) {
        setPropertyId(floor.propertyId);
      }
    }
  }, [blueprintId]);

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
          returnPath: `/blueprints/${blueprintId}`,
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
      <header className="bg-gray-800 text-white shadow flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="w-12"></div>
          <h1 className="text-sm font-bold whitespace-nowrap">検査情報入力</h1>
          <div className="w-12"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                      result === key
                        ? 'border-emerald-500 bg-emerald-50'
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
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                確定
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 border-2 border-slate-600 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-700 hover:text-white hover:border-slate-700 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* 通常撮影ボタン */}
      {propertyId && <ReferencePhotoButton propertyId={propertyId} />}
    </div>
  );
};

export default InspectionInputPage;

