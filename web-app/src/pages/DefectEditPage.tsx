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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={handleCancel} className="text-gray-600 hover:text-gray-800">
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-800">不具合情報編集</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">撮影画像</h2>
          <img
            src={imageData}
            alt="不具合画像"
            className="w-full h-auto rounded-lg mb-3"
          />
          <button
            onClick={handleRetake}
            className="w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            撮影し直す
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
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

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                場所 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={location_}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="例: 該当箇所の下地処理後、再塗装を実施"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                更新
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

export default DefectEditPage;

