'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

const COLORS = ['#6366f1', '#22d3ee', '#f472b6', '#facc15', '#34d399', '#fb923c', '#a78bfa'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[rgba(15,15,30,0.95)] border border-indigo-500/30 rounded-xl px-4 py-2 backdrop-blur-sm">
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-slate-200 text-base font-bold mt-1">
          {payload[0].value.toLocaleString()} klik
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('daily');
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  const [exporting, setExporting] = useState(false);
  const [days, setDays] = useState(7);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    fetchData();
  }, []);

  useEffect(() => {
    if (baseUrl) fetchStats();
  }, [days]);

  const fetchData = async () => {
    try {
      const [linksRes, statsRes] = await Promise.all([
        fetch('/api/links'),
        fetch(`/api/stats?days=${days}`),
      ]);
      const linksData = await linksRes.json();
      const statsData = await statsRes.json();
      setLinks(linksData.links || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/stats?days=${days}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const createLink = async () => {
    if (!newUrl || !newLabel) return;
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, label: newLabel }),
      });
      const data = await res.json();
      if (data.link) {
        setLinks(prev => [{ ...data.link, clicks: 0 }, ...prev]);
        setNewUrl('');
        setNewLabel('');
        setShowAdd(false);
      }
    } catch (err) {
      console.error('Failed to create:', err);
    }
  };

  const deleteLink = async (id) => {
    if (!confirm('Hapus link ini?')) return;
    try {
      await fetch('/api/links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setLinks(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const copyLink = (slug) => {
    navigator.clipboard.writeText(`${baseUrl}/r/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/export?days=${days}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kliktrack-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const logout = () => {
    document.cookie = 'kliktrack_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-mono text-sm">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xl">📊</div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-slate-200 to-indigo-400 bg-clip-text text-transparent">KlikTrack</h1>
          </div>
          <p className="text-slate-600 text-sm mt-1 ml-[52px]">Dashboard Analitik Klik</p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          {/* Period Selector */}
          <div className="flex gap-1 bg-[rgba(15,15,30,0.6)] rounded-lg p-1">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${days === d ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}>
                {d}h
              </button>
            ))}
          </div>
          {/* Export */}
          <button onClick={exportCSV} disabled={exporting}
            className="bg-[rgba(30,30,60,0.8)] border border-indigo-500/20 text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-500/20 transition-colors flex items-center gap-2 disabled:opacity-50">
            {exporting ? '⏳' : '📥'} Export CSV
          </button>
          {/* Add Link */}
          <button onClick={() => setShowAdd(!showAdd)}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform">
            <span className="text-lg">+</span> Tambah Link
          </button>
          {/* Logout */}
          <button onClick={logout}
            className="text-slate-500 hover:text-slate-300 text-xs px-2 py-2 transition-colors" title="Logout">
            🔒
          </button>
        </div>
      </div>

      {/* Add Link Panel */}
      {showAdd && (
        <div className="bg-[rgba(30,30,60,0.9)] border border-indigo-500/20 rounded-2xl p-6 mb-6 flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-slate-400 text-xs block mb-1.5">Label</label>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Contoh: YouTube Channel"
              className="w-full bg-[rgba(15,15,30,0.8)] border border-indigo-500/20 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none focus:border-indigo-500/50" />
          </div>
          <div className="flex-[2] min-w-[300px]">
            <label className="text-slate-400 text-xs block mb-1.5">URL Tujuan</label>
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://youtube.com/@channel-kamu"
              className="w-full bg-[rgba(15,15,30,0.8)] border border-indigo-500/20 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none focus:border-indigo-500/50" />
          </div>
          <button onClick={createLink}
            className="bg-cyan-400 text-slate-900 px-6 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap hover:bg-cyan-300 transition-colors">
            Buat Link
          </button>
        </div>
      )}

      {/* UTM Info Box */}
      {showAdd && (
        <div className="bg-[rgba(20,20,45,0.6)] border border-cyan-500/10 rounded-xl p-4 mb-6 text-xs text-slate-400">
          <p className="font-semibold text-cyan-300 mb-1">💡 Tips UTM Tracking</p>
          <p>Tambahkan parameter UTM ke tracking link untuk mengetahui sumber traffic:</p>
          <code className="block mt-2 bg-[rgba(15,15,30,0.8)] p-2 rounded text-indigo-300 break-all">
            {baseUrl}/r/slug?utm_source=instagram&utm_medium=bio&utm_campaign=promo
          </code>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: 'TOTAL KLIK', value: stats?.totalClicks || 0, accent: '#6366f1' },
          { label: 'HARI INI', value: stats?.todayClicks || 0, accent: '#22d3ee' },
          { label: 'RATA-RATA/HARI', value: stats?.avgClicks || 0, accent: '#f472b6' },
          { label: 'LINK AKTIF', value: links.length, accent: '#34d399' },
        ].map((s, i) => (
          <div key={i} className="bg-[rgba(30,30,60,0.8)] border border-indigo-500/15 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full" style={{ background: `radial-gradient(circle, ${s.accent}22, transparent)` }} />
            <p className="text-slate-500 text-xs tracking-wider font-mono">{s.label}</p>
            <p className="text-slate-100 text-3xl font-extrabold mt-2">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="flex gap-5 flex-wrap mb-7">
        <div className="flex-[2] min-w-[400px] bg-[rgba(30,30,60,0.8)] border border-indigo-500/15 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold">Grafik Klik</h3>
            <div className="flex gap-1 bg-[rgba(15,15,30,0.6)] rounded-lg p-0.5">
              {['daily', 'hourly'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === t ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}>
                  {t === 'daily' ? 'Harian' : 'Per Jam'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={activeTab === 'daily' ? (stats?.daily || []) : (stats?.hourly || [])}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey={activeTab === 'daily' ? 'day' : 'hour'} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} interval={activeTab === 'hourly' ? 3 : 0} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2.5} fill="url(#grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 min-w-[260px] bg-[rgba(30,30,60,0.8)] border border-indigo-500/15 rounded-2xl p-6">
          <h3 className="text-base font-bold mb-4">Device</h3>
          {stats?.devices?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={stats.devices} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {stats.devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-3">
                {stats.devices.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-slate-400">{d.icon} {d.name}</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-slate-200">
                      {Math.round(d.value / stats.devices.reduce((a, b) => a + b.value, 0) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm mt-10 text-center">Belum ada data</p>
          )}
        </div>
      </div>

      {/* Location & UTM Row */}
      <div className="flex gap-5 flex-wrap mb-7">
        {/* Country */}
        <div className="flex-1 min-w-[300px] bg-[rgba(30,30,60,0.8)] border border-indigo-500/15 rounded-2xl p-6">
          <h3 className="text-base font-bold mb-5">🌍 Lokasi Pengunjung</h3>
          {stats?.countries?.length > 0 ? (
            <div className="flex flex-col gap-4">
              {stats.countries.map((c, i) => {
                const total = stats.countries.reduce((a, b) => a + b.value, 0);
                const pct = Math.round(c.value / total * 100);
                return (
                  <div key={c.name}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-slate-300">{c.flag || '🌍'} {c.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{c.value.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-indigo-500/10 rounded-full">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}88)` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm mt-10 text-center">Belum ada data</p>
          )}

          {/* Cities */}
          {stats?.cities?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-indigo-500/10">
              <h4 className="text-sm font-semibold text-slate-400 mb-3">🏙️ Kota</h4>
              <div className="flex flex-wrap gap-2">
                {stats.cities.map(c => (
                  <span key={c.name} className="bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-lg text-xs font-medium">
                    {c.name} ({c.value})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* UTM Sources */}
        <div className="flex-1 min-w-[300px] bg-[rgba(30,30,60,0.8)] border border-indigo-500/15 rounded-2xl p-6">
          <h3 className="text-base font-bold mb-5">📊 UTM Tracking</h3>
          {stats?.utmSources?.length > 0 ? (
            <>
              <h4 className="text-sm font-semibold text-slate-400 mb-3">Sources</h4>
              <ResponsiveContainer width="100%" height={Math.max(120, stats.utmSources.length * 35)}>
                <BarChart data={stats.utmSources} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {stats?.utmMediums?.length > 0 && (
                <div className="mt-5 pt-4 border-t border-indigo-500/10">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">Mediums</h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.utmMediums.map(m => (
                      <span key={m.name} className="bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-lg text-xs font-medium">
                        {m.name} ({m.value})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {stats?.utmCampaigns?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-indigo-500/10">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">Campaigns</h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.utmCampaigns.map(c => (
                      <span key={c.name} className="bg-pink-500/10 text-pink-300 px-3 py-1 rounded-lg text-xs font-medium">
                        {c.name} ({c.value})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-slate-500 text-sm">Belum ada data UTM.</p>
              <p className="text-slate-600 text-xs mt-1">Tambahkan ?utm_source=... ke tracking link</p>
            </div>
          )}
        </div>
      </div>

      {/* Link List */}
      <div className="bg-[rgba(30,30,60,0.8)] border border-indigo-500/15 rounded-2xl p-6 mb-7">
        <h3 className="text-base font-bold mb-5">🔗 Link Tracking</h3>
        {links.length > 0 ? (
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <div key={link.id} className="flex items-center gap-3 p-3 bg-[rgba(15,15,30,0.5)] rounded-xl border border-indigo-500/8 flex-wrap">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: `${COLORS[link.id?.charCodeAt(0) % COLORS.length]}22` }}>🔗</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{link.label}</p>
                  <p className="text-xs text-indigo-400 font-mono truncate">{baseUrl}/r/{link.slug}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-extrabold text-slate-200">{(link.clicks || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">klik</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => copyLink(link.slug)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copied === link.slug ? 'bg-cyan-400/20 border border-cyan-400/30 text-cyan-300' : 'bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/25'}`}>
                    {copied === link.slug ? '✓ Copied' : 'Copy'}
                  </button>
                  <button onClick={() => deleteLink(link.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🔗</p>
            <p className="text-slate-400 text-sm">Belum ada link. Klik "Tambah Link" untuk mulai tracking!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-5">
        <p className="text-slate-700 text-xs font-mono">KlikTrack v2.0 — Deployed on Vercel + Supabase</p>
      </div>
    </div>
  );
}
