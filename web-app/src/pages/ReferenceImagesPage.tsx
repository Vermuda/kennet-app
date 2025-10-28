import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadData, updateData } from '../storage/localStorage';
import type { ReferenceImage, Blueprint } from '../types';

const ReferenceImagesPage: React.FC = () => {
  const { blueprintId } = useParams<{ blueprintId: string }>();
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ReferenceImage | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = loadData();
    const blueprintData = data.blueprints.find((b) => b.id === blueprintId);
    if (!blueprintData) {
      navigate('/properties');
      return;
    }
    setBlueprint(blueprintData);

    const floor = data.floors.find((f) => f.id === blueprintData.floorId);
    if (!floor) return;

    // この物件の参考画像を取得
    const images = data.referenceImages.filter((img) => img.propertyId === floor.propertyId);
    setReferenceImages(images);
  }, [blueprintId, navigate]);

  const handleDeleteImage = (imageId: string) => {
    if (window.confirm('この参考画像を削除してもよろしいですか？')) {
      const data = loadData();
      const updatedImages = data.referenceImages.filter((img) => img.id !== imageId);
      updateData('referenceImages', updatedImages);
      setReferenceImages(referenceImages.filter((img) => img.id !== imageId));
      setSelectedImage(null);
    }
  };

  const handleUpdateMemo = (imageId: string, newMemo: string) => {
    const data = loadData();
    const updatedImages = data.referenceImages.map((img) =>
      img.id === imageId ? { ...img, memo: newMemo || undefined } : img
    );
    updateData('referenceImages', updatedImages);
    setReferenceImages(
      referenceImages.map((img) =>
        img.id === imageId ? { ...img, memo: newMemo || undefined } : img
      )
    );
    if (selectedImage && selectedImage.id === imageId) {
      setSelectedImage({ ...selectedImage, memo: newMemo || undefined });
    }
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
          <h1 className="text-2xl font-bold text-gray-800">参考画像一覧</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {referenceImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {referenceImages.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition"
                onClick={() => setSelectedImage(image)}
              >
                <div className="aspect-square bg-gray-200">
                  <img
                    src={image.imageData}
                    alt="参考画像"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-500 truncate">
                    {image.memo || 'メモなし'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(image.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            参考画像が登録されていません
          </div>
        )}
      </main>

      {/* 画像詳細モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <img
                src={selectedImage.imageData}
                alt="参考画像"
                className="w-full h-auto rounded-lg mb-4"
              />
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メモ
                </label>
                <textarea
                  value={selectedImage.memo || ''}
                  onChange={(e) =>
                    handleUpdateMemo(selectedImage.id, e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="メモを入力"
                />
              </div>

              <p className="text-sm text-gray-500 mb-4">
                撮影日時: {new Date(selectedImage.createdAt).toLocaleString('ja-JP')}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteImage(selectedImage.id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                >
                  削除
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
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

export default ReferenceImagesPage;

