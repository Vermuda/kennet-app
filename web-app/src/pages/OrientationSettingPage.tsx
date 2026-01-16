import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getData, updateData } from '../storage/localStorage';
import type { Blueprint } from '../types';

// 方位画像をインポート
import houiImage from '/houi.png';

const OrientationSettingPage: React.FC = () => {
  const { blueprintId } = useParams<{ blueprintId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const compassRef = useRef<HTMLDivElement>(null);

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [orientation, setOrientation] = useState<number>(0);
  const [iconX, setIconX] = useState<number>(50);
  const [iconY, setIconY] = useState<number>(15);
  const [iconScale, setIconScale] = useState<number>(1.0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // タッチ状態
  const touchStateRef = useRef({
    isTwoFinger: false,
    startScale: 1,
    initialDistance: 0,
    compassStartX: 50,
    compassStartY: 15,
    startX: 0,
    startY: 0,
  });

  useEffect(() => {
    if (!blueprintId) return;

    const blueprints = getData('blueprints');
    const foundBlueprint = blueprints.find((b) => b.id === blueprintId);

    if (!foundBlueprint) {
      console.error('図面が見つかりません:', blueprintId);
      navigate('/properties');
      return;
    }

    setBlueprint(foundBlueprint);
    setOrientation(foundBlueprint.orientation ?? 0);
    setIconX(foundBlueprint.orientationIconX ?? 50);
    setIconY(foundBlueprint.orientationIconY ?? 15);
    setIconScale(foundBlueprint.orientationIconScale ?? 1.0);

    // 初回ガイド表示チェック
    if (!localStorage.getItem('orientationGuideShown')) {
      setShowGuide(true);
    }

      setImageLoaded(true);
  }, [blueprintId, navigate]);

  const getDirectionLabel = useCallback((angle: number): string => {
    if (angle === 0) return '北';
    if (angle === 90) return '東';
    if (angle === 180) return '南';
    if (angle === 270) return '西';
    return `${angle}°`;
  }, []);

  const handlePresetClick = (angle: number) => {
    setOrientation(angle);
  };

  const closeGuide = () => {
    setShowGuide(false);
    localStorage.setItem('orientationGuideShown', 'true');
  };

  const handleConfirm = () => {
    if (!blueprint) return;

    const blueprints = getData('blueprints');
    const updatedBlueprints = blueprints.map((b) =>
      b.id === blueprintId
        ? {
            ...b,
            orientation,
            orientationIconX: iconX,
            orientationIconY: iconY,
            orientationIconScale: iconScale,
          }
        : b
    );

    updateData('blueprints', updatedBlueprints);

    if (location.state?.fromUpload) {
      navigate(`/blueprints/${blueprintId}`);
    } else {
      navigate(`/blueprints/${blueprintId}`);
    }
  };

  const handleBack = () => {
    navigate(`/blueprints/${blueprintId}`);
  };

  // タッチイベントハンドラ
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;

    if (touches.length === 2) {
      // 2本指: 移動 or ピンチ
      touchStateRef.current.isTwoFinger = true;
      touchStateRef.current.compassStartX = iconX;
      touchStateRef.current.compassStartY = iconY;
      touchStateRef.current.startX = (touches[0].clientX + touches[1].clientX) / 2;
      touchStateRef.current.startY = (touches[0].clientY + touches[1].clientY) / 2;

      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      touchStateRef.current.initialDistance = Math.sqrt(dx * dx + dy * dy);
      touchStateRef.current.startScale = iconScale;
    } else {
      // 1本指: 回転
      touchStateRef.current.isTwoFinger = false;
    }

    e.preventDefault();
  }, [iconX, iconY, iconScale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const container = containerRef.current;
    const compass = compassRef.current;

    if (!container || !compass) return;

    if (touches.length === 2 && touchStateRef.current.isTwoFinger) {
      // ピンチでサイズ調整
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const scaleRatio = distance / touchStateRef.current.initialDistance;
      const newScale = Math.max(0.1, Math.min(1.5, touchStateRef.current.startScale * scaleRatio));
      setIconScale(newScale);

      // 2本指ドラッグで移動
      const currentX = (touches[0].clientX + touches[1].clientX) / 2;
      const currentY = (touches[0].clientY + touches[1].clientY) / 2;

      const rect = container.getBoundingClientRect();
      const deltaX = ((currentX - touchStateRef.current.startX) / rect.width) * 100;
      const deltaY = ((currentY - touchStateRef.current.startY) / rect.height) * 100;

      setIconX(Math.max(10, Math.min(90, touchStateRef.current.compassStartX + deltaX)));
      setIconY(Math.max(10, Math.min(90, touchStateRef.current.compassStartY + deltaY)));

    } else if (touches.length === 1 && !touchStateRef.current.isTwoFinger) {
      // 1本指で回転
      const rect = compass.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const touchDx = touches[0].clientX - centerX;
      const touchDy = touches[0].clientY - centerY;

      // 中心から一定距離以上の場合のみ
      const touchDistance = Math.sqrt(touchDx * touchDx + touchDy * touchDy);
      if (touchDistance > 30) {
        let newAngle = Math.atan2(touchDx, -touchDy) * (180 / Math.PI);
        if (newAngle < 0) newAngle += 360;
        newAngle = Math.round(newAngle / 5) * 5;
        if (newAngle >= 360) newAngle = 0;
        setOrientation(newAngle);
      }
    }

    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStateRef.current.isTwoFinger = false;
  }, []);

  // マウスイベント（PC対応）
  const handleMouseDown = useCallback((_e: React.MouseEvent) => {
    const compass = compassRef.current;
    if (!compass) return;

    const rect = compass.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;

      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 20) {
        let newAngle = Math.atan2(dx, -dy) * (180 / Math.PI);
        if (newAngle < 0) newAngle += 360;
        newAngle = Math.round(newAngle / 5) * 5;
        if (newAngle >= 360) newAngle = 0;
        setOrientation(newAngle);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  if (!blueprint) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 overflow-hidden relative" style={{ touchAction: 'none' }}>
      {/* 図面エリア（全画面） */}
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {imageLoaded && blueprint.imageData ? (
          <img
            src={blueprint.imageData}
            alt="図面"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-slate-500">図面を読み込み中...</div>
        )}

        {/* 方位アイコン */}
        <div
          ref={compassRef}
          className="absolute cursor-pointer"
          style={{
            left: `${iconX}%`,
            top: `${iconY}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onMouseDown={handleMouseDown}
        >
          <img
            src={houiImage}
            alt="方位"
            className="transition-transform duration-100"
            style={{
              width: `${80 * iconScale}px`,
              height: `${80 * iconScale}px`,
              transform: `rotate(${orientation}deg)`,
            }}
          />
        </div>
        </div>

      {/* ヘッダー（フローティング） */}
      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start z-10">
          <button
          onClick={handleBack}
          className="bg-black/60 text-white px-3 py-2 rounded-xl text-sm backdrop-blur-sm"
        >
          ← 戻る
          </button>

        {/* 角度・サイズ表示（コンパクト） */}
        <div className="bg-black/60 text-white px-3 py-2 rounded-xl backdrop-blur-sm text-center text-sm">
          <span className="font-bold">{getDirectionLabel(orientation)} {orientation}°</span>
          <span className="text-slate-300 ml-2">{Math.round(iconScale * 100)}%</span>
        </div>

          <button
          onClick={handleConfirm}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
        >
          確定
          </button>
        </div>

      {/* ジェスチャーヒント */}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center z-10">
        <div className="bg-black/60 text-white px-4 py-2 rounded-full text-xs backdrop-blur-sm flex items-center gap-2 animate-pulse">
          <span>👆 回転</span>
          <span className="text-slate-400">|</span>
          <span>✌️ 移動</span>
          <span className="text-slate-400">|</span>
          <span>🤏 拡縮</span>
        </div>
      </div>

      {/* プリセットボタン（下部フローティング） */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-3">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handlePresetClick(0)}
              className={`py-3 rounded-xl text-sm font-bold transition ${
                orientation === 0 ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
              }`}
            >
              北
            </button>
            <button
              onClick={() => handlePresetClick(90)}
              className={`py-3 rounded-xl text-sm font-bold transition ${
                orientation === 90 ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
              }`}
            >
              東
          </button>
          <button
            onClick={() => handlePresetClick(180)}
              className={`py-3 rounded-xl text-sm font-bold transition ${
                orientation === 180 ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
              }`}
            >
              南
          </button>
          <button
            onClick={() => handlePresetClick(270)}
              className={`py-3 rounded-xl text-sm font-bold transition ${
                orientation === 270 ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
              }`}
            >
              西
          </button>
        </div>
        </div>
      </div>

      {/* ジェスチャーガイド（初回表示） */}
      {showGuide && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-slate-800 rounded-2xl p-6 mx-4 max-w-sm">
            <h2 className="text-white text-xl font-bold mb-4 text-center">操作方法</h2>

            <div className="space-y-4 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600/30 rounded-xl flex items-center justify-center text-2xl">
                  👆
                </div>
                <div>
                  <div className="font-bold">タップ＆ドラッグ</div>
                  <div className="text-sm text-slate-400">コンパスの周りをドラッグして回転</div>
                </div>
        </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600/30 rounded-xl flex items-center justify-center text-2xl">
                  ✌️
                </div>
                <div>
                  <div className="font-bold">2本指ドラッグ</div>
                  <div className="text-sm text-slate-400">コンパスの位置を移動</div>
                </div>
        </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600/30 rounded-xl flex items-center justify-center text-2xl">
                  🤏
                </div>
                <div>
                  <div className="font-bold">ピンチイン/アウト</div>
                  <div className="text-sm text-slate-400">コンパスのサイズを調整</div>
                </div>
              </div>
        </div>

          <button
              onClick={closeGuide}
              className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-xl font-bold"
            >
              はじめる
          </button>
        </div>
      </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OrientationSettingPage;
