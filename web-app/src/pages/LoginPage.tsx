import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateUser } from '../storage/localStorage';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = await authenticateUser(username, password);
    if (user) {
      navigate('/properties');
    } else {
      setError('ユーザー名またはパスワードが正しくありません');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md border border-slate-200 animate-fade-in-up">
        {/* ロゴ表示 */}
        <div className="flex justify-center mb-8 animate-fade-in delay-100">
          <img
            src="/logo.jpg"
            alt="検NET株式会社"
            className="h-28 w-auto object-contain rounded-xl"
          />
        </div>

        {/* 見出し */}
        <h1 className="font-sans text-4xl font-bold text-center mb-3 text-slate-800 tracking-tight animate-fade-in delay-200">
          現地チェックシート
        </h1>
        <p className="font-mono text-center text-slate-600 mb-10 text-sm tracking-wider animate-fade-in delay-300">検NET株式会社</p>

        <form onSubmit={handleLogin} className="space-y-6 animate-slide-in-right delay-400">
          <div>
            <label htmlFor="username" className="block font-sans text-sm font-medium text-slate-700 mb-2">
              ユーザーID
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 font-mono text-sm
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                transition-all duration-300 ease-out
                hover:border-slate-400"
              placeholder="user_id_here"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-sans text-sm font-medium text-slate-700 mb-2">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 font-mono text-sm
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                transition-all duration-300 ease-out
                hover:border-slate-400"
              placeholder="••••••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-sans text-sm animate-fade-in">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-4 rounded-xl
              font-sans font-bold uppercase tracking-wider text-sm
              hover:bg-emerald-700
              transition-all duration-300 ease-out
              shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-700/40
              transform hover:scale-105 active:scale-95"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

