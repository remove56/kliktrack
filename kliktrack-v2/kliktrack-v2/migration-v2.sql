-- ============================================
-- KlikTrack v2 - Database Migration
-- Jalankan SQL ini di Supabase SQL Editor
-- (untuk update dari v1 ke v2)
-- ============================================

-- Tambah kolom geo-location
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- Tambah kolom UTM tracking
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS utm_source VARCHAR(200);
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(200);
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(200);
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS utm_content VARCHAR(200);
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS utm_term VARCHAR(200);

-- Index untuk UTM queries
CREATE INDEX IF NOT EXISTS idx_clicks_utm_source ON clicks(utm_source);
CREATE INDEX IF NOT EXISTS idx_clicks_country ON clicks(country);
