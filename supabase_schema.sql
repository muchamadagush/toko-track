-- =============================================
-- TokoTrack — Supabase Database Setup
-- Jalankan script ini di Supabase SQL Editor
-- =============================================

-- Buat tabel transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nama                text        NOT NULL,
  tanggal             date        NOT NULL,
  jumlah              numeric     NOT NULL CHECK (jumlah > 0),
  modal               numeric     NOT NULL CHECK (modal >= 0),
  jual                numeric     NOT NULL CHECK (jual >= 0),
  kategori            text        NOT NULL DEFAULT 'Lainnya',
  catatan             text,
  -- Field baru
  nama_pembeli        text,
  status_pesanan      text        NOT NULL DEFAULT 'Lunas',
  deadline            date,
  bahan_model         text,
  jenis               text,
  batch_id            text,
  modal_lain          text,
  modal_lain_nominal  numeric     NOT NULL DEFAULT 0,
  uang_dibayarkan     numeric     NOT NULL DEFAULT 0,
  --
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_transactions_tanggal   ON public.transactions (tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_kategori  ON public.transactions (kategori);
CREATE INDEX IF NOT EXISTS idx_transactions_status    ON public.transactions (status_pesanan);
CREATE INDEX IF NOT EXISTS idx_transactions_deadline  ON public.transactions (deadline);

-- Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON public.transactions
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- Tabel Categories (Dinamis)
-- =============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text         NOT NULL UNIQUE,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for categories" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS nama_pembeli       text;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status_pesanan     text NOT NULL DEFAULT 'Lunas';
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS deadline           date;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS bahan_model        text;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS jenis              text;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS batch_id           text;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS modal_lain         text;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS modal_lain_nominal numeric NOT NULL DEFAULT 0;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS uang_dibayarkan    numeric NOT NULL DEFAULT 0;
