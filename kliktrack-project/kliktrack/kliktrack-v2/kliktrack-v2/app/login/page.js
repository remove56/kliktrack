'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    window.location.href = `/dashboard?pw=${encodeURIComponent(password)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl mx-auto mb-4">
            📊
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-slate-200 to-indigo-400 bg-clip-text text-transparent">
            KlikTrack
          </h1>
          <p className="text-slate-500 text-sm mt-2">Masukkan password untuk akses dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-[rgba(30,30,60,0.8)] border border-indigo-500/15 rounded-2xl p-6">
            <label className="text-slate-400 text-xs block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password..."
              className="w-full bg-[rgba(15,15,30,0.8)] border border-indigo-500/20 rounded-lg px-4 py-3 text-slate-200 text-sm outline-none focus:border-indigo-500/50 mb-4"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-xs mb-3">Password salah. Coba lagi.</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
