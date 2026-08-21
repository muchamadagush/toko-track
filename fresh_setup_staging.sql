-- =============================================
-- RESET & FRESH SETUP STAGING DATABASE (DDL + DATA PRODUKSI)
-- Jalankan seluruh script ini di Supabase SQL Editor
-- =============================================

BEGIN;

-- =============================================
-- 0. HAPUS TABEL DAN VIEW LAMA (CLEAN RESET)
-- =============================================
DROP VIEW IF EXISTS public.transactions_view CASCADE;
DROP VIEW IF EXISTS public.categories_view CASCADE;
DROP TRIGGER IF EXISTS trg_populate_transaction_modal ON public.transactions CASCADE;
DROP FUNCTION IF EXISTS populate_transaction_modal() CASCADE;

DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;

-- =============================================
-- 1. PEMBUATAN SKEMA DATABASE BARU (DDL)
-- =============================================
-- =============================================
-- TS Clothing — Supabase Database Setup
-- Jalankan script ini di Supabase SQL Editor
-- =============================================

-- Buat tabel stores (Toko)
CREATE TABLE IF NOT EXISTS public.stores (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text         NOT NULL,
  address     text,
  phone       text,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Buat tabel branches (Cabang)
CREATE TABLE IF NOT EXISTS public.branches (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    uuid         NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name        text         NOT NULL,
  address     text,
  phone       text,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Buat tabel profiles (Profil Pengguna)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id    uuid         REFERENCES public.stores(id) ON DELETE SET NULL,
  branch_id   uuid         REFERENCES public.branches(id) ON DELETE SET NULL,
  role        text         NOT NULL DEFAULT 'owner', -- 'superadmin', 'owner', 'manager', 'cashier'
  email       text,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Buat tabel transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            uuid        REFERENCES public.stores(id) ON DELETE SET NULL,
  branch_id           uuid        REFERENCES public.branches(id) ON DELETE SET NULL,
  nama                text        NOT NULL,
  tanggal             date        NOT NULL,
  jumlah              numeric     NOT NULL CHECK (jumlah > 0),
  modal               numeric     NOT NULL CHECK (modal >= 0),
  jual                numeric     NOT NULL CHECK (jual >= 0),
  kategori            text        NOT NULL DEFAULT 'Lainnya',
  catatan             text,
  nama_pembeli        text,
  status_pesanan      text        NOT NULL DEFAULT 'Lunas',
  deadline            date,
  bahan_model         text,
  jenis               text,
  batch_id            text,
  modal_lain          text,
  modal_lain_nominal  numeric     NOT NULL DEFAULT 0,
  uang_dibayarkan     numeric     NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Buat tabel expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    uuid         REFERENCES public.stores(id) ON DELETE SET NULL,
  branch_id   uuid         REFERENCES public.branches(id) ON DELETE SET NULL,
  tanggal     date         NOT NULL,
  nominal     numeric      NOT NULL CHECK (nominal > 0),
  keterangan  text         NOT NULL,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Buat tabel Categories (Dinamis)
CREATE TABLE IF NOT EXISTS public.categories (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            uuid         REFERENCES public.stores(id) ON DELETE SET NULL,
  name                text         NOT NULL,
  modal               numeric      NOT NULL DEFAULT 0,
  modal_lain          text,
  modal_lain_nominal  numeric      NOT NULL DEFAULT 0,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (store_id, name)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_transactions_tanggal   ON public.transactions (tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_kategori  ON public.transactions (kategori);
CREATE INDEX IF NOT EXISTS idx_transactions_status    ON public.transactions (status_pesanan);
CREATE INDEX IF NOT EXISTS idx_transactions_deadline  ON public.transactions (deadline);
CREATE INDEX IF NOT EXISTS idx_expenses_tanggal       ON public.expenses (tanggal DESC);

-- Row Level Security (RLS)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 1. Policies untuk profiles
DROP POLICY IF EXISTS "Allow read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow delete profile for owner" ON public.profiles;

CREATE POLICY "Allow read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = id
  OR (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    AND store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "Allow update own profile" ON public.profiles FOR UPDATE TO authenticated 
USING (
  auth.uid() = id 
  OR (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    AND store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  auth.uid() = id 
  OR (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    AND (
      store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
      OR store_id IS NULL
    )
  )
);
CREATE POLICY "Allow delete profile for owner" ON public.profiles FOR DELETE TO authenticated USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
  AND store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
);


-- 2. Policies untuk stores
DROP POLICY IF EXISTS "Allow select stores" ON public.stores;
DROP POLICY IF EXISTS "Allow insert stores" ON public.stores;
DROP POLICY IF EXISTS "Allow update stores" ON public.stores;

CREATE POLICY "Allow select stores" ON public.stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert stores" ON public.stores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update stores" ON public.stores FOR UPDATE TO authenticated USING (
  id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
);


-- 3. Policies untuk branches
DROP POLICY IF EXISTS "Allow select branches" ON public.branches;
DROP POLICY IF EXISTS "Allow insert branches" ON public.branches;
DROP POLICY IF EXISTS "Allow update/delete branches" ON public.branches;

CREATE POLICY "Allow select branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert branches" ON public.branches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update/delete branches" ON public.branches FOR ALL TO authenticated USING (
  store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
);


-- 4. Policies untuk transactions
DROP POLICY IF EXISTS "Allow select transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow write transactions" ON public.transactions;

CREATE POLICY "Allow select transactions" ON public.transactions FOR SELECT TO authenticated USING (
  store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('owner', 'manager')
    OR branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "Allow write transactions" ON public.transactions FOR ALL TO authenticated USING (
  store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('owner', 'manager')
    OR branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
  OR (
    kategori = 'Lainnya'
    AND modal = 0 
    AND modal_lain_nominal = 0 
    AND (modal_lain IS NULL OR modal_lain = '')
  )
);


-- 5. Policies untuk expenses
DROP POLICY IF EXISTS "Allow select expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow write expenses" ON public.expenses;

CREATE POLICY "Allow select expenses" ON public.expenses FOR SELECT TO authenticated USING (
  store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('owner', 'manager')
    OR branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "Allow write expenses" ON public.expenses FOR ALL TO authenticated USING (
  store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('owner', 'manager')
    OR branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
  )
);


-- 6. Policies untuk categories
DROP POLICY IF EXISTS "Allow select categories" ON public.categories;
DROP POLICY IF EXISTS "Allow write categories" ON public.categories;

CREATE POLICY "Allow select categories" ON public.categories FOR SELECT TO authenticated USING (
  store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Allow write categories" ON public.categories FOR ALL TO authenticated USING (
  store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
);


-- 7. Database View untuk Transaksi (Menyembunyikan kategori & modal dari non-owner)
CREATE OR REPLACE VIEW public.transactions_view AS
SELECT 
  id, store_id, branch_id, nama, tanggal, jumlah, jual, catatan, nama_pembeli, status_pesanan, deadline, bahan_model, jenis, batch_id, uang_dibayarkan, created_at,
  CASE 
    WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN kategori 
    ELSE 'Lainnya' 
  END AS kategori,
  CASE 
    WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN modal 
    ELSE 0 
  END AS modal,
  CASE 
    WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN modal_lain 
    ELSE NULL 
  END AS modal_lain,
  CASE 
    WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN modal_lain_nominal 
    ELSE 0 
  END AS modal_lain_nominal
FROM public.transactions;


-- 8. Database View untuk Kategori (Menyembunyikan modal dari non-owner)
CREATE OR REPLACE VIEW public.categories_view AS
SELECT 
  id, store_id, name, created_at,
  CASE 
    WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN modal 
    ELSE 0 
  END AS modal,
  CASE 
    WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN modal_lain 
    ELSE NULL 
  END AS modal_lain,
  CASE 
    WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN modal_lain_nominal 
    ELSE 0 
  END AS modal_lain_nominal
FROM public.categories;


-- 9. Trigger untuk mengisi modal otomatis berdasarkan kategori
CREATE OR REPLACE FUNCTION populate_transaction_modal()
RETURNS TRIGGER AS $$
BEGIN
  -- Ambil nilai modal dari tabel categories
  SELECT modal, modal_lain, modal_lain_nominal
  INTO NEW.modal, NEW.modal_lain, NEW.modal_lain_nominal
  FROM public.categories
  WHERE store_id = NEW.store_id AND name = NEW.kategori
  LIMIT 1;

  -- Fallback jika tidak ditemukan
  IF NEW.modal IS NULL THEN
    NEW.modal := 0;
  END IF;
  IF NEW.modal_lain_nominal IS NULL THEN
    NEW.modal_lain_nominal := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_populate_transaction_modal ON public.transactions;
CREATE TRIGGER trg_populate_transaction_modal
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION populate_transaction_modal();

-- =============================================
-- Migration Helper / ALTER queries (Jika tabel sudah ada)
-- =============================================
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;
-- ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;
-- ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;
-- ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;



-- =============================================
-- 2. IMPORT DATA PRODUKSI ADAPTIF (DML)
-- =============================================
-- 1. Buat Toko & Cabang Utama jika belum ada
INSERT INTO public.stores (id, name, address, phone) VALUES ('00000000-0000-0000-0000-000000000001', 'TS Clothing (Pusat)', 'Alamat Default', '-') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.branches (id, store_id, name, address, phone) VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Pusat', 'Alamat Default', '-') ON CONFLICT (id) DO NOTHING;

-- 1.5. KONEKSI USER (BACA CATATAN DI BAWAH)
-- Karena Supabase Auth (GoTrue) sangat ketat terhadap skema enkripsi password di auth.users,
-- cara terbaik untuk login adalah:
--   1. Daftar/Sign Up secara normal lewat halaman registrasi aplikasi (misal: dengan email Anda).
--   2. Jalankan query berikut di SQL Editor untuk menautkan akun baru Anda ke data migrasi:
--
      UPDATE public.profiles
      SET 
        store_id = '00000000-0000-0000-0000-000000000001',
        branch_id = '00000000-0000-0000-0000-000000000002',
        role = 'owner'
      WHERE id = (SELECT id FROM auth.users WHERE email = 'tsgrupcompany@gmail.com');
--
-- 2. Daftarkan semua user terdaftar ke profiles sebagai owner toko default
INSERT INTO public.profiles (id, store_id, branch_id, role, email) SELECT id, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'owner', email FROM auth.users ON CONFLICT (id) DO NOTHING;

-- 3. Masukkan Data Kategori
INSERT INTO "public"."categories" ("id", "store_id", "name", "modal", "modal_lain", "modal_lain_nominal", "created_at") VALUES
('2feb556e-15e3-48cf-af44-88ebf7a5c17a', '00000000-0000-0000-0000-000000000001', 'SABLON', 0, NULL, 0, '2026-04-30 00:36:52.424105+00'),
('42fd5df7-288e-4513-8623-c8b1dd103e69', '00000000-0000-0000-0000-000000000001', 'Id Card', 0, NULL, 0, '2026-04-09 09:39:56.528727+00'),
('4aa8d0a8-16b5-4259-861b-334d18df082a', '00000000-0000-0000-0000-000000000001', 'TOPI BORDIR', 0, NULL, 0, '2026-06-30 16:31:29.46732+00'),
('67d3dc25-718c-4b7b-bffb-f98ff2ff5328', '00000000-0000-0000-0000-000000000001', 'Lanyard', 0, NULL, 0, '2026-04-09 09:39:52.186137+00'),
('778dc255-aaae-4dd2-b50c-83e75ed155fe', '00000000-0000-0000-0000-000000000001', 'VEST / ROMPI', 0, NULL, 0, '2026-07-02 10:45:54.804544+00'),
('a7a1eb09-e778-4338-96be-033951eba466', '00000000-0000-0000-0000-000000000001', 'Kaos', 0, NULL, 0, '2026-04-09 09:39:47.027816+00'),
('a8af827b-d1ef-43f7-b4d0-5764e8795a8f', '00000000-0000-0000-0000-000000000001', 'Lanyard Set Card', 0, NULL, 0, '2026-04-09 09:40:02.504461+00'),
('d415212b-32ea-4f19-adcf-25ba0b064718', '00000000-0000-0000-0000-000000000001', 'Kemeja Bordir', 0, NULL, 0, '2026-04-09 09:40:08.113124+00'),
('f8fefd03-55c0-48f4-9855-00aec8466d4b', '00000000-0000-0000-0000-000000000001', 'JERSEY', 0, NULL, 0, '2026-05-11 04:53:18.154367+00');

-- 4. Masukkan Data Pengeluaran
INSERT INTO "public"."expenses" ("id", "store_id", "branch_id", "tanggal", "nominal", "keterangan", "created_at") VALUES
('0d97cf58-4499-44a2-b6e9-2866bc1e36c8', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2026-07-04', 100000, 'Bensin Pertamax 03.07', '2026-07-04 05:57:09.278183+00'),
('1c6b3fb8-6231-4085-b66d-e9a32af5818b', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2026-04-12', 75000, 'BENSIN', '2026-04-13 09:34:58.564099+00'),
('30b5147b-902b-47c4-adf7-1766ebe6562a', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2026-04-20', 310000, 'Listrik', '2026-04-20 09:09:18.076965+00'),
('74f3be94-64b8-418f-a183-c5b3172ed785', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2026-07-04', 100000, 'LISTRIK TOKO JBG', '2026-07-04 05:56:45.379365+00'),
('a11ba57a-949d-4b2d-a86b-eaa488fb931b', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2026-04-20', 85000, 'Bensin', '2026-04-20 09:09:42.568284+00'),
('b1d11cff-3b76-4d4c-9374-be22d4580683', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2026-07-04', 800000, 'TOKO JBG JUNI', '2026-07-04 05:56:25.894908+00'),
('fa3ee0ec-f5c3-4991-aa05-f2be64ae0917', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2026-04-20', 310000, 'WIFI', '2026-04-20 09:09:23.976718+00');

-- 5. Masukkan Data Transaksi
INSERT INTO "public"."transactions" ("id", "store_id", "branch_id", "nama", "tanggal", "jumlah", "modal", "jual", "kategori", "catatan", "nama_pembeli", "status_pesanan", "deadline", "bahan_model", "modal_lain", "modal_lain_nominal", "uang_dibayarkan", "created_at", "jenis", "batch_id") VALUES
('06149442-eaa2-45ee-86c5-eba314f8a128', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD SET SMP 1 SUMBERGEMPOL', '2026-07-12', '9', '1500', '5000', 'Lanyard Set Card', '', 'SALMA SMPN 1 SUMBERGEMPOL', 'Belum Bayar', '2026-07-14', 'TISU PVC', '', '0', '0', '2026-07-12 15:08:28.07276+00', 'ID CARD', 'mrhxhls5imq85'),
('0bd4e7d6-1dc5-419b-8ee1-a0b36a8dba35', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'JERSEY PASKAB JOMBANG', '2026-07-12', '6', '10000', '10000', 'JERSEY', 'RIB + KRAH POLO', 'DESTI SMKN 2 JOMBANG', 'DP / Belum Lunas', '2026-07-20', 'EMBOS 200 GSM', '', '0', '0', '2026-07-12 15:39:01.705915+00', 'XXXL', 'mrhykvrko4u44'),
('119a25f1-3e10-4189-a8df-92e2bcf74437', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'KAOS GATHERING', '2026-05-11', '81', '46000', '63000', 'Kaos', '', 'MAS FERY TRAVEL', 'Lunas', '2026-05-13', '24s', '', '0', '5103000', '2026-05-11 06:35:11.808288+00', 'Lengan Panjang', 'mp0tuppmquoas'),
('122fb43e-0ea6-4501-92d1-81dcfc23dda7', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'KAOS POLO', '2026-04-11', '2', '75000', '110000', 'Kaos', 'LACOS CVC', 'SURABAIL', 'DP / Belum Lunas', '2026-04-20', 'POLO KANCING', '', '0', '0', '2026-04-13 09:39:08.954115+00', 'PANJANG', 'mnx03h1w01t23'),
('1871cac9-e3dc-4af1-92bc-92a619e3c4db', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'MERCHANDISE SET SAMARINDA ULU', '2026-06-04', '363', '3500', '15000', 'Kaos', '', 'DIANA TROMUKA 2026', 'Lunas', null, 'Cotton combed 24s', '', '0', '0', '2026-06-04 02:02:10.726378+00', 'LANYARD SET CARD', 'mpyuo1hvrc4ow'),
('1b7ca63f-db7e-42c2-a018-eee56d0cf116', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD SET SMP 1 SUMBERGEMPOL', '2026-07-12', '22', '6000', '16000', 'Lanyard Set Card', '', 'SALMA SMPN 1 SUMBERGEMPOL', 'Belum Bayar', '2026-07-14', 'TISU PVC', '', '0', '0', '2026-07-12 15:08:27.693047+00', 'Lanyard Set Card', 'mrhxhls5imq85'),
('1e8564fc-6598-4cc9-8334-e4253241ba1d', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'JERSEY', '2026-06-30', '20', '50000', '90000', 'JERSEY', 'KRAH V', 'MBEPY', 'Lunas', null, 'EMBOS 170 GSM', '', '0', '1800000', '2026-06-30 16:36:32.521174+00', 'EMBOS 170 GSM V KRAH', 'mr0vcnp4tlg0f'),
('249e91f2-be26-43b4-ae86-6475f323fc1b', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD HOLDER ANAK', '2026-07-02', '65', '5000', '15000', 'Lanyard Set Card', '', 'AL IHYA INTEGRATED SCHOOL', 'Lunas', '2026-07-09', 'TISU PVC', '', '0', '975000', '2026-07-02 10:41:14.309384+00', 'LANYARD HOLDER SIZE ANAK', 'mr3djfpajq7cb'),
('2d77b6d4-9aab-4a6d-b8d3-9e39f08a81e4', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD ID CARD', '2026-05-08', '34', '5000', '16000', 'Lanyard Set Card', '', 'HILMI MAN', 'Lunas', '2026-05-10', 'TISU PVC', '', '0', '544000', '2026-05-11 05:23:03.158171+00', 'LANYARD SET CARD', 'mp0r9y1oq5eva'),
('2fb574d8-73ba-469a-bbd5-6d2a8aee33f5', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD ID CARD', '2026-04-13', '470', '3000', '8000', 'Lanyard Set Card', 'PRINTING 2 SISI + STOPPER', 'FORMASIK UIN SW KEDIRI', 'Lunas', '2026-04-17', 'TISU & PVC', '', '0', '3760000', '2026-04-13 04:49:38.312331+00', 'LANYARD', 'mnwpr5zlzw0ga'),
('2fdd433e-1d79-45d8-b571-9dfe546b2631', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'KAOS GATHERING', '2026-05-11', '8', '41000', '60000', 'Kaos', '', 'MAS FERY TRAVEL', 'Lunas', '2026-05-13', '24s', '', '0', '480000', '2026-05-11 06:35:11.492409+00', '2l & 3l', 'mp0tuppmquoas'),
('30c958b1-dae7-4b6d-a731-337f4fb8c226', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'JERSEY UNIPDU', '2026-05-08', '41', '40000', '68000', 'JERSEY', 'V NECK', 'HANIP', 'Lunas', '2026-05-14', 'MILANO 170 GSM', '', '0', '2788000', '2026-05-11 05:02:01.193738+00', 'JERSEY S - XL', 'mp0qiwhnzh67q'),
('31a225dc-efeb-42a2-9d8c-9c77da09542a', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'KAOS KELAS ONET', '2026-04-13', '13', '55000', '83000', 'Id Card', 'WARNA NAVY', 'NATRA', 'Lunas', '2026-04-20', 'COTTON COMBED 24S', '', '0', '1079000', '2026-04-13 03:27:38.614988+00', 'LENGAN PANJANG', 'mnwmtp33saetr'),
('3aa607aa-b9da-4665-9784-62a477962242', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'JERSEY UNIPDU', '2026-05-08', '1', '40000', '73000', 'JERSEY', 'V NECK', 'HANIP', 'Lunas', '2026-05-14', 'MILANO 170 GSM', '', '0', '73000', '2026-05-11 05:02:01.39605+00', '2L', 'mp0qiwhnzh67q'),
('4a222d31-140b-49dd-8c7d-e084cace1253', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'TOPI BORDIR KKN', '2026-06-30', '500', '14500', '25000', 'TOPI BORDIR', '', 'DOSEN VINDHY UBHI', 'Lunas', '2026-07-10', 'Drill NAVY', 'ONGKIR MJK - TA', '100000', '12500000', '2026-06-30 16:33:26.019434+00', 'TOPI BORDIR KKN', 'mr0v8nrzsgne1'),
('4caa94ad-7c35-4c2b-8864-dd937b876778', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'TAS SPUNBOND', '2026-04-30', '75', '2200', '4500', 'SABLON', 'SABLON EXPRESS', 'QONITA - AL FATAH', 'Lunas', null, 'SPUNBOND', '', '0', '337500', '2026-04-30 00:38:07.764813+00', 'Tas Spunbond + Sablon', 'mokr95y2e3aet'),
('4cd2f4e8-ca3a-426f-a5f3-8a652ec71dd9', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'KAOS KELAS ONET', '2026-04-13', '1', '3000', '5000', 'Id Card', 'WARNA NAVY', 'NATRA', 'Lunas', '2026-04-20', 'COTTON COMBED 24S', '', '0', '5000', '2026-04-13 03:27:38.778932+00', 'XXL', 'mnwmtp33saetr'),
('54844dd2-56d6-4a93-8404-f2a9cdaf7a4a', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'MERCHANDISE SET SAMARINDA ULU', '2026-06-04', '363', '26000', '40000', 'Kaos', '', 'DIANA TROMUKA 2026', 'Lunas', null, 'Cotton combed 24s', '', '0', '0', '2026-06-04 02:02:10.527698+00', 'TOPI', 'mpyuo1hvrc4ow'),
('55d54595-d0ab-488f-94ad-036062e291d2', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD SET CARD', '2026-07-12', '9', '6000', '20000', 'Lanyard Set Card', '', 'NADYA SMKN 2 JOMBANG', 'Belum Bayar', '2026-07-16', 'TISU PVC', 'ONGKIR JBG', '11000', '0', '2026-07-12 15:12:10.792386+00', 'LANYARD SET CARD', 'mrhxmdxoiv2bs'),
('57dd2f9d-2a17-4eda-a038-a10c321c05cb', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'KAOS GATHERING', '2026-05-11', '15', '4000', '5000', 'Kaos', '', 'MAS FERY TRAVEL', 'Lunas', '2026-05-13', '24s', '', '0', '75000', '2026-05-11 06:35:11.950197+00', '2l - 6L', 'mp0tuppmquoas'),
('58c88e7d-31d3-4be0-a1d4-e1dd294e9099', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Lanyard AL FATAH', '2026-04-30', '75', '5000', '15000', 'Lanyard Set Card', '', 'QONITA AL FATAH', 'Lunas', null, 'TISU PCC', '', '0', '1125000', '2026-04-30 01:39:16.316612+00', 'Lanyard Set Card', 'moktfsbk3whi4'),
('68449f51-f86c-4d73-8695-41cdd919efba', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD SET CARD', '2026-07-12', '7', '6000', '20000', 'Lanyard Set Card', '', 'SILFI TUTOR BIMBEL', 'Belum Bayar', null, 'TISU PVC', '', '0', '0', '2026-07-12 15:10:05.459396+00', 'LANYARD SET CARD', 'mrhxjpp386dqy'),
('72ea5ece-c694-4d20-9202-39291ccd3ebf', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'JERSEY UNIPDU', '2026-05-08', '1', '40000', '98000', 'JERSEY', 'V NECK', 'HANIP', 'Lunas', '2026-05-14', 'MILANO 170 GSM', '', '0', '98000', '2026-05-11 05:02:01.714276+00', '7L', 'mp0qiwhnzh67q'),
('754d8bc5-3d93-426e-adde-910aa5dac933', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD SET CARD', '2026-07-12', '4', '6000', '20000', 'Lanyard Set Card', 'KIRIM TOKO JOMBANG', 'BILQIS SAKA BHAYANGKARA JBG', 'Belum Bayar', '2026-07-16', 'TISU PVC', '', '0', '0', '2026-07-12 15:23:00.707756+00', 'LANYARD SET CARD', 'mrhy0az3m1iup'),
('7877f8c2-3e58-4a79-9cd4-ea034ea0bcc4', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'KAOS KELAS ONET', '2026-04-13', '13', '47000', '75000', 'Id Card', 'WARNA NAVY', 'NATRA', 'Lunas', '2026-04-20', 'COTTON COMBED 24S', 'ONGKIR & STIKER', '40000', '975000', '2026-04-13 03:27:38.374679+00', 'LENGAN PENDEK', 'mnwmtp33saetr'),
('80319097-0606-41af-b7f2-9be0f0f6c233', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'JERSEY PASKAB JOMBANG', '2026-07-12', '3', '5000', '5000', 'JERSEY', 'RIB + KRAH POLO', 'DESTI SMKN 2 JOMBANG', 'DP / Belum Lunas', '2026-07-20', 'EMBOS 200 GSM', '', '0', '0', '2026-07-12 15:39:01.333082+00', 'XXL', 'mrhykvrko4u44'),
('85787a0c-61dd-413a-98ab-d74411cec1a7', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD SET CARD', '2026-07-12', '32', '6000', '15000', 'Lanyard Set Card', '', 'PRASDUTA SMKN 2 TULUNGAGUNG', 'Belum Bayar', '2026-07-16', 'TISU PVC', '', '0', '0', '2026-07-12 15:18:37.397869+00', 'LANYARD SET CARD', 'mrhxunhnhx1ll'),
('8ea4880f-c77f-466b-9c89-bc96dc2baa5a', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD SET CARD PRM', '2026-07-12', '10', '6000', '19000', 'Lanyard Set Card', 'Ayang e Martin', 'KON MARTINUS', 'Belum Bayar', '2026-07-16', 'TISU PVC', '', '0', '0', '2026-07-12 15:25:55.927323+00', 'LANYARD SET CARD', 'mrhy42nfqgd4i'),
('9c4cada0-eea7-4de5-a600-19eb023fb4df', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD ID CARD', '2026-04-13', '54', '5000', '13000', 'Lanyard Set Card', 'PRINTING 2 SISI + STOPPER', 'FORMASIK UIN SW KEDIRI', 'Lunas', '2026-04-17', 'TISU & PVC', '', '0', '702000', '2026-04-13 04:49:38.549677+00', 'LANYARD SET', 'mnwpr5zlzw0ga'),
('9d42179d-c3a9-4725-9521-f511ab9b9a7d', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'JERSEY UNIPDU', '2026-05-08', '1', '40000', '78000', 'JERSEY', 'V NECK', 'HANIP', 'Lunas', '2026-05-14', 'MILANO 170 GSM', '', '0', '78000', '2026-05-11 05:02:01.559853+00', '3L', 'mp0qiwhnzh67q'),
('a3516f18-f89f-4f3a-8465-1919d1659d60', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD ID CARD', '2026-05-11', '56', '5000', '15000', 'Lanyard Set Card', '', 'FARAH SMANEMA', 'Lunas', '2026-05-15', 'TISU PVC', '', '0', '840000', '2026-05-11 05:43:26.371133+00', 'LANYARD SET CARD', 'mp0s0683h2ujs'),
('af85b980-280d-4104-aa4b-fd933bed7c80', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD ID CARD', '2026-05-11', '40', '5000', '16000', 'Lanyard Set Card', '', 'SAVIRA SMK CB PARE', 'Lunas', '2026-05-15', 'TISU PVC', '', '0', '640000', '2026-05-11 05:42:33.421085+00', 'LANYARD SET CARD', 'mp0rz1ocycevs'),
('b4b52b80-2130-4fad-8c60-67e025e161f3', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'PDH STAIZ NGANJUK', '2026-07-12', '29', '110000', '130000', 'Kemeja Bordir', '', 'LATIFA BEM STAIZ', 'DP / Belum Lunas', '2026-08-03', 'AMERICAN DRILL', 'ONGKIR HARAPAN JAYA', '35000', '2000000', '2026-07-12 15:48:35.558741+00', 'PDH BORDIR AMERICAN', 'mrhyx7lrlvnpm'),
('bf601185-fd98-4bcf-97e5-0d39082c5632', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'KAOS KELAS MBAK YATI', '2026-04-13', '42', '10280', '20000', 'Kaos', 'BAWA KAOS SENDIRI', 'MBAK YATI', 'Lunas', '2026-04-15', 'COTTON COMBED 24S', '', '0', '840000', '2026-04-13 04:52:38.480197+00', 'SABLON SAJA', 'mnwpv1l4qa7n0'),
('c4d4b126-aff5-4da7-a44d-a84e8beece22', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD SNAPHOOK HOLDER ELASTIS', '2026-07-02', '1700', '5000', '10000', 'Lanyard Set Card', '', 'PANJI SAMPOERNA', 'Lunas', '2026-07-10', 'TISU ELASTIS', '', '0', '17000000', '2026-07-02 10:34:47.013238+00', 'LANYARD SNAPHOOK HOLDER ELASTIS', 'mr3db58ae1an3'),
('c5919809-22e4-4fb5-a377-b6436266dd3a', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'WORKSHIRT', '2026-04-13', '1', '10000', '10000', 'Kemeja Bordir', '', 'ENDIK MAN 1 KOTA MOJOKERTO', 'Lunas', '2026-04-17', 'AMERICAN DRILL', '', '0', '10000', '2026-04-13 09:42:07.59125+00', 'XXXL', 'mnx07ajhq6f52'),
('cd605be5-d6e0-40ac-ac13-19c58241dbb3', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'WORKSHIRT', '2026-04-13', '23', '105000', '130000', 'Kemeja Bordir', '', 'ENDIK MAN 1 KOTA MOJOKERTO', 'Lunas', '2026-04-17', 'AMERICAN DRILL', '', '0', '2990000', '2026-04-13 09:42:07.342785+00', 'LENGAN PENDEK', 'mnx07ajhq6f52'),
('d78aba31-7142-4212-9c97-7961882e2bd9', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'MERCHANDISE SET SAMARINDA ULU', '2026-06-04', '363', '41000', '65000', 'Kaos', '', 'DIANA TROMUKA 2026', 'Lunas', null, 'Cotton combed 24s', 'CASHBACK BONUS', '1465000', '43560000', '2026-06-04 02:02:10.167964+00', 'KAOS', 'mpyuo1hvrc4ow'),
('e330033f-55f3-47b5-8316-0549f32279bb', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD ID CARD', '2026-05-09', '77', '5000', '15000', 'Lanyard Set Card', '', 'ECAN ASTRA', 'Lunas', '2026-05-15', 'TISU PVC', '', '0', '1155000', '2026-05-11 05:05:37.46706+00', 'LANYARD SET CARD', 'mp0qnjfdof8ib'),
('e5dd715f-036b-4f76-8276-c7ec494e7e66', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Lanyard Id Card Set', '2026-04-25', '21', '6000', '16000', 'Id Card', '', 'Sema UIN', 'Lunas', null, 'Tisu PVC', '', '0', '336000', '2026-04-28 10:34:44.522621+00', 'Lanyard Set Card', 'moihopxmkyfea'),
('f11a73d0-bf22-430c-a132-632aaf30763f', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD KKN UBHI', '2026-07-02', '405', '5000', '12000', 'Lanyard Set Card', 'CARH HOLDER BENING', 'DOSEN RICO UHBI', 'Lunas', '2026-07-10', 'TISU PVC', '', '0', '4860000', '2026-07-02 10:31:35.909263+00', 'LANYARD SET CARD BENING', 'mr3d71efc0ini'),
('f18a2f46-68d1-4c06-85f6-2bedd662c4e4', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'KAOS GATHERING', '2026-05-11', '32', '38000', '55000', 'Kaos', '', 'MAS FERY TRAVEL', 'Lunas', '2026-05-13', '24s', '', '0', '1760000', '2026-05-11 06:35:11.299397+00', 'Lengan Pendek', 'mp0tuppmquoas'),
('f428b9eb-7217-4862-b011-3884f5b9f161', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'KAOS POLO', '2026-04-11', '8', '70000', '100000', 'Kaos', 'LACOS CVC', 'SURABAIL', 'DP / Belum Lunas', '2026-04-20', 'POLO KANCING', '', '0', '500000', '2026-04-13 09:39:08.723641+00', 'PENDEK', 'mnx03h1w01t23'),
('f68a753c-2a23-4e80-8f64-f7000799f8c8', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'JERSEY PASKAB JOMBANG', '2026-07-12', '50', '65000', '95000', 'JERSEY', 'RIB + KRAH POLO', 'DESTI SMKN 2 JOMBANG', 'DP / Belum Lunas', '2026-07-20', 'EMBOS 200 GSM', '', '0', '2000000', '2026-07-12 15:39:00.965411+00', 'JERSEY POLO EMBOSS 200 GSM', 'mrhykvrko4u44'),
('fcb165c5-4537-4b8b-88e7-5ba030e931c9', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'LANYARD SET CARD', '2026-07-12', '1', '3500', '15000', 'Lanyard Set Card', '', 'SILFI TUTOR BIMBEL', 'Belum Bayar', null, 'TISU PVC', '', '0', '0', '2026-07-12 15:10:05.962861+00', 'LANYARD', 'mrhxjpp386dqy');



COMMIT;
