import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadData, updateData } from '../storage/localStorage';
import type { DefectInfo, Inspection, Marker, Blueprint, Floor } from '../types';

interface DefectWithDetails extends DefectInfo {
  inspection: Inspection;
  marker: Marker;
  blueprint: Blueprint;
  floor: Floor;
}

const DefectListPage: React.FC = () => {
  const { blueprintId } = useParams<{ blueprintId: string }>();
  const [defects, setDefects] = useState<DefectWithDetails[]>([]);
  const [selectedDefect, setSelectedDefect] = useState<DefectWithDetails | null>(null);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDefects();
  }, [blueprintId]);

  const loadDefects = () => {
    const data = loadData();
    const blueprintData = data.blueprints.find((b) => b.id === blueprintId);
    
    if (!blueprintData) {
      navigate('/properties');
      return;
    }
    
    setBlueprint(blueprintData);

    // この図面に関連する不具合を取得
    const defectsWithDetails: DefectWithDetails[] = [];
    
    data.defects.forEach((defect) => {
      const inspection = data.inspections.find((i) => i.id === defect.inspectionId);
      if (!inspection || inspection.blueprintId !== blueprintId) return;

      const marker = data.markers.find((m) => m.id === inspection.markerId);
      if (!marker) return;

      const floor = data.floors.find((f) => f.id === blueprintData.floorId);
      if (!floor) return;

      defectsWithDetails.push({
        ...defect,
        inspection,
        marker,
        blueprint: blueprintData,
        floor,
      });
    });

    // 新しい順にソート
    defectsWithDetails.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setDefects(defectsWithDetails);
  };

  const handleDeleteDefect = (defectId: string, inspectionId: string, markerId: string) => {
    if (window.confirm('この不具合情報を削除してもよろしいですか？')) {
      const data = loadData();

      // 不具合を削除
      const updatedDefects = data.defects.filter((d) => d.id !== defectId);
      updateData('defects', updatedDefects);

      // 検査情報を削除
      const updatedInspections = data.inspections.filter((i) => i.id !== inspectionId);
      updateData('inspections', updatedInspections);

      // マーカーを削除
      const updatedMarkers = data.markers.filter((m) => m.id !== markerId);
      updateData('markers', updatedMarkers);

      loadDefects();
      setSelectedDefect(null);
    }
  };

  const handleEditDefect = (defect: DefectWithDetails) => {
    navigate(`/defect/edit/${defect.id}`, {
      state: {
        defect,
        blueprintId,
      },
    });
  };

  const getResultLabel = (result: string) => {
    const labels: { [key: string]: string } = {
      a: 'a: 劣化なし',
      b1: 'b1: 軽微な劣化',
      b2: 'b2: 劣化あり',
      c: 'c: 重大な劣化',
    };
    return labels[result] || result;
  };

  const getResultColor = (result: string) => {
    const colors: { [key: string]: string } = {
      a: 'bg-green-100 text-green-800',
      b1: 'bg-yellow-100 text-yellow-800',
      b2: 'bg-orange-100 text-orange-800',
      c: 'bg-red-100 text-red-800',
    };
    return colors[result] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(`/blueprints/${blueprintId}`)}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-800">不具合一覧</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {defects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {defects.map((defect) => (
              <div
                key={defect.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition duration-200 overflow-hidden cursor-pointer"
                onClick={() => setSelectedDefect(defect)}
              >
                <div className="aspect-video bg-gray-200">
                  <img
                    src={defect.imageData}
                    alt="不具合画像"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${getResultColor(
                        defect.inspection.result
                      )}`}
                    >
                      {getResultLabel(defect.inspection.result)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{defect.location}</h3>
                  <p className="text-gray-600 text-sm mb-2">{defect.component}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      {defect.inspection.majorCategory} {'>'} {defect.inspection.middleCategory}{' '}
                      {'>'} {defect.inspection.minorCategory}
                    </p>
                    <p>{new Date(defect.createdAt).toLocaleDateString('ja-JP')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            登録された不具合がありません
          </div>
        )}
      </main>

      {/* 不具合詳細モーダル */}
      {selectedDefect && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-auto"
          onClick={() => setSelectedDefect(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">不具合詳細</h2>
                <span
                  className={`text-sm px-3 py-1 rounded font-semibold ${getResultColor(
                    selectedDefect.inspection.result
                  )}`}
                >
                  {getResultLabel(selectedDefect.inspection.result)}
                </span>
              </div>

              <img
                src={selectedDefect.imageData}
                alt="不具合画像"
                className="w-full h-auto rounded-lg mb-6"
              />

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">検査分類</h3>
                  <p className="text-gray-900">
                    {selectedDefect.inspection.majorCategory} {'>'}{' '}
                    {selectedDefect.inspection.middleCategory} {'>'}{' '}
                    {selectedDefect.inspection.minorCategory}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">場所</h3>
                  <p className="text-gray-900">{selectedDefect.location}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">部位</h3>
                  <p className="text-gray-900">{selectedDefect.component}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">劣化状況</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedDefect.deterioration}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">補修・改修の範囲・方法</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedDefect.repairMethod}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">登録日時</h3>
                  <p className="text-gray-900">
                    {new Date(selectedDefect.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleEditDefect(selectedDefect)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  編集
                </button>
                <button
                  onClick={() =>
                    handleDeleteDefect(
                      selectedDefect.id,
                      selectedDefect.inspection.id,
                      selectedDefect.marker.id
                    )
                  }
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                >
                  削除
                </button>
                <button
                  onClick={() => setSelectedDefect(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectListPage;

