import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { loadData, updateData } from '../storage/indexedDB';
import type { DefectInfo, Inspection } from '../types';

interface ExistingFormData {
  location: string;
  component: string;
  deterioration: string;
  repairMethod: string;
}

const DefectEditPage: React.FC = () => {
  const { defectId } = useParams<{ defectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    defect?: DefectInfo & { inspection: Inspection };
    blueprintId?: string;
    newImageData?: string;
    existingData?: ExistingFormData;
    returnPath?: string;
  };

  // カメラから戻ってきた場合の処理
  const [initialDefect, setInitialDefect] = useState<DefectInfo & { inspection: Inspection } | null>(null);
  const [blueprintId, setBlueprintId] = useState<string>('');

  useEffect(() => {
    const loadDefectData = async () => {
      if (state.defect) {
        setInitialDefect(state.defect);
        setBlueprintId(state.blueprintId || '');
      } else {
        const data = await loadData();
        const defect = data.defects.find((d) => d.id === defectId);
        const inspection = data.inspections.find((i) => i.id === defect?.inspectionId);
        const loadedDefect = { ...defect, inspection } as DefectInfo & { inspection: Inspection };
        setInitialDefect(loadedDefect);

        const foundInspection = data.inspections.find((i) => i.id === loadedDefect.inspectionId);
        setBlueprintId(foundInspection?.blueprintId || '');
      }
    };
    loadDefectData();
  }, [state.defect, state.blueprintId, defectId]);

  const [location_, setLocation] = useState(state.existingData?.location || '');
  const [component, setComponent] = useState(state.existingData?.component || '');
  const [deterioration, setDeterioration] = useState(state.existingData?.deterioration || '');
  const [repairMethod, setRepairMethod] = useState(state.existingData?.repairMethod || '');
  const [imageData, setImageData] = useState(state.newImageData || '');

  useEffect(() => {
    if (initialDefect) {
      if (!state.existingData?.location) setLocation(initialDefect.location);
      if (!state.existingData?.component) setComponent(initialDefect.component);
      if (!state.existingData?.deterioration) setDeterioration(initialDefect.deterioration);
      if (!state.existingData?.repairMethod) setRepairMethod(initialDefect.repairMethod);
      if (!state.newImageData) setImageData(initialDefect.imageData);
    }
    if (state.newImageData) {
      setImageData(state.newImageData);
    }
  }, [state.newImageData, state.existingData, initialDefect]);

  const handleSubmit = async () => {
    // 必須項目バリデーション
    if (!location_.trim() || !component.trim() || !deterioration.trim()) {
      alert('★の必須項目を入力してください');
      return;
    }
    if (initialDefect?.evaluationType !== 'b2' && !repairMethod.trim()) {
      alert('補修・改修の範囲・方法を入力してください');
      return;
    }

    const data = await loadData();
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

    await updateData('defects', updatedDefects);
    if (state.returnPath) {
      navigate(state.returnPath);
    } else {
      navigate(`/defects/${blueprintId}`);
    }
  };

  const handleRetake = () => {
    if (!initialDefect) return;
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
    if (state.returnPath) {
      navigate(state.returnPath);
    } else {
      navigate(`/defects/${blueprintId}`);
    }
  };

  if (!initialDefect) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

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
          <h1 className="text-sm font-bold whitespace-nowrap flex items-center">
            不具合情報編集
            <span className="ml-2 text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-medium">編集モード</span>
          </h1>
          <div className="w-12"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-24">
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          {/* 撮影画像（サムネイル形式） */}
          <div className="flex items-start gap-3 mb-4">
            <img src={imageData} alt="不具合画像" className="w-32 h-24 object-cover rounded-lg flex-shrink-0" />
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-slate-500">撮影画像</span>
              <button onClick={handleRetake} className="text-xs text-emerald-600 border border-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50">
                撮影し直す
              </button>
            </div>
          </div>

          {/* 検査情報（コンパクト表示） */}
          <div className="bg-slate-50 rounded-lg px-3 py-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-600 mb-1">検査情報（変更不可）</h2>
            <div className="space-y-0.5 text-xs text-gray-600">
              <p><span className="font-medium">大分類:</span> {initialDefect.inspection.majorCategory}</p>
              <p><span className="font-medium">中分類:</span> {initialDefect.inspection.middleCategory}</p>
              <p><span className="font-medium">小分類:</span> {initialDefect.inspection.minorCategory}</p>
              <p><span className="font-medium">検査結果:</span> {initialDefect.inspection.result}</p>
            </div>
          </div>

          {/* フォーム */}
          <div className="space-y-4">
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
                補修・改修の範囲・方法 {initialDefect?.evaluationType !== 'b2' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={repairMethod}
                onChange={(e) => setRepairMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                rows={4}
                placeholder="例: 該当箇所の下地処理後、再塗装を実施"
                required={initialDefect?.evaluationType !== 'b2'}
              />
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-30">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 border-2 border-slate-600 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-700 hover:text-white hover:border-slate-700 transition-all active:scale-95"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all active:scale-95 shadow-lg"
          >
            更新
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefectEditPage;
