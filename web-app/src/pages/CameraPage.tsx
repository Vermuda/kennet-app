import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { compressImage, formatSize, getBase64Size } from '../utils/imageCompression';
import { logStorageUsage, getStorageWarningLevel, loadData } from '../storage/localStorage';
import { uploadToB2 } from '../services/b2Storage';
import { generateId } from '../utils/helpers';

const CameraPage: React.FC = () => {
  const { mode } = useParams<{ mode: 'defect' | 'reference' | 'standard' }>();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Camera] mount. mode =', mode);
    startCamera();
    return () => {
      console.log('[Camera] unmount. stopCamera');
      stopCamera();
    };
  }, []);

  // video要素がレンダリングされた後にMediaStreamをアタッチする（初回 null 対策）
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) {
      console.log('[Camera] attach effect skipped', { hasVideo: !!video, hasStream: !!stream });
      return;
    }
    try {
      console.log('[Camera] attaching stream to <video> in effect');
      (video as any).srcObject = stream;
      video.muted = true;
      const p = video.play();
      if (p && typeof (p as any).then === 'function') {
        (p as any).then(() => {
          console.log('[Camera] video.play() succeeded in effect', {
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
          });
        }).catch((err: unknown) => {
          console.warn('[Camera] video.play() failed in effect', err);
        });
      }
    } catch (err) {
      console.warn('[Camera] attach effect error', err);
    }
  }, [stream, cameraStarted]);

  const startCamera = async () => {
    try {
      console.log('[Camera] startCamera called');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // スマホの場合は背面カメラを優先
        audio: false,
      });
      console.log('[Camera] getUserMedia success', {
        tracks: mediaStream.getTracks().map((t) => ({ kind: t.kind, readyState: t.readyState })),
      });
      
      console.log('[Camera] before setStream. videoRef exists?', !!videoRef.current);
      setStream(mediaStream);
      console.log('[Camera] after setStream');
      
      if (videoRef.current) {
        console.log('[Camera] assigning stream to <video>');
        videoRef.current.srcObject = mediaStream;
        // iOS/Safari対策: 自動再生できるようにミュートして再生を試みる
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
          console.log('[Camera] video.play() succeeded', {
            readyState: videoRef.current.readyState,
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight,
          });
        } catch (_) {
          // 再生はユーザー操作後に開始される場合があるため無視
          console.warn('[Camera] video.play() failed (will require user gesture)');
        }
      }
      
      // カメラ起動を表示
      setCameraStarted(true);
      console.log('[Camera] cameraStarted = true');
    } catch (error) {
      console.error('カメラの起動に失敗しました:', error);
      alert('カメラの起動に失敗しました。カメラの権限を確認してください。');
    }
  };

  const stopCamera = () => {
    console.log('[Camera] stopCamera called', {
      streamExists: !!stream,
      tracks: stream?.getTracks().map((t) => ({ kind: t.kind, readyState: t.readyState })),
    });
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const captureImage = async () => {
    console.log('[Camera] captureImage invoked');
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // ビデオの準備ができているか確認
      if (video.readyState < 2) {
        console.log('[Camera] video not ready', {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
        });
        try {
          await video.play();
          console.log('[Camera] retried video.play()');
        } catch (_) {}
        // 少し待機して準備完了を待つ
        await new Promise((r) => setTimeout(r, 150));
        if (video.readyState < 2 && video.videoWidth === 0) {
          alert('カメラの準備ができていません。少しお待ちください。');
          return;
        }
      }
      
      // videoWidth/Heightが0の場合も確認
      const width = video.videoWidth || video.width || 640;
      const height = video.videoHeight || video.height || 480;
      console.log('[Camera] capture size', { width, height, readyState: video.readyState });
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        
        // まずJPEGで取得
        const originalImageData = canvas.toDataURL('image/jpeg', 0.9);
        const originalSize = getBase64Size(originalImageData);
        
        console.log('[Camera] Original image captured:', {
          size: formatSize(originalSize),
          dimensions: `${width}x${height}`,
        });
        
        // LocalStorageの使用状況をチェック
        logStorageUsage();
        const warningLevel = getStorageWarningLevel();
        
        if (warningLevel === 'critical') {
          alert('⚠️ LocalStorageの容量が不足しています。\n古いデータを削除するか、データをエクスポートしてください。');
          return;
        } else if (warningLevel === 'warning') {
          console.warn('[Camera] LocalStorage usage is high. Consider exporting data.');
        }
        
        try {
          // WebP 80%で圧縮
          const compressed = await compressImage(originalImageData, {
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1080,
            format: 'webp',
          });
          
          console.log('[Camera] Image compressed:', {
            format: compressed.format,
            originalSize: formatSize(compressed.originalSize),
            compressedSize: formatSize(compressed.compressedSize),
            compressionRatio: `${compressed.compressionRatio.toFixed(1)}% reduction`,
            dimensions: `${compressed.width}x${compressed.height}`,
          });
          
          setCapturedImage(compressed.dataUrl);
        } catch (error) {
          console.error('[Camera] Compression failed:', error);
          // 圧縮に失敗した場合は元の画像を使用
          alert('画像の圧縮に失敗しました。元の画像を使用します。');
          setCapturedImage(originalImageData);
        }
        
        stopCamera();
      }
    }
  };

  const retake = () => {
    console.log('[Camera] retake clicked');
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // B2へアップロード
      const data = loadData();
      let propertyId: string;
      let floorId: string;
      let imageType: 'blueprints' | 'defects' | 'references' | 'standard';
      const imageId = generateId();

      if (mode === 'defect') {
        // 不具合撮影の場合
        const state = location.state as {
          inspectionId?: string;
          blueprintId: string;
          isEdit?: boolean;
          returnPath?: string;
          existingData?: any;
          // 新フロー用のパラメータ
          propertyId?: string;
          inspectionItemId?: string;
          inspectionItemName?: string;
          evaluationId?: string;
          evaluationType?: string;
          positionX?: number;
          positionY?: number;
        };

        // blueprintIdからfloorIdとpropertyIdを取得
        const blueprint = data.blueprints.find(b => b.id === state.blueprintId);
        if (blueprint) {
          const floor = data.floors.find(f => f.id === blueprint.floorId);
          floorId = blueprint.floorId;
          propertyId = state.propertyId || floor?.propertyId || 'unknown';
        } else {
          floorId = 'unknown';
          propertyId = state.propertyId || 'unknown';
        }
        imageType = 'defects';

        // B2にアップロード
        console.log('[Camera] Uploading defect image to B2...');
        const uploadResult = await uploadToB2({
          propertyId,
          floorId,
          imageType,
          imageId,
          imageData: capturedImage,
        });

        if (!uploadResult.success) {
          console.warn('[Camera] B2 upload failed:', uploadResult.error);
          // アップロード失敗してもローカル保存は続行
        } else {
          console.log('[Camera] B2 upload successful:', uploadResult.key);
        }

        if (state.isEdit && state.returnPath) {
          // 編集時の撮影し直し
          navigate(state.returnPath, {
            state: {
              newImageData: capturedImage,
              existingData: state.existingData,
            },
          });
        } else {
          // 新規不具合撮影
          navigate('/defect/input', {
            state: {
              inspectionId: state.inspectionId,
              blueprintId: state.blueprintId,
              imageData: capturedImage,
              returnPath: state.returnPath,
              // 新フロー用のパラメータ
              propertyId: state.propertyId,
              inspectionItemId: state.inspectionItemId,
              inspectionItemName: state.inspectionItemName,
              evaluationId: state.evaluationId,
              evaluationType: state.evaluationType,
              positionX: state.positionX,
              positionY: state.positionY,
            },
          });
        }
      } else if (mode === 'standard') {
        // 定形写真撮影の場合
        const state = location.state as {
          propertyId: string;
          photoType: number;
        };

        propertyId = state.propertyId;
        floorId = 'standard'; // 定形写真はフロアに紐づかない
        imageType = 'standard';

        // B2にアップロード
        console.log('[Camera] Uploading standard photo to B2...');
        const uploadResult = await uploadToB2({
          propertyId,
          floorId,
          imageType: 'references', // B2のフォルダ構成としてはreferencesを使用
          imageId: `standard_${state.photoType}_${imageId}`,
          imageData: capturedImage,
        });

        if (!uploadResult.success) {
          console.warn('[Camera] B2 upload failed:', uploadResult.error);
        } else {
          console.log('[Camera] B2 upload successful:', uploadResult.key);
        }

        navigate(`/properties/${state.propertyId}/standard-photos`, {
          state: {
            newPhoto: {
              photoType: state.photoType,
              imageData: capturedImage,
            },
          },
        });
      } else {
        // 通常撮影の場合
        const state = location.state as {
          propertyId: string;
          returnPath: string;
          blueprintId?: string;
        };

        propertyId = state.propertyId;
        
        // returnPathからblueprintIdを取得してfloorIdを得る
        if (state.blueprintId) {
          const blueprint = data.blueprints.find(b => b.id === state.blueprintId);
          floorId = blueprint?.floorId || 'unknown';
        } else {
          // returnPathからblueprintIdを抽出（/blueprints/:blueprintId形式の場合）
          const match = state.returnPath.match(/\/blueprints\/([^/]+)/);
          if (match) {
            const blueprintId = match[1];
            const blueprint = data.blueprints.find(b => b.id === blueprintId);
            floorId = blueprint?.floorId || 'unknown';
          } else {
            floorId = 'reference';
          }
        }
        imageType = 'references';

        // B2にアップロード
        console.log('[Camera] Uploading reference image to B2...');
        const uploadResult = await uploadToB2({
          propertyId,
          floorId,
          imageType,
          imageId,
          imageData: capturedImage,
        });

        if (!uploadResult.success) {
          console.warn('[Camera] B2 upload failed:', uploadResult.error);
        } else {
          console.log('[Camera] B2 upload successful:', uploadResult.key);
        }

        navigate('/reference-images/input', {
          state: {
            propertyId: state.propertyId,
            imageData: capturedImage,
            returnPath: state.returnPath,
          },
        });
      }
    } catch (error) {
      console.error('[Camera] Upload error:', error);
      setUploadError('アップロードに失敗しました。ローカルに保存します。');
      // エラーが発生しても3秒後に画面遷移
      setTimeout(() => {
        navigateAfterError();
      }, 3000);
    } finally {
      setIsUploading(false);
    }
  };

  // エラー時の画面遷移処理
  const navigateAfterError = () => {
    if (!capturedImage) return;

    if (mode === 'defect') {
      const state = location.state as {
        inspectionId: string;
        blueprintId: string;
        isEdit?: boolean;
        returnPath?: string;
        existingData?: any;
      };

      if (state.isEdit && state.returnPath) {
        navigate(state.returnPath, {
          state: {
            newImageData: capturedImage,
            existingData: state.existingData,
          },
        });
      } else {
        navigate('/defect/input', {
          state: {
            inspectionId: state.inspectionId,
            blueprintId: state.blueprintId,
            imageData: capturedImage,
            returnPath: state.returnPath, // キャンセル時の戻り先を渡す
          },
        });
      }
    } else if (mode === 'standard') {
      const { propertyId, photoType } = location.state as {
        propertyId: string;
        photoType: number;
      };
      navigate(`/properties/${propertyId}/standard-photos`, {
        state: {
          newPhoto: {
            photoType,
            imageData: capturedImage,
          },
        },
      });
    } else {
      const { propertyId, returnPath } = location.state as {
        propertyId: string;
        returnPath: string;
      };
      navigate('/reference-images/input', {
        state: {
          propertyId,
          imageData: capturedImage,
          returnPath,
        },
      });
    }
  };

  const handleCancel = () => {
    stopCamera();
    
    // location.stateからreturnPathを取得（すべてのモードで統一）
    const state = location.state as {
      returnPath?: string;
      blueprintId?: string;
      propertyId?: string;
    } | null;

    // returnPathが指定されている場合はそれを使用
    if (state?.returnPath) {
      navigate(state.returnPath);
      return;
    }

    // returnPathがない場合のフォールバック
    if (mode === 'defect' && state?.blueprintId) {
      navigate(`/blueprints/${state.blueprintId}`);
    } else if (mode === 'standard' && state?.propertyId) {
      navigate(`/properties/${state.propertyId}/standard-photos`);
    } else if (state?.propertyId) {
      navigate(`/properties/${state.propertyId}`);
    } else {
      // 最終フォールバック：1つ前の画面に戻る
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="bg-gray-800 text-white shadow flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-center">
          <h1 className="text-sm font-bold whitespace-nowrap">
            {mode === 'defect' ? '不具合撮影' : mode === 'standard' ? '定形写真撮影' : '通常撮影'}
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {!capturedImage ? (
          <div className="relative w-full max-w-3xl">
            {cameraStarted ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto rounded-lg"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button
                    onClick={captureImage}
                    className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-emerald-500 transition"
                  />
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 border-2 border-white text-white rounded-xl hover:bg-white hover:text-slate-900 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95"
                  >
                    キャンセル
                  </button>
                </div>
              </>
            ) : (
              <div className="text-white text-center">
                カメラを起動しています...
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-3xl">
            <img
              src={capturedImage}
              alt="撮影した画像"
              className="w-full h-auto rounded-xl mb-4"
            />
            
            {/* アップロードエラー表示 */}
            {uploadError && (
              <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-xl text-yellow-200 text-sm">
                ⚠️ {uploadError}
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                onClick={retake}
                disabled={isUploading}
                className={`flex-1 border-2 border-slate-600 text-slate-600 py-3 rounded-xl font-semibold transition-all duration-300 ease-out transform ${
                  isUploading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-slate-700 hover:text-white hover:border-slate-700 hover:scale-105 active:scale-95'
                }`}
              >
                撮影し直す
              </button>
              <button
                onClick={handleConfirm}
                disabled={isUploading}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ease-out transform shadow-lg ${
                  isUploading
                    ? 'bg-slate-500 text-white cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95 hover:shadow-xl'
                }`}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    アップロード中...
                  </span>
                ) : (
                  '確定'
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraPage;

