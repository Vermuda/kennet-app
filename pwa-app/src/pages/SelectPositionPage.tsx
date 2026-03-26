import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { loadData } from '../storage/indexedDB';
import type { Blueprint, Floor } from '../types';
import houiImage from '/houi.png';

interface SelectPositionState {
  propertyId: string;
  inspectionItemId: string;
  inspectionItemName: string;
  evaluationId: string;
  evaluationType: string;
  returnPath: string;
  pendingInspectionData?: unknown;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

const SelectPositionPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as SelectPositionState;

  const [floors, setFloors] = useState<Floor[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [lastPinchDist, setLastPinchDist] = useState<number | null>(null);
  const [baseSize, setBaseSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Reset zoom/pan when blueprint changes
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setDragStart(null);
    setLastPinchDist(null);
  }, [selectedBlueprint]);

  const clampOffset = useCallback((newOffset: { x: number; y: number }, currentScale: number): { x: number; y: number } => {
    if (currentScale <= 1) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    if (!canvas) return newOffset;

    // 拡大時のスクロール範囲: 画像全体を見られるようにする
    // 最小offset（右端を見る）: -(scale-1) * size
    // 最大offset（左端を見る）: 0
    const minOffsetX = -(currentScale - 1) * baseSize.width;
    const minOffsetY = -(currentScale - 1) * baseSize.height;

    return {
      x: Math.max(minOffsetX, Math.min(0, newOffset.x)),
      y: Math.max(minOffsetY, Math.min(0, newOffset.y)),
    };
  }, [baseSize]);

  useEffect(() => {
    const loadPositionData = async () => {
      if (!propertyId) {
        navigate('/properties');
        return;
      }

      const data = await loadData();

      // 物件の階層を取得
      const propertyFloors = data.floors
        .filter((f) => f.propertyId === propertyId)
        .sort((a, b) => a.order - b.order);
      setFloors(propertyFloors);

      // 物件のすべての図面を取得
      const floorIds = propertyFloors.map((f) => f.id);
      const propertyBlueprints = data.blueprints.filter((b) => floorIds.includes(b.floorId));
      setBlueprints(propertyBlueprints);

      // 自動選択ロジック
      if (propertyFloors.length === 1) {
        setSelectedFloorId(propertyFloors[0].id);
        const floorBlueprints = propertyBlueprints.filter(
          (b) => b.floorId === propertyFloors[0].id
        );
        if (floorBlueprints.length === 1) {
          selectBlueprint(floorBlueprints[0]);
        }
      } else if (propertyBlueprints.length === 1) {
        setSelectedFloorId(propertyBlueprints[0].floorId);
        selectBlueprint(propertyBlueprints[0]);
      }
    };
    loadPositionData();
  }, [propertyId, navigate]);

  const selectBlueprint = (blueprint: Blueprint) => {
    setSelectedBlueprint(blueprint);
    setImageLoaded(false);

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = blueprint.imageData;
  };

  // Canvas drawing with zoom/pan support
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const img = imageRef.current;
    const container = containerRef.current;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const imgAspect = img.width / img.height;
    const containerAspect = containerWidth / containerHeight;

    let canvasWidth: number;
    let canvasHeight: number;

    if (imgAspect > containerAspect) {
      canvasWidth = containerWidth;
      canvasHeight = containerWidth / imgAspect;
    } else {
      canvasHeight = containerHeight;
      canvasWidth = containerHeight * imgAspect;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Save base size for coordinate conversion
    if (baseSize.width === 0 || baseSize.height === 0) {
      setBaseSize({ width: canvasWidth, height: canvasHeight });
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    }
  }, [imageLoaded, scale, offset, baseSize]);

  // --- Touch handlers for pinch zoom and pan ---

  const getTouchDist = (e: React.TouchEvent): number => {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setLastPinchDist(getTouchDist(e));
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
      setIsDragging(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist !== null) {
      e.preventDefault();
      const newDist = getTouchDist(e);
      const ratio = newDist / lastPinchDist;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * ratio));

      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        const scaleRatio = newScale / scale;
        const newOffset = {
          x: cx - (cx - offset.x) * scaleRatio,
          y: cy - (cy - offset.y) * scaleRatio,
        };
        setOffset(clampOffset(newOffset, newScale));
      }
      setScale(newScale);
      setLastPinchDist(newDist);
    } else if (e.touches.length === 1 && dragStart) {
      const dx = e.touches[0].clientX - dragStart.x - offset.x;
      const dy = e.touches[0].clientY - dragStart.y - offset.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        setIsDragging(true);
      }
      if (scale > 1) {
        const newOffset = {
          x: e.touches[0].clientX - dragStart.x,
          y: e.touches[0].clientY - dragStart.y,
        };
        setOffset(clampOffset(newOffset, scale));
      }
    }
  };

  const handleTouchEnd = () => {
    setLastPinchDist(null);
    setDragStart(null);
  };

  // --- Mouse wheel zoom ---

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * delta));
    const scaleRatio = newScale / scale;
    const newOffset = {
      x: cx - (cx - offset.x) * scaleRatio,
      y: cy - (cy - offset.y) * scaleRatio,
    };
    setOffset(clampOffset(newOffset, newScale));
    setScale(newScale);
  }, [scale, offset, clampOffset]);

  // Attach wheel event with { passive: false } to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel, imageLoaded]);

  // --- Mouse drag for pan ---

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (scale <= 1) return;
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragStart || scale <= 1) return;
    const dx = e.clientX - dragStart.x - offset.x;
    const dy = e.clientY - dragStart.y - offset.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      setIsDragging(true);
    }
    const newOffset = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setOffset(clampOffset(newOffset, scale));
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  // --- Zoom button handlers ---

  const zoomIn = () => {
    const newScale = Math.min(MAX_SCALE, scale * 1.3);
    const canvas = canvasRef.current;
    if (canvas) {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const scaleRatio = newScale / scale;
      const newOffset = {
        x: cx - (cx - offset.x) * scaleRatio,
        y: cy - (cy - offset.y) * scaleRatio,
      };
      setOffset(clampOffset(newOffset, newScale));
    }
    setScale(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(MIN_SCALE, scale / 1.3);
    if (newScale <= 1) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const scaleRatio = newScale / scale;
      const newOffset = {
        x: cx - (cx - offset.x) * scaleRatio,
        y: cy - (cy - offset.y) * scaleRatio,
      };
      setOffset(clampOffset(newOffset, newScale));
    }
    setScale(newScale);
  };

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // --- Click handler with coordinate transform ---

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;
    if (!selectedBlueprint || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const displayScaleX = canvas.width / rect.width;
    const displayScaleY = canvas.height / rect.height;

    const canvasX = clickX * displayScaleX;
    const canvasY = clickY * displayScaleY;

    // Inverse zoom/pan transform to get image-space coordinates
    const imgX = (canvasX - offset.x) / scale;
    const imgY = (canvasY - offset.y) / scale;

    const effectiveWidth = baseSize.width > 0 ? baseSize.width : canvas.width;
    const effectiveHeight = baseSize.height > 0 ? baseSize.height : canvas.height;

    const xPercent = (imgX / effectiveWidth) * 100;
    const yPercent = (imgY / effectiveHeight) * 100;

    // Out of bounds check
    if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) return;

    console.log('[SelectPosition] Navigating to camera with blueprintId:', selectedBlueprint.id, 'floorId:', selectedFloorId);
    // カメラ画面へ遷移
    navigate('/camera/defect', {
      state: {
        propertyId,
        blueprintId: selectedBlueprint.id,
        inspectionItemId: state.inspectionItemId,
        inspectionItemName: state.inspectionItemName,
        evaluationId: state.evaluationId,
        evaluationType: state.evaluationType,
        positionX: xPercent,
        positionY: yPercent,
        returnPath: state.returnPath,
        pendingInspectionData: state.pendingInspectionData,
      },
    });
  };

  const handleBack = () => {
    if (selectedBlueprint) {
      const floorBlueprints = blueprints.filter((b) => b.floorId === selectedFloorId);
      if (floors.length === 1 && floorBlueprints.length === 1) {
        navigate(state.returnPath);
        return;
      }
      setSelectedBlueprint(null);
      setImageLoaded(false);
      if (floors.length === 1) {
        return;
      }
      if (floorBlueprints.length === 1) {
        setSelectedFloorId(null);
      }
    } else if (selectedFloorId) {
      if (floors.length === 1) {
        navigate(state.returnPath);
      } else {
        setSelectedFloorId(null);
      }
    } else {
      navigate(state.returnPath);
    }
  };

  const getFloorName = (floorId: string) => {
    const floor = floors.find((f) => f.id === floorId);
    return floor?.name || '不明';
  };

  const getBlueprintCountForFloor = (floorId: string) => {
    return blueprints.filter((b) => b.floorId === floorId).length;
  };

  const selectedFloorName = selectedFloorId ? getFloorName(selectedFloorId) : '';

  // Phase 1: 階層選択画面
  if (!selectedFloorId && !selectedBlueprint) {
    return (
      <div className="min-h-screen bg-slate-100">
        <header className="bg-gray-800 text-white shadow flex-shrink-0">
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <button
              onClick={() => navigate(state.returnPath)}
              className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
            >
              ← 戻る
            </button>
            <div className="text-center">
              <h1 className="text-sm font-bold whitespace-nowrap">階層を選択</h1>
              <p className="text-[10px] text-slate-300">{state.inspectionItemName}</p>
            </div>
            <div className="w-12"></div>
          </div>
        </header>

        <main className="p-4">
          {floors.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-slate-500">
              <p className="mb-4">階層が登録されていません</p>
              <button
                onClick={() => navigate(state.returnPath)}
                className="bg-slate-600 text-white px-6 py-2 rounded-lg"
              >
                戻る
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {floors.map((floor) => {
                const bpCount = getBlueprintCountForFloor(floor.id);
                return (
                  <button
                    key={floor.id}
                    onClick={() => {
                      setSelectedFloorId(floor.id);
                      const floorBlueprints = blueprints.filter(
                        (b) => b.floorId === floor.id
                      );
                      if (floorBlueprints.length === 1) {
                        selectBlueprint(floorBlueprints[0]);
                      }
                    }}
                    className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between hover:shadow-lg active:bg-slate-50 transition text-left"
                  >
                    <div>
                      <p className="text-lg font-bold text-slate-800">{floor.name}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {bpCount > 0
                          ? `${bpCount}件の図面`
                          : '図面なし'}
                      </p>
                    </div>
                    <svg
                      className="w-6 h-6 text-slate-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Phase 2: 図面選択画面
  if (selectedFloorId && !selectedBlueprint) {
    const floorBlueprints = blueprints.filter((b) => b.floorId === selectedFloorId);

    return (
      <div className="min-h-screen bg-slate-100">
        <header className="bg-gray-800 text-white shadow flex-shrink-0">
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <button
              onClick={handleBack}
              className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
            >
              ← 戻る
            </button>
            <div className="text-center">
              <h1 className="text-sm font-bold whitespace-nowrap">
                図面を選択 - {selectedFloorName}
              </h1>
              <p className="text-[10px] text-slate-300">{state.inspectionItemName}</p>
            </div>
            <div className="w-12"></div>
          </div>
        </header>

        <main className="p-4">
          {floorBlueprints.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-slate-500">
              <p className="mb-4">この階層には図面が登録されていません</p>
              <button
                onClick={handleBack}
                className="bg-slate-600 text-white px-6 py-2 rounded-lg"
              >
                戻る
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {floorBlueprints.map((blueprint) => (
                <button
                  key={blueprint.id}
                  onClick={() => selectBlueprint(blueprint)}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition text-left"
                >
                  <div className="aspect-video bg-slate-200">
                    <img
                      src={blueprint.imageData}
                      alt="図面"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-slate-800">{selectedFloorName}</p>
                    <p className="text-xs text-slate-500">タップして位置を選択</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Phase 3: 位置選択画面
  const backLabel = (() => {
    if (!selectedFloorId) return '戻る';
    const floorBlueprints = blueprints.filter((b) => b.floorId === selectedFloorId);
    if (floors.length === 1 && floorBlueprints.length === 1) {
      return '戻る';
    }
    if (floorBlueprints.length > 1) {
      return '図面選択';
    }
    return '階層選択';
  })();

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
      {/* ヘッダー */}
      <header className="bg-gray-800 text-white shadow flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={handleBack}
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ← {backLabel}
          </button>
          <div className="text-center flex-1 mx-2">
            <h1 className="text-sm font-bold whitespace-nowrap">位置をタップ</h1>
            <p className="text-[10px] text-slate-300 truncate">{state.inspectionItemName}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs ${state.evaluationType === 'c' ? 'bg-red-600' : 'bg-amber-500'}`}>
            {state.evaluationType === 'c' ? '不具合' : '経年変化'}
          </span>
        </div>
      </header>

      {/* 図面エリア */}
      <main className="flex-1 flex items-center justify-center p-2 overflow-hidden">
        <div
          ref={containerRef}
          className="relative bg-slate-800 rounded-lg shadow-2xl overflow-hidden flex items-center justify-center"
          style={{ width: '100%', height: '100%' }}
        >
          {imageLoaded ? (
            <>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`touch-none ${scale > 1 && isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-crosshair'}`}
              />

              {/* 方位アイコン */}
              {selectedBlueprint && selectedBlueprint.orientation !== undefined && (
                <div
                  className="absolute pointer-events-none z-10"
                  style={{
                    left: `${selectedBlueprint.orientationIconX ?? 50}%`,
                    top: `${selectedBlueprint.orientationIconY ?? 15}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <img
                    src={houiImage}
                    alt="方位"
                    className="flex-shrink-0 object-contain"
                    style={{
                      width: `${80 * (selectedBlueprint.orientationIconScale ?? 1.0)}px`,
                      height: `${80 * (selectedBlueprint.orientationIconScale ?? 1.0)}px`,
                      transform: `rotate(${selectedBlueprint.orientation}deg)`,
                    }}
                  />
                </div>
              )}

              {/* Zoom controls */}
              <div className="absolute bottom-16 left-4 flex flex-col gap-2 z-20">
                <button
                  onClick={zoomIn}
                  className="w-10 h-10 bg-white/90 rounded-lg shadow-lg text-lg font-bold text-slate-700 active:bg-slate-200 transition-colors flex items-center justify-center"
                  aria-label="ズームイン"
                >
                  +
                </button>
                <button
                  onClick={zoomOut}
                  className="w-10 h-10 bg-white/90 rounded-lg shadow-lg text-lg font-bold text-slate-700 active:bg-slate-200 transition-colors flex items-center justify-center"
                  aria-label="ズームアウト"
                >
                  -
                </button>
              </div>

              {/* Reset button (only shown when zoomed) */}
              {scale > 1 && (
                <div className="absolute bottom-16 right-4 z-20">
                  <button
                    onClick={resetZoom}
                    className="w-10 h-10 bg-white/90 rounded-lg shadow-lg text-sm font-bold text-slate-700 active:bg-slate-200 transition-colors flex items-center justify-center"
                    aria-label="ズームリセット"
                  >
                    1:1
                  </button>
                </div>
              )}

              {/* Scale indicator (only shown when zoomed) */}
              {scale > 1 && (
                <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs z-20">
                  {Math.round(scale * 100)}%
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white px-4 py-3 rounded-lg text-center">
                <p className="text-sm font-bold">撮影位置をタップしてください</p>
                <p className="text-xs text-slate-300 mt-1">タップした位置が不具合の場所として記録されます</p>
              </div>
            </>
          ) : (
            <div className="text-slate-400">読み込み中...</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SelectPositionPage;
