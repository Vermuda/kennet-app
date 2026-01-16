import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getData, updateData } from '../storage/localStorage';
import type { Property } from '../types';

const DateWeatherInputPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [inspectionDate, setInspectionDate] = useState('');
  const [weather, setWeather] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!propertyId) {
      setError('物件IDが指定されていません');
      return;
    }

    const properties = getData('properties');
    const foundProperty = properties.find((p) => p.id === propertyId);

    if (!foundProperty) {
      setError('物件が見つかりません');
      return;
    }

    setProperty(foundProperty);

    // 既に入力済みの場合は初期値を設定
    if (foundProperty.inspectionDate) {
      setInspectionDate(foundProperty.inspectionDate);
    }
    if (foundProperty.weather) {
      setWeather(foundProperty.weather);
    }
  }, [propertyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inspectionDate) {
      setError('検査日を入力してください');
      return;
    }

    if (!weather) {
      setError('天候を選択してください');
      return;
    }

    if (!property) {
      setError('物件情報が見つかりません');
      return;
    }

    // 物件情報を更新
    const properties = getData('properties');
    const updatedProperties = properties.map((p) =>
      p.id === propertyId
        ? {
            ...p,
            inspectionDate,
            weather,
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    updateData('properties', updatedProperties);

    // 定形写真ページへ遷移
    navigate(`/properties/${propertyId}/standard-photos`);
  };

  const handleBack = () => {
    navigate(`/properties/${propertyId}`);
  };

  if (error && !property) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
          <div className="text-red-600 text-center">{error}</div>
          <button
            onClick={() => navigate('/properties')}
            className="mt-4 w-full border-2 border-slate-600 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-700 hover:text-white hover:border-slate-700 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95"
          >
            物件一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl p-6 border-l-4 border-emerald-600">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">検査日・天候入力</h1>
          {property && (
            <p className="text-gray-600 text-sm">物件: {property.name}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="inspectionDate" className="block text-sm font-medium text-gray-700 mb-2">
              検査日 <span className="text-red-500">*</span>
            </label>
            <input
              id="inspectionDate"
              type="date"
              value={inspectionDate}
              onChange={(e) => {
                setInspectionDate(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
              required
            />
          </div>

          <div>
            <label htmlFor="weather" className="block text-sm font-medium text-gray-700 mb-2">
              天候 <span className="text-red-500">*</span>
            </label>
            <select
              id="weather"
              value={weather}
              onChange={(e) => {
                setWeather(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xl appearance-none bg-white"
              style={{ fontSize: '18px' }}
              required
            >
              <option value="">選択してください</option>
              <option value="晴れ">晴れ</option>
              <option value="曇り">曇り</option>
              <option value="雨">雨</option>
              <option value="雪">雪</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 border-2 border-slate-600 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 hover:text-white hover:border-slate-700 transition-all"
            >
              戻る
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-md flex flex-col items-center justify-center"
            >
              <span className="text-sm">次へ</span>
              <span className="text-xs opacity-80">（定形写真撮影）</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DateWeatherInputPage;
