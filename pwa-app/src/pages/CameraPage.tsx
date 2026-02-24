import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { compressImage, formatSize, getBase64Size } from '../utils/imageCompression';
import { logStorageUsage, getStorageWarningLevel, getSetting, loadData, updateData } from '../storage/indexedDB';
import { generateId } from '../utils/helpers';
import type { ReferenceImage } from '../types';

const TARGET_ASPECT = 16 / 9;
const TIMER_SETTING_KEY = 'cameraTimerSeconds';

const CameraPage: React.FC = () => {
  const { mode } = useParams<{ mode: 'defect' | 'reference' | 'standard' }>();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  // タイマー関連
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    console.log('[Camera] mount. mode =', mode);
    startCamera();
    // タイマー設定を読み込み
    getSetting<number | null>(TIMER_SETTING_KEY, null).then(setTimerSeconds);
    return () => {
      console.log('[Camera] unmount. stopCamera');
      stopCamera();
      clearCountdown();
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
        video: { facingMode: 'environment' },
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
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
          console.log('[Camera] video.play() succeeded', {
            readyState: videoRef.current.readyState,
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight,
          });
        } catch (_) {
          console.warn('[Camera] video.play() failed (will require user gesture)');
        }
      }

      setCameraStarted(true);
      console.log('[Camera] cameraStarted = true');
    } catch (error: any) {
      console.error('カメラの起動に失敗しました:', error);

      let errorMessage = 'カメラの起動に失敗しました。';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'カメラへのアクセスが拒否されました。\nブラウザの設定でカメラの使用を許可してください。';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'カメラデバイスが見つかりません。\nカメラが接続されているか確認してください。';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'カメラが他のアプリケーションで使用中です。\n他のアプリを閉じてから再度お試しください。';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'カメラの設定に問題があります。\n別のカメラモードで試してください。';
      } else {
        errorMessage += `\nエラー: ${error.message || '不明なエラー'}`;
      }

      alert(errorMessage);
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

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
  };

  const captureImage = useCallback(async () => {
    console.log('[Camera] captureImage invoked');
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const maxRetries = 10;
      let retries = 0;

      while (retries < maxRetries) {
        console.log('[Camera] checking video readiness', {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          retry: retries,
        });

        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          break;
        }

        try {
          await video.play();
        } catch (_) {}

        await new Promise((r) => setTimeout(r, 200));
        retries++;
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('[Camera] Video dimensions are 0 after retries');
        alert('カメラの準備ができていません。もう一度お試しください。');
        return;
      }

      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      const srcAspect = srcW / srcH;

      let cropW: number;
      let cropH: number;

      if (srcAspect >= TARGET_ASPECT) {
        // 既に横長（PCカメラや横持ちの場合）→ 高さ基準
        cropH = srcH;
        cropW = srcH * TARGET_ASPECT;
      } else {
        // 縦長（スマホ縦持ち）→ 幅基準
        cropW = srcW;
        cropH = srcW / TARGET_ASPECT;
      }

      const cropX = (srcW - cropW) / 2;
      const cropY = (srcH - cropH) / 2;

      canvas.width = cropW;
      canvas.height = cropH;

      console.log('[Camera] crop capture', {
        src: `${srcW}x${srcH}`,
        crop: `${Math.round(cropW)}x${Math.round(cropH)}`,
        offset: `(${Math.round(cropX)}, ${Math.round(cropY)})`,
      });

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          video,
          cropX, cropY, cropW, cropH,
          0, 0, cropW, cropH
        );

        const originalImageData = canvas.toDataURL('image/jpeg', 0.9);
        const originalSize = getBase64Size(originalImageData);

        console.log('[Camera] Original image captured:', {
          size: formatSize(originalSize),
          dimensions: `${Math.round(cropW)}x${Math.round(cropH)}`,
        });

        await logStorageUsage();
        const warningLevel = await getStorageWarningLevel();

        if (warningLevel === 'critical') {
          alert('ストレージの容量が不足しています。\n古いデータを削除するか、データをエクスポートしてください。');
          return;
        } else if (warningLevel === 'warning') {
          console.warn('[Camera] LocalStorage usage is high. Consider exporting data.');
        }

        try {
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

          // referenceモード: 撮影即保存（プレビュー・メモ入力省略）
          if (mode === 'reference') {
            const state = location.state as {
              propertyId: string;
              returnPath: string;
            };
            try {
              const data = await loadData();
              const property = data.properties.find((p) => p.id === state.propertyId);
              if (!property) {
                alert('物件が見つかりません');
                stopCamera();
                navigate('/properties');
                return;
              }
              const referenceImage: ReferenceImage = {
                id: generateId(),
                propertyId: state.propertyId,
                imageData: compressed.dataUrl,
                memo: undefined,
                createdAt: new Date().toISOString(),
              };
              await updateData('referenceImages', [...data.referenceImages, referenceImage]);
              console.log('[Camera] Reference image saved directly:', referenceImage.id);
              stopCamera();
              navigate(state.returnPath);
              return;
            } catch (err) {
              console.error('[Camera] Failed to save reference image:', err);
              alert('写真の保存に失敗しました。');
              stopCamera();
              return;
            }
          }

          setCapturedImage(compressed.dataUrl);
        } catch (error) {
          console.error('[Camera] Compression failed:', error);
          alert('画像の圧縮に失敗しました。元の画像を使用します。');
          setCapturedImage(originalImageData);
        }

        stopCamera();
      }
    }
  }, [stream]);

  const handleShutter = () => {
    if (timerSeconds !== null && timerSeconds > 0) {
      // タイマー撮影: カウントダウン開始
      setCountdown(timerSeconds);
      let remaining = timerSeconds;
      countdownRef.current = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearCountdown();
          captureImage();
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    } else {
      // 即時撮影
      captureImage();
    }
  };

  const handleCancelCountdown = () => {
    clearCountdown();
  };

  const retake = () => {
    console.log('[Camera] retake clicked');
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (!capturedImage) return;

    if (mode === 'defect') {
      const state = location.state as {
        inspectionId?: string;
        blueprintId: string;
        isEdit?: boolean;
        returnPath?: string;
        existingData?: any;
        propertyId?: string;
        inspectionItemId?: string;
        inspectionItemName?: string;
        evaluationId?: string;
        evaluationType?: string;
        isSimilar?: boolean;
        positionX?: number;
        positionY?: number;
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
            returnPath: state.returnPath,
            propertyId: state.propertyId,
            inspectionItemId: state.inspectionItemId,
            inspectionItemName: state.inspectionItemName,
            evaluationId: state.evaluationId,
            evaluationType: state.evaluationType,
            isSimilar: state.isSimilar,
            positionX: state.positionX,
            positionY: state.positionY,
          },
        });
      }
    } else if (mode === 'standard') {
      const state = location.state as {
        propertyId: string;
        photoType: number;
      };

      navigate(`/properties/${state.propertyId}/standard-photos`, {
        state: {
          newPhoto: {
            photoType: state.photoType,
            imageData: capturedImage,
          },
        },
      });
    } else {
      const state = location.state as {
        propertyId: string;
        returnPath: string;
        blueprintId?: string;
      };

      navigate('/reference-images/input', {
        state: {
          propertyId: state.propertyId,
          imageData: capturedImage,
          returnPath: state.returnPath,
        },
      });
    }
  };

  const handleCancel = () => {
    stopCamera();
    clearCountdown();

    const state = location.state as {
      returnPath?: string;
      blueprintId?: string;
      propertyId?: string;
    } | null;

    if (state?.returnPath) {
      navigate(state.returnPath);
      return;
    }

    if (mode === 'defect' && state?.blueprintId) {
      navigate(`/blueprints/${state.blueprintId}`);
    } else if (mode === 'standard' && state?.propertyId) {
      navigate(`/properties/${state.propertyId}/standard-photos`);
    } else if (state?.propertyId) {
      navigate(`/properties/${state.propertyId}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="bg-gray-800 text-white shadow flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-center gap-3">
          <h1 className="text-sm font-bold whitespace-nowrap">
            {mode === 'defect' ? '不具合撮影' : mode === 'standard' ? '定形写真撮影' : '通常撮影'}
          </h1>
          {timerSeconds !== null && countdown === null && (
            <span className="text-xs bg-amber-600 px-2 py-0.5 rounded-full">
              タイマー {timerSeconds}秒
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {!capturedImage ? (
          <div className="relative w-full max-w-3xl">
            {cameraStarted ? (
              <>
                {/* カメラプレビュー + クロップ枠 */}
                <div className="relative overflow-hidden rounded-lg">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                  />
                  {/* 上部マスク */}
                  <div
                    className="absolute top-0 left-0 right-0 bg-black/60 pointer-events-none"
                    style={{ height: 'calc((100% - 100% / (16/9) * (var(--video-aspect, 1))) / 2)' }}
                  />
                  {/* クロップオーバーレイ: 上下の暗いマスクで横長枠を示す */}
                  <CropOverlay videoRef={videoRef} />

                  {/* カウントダウン表示 */}
                  {countdown !== null && (
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ zIndex: 20 }}
                    >
                      <div className="text-white text-8xl font-bold drop-shadow-lg animate-pulse">
                        {countdown}
                      </div>
                    </div>
                  )}
                </div>

                {/* ボタン群 */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4" style={{ zIndex: 30 }}>
                  {countdown !== null ? (
                    <button
                      onClick={handleCancelCountdown}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold transition-all active:scale-95"
                    >
                      タイマー中止
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleShutter}
                        className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-emerald-500 transition"
                      />
                      <button
                        onClick={handleCancel}
                        className="px-6 py-3 border-2 border-white text-white rounded-xl hover:bg-white hover:text-slate-900 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95"
                      >
                        キャンセル
                      </button>
                    </>
                  )}
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

            <div className="flex gap-4">
              <button
                onClick={retake}
                className="flex-1 border-2 border-slate-600 text-slate-600 py-3 rounded-xl font-semibold transition-all duration-300 ease-out transform hover:bg-slate-700 hover:text-white hover:border-slate-700 hover:scale-105 active:scale-95"
              >
                撮影し直す
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 ease-out transform shadow-lg hover:bg-emerald-700 hover:scale-105 active:scale-95 hover:shadow-xl"
              >
                確定
              </button>
            </div>
          </div>
        )}
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

/**
 * クロップオーバーレイ: video要素の上に16:9横長枠を表示
 * 枠外を半透明黒でマスクする
 */
const CropOverlay: React.FC<{ videoRef: React.RefObject<HTMLVideoElement | null> }> = ({ videoRef }) => {
  const [maskHeight, setMaskHeight] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      const video = videoRef.current;
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        const containerWidth = video.clientWidth;
        const containerHeight = video.clientHeight;
        const videoAspect = video.videoWidth / video.videoHeight;

        // video要素内での実際の映像表示サイズを計算
        let displayW: number;
        let displayH: number;
        if (containerWidth / containerHeight > videoAspect) {
          displayH = containerHeight;
          displayW = containerHeight * videoAspect;
        } else {
          displayW = containerWidth;
          displayH = containerWidth / videoAspect;
        }

        // 16:9クロップ領域の高さ
        const cropDisplayH = displayW / TARGET_ASPECT;
        // マスクする上下の高さ (映像表示領域からはみ出す部分)
        const mask = Math.max(0, (displayH - cropDisplayH) / 2);
        // コンテナ全体の高さに対するオフセット
        const containerOffsetY = (containerHeight - displayH) / 2;
        setMaskHeight(containerOffsetY + mask);
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [videoRef]);

  if (maskHeight <= 0) return null;

  return (
    <>
      {/* 上部マスク */}
      <div
        className="absolute top-0 left-0 right-0 bg-black/60 pointer-events-none"
        style={{ height: `${maskHeight}px`, zIndex: 10 }}
      />
      {/* 下部マスク */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-black/60 pointer-events-none"
        style={{ height: `${maskHeight}px`, zIndex: 10 }}
      />
      {/* 枠線 */}
      <div
        className="absolute left-0 right-0 border-2 border-white/50 pointer-events-none"
        style={{
          top: `${maskHeight}px`,
          bottom: `${maskHeight}px`,
          zIndex: 10,
        }}
      />
    </>
  );
};

export default CameraPage;
