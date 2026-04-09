# 🛒 TokoTrack — Aplikasi Pencatatan Barang

Aplikasi pencatatan pengeluaran barang, harga modal, harga jual, perhitungan untung/rugi, dan rekap mingguan, bulanan, tahunan.

**Stack:** React + Vite · TailwindCSS · Supabase · Recharts · Vercel

---

## 🚀 Cara Deploy (5 Langkah)

### 1. Setup Supabase

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Buat project baru (simpan password database)
3. Buka **SQL Editor** → paste isi file `supabase_schema.sql` → klik **Run**
4. Buka **Project Settings → API**:
   - Salin **Project URL** (contoh: `https://abcd1234.supabase.co`)
   - Salin **anon public key**

### 2. Clone & Install

```bash
git clone <repo-url>
cd toko-app
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Jalankan Lokal

```bash
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173)

### 5. Deploy ke Vercel

**Cara A — via Vercel CLI:**
```bash
npm install -g vercel
vercel
```
Saat ditanya environment variables, masukkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.

**Cara B — via GitHub:**
1. Push project ke GitHub
2. Buka [vercel.com](https://vercel.com) → **New Project** → Import repo
3. Di bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Klik **Deploy**

---

## 📱 Fitur

| Fitur | Keterangan |
|-------|------------|
| Catat Barang | Input nama, tanggal, qty, harga modal & jual per unit |
| Preview Kalkulasi | Otomatis hitung laba/rugi saat mengisi form |
| Daftar Transaksi | Tabel lengkap dengan filter, search, dan sort |
| Rekap Mingguan | Grafik & tabel 7 hari terakhir |
| Rekap Bulanan | Grafik & tabel per bulan pilihan |
| Rekap Tahunan | Grafik & tabel per bulan dalam setahun |
| Rekap per Kategori | Breakdown untung/rugi per kategori barang |
| Pembayaran & DP | Dukungan pembayaran parsial (DP), hitung kekurangan, dan pelunasan cepat |
| Kelola Kategori | Manajemen kategori dinamis (CRUD) dengan proteksi data (mencegah hapus kategori yang digunakan) |
| Fallback LocalStorage | Otomatis pakai localStorage jika Supabase belum dikonfigurasi |

---

## 🗂 Struktur Project

```
toko-app/
├── src/
│   ├── components/
│   │   ├── CatatBarang.jsx     # Form input barang & pembayaran
│   │   ├── DaftarTransaksi.jsx # Tabel semua transaksi & update pembayaran
│   │   ├── KelolaKategori.jsx  # Manajemen kategori dinamis
│   │   └── Rekap.jsx           # Rekap & grafik (termasuk total bayar/kurang)
│   ├── hooks/
│   │   ├── useTransactions.js  # Logic transaksi (Supabase + localStorage)
│   │   └── useCategories.js    # Logic kategori (Supabase + localStorage)
│   ├── lib/
│   │   ├── supabase.js         # Supabase client
│   │   └── utils.js            # Format & kalkulasi
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase_schema.sql         # SQL untuk setup database
├── .env.example
├── vercel.json
└── package.json
```

---

## ⚙️ Tanpa Supabase

Jika tidak ingin menggunakan Supabase, aplikasi tetap berjalan dengan **localStorage** sebagai penyimpanan. Data akan tersimpan di browser (tidak bisa diakses dari perangkat lain).

---

## 🔒 Catatan Keamanan

File `.env.local` **jangan** di-push ke GitHub. Pastikan `.gitignore` sudah berisi:
```
.env.local
.env
```
