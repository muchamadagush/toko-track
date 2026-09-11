# AGENTS.md — TS Clothing (Toko App)

## Project Overview

Aplikasi pencatatan pengeluaran barang, harga modal, harga jual, perhitungan untung/rugi, dan rekap mingguan/bulanan/tahunan untuk toko pakaian.

**Stack:** React 18 · Vite 5 · TailwindCSS 3 · Supabase · Recharts · Vercel

---

## Architecture

- **Frontend:** React (JSX) with Vite as the build tool
- **Styling:** TailwindCSS 3
- **Backend/Database:** Supabase (PostgreSQL) with localStorage fallback
- **Charts:** Recharts for data visualization
- **Deployment:** Vercel

### Directory Structure

```
src/
├── components/        # UI components (CatatBarang, DaftarTransaksi, KelolaKategori, Rekap)
├── hooks/             # Custom React hooks (useTransactions, useCategories)
├── lib/               # Utilities and Supabase client (supabase.js, utils.js)
├── App.jsx            # Main application component with routing/navigation
├── main.jsx           # React entry point
└── index.css          # Global styles (TailwindCSS directives)
```

---

## Coding Conventions

### Language & Style
- Use **JSX** (not TSX) — this project does not use TypeScript
- Use **ES module** syntax (`import`/`export`), the project is `"type": "module"`
- Use **Indonesian** for user-facing text, labels, and comments where appropriate
- Use **English** for code identifiers (variable names, function names, etc.)

### Component Patterns
- React functional components with hooks
- Custom hooks in `src/hooks/` for data logic (Supabase + localStorage)
- Supabase client initialized in `src/lib/supabase.js`
- Helper/utility functions in `src/lib/utils.js`

### Data Layer
- Always implement **dual storage**: Supabase as primary, localStorage as fallback
- Check Supabase availability before operations; gracefully fall back to localStorage
- Database schema is defined in `supabase_schema.sql` at the project root

### Styling
- Use **TailwindCSS utility classes** for all styling
- Global/base styles in `src/index.css`
- Tailwind config in `tailwind.config.js`

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public API key |

- Prefix all env vars with `VITE_` (required by Vite)
- Never commit `.env` or `.env.local` — they are in `.gitignore`

---

## Key Features & Context

- **Catat Barang:** Item recording with name, date, qty, cost price, selling price
- **Pembayaran & DP:** Partial payment (down payment) support with balance tracking
- **Rekap:** Weekly, monthly, yearly, and per-category profit/loss reports with charts
- **Kelola Kategori:** Dynamic category CRUD with data protection (prevent deleting used categories)
- **LocalStorage Fallback:** App works offline without Supabase configured

---

## Rules

1. **Do not modify** `supabase_schema.sql` without updating the README migration steps
2. **Do not expose** Supabase keys in source code — always use `import.meta.env`
3. **Preserve** the localStorage fallback behavior in all data hooks
4. **Test** both Supabase-connected and offline (localStorage-only) modes when changing data logic
5. **Keep** the Vercel deployment config (`vercel.json`) in sync with any routing changes
