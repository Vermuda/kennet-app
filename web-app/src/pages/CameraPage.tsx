import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { compressImage, formatSize, getBase64Size } from '../utils/imageCompression';
import { logStorageUsage, getStorageWarningLevel } from '../storage/localStorage';

const CameraPage: React.FC = () => {
  const { mode } = useParams<{ mode: 'defect' | 'reference' }>();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);

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

  const handleConfirm = () => {
    if (!capturedImage) return;

    if (mode === 'defect') {
      // 不具合撮影の場合
      const state = location.state as {
        inspectionId: string;
        blueprintId: string;
        isEdit?: boolean;
        returnPath?: string;
        existingData?: any;
      };

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
          },
        });
      }
    } else {
      // 参考画像撮影の場合
      const { blueprintId, returnPath } = location.state as {
        blueprintId: string;
        returnPath: string;
      };
      navigate('/reference-images/input', {
        state: {
          blueprintId,
          imageData: capturedImage,
          returnPath,
        },
      });
    }
  };

  const handleCancel = () => {
    stopCamera();
    if (mode === 'defect') {
      const { blueprintId } = location.state as { blueprintId: string };
      navigate(`/blueprints/${blueprintId}`);
    } else {
      const { returnPath } = location.state as { returnPath: string };
      navigate(returnPath);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold text-center">
          {mode === 'defect' ? '不具合撮影' : '参考画像撮影'}
        </h1>
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
                    className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-blue-500 transition"
                  />
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
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
              className="w-full h-auto rounded-lg mb-4"
            />
            <div className="flex gap-4">
              <button
                onClick={retake}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600"
              >
                撮影し直す
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
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

export default CameraPage;

