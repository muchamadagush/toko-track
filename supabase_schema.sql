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
CREATE POLICY "Allow update own profile" ON public.profiles FOR UPDATE TO authenticated USING (
  auth.uid() = id 
  OR (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    AND store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
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

