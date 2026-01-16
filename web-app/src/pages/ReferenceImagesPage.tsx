import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadData, updateData } from '../storage/localStorage';
import type { ReferenceImage } from '../types';

const ReferenceImagesPage: React.FC = () => {
  const { blueprintId } = useParams<{ blueprintId: string }>();
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

    const floor = data.floors.find((f) => f.id === blueprintData.floorId);
    if (!floor) return;

    // この物件の通常撮影を取得
    const images = data.referenceImages.filter((img) => img.propertyId === floor.propertyId);
    setReferenceImages(images);
  }, [blueprintId, navigate]);

  const handleDeleteImage = (imageId: string) => {
    if (window.confirm('この通常撮影を削除してもよろしいですか？')) {
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
      <header className="bg-gray-800 text-white shadow flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(`/blueprints/${blueprintId}`)}
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ← 戻る
          </button>
          <h1 className="text-sm font-bold whitespace-nowrap">通常撮影一覧</h1>
          <div className="w-12"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {referenceImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {referenceImages.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition"
                onClick={() => setSelectedImage(image)}
              >
                <div className="aspect-square bg-gray-200">
                  <img
                    src={image.imageData}
                    alt="通常撮影"
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
          <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
            通常撮影が登録されていません
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
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <img
                src={selectedImage.imageData}
                alt="通常撮影"
                className="w-full h-auto rounded-xl mb-4"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
                  className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700"
                >
                  削除
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="flex-1 border-2 border-slate-600 text-slate-600 py-2 rounded-xl hover:bg-slate-700 hover:text-white hover:border-slate-700 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95"
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

