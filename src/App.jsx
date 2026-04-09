import { useState } from 'react'
import CatatBarang from './components/CatatBarang'
import DaftarTransaksi from './components/DaftarTransaksi'
import Rekap from './components/Rekap'
import KelolaKategori from './components/KelolaKategori'
import { useTransactions } from './hooks/useTransactions'
import { useCategories } from './hooks/useCategories'
import { calcSummary, fmtShort } from './lib/utils'

const TABS = [
  { id: 'catat', label: 'Catat Barang' },
  { id: 'daftar', label: 'Transaksi' },
  { id: 'rekap', label: 'Rekap' },
  { id: 'kategori', label: 'Kategori' },
]

export default function App() {
  const [tab, setTab] = useState('catat')
  const { transactions, loading: tLoading, error: tError, addTransaction, updateTransaction, deleteTransaction, deleteAll, useSupabase } = useTransactions()
  const { categories, loading: cLoading, addCategory, updateCategory, deleteCategory } = useCategories()

  const loading = tLoading
  const error = tError
  const summary = calcSummary(transactions)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <span className="font-bold text-gray-900 text-base">TS Clothing</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${useSupabase ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              {useSupabase ? '● Supabase' : '● Local'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            ⚠️ Error: {error}
          </div>
        )}

        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Transaksi', val: `${summary.count} item` },
            { label: 'Total Modal', val: fmtShort(summary.totalModal) },
            { label: 'Total Penjualan', val: fmtShort(summary.totalJual) },
            { label: summary.totalLaba >= 0 ? 'Keuntungan' : 'Kerugian', val: fmtShort(summary.totalLaba), highlight: summary.totalLaba >= 0 ? 'green' : 'red' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
              <p className="text-xs text-gray-400 mb-0.5">{c.label}</p>
              <p className={`text-lg font-bold ${c.highlight === 'green' ? 'text-green-600' : c.highlight === 'red' ? 'text-red-500' : 'text-gray-800'}`}>
                {summary.count === 0 ? (c.label === 'Total Transaksi' ? '0 item' : 'Rp 0') : c.val}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'catat' && <CatatBarang onAdd={addTransaction} categories={categories} />}
        {tab === 'daftar' && <DaftarTransaksi transactions={transactions} categories={categories} onDelete={deleteTransaction} onUpdate={updateTransaction} onDeleteAll={deleteAll} loading={loading} />}
        {tab === 'rekap' && <Rekap transactions={transactions} />}
        {tab === 'kategori' && (
          <KelolaKategori
            categories={categories}
            transactions={transactions}
            onAdd={addCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
            loading={cLoading}
          />
        )}
      </main>
    </div>
  )
}
