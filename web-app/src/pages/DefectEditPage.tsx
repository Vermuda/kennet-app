import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { loadData, updateData } from '../storage/localStorage';
import type { DefectInfo, Inspection } from '../types';

const DefectEditPage: React.FC = () => {
  const { defectId } = useParams<{ defectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    defect?: DefectInfo & { inspection: Inspection };
    blueprintId?: string;
    newImageData?: string;
    existingData?: any;
  };

  // カメラから戻ってきた場合の処理
  const initialDefect = state.defect || (() => {
    const data = loadData();
    const defect = data.defects.find((d) => d.id === defectId);
    const inspection = data.inspections.find((i) => i.id === defect?.inspectionId);
    return { ...defect, inspection } as DefectInfo & { inspection: Inspection };
  })();

  const blueprintId = state.blueprintId || (() => {
    const data = loadData();
    const inspection = data.inspections.find((i) => i.id === initialDefect.inspectionId);
    return inspection?.blueprintId || '';
  })();

  const [location_, setLocation] = useState(state.existingData?.location || initialDefect.location);
  const [component, setComponent] = useState(state.existingData?.component || initialDefect.component);
  const [deterioration, setDeterioration] = useState(state.existingData?.deterioration || initialDefect.deterioration);
  const [repairMethod, setRepairMethod] = useState(state.existingData?.repairMethod || initialDefect.repairMethod);
  const [imageData, setImageData] = useState(state.newImageData || initialDefect.imageData);

  useEffect(() => {
    if (state.newImageData) {
      setImageData(state.newImageData);
    }
  }, [state.newImageData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = loadData();
    const updatedDefects = data.defects.map((d) =>
      d.id === defectId
        ? {
            ...d,
            location: location_,
            component,
            deterioration,
            repairMethod,
            imageData,
          }
        : d
    );

    updateData('defects', updatedDefects);
    navigate(`/defects/${blueprintId}`);
  };

  const handleRetake = () => {
    navigate('/camera/defect', {
      state: {
        inspectionId: initialDefect.inspectionId,
        blueprintId,
        isEdit: true,
        returnPath: `/defect/edit/${defectId}`,
        existingData: {
          location: location_,
          component,
          deterioration,
          repairMethod,
        },
      },
    });
  };

  const handleCancel = () => {
    navigate(`/defects/${blueprintId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white shadow flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={handleCancel}
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ← 戻る
          </button>
          <h1 className="text-sm font-bold whitespace-nowrap">不具合情報編集</h1>
          <div className="w-12"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">撮影画像</h2>
          <img
            src={imageData}
            alt="不具合画像"
            className="w-full h-auto rounded-xl mb-3"
          />
          <button
            onClick={handleRetake}
            className="w-full py-2 border border-emerald-600 text-emerald-600 rounded-xl hover:bg-emerald-50"
          >
            撮影し直す
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">検査情報（変更不可）</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-medium">大分類:</span> {initialDefect.inspection.majorCategory}
            </p>
            <p>
              <span className="font-medium">中分類:</span> {initialDefect.inspection.middleCategory}
            </p>
            <p>
              <span className="font-medium">小分類:</span> {initialDefect.inspection.minorCategory}
            </p>
            <p>
              <span className="font-medium">検査結果:</span> {initialDefect.inspection.result}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                場所 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={location_}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                placeholder="例: 1階北側外壁"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                部位 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={component}
                onChange={(e) => setComponent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                placeholder="例: 外壁塗装"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                劣化状況 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deterioration}
                onChange={(e) => setDeterioration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                rows={4}
                placeholder="例: 塗装の剥がれ、ひび割れが複数箇所確認される"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                補修・改修の範囲・方法 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={repairMethod}
                onChange={(e) => setRepairMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                rows={4}
                placeholder="例: 該当箇所の下地処理後、再塗装を実施"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                更新
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
    </div>
  );
};

export default DefectEditPage;

