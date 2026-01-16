import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadData } from '../storage/localStorage';
import ReferencePhotoButton from '../components/ReferencePhotoButton';
import type { Blueprint, Marker } from '../types';

// 方位画像をインポート
import houiImage from '/houi.png';

const BlueprintViewPage: React.FC = () => {
  const { blueprintId } = useParams<{ blueprintId: string }>();
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const compassImageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [compassImageLoaded, setCompassImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const data = loadData();
    const blueprintData = data.blueprints.find((b) => b.id === blueprintId);
    if (!blueprintData) {
      navigate('/properties');
      return;
    }
    setBlueprint(blueprintData);

    // propertyIdを取得（floor → property）
    const floor = data.floors.find((f) => f.id === blueprintData.floorId);
    if (floor) {
      setPropertyId(floor.propertyId);
    }

    const blueprintMarkers = data.markers.filter((m) => m.blueprintId === blueprintId);
    setMarkers(blueprintMarkers);

    // 画像を読み込む
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = blueprintData.imageData;

    // 方位画像を読み込む
    const compassImg = new Image();
    compassImg.onload = () => {
      compassImageRef.current = compassImg;
      setCompassImageLoaded(true);
    };
    compassImg.src = houiImage;
  }, [blueprintId, navigate]);

  // 画面サイズに合わせてcanvasを再描画
  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current || !imageRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const img = imageRef.current;
    const canvas = canvasRef.current;

    // コンテナのサイズを取得
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 画像のアスペクト比を維持しながら、コンテナに収まる最大サイズを計算
    const imgAspect = img.width / img.height;
    const containerAspect = containerWidth / containerHeight;

    let canvasWidth: number;
    let canvasHeight: number;

    if (imgAspect > containerAspect) {
      // 横長の画像：幅に合わせる
      canvasWidth = containerWidth;
      canvasHeight = containerWidth / imgAspect;
    } else {
      // 縦長の画像：高さに合わせる
      canvasHeight = containerHeight;
      canvasWidth = containerHeight * imgAspect;
    }

    // スケール係数を保存（座標計算用）
    const newScale = canvasWidth / img.width;
    setScale(newScale);

    // Canvasサイズを設定
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 画像を描画
    drawCanvas(canvasWidth, canvasHeight, newScale);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, blueprint]);

  useEffect(() => {
    if (imageLoaded && compassImageLoaded && canvasRef.current && imageRef.current) {
      updateCanvasSize();
    }
  }, [imageLoaded, compassImageLoaded, markers, blueprint?.orientation, blueprint?.orientationIconX, blueprint?.orientationIconY, blueprint?.orientationIconScale, updateCanvasSize]);

  // ウィンドウリサイズ時に再描画
  useEffect(() => {
    if (!imageLoaded) return;

    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener('resize', handleResize);
    // 画面の向き変更にも対応
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [imageLoaded, updateCanvasSize]);

  const drawCompass = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, iconScale: number = 1.0) => {
    const compassImg = compassImageRef.current;
    if (!compassImg) return;

    ctx.save();

    // 位置を移動
    ctx.translate(x, y);

    // 回転を適用
    ctx.rotate((angle * Math.PI) / 180);

    // スケールを適用
    ctx.scale(iconScale, iconScale);

    // 画像を中央に配置して描画
    const imgSize = 80; // 基本サイズ
    ctx.drawImage(compassImg, -imgSize / 2, -imgSize / 2, imgSize, imgSize);

    ctx.restore();
  }, []);

  const drawCanvas = (canvasWidth?: number, canvasHeight?: number, currentScale?: number) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvasWidth ?? canvas.width;
    const height = canvasHeight ?? canvas.height;
    const drawScale = currentScale ?? scale;

    // 画像をスケーリングして描画
    ctx.drawImage(img, 0, 0, width, height);

    // 方位アイコンを描画（方位が設定されている場合）
    if (blueprint && blueprint.orientation !== undefined && compassImageRef.current) {
      const iconX = blueprint.orientationIconX ?? 50; // デフォルト: 中央
      const iconY = blueprint.orientationIconY ?? 10; // デフォルト: 上部
      const iconScale = blueprint.orientationIconScale ?? 1.0; // デフォルト: 等倍

      const compassX = (width * iconX) / 100;
      const compassY = (height * iconY) / 100;

      // スケールに応じて方位アイコンのサイズも調整
      const adjustedIconScale = iconScale * Math.min(drawScale * 1.5, 1.5);
      drawCompass(ctx, compassX, compassY, blueprint.orientation, adjustedIconScale);
    }

    // マーカーを描画
    markers.forEach((marker) => {
      const x = (marker.x / 100) * width;
      const y = (marker.y / 100) * height;

      // スケールに応じてマーカーサイズを調整
      const markerSize = Math.max(12 * drawScale, 8);
      const innerSize = Math.max(10 * drawScale, 6);
      const centerSize = Math.max(3 * drawScale, 2);

      // 外側の円（白い縁）
      ctx.beginPath();
      ctx.arc(x, y, markerSize, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();

      // 内側の円（赤）
      ctx.beginPath();
      ctx.arc(x, y, innerSize, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      // 中心の点
      ctx.beginPath();
      ctx.arc(x, y, centerSize, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    });
  };

  // 図面表示画面は確認用なのでタップしても何もしない
  // （位置選択は SelectPositionPage で行う）

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
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* ヘッダー - 1行に収まるようコンパクト化 */}
      <header className="bg-gray-800 text-white shadow flex-shrink-0">
        <div className="px-2 py-1.5 flex items-center justify-between gap-1">
          <button
            onClick={goBack}
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ← 戻る
          </button>
          <h1 className="text-sm font-bold whitespace-nowrap">図面表示</h1>
          <div className="flex gap-1">
            <button
              onClick={() => navigate(`/defects/${blueprintId}`)}
              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 whitespace-nowrap"
            >
              不具合一覧
            </button>
            {propertyId && (
              <button
                onClick={() => navigate(`/reference-images/${blueprintId}`)}
                className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 whitespace-nowrap"
              >
                通常撮影一覧
              </button>
            )}
          </div>
        </div>
      </header>

      {/* メインエリア - 残りの高さをフルに使用 */}
      <main className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-hidden">
        <div 
          ref={containerRef}
          className="relative bg-slate-800 rounded-lg shadow-2xl overflow-hidden flex items-center justify-center"
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          {imageLoaded ? (
            <>
              <canvas
                ref={canvasRef}
                className="cursor-default"
              />
              {/* 図面表示画面は確認用 - マーカー位置を確認できる */}
            </>
          ) : (
            <div className="text-gray-400">
              読み込み中...
            </div>
          )}
        </div>
      </main>

      {/* 通常撮影ボタン */}
      {propertyId && <ReferencePhotoButton propertyId={propertyId} />}
    </div>
  );
};

export default BlueprintViewPage;

