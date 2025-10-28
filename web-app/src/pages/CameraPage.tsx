import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

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
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // スマホの場合は背面カメラを優先
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setCameraStarted(true);
    } catch (error) {
      console.error('カメラの起動に失敗しました:', error);
      alert('カメラの起動に失敗しました。カメラの権限を確認してください。');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const retake = () => {
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

