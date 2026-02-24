import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSetting, setSetting } from '../storage/indexedDB';

const TIMER_SETTING_KEY = 'cameraTimerSeconds';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(5);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const value = await getSetting<number | null>(TIMER_SETTING_KEY, null);
      if (value !== null) {
        setTimerEnabled(true);
        setTimerSeconds(value);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    const value = timerEnabled ? timerSeconds : null;
    await setSetting(TIMER_SETTING_KEY, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTimerToggle = (enabled: boolean) => {
    setTimerEnabled(enabled);
    setSaved(false);
  };

  const handleSecondsChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 30) {
      setTimerSeconds(num);
      setSaved(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ヘッダー - 統一スタイル */}
      <header className="sticky top-0 bg-gray-800 text-white shadow z-30 flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ← 戻る
          </button>
          <h1 className="text-sm font-bold whitespace-nowrap truncate flex-1 text-center">
            設定
          </h1>
          <div className="w-12"></div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* カメラ設定カード */}
        <div className="bg-white rounded-2xl p-5 shadow">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            カメラ設定
          </h2>

          {/* タイマー撮影 */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">タイマー撮影</label>

            <div className="space-y-2">
              {/* OFF */}
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors"
                style={{
                  borderColor: !timerEnabled ? '#059669' : '#e2e8f0',
                  backgroundColor: !timerEnabled ? '#ecfdf5' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="timer"
                  checked={!timerEnabled}
                  onChange={() => handleTimerToggle(false)}
                  className="w-4 h-4 text-emerald-600 accent-emerald-600"
                />
                <span className="text-sm font-medium text-slate-700">OFF（即時撮影）</span>
              </label>

              {/* ON */}
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors"
                style={{
                  borderColor: timerEnabled ? '#059669' : '#e2e8f0',
                  backgroundColor: timerEnabled ? '#ecfdf5' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="timer"
                  checked={timerEnabled}
                  onChange={() => handleTimerToggle(true)}
                  className="w-4 h-4 text-emerald-600 accent-emerald-600"
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">ON</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={timerSeconds}
                    onChange={(e) => handleSecondsChange(e.target.value)}
                    disabled={!timerEnabled}
                    className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-center text-sm font-semibold disabled:opacity-40 disabled:bg-slate-100"
                  />
                  <span className="text-sm text-slate-600">秒</span>
                  <span className="text-xs text-slate-400">（1〜30）</span>
                </div>
              </label>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="mt-6">
            <button
              onClick={handleSave}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 ease-out transform active:scale-95"
              style={{
                backgroundColor: saved ? '#059669' : '#334155',
              }}
            >
              {saved ? '保存しました' : '保存'}
            </button>
          </div>
        </div>

        {/* 設定説明 */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="text-xs text-blue-700 leading-relaxed">
            タイマー撮影を有効にすると、カメラ画面で撮影ボタンを押した後、設定した秒数のカウントダウン後に自動撮影されます。
            スマホを三脚等に固定して撮影する際に便利です。
          </p>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
