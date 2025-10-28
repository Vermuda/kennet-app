import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadData } from '../storage/localStorage';
import type { Blueprint, Marker } from '../types';

const BlueprintViewPage: React.FC = () => {
  const { blueprintId } = useParams<{ blueprintId: string }>();
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const data = loadData();
    const blueprintData = data.blueprints.find((b) => b.id === blueprintId);
    if (!blueprintData) {
      navigate('/properties');
      return;
    }
    setBlueprint(blueprintData);

    const blueprintMarkers = data.markers.filter((m) => m.blueprintId === blueprintId);
    setMarkers(blueprintMarkers);

    // 画像を読み込む
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = blueprintData.imageData;
  }, [blueprintId, navigate]);

  useEffect(() => {
    if (imageLoaded && canvasRef.current && imageRef.current) {
      drawCanvas();
    }
  }, [imageLoaded, markers]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvasサイズを画像サイズに合わせる
    canvas.width = img.width;
    canvas.height = img.height;

    // 画像を描画
    ctx.drawImage(img, 0, 0);

    // マーカーを描画
    markers.forEach((marker) => {
      const x = (marker.x / 100) * canvas.width;
      const y = (marker.y / 100) * canvas.height;

      // 外側の円（白い縁）
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();

      // 内側の円（赤）
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      // 中心の点
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // パーセンテージに変換
    const xPercent = (x / canvas.width) * 100;
    const yPercent = (y / canvas.height) * 100;

    // 検査情報入力画面へ遷移
    navigate(`/inspection/new`, {
      state: {
        blueprintId,
        x: xPercent,
        y: yPercent,
      },
    });
  };

  const goBack = () => {
    if (blueprint) {
      const data = loadData();
      const floor = data.floors.find((f) => f.id === blueprint.floorId);
      if (floor) {
        navigate(`/floors/${floor.id}`);
      }
    }
  };

  if (!blueprint) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="text-gray-300 hover:text-white">
              ← 戻る
            </button>
            <h1 className="text-xl font-bold">図面表示</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/defects/${blueprintId}`)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              不具合一覧
            </button>
            <button
              onClick={() => navigate(`/reference-images/${blueprintId}`)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              参考画像
            </button>
            <button
              onClick={() =>
                navigate(`/camera/reference`, {
                  state: { blueprintId, returnPath: `/blueprints/${blueprintId}` },
                })
              }
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              📷 参考画像撮影
            </button>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {imageLoaded ? (
            <div className="relative">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="cursor-crosshair max-w-full h-auto"
                style={{ maxHeight: 'calc(100vh - 120px)' }}
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded text-sm">
                図面をタップして撮影箇所を指定
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">読み込み中...</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BlueprintViewPage;

