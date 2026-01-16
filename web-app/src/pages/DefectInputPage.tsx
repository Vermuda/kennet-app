import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadData, updateData } from '../storage/localStorage';
import { generateId } from '../utils/helpers';
import type { DefectInfo, Marker, Inspection } from '../types';

interface DefectInputState {
  inspectionId?: string;
  blueprintId: string;
  imageData: string;
  returnPath?: string;
  // 新フロー用のパラメータ
  propertyId?: string;
  inspectionItemId?: string;
  inspectionItemName?: string;
  evaluationId?: string;
  evaluationType?: string;
  positionX?: number;
  positionY?: number;
}

const DefectInputPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as DefectInputState;
  const { 
    inspectionId, 
    blueprintId, 
    imageData, 
    returnPath,
    inspectionItemId,
    inspectionItemName,
    evaluationType,
    positionX,
    positionY,
  } = state;

  const [location_, setLocation] = useState('');
  const [component, setComponent] = useState('');
  const [deterioration, setDeterioration] = useState('');
  const [repairMethod, setRepairMethod] = useState('');
  const [propertyId, setPropertyId] = useState<string | null>(state.propertyId || null);

  // 新フローの場合、検査項目名を場所のデフォルト値に設定
  useEffect(() => {
    if (inspectionItemName && !location_) {
      setLocation(inspectionItemName);
    }
  }, [inspectionItemName, location_]);

  useEffect(() => {
    if (!propertyId) {
      const data = loadData();
      const blueprint = data.blueprints.find((b) => b.id === blueprintId);
      if (blueprint) {
        const floor = data.floors.find((f) => f.id === blueprint.floorId);
        if (floor) {
          setPropertyId(floor.propertyId);
        }
      }
    }
  }, [blueprintId, propertyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = loadData();
    let finalInspectionId = inspectionId;

    // 新フロー（位置情報がある場合）: マーカーと検査データを作成
    if (positionX !== undefined && positionY !== undefined) {
      // マーカーを作成
      const marker: Marker = {
        id: generateId(),
        blueprintId,
        x: positionX,
        y: positionY,
        createdAt: new Date().toISOString(),
      };
      updateData('markers', [...data.markers, marker]);

      // 検査データを作成（旧形式との互換性のため）
      const inspection: Inspection = {
        id: generateId(),
        markerId: marker.id,
        blueprintId,
        majorCategory: inspectionItemName || location_,
        middleCategory: evaluationType === 'c' ? '不具合' : '経年変化',
        minorCategory: component,
        result: (evaluationType as 'b2' | 'c') || 'c',
        createdAt: new Date().toISOString(),
      };
      updateData('inspections', [...data.inspections, inspection]);
      finalInspectionId = inspection.id;
    }

    // 不具合情報を保存
    const defect: DefectInfo = {
      id: generateId(),
      inspectionId: finalInspectionId || generateId(),
      location: location_,
      component,
      deterioration,
      repairMethod,
      imageData,
      // 新フロー用の追加情報
      inspectionItemId,
      evaluationType,
      positionX,
      positionY,
      blueprintId,
      createdAt: new Date().toISOString(),
    };

    // defectsを再読み込みして保存（マーカー追加後のデータで）
    const latestData = loadData();
    updateData('defects', [...latestData.defects, defect]);

    // 戻り先を決定
    if (returnPath) {
      navigate(returnPath);
    } else if (propertyId) {
      navigate(`/properties/${propertyId}/inspection-checklist`);
    } else {
      navigate(`/blueprints/${blueprintId}`);
    }
  };

  const handleRetake = () => {
    navigate('/camera/defect', {
      state: {
        inspectionId,
        blueprintId,
        returnPath: '/defect/input',
      },
    });
  };

  const handleCancel = () => {
    if (window.confirm('入力内容を破棄して戻りますか？')) {
      // returnPathが指定されている場合はそれを使用
      if (returnPath) {
        navigate(returnPath);
      } else if (propertyId) {
        // propertyIdがある場合は検査チェックシートに戻る
        navigate(`/properties/${propertyId}/inspection-checklist`);
      } else {
        // フォールバック：図面表示画面に戻る
        navigate(`/blueprints/${blueprintId}`);
      }
    }
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
          <h1 className="text-sm font-bold whitespace-nowrap">不具合情報記入</h1>
          <div className="w-12"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">撮影画像</h2>
          <img
            src={imageData}
            alt="撮影した不具合"
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
                保存
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

export default DefectInputPage;

