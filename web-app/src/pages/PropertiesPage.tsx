import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadData, updateData, logout } from '../storage/localStorage';
import { generateId } from '../utils/helpers';
import type { Property } from '../types';

const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyAddress, setNewPropertyAddress] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const data = loadData();
    if (!data.currentUser) {
      navigate('/');
      return;
    }
    setProperties(data.properties);
  }, [navigate]);

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    const newProperty: Property = {
      id: generateId(),
      name: newPropertyName,
      address: newPropertyAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedProperties = [...properties, newProperty];
    setProperties(updatedProperties);
    updateData('properties', updatedProperties);

    setNewPropertyName('');
    setNewPropertyAddress('');
    setShowAddModal(false);
  };

  const handleDeleteProperty = (id: string) => {
    if (window.confirm('この物件を削除してもよろしいですか？')) {
      const updatedProperties = properties.filter((p) => p.id !== id);
      setProperties(updatedProperties);
      updateData('properties', updatedProperties);

      // 関連データも削除
      const data = loadData();
      data.floors = data.floors.filter((f) => f.propertyId !== id);
      data.referenceImages = data.referenceImages.filter((r) => r.propertyId !== id);
      updateData('floors', data.floors);
      updateData('referenceImages', data.referenceImages);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー - 統一スタイル */}
      <header className="bg-gray-800 text-white shadow flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="w-12"></div>
          <h1 className="text-sm font-bold whitespace-nowrap">物件一覧</h1>
          <button
            onClick={handleLogout}
            className="px-2 py-1 border border-white text-white rounded text-xs font-medium hover:bg-white hover:text-slate-900 transition-all whitespace-nowrap"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* 新規追加ボタン - シンプルで業務的 */}
        <div className="mb-10 animate-fade-in-up delay-200">
          <button
            onClick={() => setShowAddModal(true)}
            className="group bg-emerald-600 text-white px-10 py-4 rounded-xl
              font-sans font-bold uppercase tracking-widest text-sm
              hover:bg-emerald-700
              transition-all duration-300 ease-out
              shadow-lg shadow-emerald-600/20 hover:shadow-xl
              transform hover:scale-105 active:scale-95
              inline-flex items-center gap-3"
          >
            <svg className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            新規物件追加
          </button>
        </div>

        {/* 物件カードグリッド - 個性的なカードデザイン */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property, index) => (
            <div
              key={property.id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl
                transition-all duration-300 ease-out overflow-hidden
                border-l-4 border-emerald-500
                transform hover:-translate-y-2 hover:scale-[1.02]
                animate-fade-in-up"
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              {/* カードヘッダー - serif見出し */}
              <div className="bg-gradient-to-br from-stone-50 to-amber-50 p-5 border-b-2 border-amber-200/50">
                <h3 className="font-sans text-2xl font-bold text-slate-800 tracking-tight group-hover:text-emerald-600 transition-colors duration-300">
                  {property.name}
                </h3>
              </div>

              {/* カード本文 */}
              <div className="p-6 space-y-4">
                {/* 住所 - mono */}
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="font-mono text-sm text-slate-600 leading-relaxed">{property.address}</p>
                </div>

                {/* 作成日 - sans */}
                <div className="flex items-center gap-2 font-sans text-xs text-slate-500 uppercase tracking-wider">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(property.createdAt).toLocaleDateString('ja-JP')}
                </div>

                {/* アクションボタン */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => navigate(`/properties/${property.id}`)}
                    className="flex-1 bg-emerald-600 text-white px-5 py-3 rounded-xl
                      font-sans font-bold uppercase tracking-wider text-xs
                      hover:bg-emerald-700
                      transition-all duration-300 ease-out
                      shadow-md hover:shadow-lg
                      transform hover:scale-105 active:scale-95"
                  >
                    詳細
                  </button>
                  <button
                    onClick={() => handleDeleteProperty(property.id)}
                    className="px-5 py-3 border-2 border-red-600 text-red-600 rounded-xl
                      font-sans font-medium text-xs uppercase tracking-wider
                      hover:bg-red-600 hover:text-white
                      transition-all duration-300 ease-out
                      transform hover:scale-105 active:scale-95"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 空状態 - モダンな表示 */}
        {properties.length === 0 && (
          <div className="text-center py-24 animate-fade-in-up delay-300">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 mb-6">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="font-sans text-2xl font-bold text-slate-700 mb-2">物件が登録されていません</p>
            <p className="font-mono text-sm text-slate-500 tracking-wide">新規物件を追加してください</p>
          </div>
        )}
      </main>

      {/* 新規物件追加モーダル - エレガントなデザイン */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-10 max-w-lg w-full shadow-2xl border-l-4 border-emerald-500 transform transition-all animate-fade-in-up">
            <h2 className="font-sans text-3xl font-bold mb-8 text-slate-800 tracking-tight">新規物件追加</h2>
            <form onSubmit={handleAddProperty} className="space-y-6">
              <div>
                <label className="block font-sans text-xs uppercase tracking-widest text-slate-600 mb-3 font-medium">
                  物件名 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPropertyName}
                  onChange={(e) => setNewPropertyName(e.target.value)}
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl
                    font-mono text-sm text-slate-700
                    focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400
                    hover:border-slate-300
                    transition-all duration-300 ease-out"
                  placeholder="例: サンプルマンション"
                  required
                />
              </div>
              <div>
                <label className="block font-sans text-xs uppercase tracking-widest text-slate-600 mb-3 font-medium">
                  住所 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPropertyAddress}
                  onChange={(e) => setNewPropertyAddress(e.target.value)}
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl
                    font-mono text-sm text-slate-700
                    focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400
                    hover:border-slate-300
                    transition-all duration-300 ease-out"
                  placeholder="例: 東京都渋谷区..."
                  required
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-xl
                    font-sans font-bold uppercase tracking-wider text-sm
                    hover:bg-emerald-700
                    transition-all duration-300 ease-out
                    shadow-lg hover:shadow-xl
                    transform hover:scale-105 active:scale-95"
                >
                  追加
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewPropertyName('');
                    setNewPropertyAddress('');
                  }}
                  className="flex-1 border-2 border-slate-600 text-slate-600 py-4 rounded-xl
                    font-sans font-medium uppercase tracking-wider text-sm
                    hover:bg-slate-700 hover:text-white hover:border-slate-700
                    transition-all duration-300 ease-out
                    transform hover:scale-105 active:scale-95"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPage;
