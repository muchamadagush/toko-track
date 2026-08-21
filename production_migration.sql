-- =============================================
-- IN-PLACE PRODUCTION DATABASE MIGRATION SCRIPT
-- Jalankan seluruh script ini di Supabase SQL Editor PRODUCTION
-- PERINGATAN: JANGAN drop table. Script ini memigrasi data secara aman & in-place.
-- =============================================

-- ---------------------------------------------
-- LANGKAH DDL: PEMBUATAN TABEL & KOLOM BARU
-- ---------------------------------------------
BEGIN;

-- 1. Buat tabel stores jika belum ada
CREATE TABLE IF NOT EXISTS public.stores (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text         NOT NULL,
  address     text,
  phone       text,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- 2. Buat tabel branches jika belum ada
CREATE TABLE IF NOT EXISTS public.branches (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    uuid         NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name        text         NOT NULL,
  address     text,
  phone       text,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- 3. Buat tabel profiles jika belum ada
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id    uuid         REFERENCES public.stores(id) ON DELETE SET NULL,
  branch_id   uuid         REFERENCES public.branches(id) ON DELETE SET NULL,
  role        text         NOT NULL DEFAULT 'owner',
  email       text,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- 4. Tambahkan kolom store_id dan branch_id ke tabel lama jika belum ada
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS modal numeric NOT NULL DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS modal_lain text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS modal_lain_nominal numeric NOT NULL DEFAULT 0;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

COMMIT;

-- ---------------------------------------------
-- LANGKAH DML: INISIALISASI TENANT & PEMETAAN USER LAMA
-- ---------------------------------------------
BEGIN;

-- 1. Buat satu Toko Utama (Default Store)
INSERT INTO public.stores (id, name, address, phone)
VALUES ('00000000-0000-0000-0000-000000000001', 'Toko Utama (Migrasi)', 'Alamat Default', '-')
ON CONFLICT (id) DO NOTHING;

-- 2. Buat satu Cabang Utama (Default Branch)
INSERT INTO public.branches (id, store_id, name, address, phone)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Pusat', 'Alamat Default', '-')
ON CONFLICT (id) DO NOTHING;

-- 3. Hubungkan Akun Owner Utama Anda ke Profil Toko Default
-- PERINGATAN: Pastikan Anda sudah mendaftar/Sign Up terlebih dahulu di aplikasi dengan email Anda
-- (contoh: tsgrupcompany@gmail.com) sebelum menjalankan script ini.
INSERT INTO public.profiles (id, store_id, branch_id, role, email)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'tsgrupcompany@gmail.com'),
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'owner',
  'tsgrupcompany@gmail.com'
)
ON CONFLICT (id) DO UPDATE 
SET 
  store_id = EXCLUDED.store_id,
  branch_id = EXCLUDED.branch_id,
  role = EXCLUDED.role,
  email = EXCLUDED.email;

-- 4. Update data transaksi lama yang store_id / branch_id-nya masih NULL
UPDATE public.transactions
SET 
  store_id = '00000000-0000-0000-0000-000000000001',
  branch_id = '00000000-0000-0000-0000-000000000002'
WHERE store_id IS NULL OR branch_id IS NULL;

-- 5. Update data pengeluaran (expenses) lama
UPDATE public.expenses
SET 
  store_id = '00000000-0000-0000-0000-000000000001',
  branch_id = '00000000-0000-0000-0000-000000000002'
WHERE store_id IS NULL OR branch_id IS NULL;

-- 6. Update data kategori (categories) lama
UPDATE public.categories
SET store_id = '00000000-0000-0000-0000-000000000001'
WHERE store_id IS NULL;

-- 7. Sinkronkan email lama dari auth.users
UPDATE public.profiles p
SET email = (SELECT email FROM auth.users u WHERE u.id = p.id)
WHERE p.email IS NULL;

COMMIT;

-- ---------------------------------------------
-- LANGKAH POLICIES: AKTIFKAN RLS, VIEW, DAN TRIGGER
-- ---------------------------------------------
BEGIN;

-- 1. Hapus constraint UNIQUE lama pada tabel categories dan buat yang baru (berdasarkan store_id + name)
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE public.categories ADD CONSTRAINT categories_store_id_name_key UNIQUE (store_id, name);

-- 2. Terapkan RLS (Row Level Security)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. Buat Policies untuk tabel profiles
DROP POLICY IF EXISTS "Allow read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow delete profile for owner" ON public.profiles;

CREATE POLICY "Allow read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = id OR ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' AND store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid()))
);
CREATE POLICY "Allow update own profile" ON public.profiles FOR UPDATE TO authenticated 
USING (
  auth.uid() = id OR ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' AND store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid()))
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
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' AND store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
);

-- 4. Buat Policies untuk tabel stores
DROP POLICY IF EXISTS "Allow select stores" ON public.stores;
DROP POLICY IF EXISTS "Allow insert stores" ON public.stores;
DROP POLICY IF EXISTS "Allow update stores" ON public.stores;

CREATE POLICY "Allow select stores" ON public.stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert stores" ON public.stores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update stores" ON public.stores FOR UPDATE TO authenticated USING (
  id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
);

-- 5. Buat Policies untuk tabel branches
DROP POLICY IF EXISTS "Allow select branches" ON public.branches;
DROP POLICY IF EXISTS "Allow insert branches" ON public.branches;
DROP POLICY IF EXISTS "Allow update/delete branches" ON public.branches;

CREATE POLICY "Allow select branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert branches" ON public.branches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update/delete branches" ON public.branches FOR ALL TO authenticated USING (
  store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
);

-- 6. Buat Policies untuk tabel transactions
DROP POLICY IF EXISTS "Allow select transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow write transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow all for anon" ON public.transactions;

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
) WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
  OR (kategori = 'Lainnya' AND modal = 0 AND modal_lain_nominal = 0 AND (modal_lain IS NULL OR modal_lain = ''))
);

-- 7. Buat Policies untuk tabel expenses
DROP POLICY IF EXISTS "Allow select expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow write expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow all for expenses" ON public.expenses;

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

-- 8. Buat Policies untuk tabel categories
DROP POLICY IF EXISTS "Allow select categories" ON public.categories;
DROP POLICY IF EXISTS "Allow write categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all for categories" ON public.categories;

CREATE POLICY "Allow select categories" ON public.categories FOR SELECT TO authenticated USING (
  store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Allow write categories" ON public.categories FOR ALL TO authenticated USING (
  store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
);

-- 9. Buat database views
CREATE OR REPLACE VIEW public.transactions_view AS
SELECT 
  id, store_id, branch_id, nama, tanggal, jumlah, jual, catatan, nama_pembeli, status_pesanan, deadline, bahan_model, jenis, batch_id, uang_dibayarkan, created_at,
  CASE WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN kategori ELSE 'Lainnya' END AS kategori,
  CASE WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN modal ELSE 0 END AS modal,
  CASE WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN modal_lain ELSE NULL END AS modal_lain,
  CASE WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN modal_lain_nominal ELSE 0 END AS modal_lain_nominal
FROM public.transactions;

CREATE OR REPLACE VIEW public.categories_view AS
SELECT 
  id, store_id, name, created_at,
  CASE WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN modal ELSE 0 END AS modal,
  CASE WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN modal_lain ELSE NULL END AS modal_lain,
  CASE WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' THEN modal_lain_nominal ELSE 0 END AS modal_lain_nominal
FROM public.categories;

-- 10. Buat Trigger auto-modal
CREATE OR REPLACE FUNCTION populate_transaction_modal()
RETURNS TRIGGER AS $$
BEGIN
  SELECT modal, modal_lain, modal_lain_nominal
  INTO NEW.modal, NEW.modal_lain, NEW.modal_lain_nominal
  FROM public.categories
  WHERE store_id = NEW.store_id AND name = NEW.kategori
  LIMIT 1;

  IF NEW.modal IS NULL THEN NEW.modal := 0; END IF;
  IF NEW.modal_lain_nominal IS NULL THEN NEW.modal_lain_nominal := 0; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_populate_transaction_modal ON public.transactions;
CREATE TRIGGER trg_populate_transaction_modal
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION populate_transaction_modal();

COMMIT;
