import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getData, updateData } from '../storage/indexedDB';
import { generateId } from '../utils/helpers';
import { compressImage } from '../utils/imageCompression';
import {
  STANDARD_PHOTO_TYPES,
  getRequiredPhotoCount,
  getOptionalPhotoCount,
  getStandardPhotoTypeById,
} from '../utils/standardPhotoTypes';
import type { Property, StandardPhoto } from '../types';

// デバッグモード: trueにするとダミー画像で一括入力ができる
const DEBUG_MODE = true;

// ダミー画像生成（Canvas APIで簡単な画像を生成）
const generateDummyImage = (photoType: number, photoName: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 背景色（タイプごとに少し変える）
  const hue = (photoType * 30) % 360;
  ctx.fillStyle = `hsl(${hue}, 40%, 85%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 枠線
  ctx.strokeStyle = `hsl(${hue}, 60%, 50%)`;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // テキスト
  ctx.fillStyle = '#333';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`[DEBUG] No.${photoType}`, canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = '24px sans-serif';
  ctx.fillText(photoName, canvas.width / 2, canvas.height / 2 + 20);

  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText(new Date().toLocaleString('ja-JP'), canvas.width / 2, canvas.height / 2 + 60);

  return canvas.toDataURL('image/jpeg', 0.8);
};

const StandardPhotosPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [property, setProperty] = useState<Property | null>(null);
  const [standardPhotos, setStandardPhotos] = useState<StandardPhoto[]>([]);
  const [scrollToPhotoType, setScrollToPhotoType] = useState<number | null>(null);
  const [isFillingDebug, setIsFillingDebug] = useState(false);
  const photoRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  const handleSavePhoto = useCallback(async (
    photoType: number,
    imageData: string,
    currentProperty: Property
  ) => {
    try {
      // 画像を圧縮（定型写真は70%品質、最大1280x720）
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

      // 既存の同じタイプの写真を取得（撮り直しの場合、過去画像を保持）
      const existingPhoto = (currentProperty.standardPhotos || []).find(
        (p) => p.photoType === photoType
      );
      const previousImages = existingPhoto
        ? [
            ...(existingPhoto.previousImages || []),
            { imageData: existingPhoto.imageData, createdAt: existingPhoto.createdAt },
          ]
        : undefined;

      const newPhoto: StandardPhoto = {
        id: generateId(),
        propertyId: propertyId!,
        photoType,
        imageData: compressed.dataUrl,
        isRequired: photoTypeInfo.required,
        createdAt: new Date().toISOString(),
        ...(previousImages && previousImages.length > 0 ? { previousImages } : {}),
      };

      // 既存の同じタイプの写真を置き換え
      const updatedPhotos = [
        ...(currentProperty.standardPhotos || []).filter(
          (p) => p.photoType !== photoType
        ),
        newPhoto,
      ];

      // プロパティを更新
      const properties = await getData('properties');
      const updatedProperties = properties.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              standardPhotos: updatedPhotos,
              updatedAt: new Date().toISOString(),
            }
          : p
      );

      await updateData('properties', updatedProperties);
      setStandardPhotos(updatedPhotos);
    } catch (error) {
      console.error('Failed to save standard photo:', error);
      alert('写真の保存に失敗しました');
    }
  }, [propertyId]);

  useEffect(() => {
    const loadStandardPhotos = async () => {
      if (!propertyId) return;

      const properties = await getData('properties');
      const foundProperty = properties.find((p) => p.id === propertyId);

    if (!foundProperty) {
      navigate('/properties');
      return;
    }

    // カメラから戻ってきた場合、新しい写真を保存
    if (location.state?.newPhoto) {
      const { photoType, imageData } = location.state.newPhoto;
      await handleSavePhoto(photoType, imageData, foundProperty);

      // 撮影したphotoTypeの位置にスクロールするためにセット
      setScrollToPhotoType(photoType);

      // location.stateをクリア
      navigate(location.pathname, { replace: true, state: {} });

      // 保存後に最新データを再読み込み
      const updatedProperties = await getData('properties');
      const updatedProperty = updatedProperties.find((p) => p.id === propertyId);
      if (updatedProperty) {
        setProperty(updatedProperty);
        setStandardPhotos(updatedProperty.standardPhotos || []);
      }
    } else {
      // 通常の読み込み
      setProperty(foundProperty);
      setStandardPhotos(foundProperty.standardPhotos || []);
    }
    };
    loadStandardPhotos();
  }, [propertyId, location.state, navigate, location.pathname, handleSavePhoto]);

  // スクロール位置を復元
  useEffect(() => {
    if (scrollToPhotoType !== null && photoRefs.current[scrollToPhotoType]) {
      // 少し遅延させてDOMが更新されてからスクロール
      setTimeout(() => {
        photoRefs.current[scrollToPhotoType]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        setScrollToPhotoType(null);
      }, 100);
    }
  }, [scrollToPhotoType, standardPhotos]);

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

  // デバッグ用: 未撮影の写真を一括でダミー画像で埋める
  const handleDebugFillAll = async () => {
    if (!property || !DEBUG_MODE) return;

    setIsFillingDebug(true);
    try {
      let currentPhotos = [...standardPhotos];

      for (const photoType of STANDARD_PHOTO_TYPES) {
        // 既に撮影済みならスキップ
        if (currentPhotos.some((p) => p.photoType === photoType.id)) {
          continue;
        }

        const dummyImage = generateDummyImage(photoType.id, photoType.name);

        const newPhoto: StandardPhoto = {
          id: generateId(),
          propertyId: propertyId!,
          photoType: photoType.id,
          imageData: dummyImage,
          isRequired: photoType.required,
          createdAt: new Date().toISOString(),
        };

        currentPhotos = [...currentPhotos, newPhoto];
      }

      // プロパティを更新
      const properties = await getData('properties');
      const updatedProperties = properties.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              standardPhotos: currentPhotos,
              updatedAt: new Date().toISOString(),
            }
          : p
      );

      await updateData('properties', updatedProperties);
      setStandardPhotos(currentPhotos);

      alert(`デバッグ: ${currentPhotos.length}件の写真を設定しました`);
    } catch (error) {
      console.error('Debug fill failed:', error);
      alert('デバッグ入力に失敗しました');
    } finally {
      setIsFillingDebug(false);
    }
  };

  // デバッグ用: 全写真をクリア
  const handleDebugClearAll = async () => {
    if (!property || !DEBUG_MODE) return;

    if (!confirm('全ての定型写真を削除しますか？')) return;

    try {
      const properties = await getData('properties');
      const updatedProperties = properties.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              standardPhotos: [],
              updatedAt: new Date().toISOString(),
            }
          : p
      );

      await updateData('properties', updatedProperties);
      setStandardPhotos([]);
      alert('デバッグ: 全写真をクリアしました');
    } catch (error) {
      console.error('Debug clear failed:', error);
      alert('クリアに失敗しました');
    }
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
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="sticky top-0 bg-gray-800 text-white shadow z-30">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(`/properties/${propertyId}`)}
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ← 戻る
          </button>
          <h1 className="text-sm font-bold whitespace-nowrap truncate flex-1 text-center">
            定型写真撮影
          </h1>
          <div className="w-14" />
        </div>
      </header>

      <div className="p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6 border-l-4 border-emerald-600">
        <div className="mb-4">
          <p className="text-gray-600 text-sm">物件: {property.name}</p>
        </div>

        {/* デバッグモード */}
        {DEBUG_MODE && (
          <div className="mb-4 p-3 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-yellow-800 font-bold text-sm">🔧 デバッグモード</span>
              <div className="flex gap-2">
                <button
                  onClick={handleDebugFillAll}
                  disabled={isFillingDebug}
                  className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded font-medium disabled:opacity-50"
                >
                  {isFillingDebug ? '処理中...' : '一括ダミー入力'}
                </button>
                <button
                  onClick={handleDebugClearAll}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded font-medium"
                >
                  全クリア
                </button>
              </div>
            </div>
          </div>
        )}

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
                ref={(el) => { photoRefs.current[photoType.id] = el; }}
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
                <div className="absolute top-2 left-2 right-2 flex items-center gap-1 flex-nowrap">
                  <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded font-bold flex-shrink-0">
                    {photoType.id}
                  </span>
                  {photoType.required ? (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold flex-shrink-0">
                      必須
                    </span>
                  ) : (
                    <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded font-bold flex-shrink-0">
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

        {/* ボタン（下部に固定撮影ボタン分のパディング追加） */}
        <div className="flex gap-3 mb-20">
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

      {/* 通常撮影ボタン（右下固定） */}
      <button
        onClick={() => navigate(`/camera/reference`, {
          state: {
            propertyId,
            returnPath: `/properties/${propertyId}/standard-photos`,
          },
        })}
        className="fixed bottom-4 right-4 z-40 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition active:scale-95 flex items-center gap-2 px-5 py-3 font-bold text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        通常撮影
      </button>
    </div>
  );
};

export default StandardPhotosPage;
