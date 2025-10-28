import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadData, updateData } from '../storage/localStorage';
import { generateId } from '../utils/helpers';
import type { DefectInfo } from '../types';

const DefectInputPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { inspectionId, blueprintId, imageData } = location.state as {
    inspectionId: string;
    blueprintId: string;
    imageData: string;
  };

  const [location_, setLocation] = useState('');
  const [component, setComponent] = useState('');
  const [deterioration, setDeterioration] = useState('');
  const [repairMethod, setRepairMethod] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const defect: DefectInfo = {
      id: generateId(),
      inspectionId,
      location: location_,
      component,
      deterioration,
      repairMethod,
      imageData,
      createdAt: new Date().toISOString(),
    };

    const data = loadData();
    updateData('defects', [...data.defects, defect]);

    // 図面表示画面に戻る
    navigate(`/blueprints/${blueprintId}`);
  };

  const handleRetake = () => {
    navigate('/camera/defect', {
      state: {
        inspectionId,
        blueprintId,
      },
    });
  };

  const handleCancel = () => {
    if (window.confirm('入力内容を破棄して検査情報入力画面に戻りますか？')) {
      navigate(`/inspection/new`, {
        state: {
          blueprintId,
          x: 50,
          y: 50,
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">不具合情報記入</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">撮影画像</h2>
          <img
            src={imageData}
            alt="撮影した不具合"
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
                保存
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

export default DefectInputPage;

