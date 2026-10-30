import { useState, useMemo } from 'react'
import { fmt, MONTHS_FULL } from '../lib/utils'

function parseDateParts(dateStr) {
  if (!dateStr) return { year: null, month: null }
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.slice(0, 10).split('-')
    if (parts.length >= 2) {
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1,
      }
    }
  }
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? { year: null, month: null } : { year: d.getFullYear(), month: d.getMonth() }
}

export default function DaftarPengeluaran({ expenses = [], onDelete, onDeleteAll, loading }) {
  const now = new Date()
  const curMonth = now.getMonth()
  const curYear = now.getFullYear()

  const [search, setSearch] = useState('')
  const [filterBulan, setFilterBulan] = useState(curMonth)
  const [filterTahun, setFilterTahun] = useState(curYear)

  const availableYears = useMemo(() => {
    const curYearVal = new Date().getFullYear()
    const set = new Set(
      expenses
        .map(e => {
          if (!e.tanggal) return null
          const { year } = parseDateParts(e.tanggal)
          return year
        })
        .filter(Boolean)
    )
    if (!set.has(curYearVal)) set.add(curYearVal)
    return Array.from(set).sort((a, b) => b - a)
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    return expenses.filter(ex => {
      const q = search.toLowerCase()
      const matchSearch = !q || (ex.keterangan || '').toLowerCase().includes(q)

      const { year: exYear, month: exMonth } = parseDateParts(ex.tanggal)
      const matchBulan = filterBulan === 'Semua' || exMonth === parseInt(filterBulan, 10)
      const matchTahun = filterTahun === 'Semua' || exYear === parseInt(filterTahun, 10)

      return matchSearch && matchBulan && matchTahun
    })
  }, [expenses, search, filterBulan, filterTahun])

  const total = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + (parseFloat(curr.nominal) || 0), 0)
  }, [filteredExpenses])

  if (loading) return <div className="text-center py-12 text-gray-400">Memuat data...</div>

  const isFiltered = filterBulan !== curMonth || filterTahun !== curYear || search.trim() !== ''

  return (
    <div className="space-y-4">
      {/* KPI Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs text-gray-400">Total Pengeluaran</p>
            <span className="text-[11px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {filterBulan !== 'Semua' ? MONTHS_FULL[filterBulan] : 'Semua Bulan'}
              {' '}
              {filterTahun !== 'Semua' ? filterTahun : 'Semua Tahun'}
            </span>
          </div>
          <p className="text-2xl font-bold text-red-600">{fmt(total)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {filteredExpenses.length} {isFiltered ? `dari ${expenses.length} ` : ''}catatan pengeluaran
          </p>
        </div>
        {expenses.length > 0 && (
          <button
            onClick={() => { if (confirm('Hapus semua pengeluaran?')) onDeleteAll() }}
            className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition-all self-start sm:self-center"
          >
            Hapus Semua
          </button>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Cari keterangan pengeluaran..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[160px] border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
          />
          <select
            value={filterBulan}
            onChange={e => setFilterBulan(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="Semua">Semua Bulan</option>
            {MONTHS_FULL.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={filterTahun}
            onChange={e => setFilterTahun(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="Semua">Semua Tahun</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {isFiltered && (
            <button
              onClick={() => {
                setSearch('')
                setFilterBulan(curMonth)
                setFilterTahun(curYear)
              }}
              className="px-3 py-2 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-medium"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-400 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4 text-right">Nominal</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    <p>
                      {expenses.length === 0
                        ? 'Belum ada pengeluaran tercatat'
                        : 'Tidak ada pengeluaran pada periode/filter ini'}
                    </p>
                    {expenses.length > 0 && (
                      <div className="mt-2 flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setFilterBulan('Semua')
                            setFilterTahun('Semua')
                            setSearch('')
                          }}
                          className="text-xs text-red-500 hover:underline font-medium"
                        >
                          Lihat Semua Periode
                        </button>
                        {isFiltered && (
                          <button
                            onClick={() => {
                              setFilterBulan(curMonth)
                              setFilterTahun(curYear)
                              setSearch('')
                            }}
                            className="text-xs text-gray-500 hover:underline font-medium"
                          >
                            Kembali ke Bulan Ini
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(ex => (
                  <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {new Date(ex.tanggal).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{ex.keterangan}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-500">{fmt(ex.nominal)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => { if (confirm('Hapus pengeluaran ini?')) onDelete(ex.id) }}
                        className="text-gray-300 hover:text-red-500 transition-colors text-lg"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
