import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { compressImage, formatSize, getBase64Size } from '../utils/imageCompression';
import { logStorageUsage, getStorageWarningLevel, getSetting, loadData, updateData } from '../storage/indexedDB';
import { generateId } from '../utils/helpers';
import type { ReferenceImage } from '../types';

const LANDSCAPE_ASPECT = 16 / 9;
const PORTRAIT_ASPECT = 9 / 16;
const TIMER_SETTING_KEY = 'cameraTimerSeconds';

type OrientationMode = 'portrait' | 'landscape';

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

  // 撮影モード（縦/横）
  const [orientationMode, setOrientationMode] = useState<OrientationMode>('landscape');
  const targetAspect = orientationMode === 'landscape' ? LANDSCAPE_ASPECT : PORTRAIT_ASPECT;

  // デバイスの実際の向き（横持ちかどうか）
  const [isDeviceLandscape, setIsDeviceLandscape] = useState(window.innerWidth > window.innerHeight);

  // ズーム・フォーカス関連
  const [zoomValue, setZoomValue] = useState(1);
  const zoomRef = useRef(1);
  const zoomRangeRef = useRef<{ min: number; max: number } | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const pinchRef = useRef({ isPinching: false, initialDistance: 0, startZoom: 1 });

  // デバイスの実際の向き追跡（撮影モードは変更しない）
  useEffect(() => {
    const handleOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setIsDeviceLandscape(isLandscape);
    };
    handleOrientation(); // 初回チェック
    window.addEventListener('resize', handleOrientation);
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientation);
    }
    return () => {
      window.removeEventListener('resize', handleOrientation);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientation);
      }
    };
  }, []);

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

      // ズーム対応検出
      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        const caps = track.getCapabilities() as any;
        if (caps.zoom) {
          zoomRangeRef.current = { min: caps.zoom.min, max: caps.zoom.max };
          const settings = track.getSettings() as any;
          if (settings.zoom) {
            zoomRef.current = settings.zoom;
            setZoomValue(settings.zoom);
          }
          console.log('[Camera] zoom supported:', caps.zoom.min, '-', caps.zoom.max);
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

      let cropW: number;
      let cropH: number;
      let cropX: number;
      let cropY: number;

      if (orientationMode === 'portrait' || (orientationMode === 'landscape' && isDeviceLandscape)) {
        // 縦モード or 横モード+横持ち: クロップなし、全フレーム使用
        cropW = srcW;
        cropH = srcH;
        cropX = 0;
        cropY = 0;
      } else {
        // 横モード+縦持ち: 16:9クロップ
        const srcAspect = srcW / srcH;
        if (srcAspect >= targetAspect) {
          cropH = srcH;
          cropW = srcH * targetAspect;
        } else {
          cropW = srcW;
          cropH = srcW / targetAspect;
        }
        cropX = (srcW - cropW) / 2;
        cropY = (srcH - cropH) / 2;
      }

      canvas.width = cropW;
      canvas.height = cropH;

      console.log('[Camera] capture', {
        mode: orientationMode,
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
  }, [stream, orientationMode, targetAspect, isDeviceLandscape]);

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
        positionX?: number;
        positionY?: number;
        pendingInspectionData?: any;
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
            positionX: state.positionX,
            positionY: state.positionY,
            pendingInspectionData: state.pendingInspectionData,
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

  // ─── ピンチズーム ─────────────────────────────

  const applyZoom = useCallback(async (val: number) => {
    const range = zoomRangeRef.current;
    if (!range) return;
    const clamped = Math.max(range.min, Math.min(range.max, val));
    zoomRef.current = clamped;
    setZoomValue(clamped);
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ zoom: clamped } as any] });
    } catch (_) { /* ignore */ }
  }, [stream]);

  const handlePinchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      pinchRef.current = {
        isPinching: true,
        initialDistance: Math.sqrt(dx * dx + dy * dy),
        startZoom: zoomRef.current,
      };
    }
  }, []);

  const handlePinchMove = useCallback((e: React.TouchEvent) => {
    const pinch = pinchRef.current;
    if (e.touches.length === 2 && pinch.isPinching) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      const scale = currentDistance / pinch.initialDistance;
      applyZoom(pinch.startZoom * scale);
      e.preventDefault();
    }
  }, [applyZoom]);

  const handlePinchEnd = useCallback(() => {
    pinchRef.current.isPinching = false;
  }, []);

  // ─── タップフォーカス ─────────────────────────

  const handleTapFocus = useCallback(async (e: React.TouchEvent) => {
    // ピンチ操作中は無視、シングルタップのみ
    if (pinchRef.current.isPinching || e.changedTouches.length !== 1) return;

    const touch = e.changedTouches[0];
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const screenX = touch.clientX - rect.left;
    const screenY = touch.clientY - rect.top;
    const normX = screenX / rect.width;
    const normY = screenY / rect.height;

    // フォーカスインジケーター
    setFocusPoint({ x: screenX, y: screenY });
    setTimeout(() => setFocusPoint(null), 1000);

    const track = stream?.getVideoTracks()[0];
    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [{ pointsOfInterest: [{ x: normX, y: normY }] } as any],
      });
    } catch {
      try {
        await track.applyConstraints({ advanced: [{ focusMode: 'single-shot' } as any] });
      } catch (_) { /* ignore */ }
    }
  }, [stream]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center relative">
        {!capturedImage ? (
          <div className="absolute inset-0">
            {cameraStarted ? (
              <>
                {/* カメラプレビュー（フルスクリーン） */}
                <div
                  className="relative w-full h-full overflow-hidden"
                  style={{ touchAction: 'none' }}
                  onTouchStart={handlePinchStart}
                  onTouchMove={handlePinchMove}
                  onTouchEnd={(e) => { handlePinchEnd(); handleTapFocus(e); }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* クロップオーバーレイ（横モードで縦持ちの場合のみ表示） */}
                  {orientationMode === 'landscape' && !isDeviceLandscape && (
                    <CropOverlay videoRef={videoRef} orientationMode={orientationMode} />
                  )}

                  {/* ズームインジケーター */}
                  {zoomRangeRef.current && zoomValue > zoomRangeRef.current.min && (
                    <div className="absolute top-3 left-3 bg-black/60 text-white px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm" style={{ zIndex: 15 }}>
                      x{zoomValue.toFixed(1)}
                    </div>
                  )}

                  {/* 縦/横撮影モードトグル */}
                  <div className="absolute top-3 right-3 flex rounded-lg overflow-hidden shadow-lg" style={{ zIndex: 15 }}>
                    <button
                      onClick={() => { setOrientationMode('portrait');}}
                      className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                        orientationMode === 'portrait'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-black/50 text-white/60'
                      }`}
                    >
                      縦
                    </button>
                    <button
                      onClick={() => { setOrientationMode('landscape');}}
                      className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                        orientationMode === 'landscape'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-black/50 text-white/60'
                      }`}
                    >
                      横
                    </button>
                  </div>

                  {/* タップフォーカスインジケーター */}
                  {focusPoint && (
                    <div
                      className="absolute pointer-events-none"
                      style={{ left: focusPoint.x - 25, top: focusPoint.y - 25, zIndex: 15 }}
                    >
                      <div className="w-[50px] h-[50px] border-2 border-yellow-400 rounded-lg animate-pulse" />
                    </div>
                  )}

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
                <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4" style={{ zIndex: 30 }}>
                  {countdown !== null ? (
                    <button
                      onClick={handleCancelCountdown}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold transition-all active:scale-95"
                    >
                      タイマー中止
                    </button>
                  ) : (
                    <>
                      {/* タイマー撮影ボタン（タイマー設定時のみ表示） */}
                      {timerSeconds !== null && timerSeconds > 0 && (
                        <button
                          onClick={handleShutter}
                          className="flex flex-col items-center gap-0.5 px-3 py-2 bg-amber-600 text-white rounded-xl font-semibold transition-all active:scale-95"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs">{timerSeconds}秒</span>
                        </button>
                      )}
                      {/* 即時撮影ボタン（常に表示） */}
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
 * クロップオーバーレイ: video要素の上にクロップ枠を表示
 * portrait: 9:16縦長枠（左右マスク）, landscape: 16:9横長枠（上下マスク）
 */
const CropOverlay: React.FC<{
  videoRef: React.RefObject<HTMLVideoElement | null>;
  orientationMode: OrientationMode;
}> = ({ videoRef, orientationMode }) => {
  const [mask, setMask] = useState<{ type: 'tb' | 'lr'; size: number }>({ type: 'tb', size: 0 });
  const rafRef = useRef<number>(0);

  const aspect = orientationMode === 'landscape' ? LANDSCAPE_ASPECT : PORTRAIT_ASPECT;

  useEffect(() => {
    const update = () => {
      const video = videoRef.current;
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        const containerWidth = video.clientWidth;
        const containerHeight = video.clientHeight;
        const videoAspect = video.videoWidth / video.videoHeight;

        let displayW: number;
        let displayH: number;
        if (containerWidth / containerHeight > videoAspect) {
          displayH = containerHeight;
          displayW = containerHeight * videoAspect;
        } else {
          displayW = containerWidth;
          displayH = containerWidth / videoAspect;
        }

        const displayAspect = displayW / displayH;

        if (aspect >= displayAspect) {
          // クロップ領域が表示領域より横長 → 上下をマスク
          const cropH = displayW / aspect;
          const maskSize = Math.max(0, (displayH - cropH) / 2);
          const containerOffsetY = (containerHeight - displayH) / 2;
          setMask({ type: 'tb', size: containerOffsetY + maskSize });
        } else {
          // クロップ領域が表示領域より縦長 → 左右をマスク
          const cropW = displayH * aspect;
          const maskSize = Math.max(0, (displayW - cropW) / 2);
          const containerOffsetX = (containerWidth - displayW) / 2;
          setMask({ type: 'lr', size: containerOffsetX + maskSize });
        }
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [videoRef, aspect]);

  if (mask.size <= 0) return null;

  if (mask.type === 'tb') {
    return (
      <>
        <div className="absolute top-0 left-0 right-0 bg-black/60 pointer-events-none" style={{ height: `${mask.size}px`, zIndex: 10 }} />
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 pointer-events-none" style={{ height: `${mask.size}px`, zIndex: 10 }} />
        <div className="absolute left-0 right-0 border-2 border-white/50 pointer-events-none" style={{ top: `${mask.size}px`, bottom: `${mask.size}px`, zIndex: 10 }} />
      </>
    );
  }

  return (
    <>
      <div className="absolute top-0 left-0 bottom-0 bg-black/60 pointer-events-none" style={{ width: `${mask.size}px`, zIndex: 10 }} />
      <div className="absolute top-0 right-0 bottom-0 bg-black/60 pointer-events-none" style={{ width: `${mask.size}px`, zIndex: 10 }} />
      <div className="absolute top-0 bottom-0 border-2 border-white/50 pointer-events-none" style={{ left: `${mask.size}px`, right: `${mask.size}px`, zIndex: 10 }} />
    </>
  );
};

export default CameraPage;
