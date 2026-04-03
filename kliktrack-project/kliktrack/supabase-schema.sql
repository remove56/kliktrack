-- ============================================
-- KlikTrack Database Schema
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================

-- Tabel untuk menyimpan link tracking
CREATE TABLE links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(20) UNIQUE NOT NULL,
  url TEXT NOT NULL,
  label VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk menyimpan data klik
CREATE TABLE clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  ip_address VARCHAR(50),
  user_agent TEXT,
  referer TEXT,
  device VARCHAR(20) DEFAULT 'desktop',
  browser VARCHAR(20) DEFAULT 'other',
  country VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX idx_clicks_link_id ON clicks(link_id);
CREATE INDEX idx_clicks_created_at ON clicks(created_at);
CREATE INDEX idx_links_slug ON links(slug);

-- Enable Row Level Security (tapi allow semua untuk sekarang)
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- Policy: allow semua operasi (untuk dashboard pribadi)
-- PENTING: Kalau mau lebih aman, tambahkan auth nanti
CREATE POLICY "Allow all on links" ON links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clicks" ON clicks FOR ALL USING (true) WITH CHECK (true);
