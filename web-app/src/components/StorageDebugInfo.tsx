/**
 * LocalStorageの使用状況をデバッグ表示するコンポーネント
 * 開発中のみ表示推奨
 */

import React, { useState, useEffect } from 'react';
import { getStorageUsage, formatStorageSize, getStorageWarningLevel } from '../storage/localStorage';

interface StorageDebugInfoProps {
  show?: boolean;
}

const StorageDebugInfo: React.FC<StorageDebugInfoProps> = ({ show = true }) => {
  const [usage, setUsage] = useState(getStorageUsage());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // 定期的に更新
    const interval = setInterval(() => {
      setUsage(getStorageUsage());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!show) return null;

  const warningLevel = getStorageWarningLevel();
  
  const getWarningColor = () => {
    switch (warningLevel) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getWarningText = () => {
    switch (warningLevel) {
      case 'critical':
        return '🔴 容量不足';
      case 'warning':
        return '⚠️ 要注意';
      default:
        return '✅ 正常';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className={`${getWarningColor()} text-white px-4 py-2 rounded-lg shadow-lg hover:opacity-90 transition text-sm font-semibold`}
        >
          💾 {usage.usagePercentage.toFixed(0)}%
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-2xl p-4 w-80 border-2 border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              💾 LocalStorage 使用状況
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {/* 使用率 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">使用率</span>
                <span className="font-semibold">{getWarningText()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`${getWarningColor()} h-3 rounded-full transition-all duration-300`}
                  style={{ width: `${Math.min(usage.usagePercentage, 100)}%` }}
                />
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">
                {usage.usagePercentage.toFixed(1)}%
              </div>
            </div>

            {/* 詳細情報 */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">使用中:</span>
                <span className="font-mono font-semibold">
                  {formatStorageSize(usage.used)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">利用可能:</span>
                <span className="font-mono font-semibold">
                  {formatStorageSize(usage.available)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">総容量:</span>
                <span className="font-mono font-semibold">
                  {formatStorageSize(usage.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">アイテム数:</span>
                <span className="font-mono font-semibold">
                  {usage.itemCount}
                </span>
              </div>
            </div>

            {/* 警告メッセージ */}
            {warningLevel !== 'safe' && (
              <div className={`p-3 rounded-lg text-sm ${
                warningLevel === 'critical' 
                  ? 'bg-red-50 text-red-800 border border-red-200' 
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              }`}>
                {warningLevel === 'critical' ? (
                  <>
                    <strong>容量が不足しています</strong>
                    <br />
                    古いデータを削除するか、エクスポートしてください。
                  </>
                ) : (
                  <>
                    <strong>使用量が多くなっています</strong>
                    <br />
                    定期的なデータエクスポートを推奨します。
                  </>
                )}
              </div>
            )}

            {/* 注意事項 */}
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              ※ 総容量はブラウザによって異なります（推定値: 10MB）
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageDebugInfo;
