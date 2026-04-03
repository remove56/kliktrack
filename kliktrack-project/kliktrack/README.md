# 📊 KlikTrack - Dashboard Analitik Klik

Dashboard analytics untuk tracking semua link yang kamu share. Lihat siapa yang klik, dari mana, pakai device apa, dan kapan.

## 🚀 Cara Setup & Deploy (Step by Step)

### LANGKAH 1: Buat Database di Supabase (GRATIS)

1. Buka **https://supabase.com** → Klik **Start your project** → Login pakai GitHub
2. Klik **New Project** → Isi nama project (contoh: `kliktrack`) → Pilih region **Southeast Asia** → Buat password → Klik **Create**
3. Tunggu sampai project siap (~2 menit)
4. Buka menu **SQL Editor** (icon database di sidebar kiri)
5. Copy-paste SEMUA isi file `supabase-schema.sql` ke editor → Klik **Run**
6. Buka menu **Settings** → **API** → Catat 2 hal ini:
   - **Project URL** (contoh: `https://abcdefg.supabase.co`)
   - **anon public key** (string panjang yang dimulai `eyJ...`)

### LANGKAH 2: Upload ke GitHub

1. Buka **https://github.com** → Login → Klik **New Repository**
2. Nama repo: `kliktrack` → Klik **Create repository**
3. Upload SEMUA file dari folder `kliktrack` ke repo tersebut
   - Cara mudah: klik **uploading an existing file** → drag semua file
   - JANGAN upload file `.env` (yang berisi key asli)

### LANGKAH 3: Deploy ke Vercel (GRATIS)

1. Buka **https://vercel.com** → Login pakai GitHub
2. Klik **Add New** → **Project**
3. Pilih repo `kliktrack` yang baru dibuat → Klik **Import**
4. Di bagian **Environment Variables**, tambahkan 2 variabel:
   - `NEXT_PUBLIC_SUPABASE_URL` → paste Project URL dari Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → paste anon key dari Supabase
5. Klik **Deploy** → Tunggu ~2 menit
6. Selesai! Dashboard kamu live di `https://kliktrack.vercel.app` (atau nama lain)

## 📖 Cara Pakai

1. Buka dashboard kamu di browser
2. Klik **+ Tambah Link** → Isi label dan URL tujuan → Klik **Buat Link**
3. Kamu akan dapat tracking link seperti: `https://kliktrack.vercel.app/r/abc123`
4. Share tracking link tersebut (bukan URL asli) ke sosial media, bio, dll
5. Setiap orang yang klik akan otomatis di-redirect ke URL asli, dan klik-nya tercatat
6. Buka dashboard kapan saja untuk lihat statistik

## 📁 Struktur File

```
kliktrack/
├── app/
│   ├── api/
│   │   ├── links/route.js    ← API kelola link (tambah/hapus/list)
│   │   ├── stats/route.js    ← API data analytics
│   │   └── track/route.js    ← API tracking klik
│   ├── dashboard/page.js     ← Halaman dashboard utama
│   ├── r/[slug]/page.js      ← Handler redirect + tracking
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── lib/
│   └── supabase.js            ← Koneksi ke Supabase
├── supabase-schema.sql        ← SQL untuk setup database
├── .env.example               ← Contoh environment variables
├── package.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## ❓ Troubleshooting

**Dashboard kosong / error?**
→ Pastikan environment variables di Vercel sudah benar. Cek di Vercel → Settings → Environment Variables.

**SQL error saat setup Supabase?**
→ Pastikan copy SEMUA isi file supabase-schema.sql, termasuk bagian policy di bawah.

**Link redirect tidak jalan?**
→ Pastikan URL yang dimasukkan lengkap dengan `https://`

**Mau custom domain?**
→ Di Vercel, buka Settings → Domains → Tambahkan domain kamu
