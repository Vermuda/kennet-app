/**
 * @file DebugPanel.tsx
 * @description デバッグ操作パネルコンポーネント
 * ダミーデータ一括入力・全クリアのボタンを提供する。
 */

import React from 'react';

/** DebugPanel コンポーネントのProps */
interface DebugPanelProps {
  /** デバッグパネルの表示状態 */
  showDebugPanel: boolean;
  /** デバッグパネルの表示/非表示を切り替え */
  setShowDebugPanel: (v: boolean) => void;
  /** ダミーデータ入力中フラグ */
  isFillingDebug: boolean;
  /** 一括ダミーデータ入力ハンドラ */
  onFillAll: () => void;
  /** 全データクリアハンドラ */
  onClearAll: () => void;
}

/**
 * デバッグ操作パネル
 * @description 右上にトグルボタンを固定表示し、クリックで操作パネルを展開する。
 */
const DebugPanel: React.FC<DebugPanelProps> = ({
  showDebugPanel,
  setShowDebugPanel,
  isFillingDebug,
  onFillAll,
  onClearAll,
}) => {
  return (
    <>
      <button
        onClick={() => setShowDebugPanel(!showDebugPanel)}
        className="fixed bottom-10 right-44 z-50 w-8 h-8 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-lg flex items-center justify-center text-sm font-bold"
        title="デバッグモード"
      >
        🔧
      </button>

      {showDebugPanel && (
        <div className="fixed bottom-20 right-44 z-50 p-3 bg-yellow-100 border-2 border-yellow-400 rounded-lg shadow-lg w-64">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-800 font-bold text-xs">🔧 デバッグ</span>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="text-yellow-600 hover:text-yellow-800 text-lg leading-none"
            >
              ×
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={onFillAll}
              disabled={isFillingDebug}
              className="w-full px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded font-medium disabled:opacity-50"
            >
              {isFillingDebug ? '処理中...' : '一括ダミー入力'}
            </button>
            <button
              onClick={onClearAll}
              className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded font-medium"
            >
              全クリア
            </button>
          </div>
          <p className="text-[10px] text-yellow-700 mt-2">
            ※ b2/cはダミー画像・マーカー・不具合情報も自動生成
          </p>
        </div>
      )}
    </>
  );
};

export default DebugPanel;
