import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { loadData } from '../storage/localStorage';
import type { Blueprint, Floor } from '../types';

interface SelectPositionState {
  propertyId: string;
  inspectionItemId: string;
  inspectionItemName: string;
  evaluationId: string;
  evaluationType: string;
  returnPath: string;
}

const SelectPositionPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as SelectPositionState;

  const [floors, setFloors] = useState<Floor[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!propertyId) {
      navigate('/properties');
      return;
    }

    const data = loadData();
    
    // 物件の階層を取得
    const propertyFloors = data.floors
      .filter((f) => f.propertyId === propertyId)
      .sort((a, b) => a.order - b.order);
    setFloors(propertyFloors);

    // 物件のすべての図面を取得
    const floorIds = propertyFloors.map((f) => f.id);
    const propertyBlueprints = data.blueprints.filter((b) => floorIds.includes(b.floorId));
    setBlueprints(propertyBlueprints);

    // 図面が1つだけなら自動選択
    if (propertyBlueprints.length === 1) {
      selectBlueprint(propertyBlueprints[0]);
    }
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

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    }
  }, [imageLoaded]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedBlueprint || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const displayScaleX = canvas.width / rect.width;
    const displayScaleY = canvas.height / rect.height;

    const canvasX = clickX * displayScaleX;
    const canvasY = clickY * displayScaleY;

    const xPercent = (canvasX / canvas.width) * 100;
    const yPercent = (canvasY / canvas.height) * 100;

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
      },
    });
  };

  const handleBack = () => {
    if (selectedBlueprint && blueprints.length > 1) {
      // 図面選択に戻る
      setSelectedBlueprint(null);
      setImageLoaded(false);
    } else {
      // 検査チェックシートに戻る
      navigate(state.returnPath);
    }
  };

  const getFloorName = (floorId: string) => {
    const floor = floors.find((f) => f.id === floorId);
    return floor?.name || '不明';
  };

  // 図面選択画面
  if (!selectedBlueprint) {
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
              <h1 className="text-sm font-bold whitespace-nowrap">図面を選択</h1>
              <p className="text-[10px] text-slate-300">{state.inspectionItemName}</p>
            </div>
            <div className="w-12"></div>
          </div>
        </header>

        <main className="p-4">
          {blueprints.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-slate-500">
              <p className="mb-4">図面が登録されていません</p>
              <button
                onClick={() => navigate(state.returnPath)}
                className="bg-slate-600 text-white px-6 py-2 rounded-lg"
              >
                戻る
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blueprints.map((blueprint) => (
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
                    <p className="font-bold text-slate-800">{getFloorName(blueprint.floorId)}</p>
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

  // 位置選択画面
  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
      {/* ヘッダー */}
      <header className="bg-gray-800 text-white shadow flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={handleBack}
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ← {blueprints.length > 1 ? '図面選択' : '戻る'}
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
                className="cursor-crosshair"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white px-4 py-3 rounded-lg text-center">
                <p className="text-sm font-bold">📍 撮影位置をタップしてください</p>
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
