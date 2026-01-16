import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getData, updateData } from '../storage/localStorage';
import { generateId } from '../utils/helpers';
import { compressImage } from '../utils/imageCompression';
import {
  STANDARD_PHOTO_TYPES,
  getRequiredPhotoCount,
  getOptionalPhotoCount,
  getStandardPhotoTypeById,
} from '../utils/standardPhotoTypes';
import type { Property, StandardPhoto } from '../types';

const StandardPhotosPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [property, setProperty] = useState<Property | null>(null);
  const [standardPhotos, setStandardPhotos] = useState<StandardPhoto[]>([]);

  useEffect(() => {
    if (!propertyId) return;

    const properties = getData('properties');
    const foundProperty = properties.find((p) => p.id === propertyId);

    if (!foundProperty) {
      navigate('/properties');
      return;
    }

    setProperty(foundProperty);
    setStandardPhotos(foundProperty.standardPhotos || []);

    // カメラから戻ってきた場合、新しい写真を保存
    if (location.state?.newPhoto) {
      const { photoType, imageData } = location.state.newPhoto;
      handleSavePhoto(photoType, imageData, foundProperty);

      // location.stateをクリア
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [propertyId, location.state, navigate, location.pathname]);

  const handleSavePhoto = async (
    photoType: number,
    imageData: string,
    currentProperty: Property
  ) => {
    try {
      // 画像を圧縮（定形写真は70%品質、最大1280x720）
      const compressed = await compressImage(imageData, {
        quality: 0.7,
        maxWidth: 1280,
        maxHeight: 720,
        format: 'webp',
      });

      console.log(
        `[StandardPhoto] Compressed ${photoType}: ${compressed.originalSize} → ${compressed.compressedSize} (${compressed.compressionRatio}%)`
      );

      const photoTypeInfo = getStandardPhotoTypeById(photoType);
      if (!photoTypeInfo) {
        alert('無効な写真タイプです');
        return;
      }

      const newPhoto: StandardPhoto = {
        id: generateId(),
        propertyId: propertyId!,
        photoType,
        imageData: compressed.dataUrl,
        isRequired: photoTypeInfo.required,
        createdAt: new Date().toISOString(),
      };

      // 既存の同じタイプの写真を削除して新しい写真を追加
      const updatedPhotos = [
        ...(currentProperty.standardPhotos || []).filter(
          (p) => p.photoType !== photoType
        ),
        newPhoto,
      ];

      // プロパティを更新
      const properties = getData('properties');
      const updatedProperties = properties.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              standardPhotos: updatedPhotos,
              updatedAt: new Date().toISOString(),
            }
          : p
      );

      updateData('properties', updatedProperties);
      setStandardPhotos(updatedPhotos);
    } catch (error) {
      console.error('Failed to save standard photo:', error);
      alert('写真の保存に失敗しました');
    }
  };

  const handlePhotoClick = (photoType: number) => {
    navigate(`/camera/standard`, {
      state: { 
        propertyId, 
        photoType,
        returnPath: `/properties/${propertyId}/standard-photos`,
      },
    });
  };

  const handleNext = () => {
    navigate(`/properties/${propertyId}`);
  };

  const handleBack = () => {
    navigate(`/properties/${propertyId}`);
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  // 進捗計算
  const requiredPhotos = standardPhotos.filter((p) => p.isRequired);
  const optionalPhotos = standardPhotos.filter((p) => !p.isRequired);
  const requiredCount = getRequiredPhotoCount();
  const optionalCount = getOptionalPhotoCount();
  const allRequiredTaken = requiredPhotos.length >= requiredCount;

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6 border-l-4 border-emerald-600">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">定形写真撮影</h1>
          <p className="text-gray-600 text-sm">物件: {property.name}</p>
        </div>

        {/* 進捗表示 */}
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-6">
            {/* 必須 */}
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-1">必須</div>
              <div className={`text-xl font-bold ${allRequiredTaken ? 'text-emerald-600' : 'text-red-600'}`}>
                {requiredPhotos.length}/{requiredCount}
              </div>
            </div>
            {/* 任意 */}
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-1">任意</div>
              <div className="text-xl font-bold text-blue-600">
                {optionalPhotos.length}/{optionalCount}
              </div>
            </div>
            {/* 完了表示 */}
            {allRequiredTaken && (
              <div className="text-emerald-600 font-semibold text-sm whitespace-nowrap">
                ✓ 必須写真完了
              </div>
            )}
          </div>
        </div>

        {/* 写真グリッド */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {STANDARD_PHOTO_TYPES.map((photoType) => {
            const existingPhoto = standardPhotos.find(
              (p) => p.photoType === photoType.id
            );
            const isTaken = !!existingPhoto;

            return (
              <button
                key={photoType.id}
                onClick={() => handlePhotoClick(photoType.id)}
                className={`relative p-3 border-2 rounded-xl transition hover:shadow-xl ${
                  isTaken
                    ? 'border-emerald-500 bg-emerald-50'
                    : photoType.required
                    ? 'border-red-300 bg-red-50'
                    : 'border-blue-300 bg-emerald-50'
                }`}
              >
                {/* 写真番号とバッジ */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded font-bold">
                    {photoType.id}
                  </span>
                  {photoType.required ? (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                      必須
                    </span>
                  ) : (
                    <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded font-bold">
                      任意
                    </span>
                  )}
                </div>

                {/* チェックマーク */}
                {isTaken && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                    ✓
                  </div>
                )}

                {/* サムネイルまたはプレースホルダー */}
                <div className="aspect-square mb-2 mt-8 rounded overflow-hidden bg-gray-200">
                  {existingPhoto ? (
                    <img
                      src={existingPhoto.imageData}
                      alt={photoType.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 写真名 */}
                <p className="text-xs text-gray-700 font-medium leading-tight line-clamp-2">
                  {photoType.name}
                </p>
              </button>
            );
          })}
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 border-2 border-slate-600 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-700 hover:text-white hover:border-slate-700 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95"
          >
            戻る
          </button>
          <button
            onClick={handleNext}
            disabled={!allRequiredTaken}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ease-out transform ${
              allRequiredTaken
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {allRequiredTaken ? '次へ（物件詳細へ）' : '必須写真を撮影してください'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandardPhotosPage;
