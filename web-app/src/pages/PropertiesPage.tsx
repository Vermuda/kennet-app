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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">物件一覧</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            + 新規物件追加
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition duration-200 p-6"
            >
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                {property.name}
              </h3>
              <p className="text-gray-600 mb-4">{property.address}</p>
              <p className="text-sm text-gray-400 mb-4">
                作成日: {new Date(property.createdAt).toLocaleDateString('ja-JP')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/properties/${property.id}`)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  詳細
                </button>
                <button
                  onClick={() => handleDeleteProperty(property.id)}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            物件が登録されていません。新規物件を追加してください。
          </div>
        )}
      </main>

      {/* 新規物件追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">新規物件追加</h2>
            <form onSubmit={handleAddProperty} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  物件名
                </label>
                <input
                  type="text"
                  value={newPropertyName}
                  onChange={(e) => setNewPropertyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  住所
                </label>
                <input
                  type="text"
                  value={newPropertyAddress}
                  onChange={(e) => setNewPropertyAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
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
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400"
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

