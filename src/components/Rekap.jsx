import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { calcItem, calcSummary, fmtShort, fmt, MONTHS, MONTHS_FULL, STATUS_PESANAN, STATUS_COLOR } from '../lib/utils'

const now = new Date()

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="mb-0.5">
          {p.name}: {fmtShort(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Rekap({ transactions }) {
  const [period, setPeriod] = useState('minggu')
  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [selYear, setSelYear] = useState(now.getFullYear())

  const years = useMemo(() => {
    const ys = [...new Set(transactions.map(d => new Date(d.tanggal).getFullYear()))]
    if (!ys.includes(now.getFullYear())) ys.unshift(now.getFullYear())
    return ys.sort((a, b) => b - a)
  }, [transactions])

  const filtered = useMemo(() => {
    return transactions.filter(d => {
      const dt = new Date(d.tanggal)
      if (period === 'minggu') return (now - dt) / 86400000 <= 7
      if (period === 'bulan') return dt.getFullYear() === +selYear && dt.getMonth() === +selMonth
      return dt.getFullYear() === +selYear
    })
  }, [transactions, period, selMonth, selYear])

  const summary = useMemo(() => calcSummary(filtered), [filtered])
  const margin = summary.totalModal > 0 ? (summary.totalLaba / summary.totalModal) * 100 : 0

  // Chart data
  const chartData = useMemo(() => {
    if (period === 'tahun') {
      return MONTHS.map((m, i) => {
        const items = filtered.filter(d => new Date(d.tanggal).getMonth() === i)
        const s = calcSummary(items)
        return { name: m, Modal: Math.round(s.totalModal), Penjualan: Math.round(s.totalJual), 'Laba/Rugi': Math.round(s.totalLaba) }
      }).filter(d => d.Modal > 0 || d.Penjualan > 0)
    }
    const byDate = {}
    filtered.forEach(d => {
      if (!byDate[d.tanggal]) byDate[d.tanggal] = []
      byDate[d.tanggal].push(d)
    })
    return Object.entries(byDate)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, items]) => {
        const s = calcSummary(items)
        const label = new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        return { name: label, Modal: Math.round(s.totalModal), Penjualan: Math.round(s.totalJual), 'Laba/Rugi': Math.round(s.totalLaba) }
      })
  }, [filtered, period])

  // By kategori
  const byKategori = useMemo(() => {
    const map = {}
    filtered.forEach(d => {
      if (!map[d.kategori]) map[d.kategori] = []
      map[d.kategori].push(d)
    })
    return Object.entries(map)
      .map(([kat, items]) => ({ kat, ...calcSummary(items) }))
      .sort((a, b) => b.totalLaba - a.totalLaba)
  }, [filtered])

  // By status pembayaran
  const byStatus = useMemo(() => {
    const map = {}
    filtered.forEach(d => {
      const s = d.status_pesanan || 'Tidak diketahui'
      if (!map[s]) map[s] = { count: 0, totalJual: 0 }
      const { totalJual } = calcItem(d)
      map[s].count++
      map[s].totalJual += totalJual
    })
    return Object.entries(map).map(([status, v]) => ({ status, ...v }))
  }, [filtered])

  // Deadline mendatang (belum lunas)
  const upcoming = useMemo(() => {
    const todayStr = now.toISOString().slice(0, 10)
    return transactions
      .filter(d => d.deadline && d.status_pesanan !== 'Lunas' && d.deadline >= todayStr)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5)
  }, [transactions])

  const periodLabel = period === 'minggu' ? '7 Hari Terakhir'
    : period === 'bulan' ? `${MONTHS_FULL[selMonth]} ${selYear}`
    : `Tahun ${selYear}`

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-gray-500">Periode:</span>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
            {[['minggu','Mingguan'],['bulan','Bulanan'],['tahun','Tahunan']].map(([v,l]) => (
              <button key={v} onClick={() => setPeriod(v)}
                className={`px-4 py-2 transition-colors ${period===v ? 'bg-green-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                {l}
              </button>
            ))}
          </div>
          {period === 'bulan' && (
            <select value={selMonth} onChange={e => setSelMonth(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              {MONTHS_FULL.map((m,i) => <option key={i} value={i}>{m}</option>)}
            </select>
          )}
          {(period === 'bulan' || period === 'tahun') && (
            <select value={selYear} onChange={e => setSelYear(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
          )}
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} transaksi · {periodLabel}</span>
        </div>
      </div>

      {/* Deadline Alert */}
      {upcoming.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">⏰ Deadline Mendatang (Belum Lunas)</p>
          <div className="space-y-2">
            {upcoming.map(d => {
              const diff = Math.ceil((new Date(d.deadline) - now) / 86400000)
              return (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{d.nama}</span>
                    {d.nama_pembeli && <span className="text-gray-400 ml-2">— {d.nama_pembeli}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[d.status_pesanan] || ''}`}>{d.status_pesanan}</span>
                    <span className={`text-xs font-bold ${diff === 0 ? 'text-orange-500' : diff <= 2 ? 'text-red-500' : 'text-amber-600'}`}>
                      {diff === 0 ? 'Hari ini!' : `${diff} hari lagi`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
          Tidak ada data untuk periode ini.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: 'Total Transaksi', val: `${filtered.length} item` },
              { label: 'Total Modal', val: fmtShort(summary.totalModal) },
              { label: 'Total Penjualan', val: fmtShort(summary.totalJual) },
              { label: 'Total Dibayar', val: fmtShort(summary.totalDibayar), color: 'text-blue-600' },
              { label: 'Total Kekurangan', val: fmtShort(summary.totalKurang), color: summary.totalKurang > 0 ? 'text-orange-600' : 'text-gray-400' },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center sm:text-left">
                <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                <p className={`text-lg sm:text-xl font-bold ${c.color || 'text-gray-800'}`}>{c.val}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center mt-3">
            <p className="text-xs text-gray-400 mb-1">{summary.totalLaba >= 0 ? 'Total Keuntungan' : 'Total Kerugian'}</p>
            <p className={`text-2xl font-black ${summary.totalLaba >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(summary.totalLaba)}</p>
          </div>

          {/* Status Pembayaran & Margin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Status Pembayaran</h3>
              <div className="space-y-2">
                {byStatus.map(({ status, count, totalJual }) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
                    <div className="text-right">
                      <span className="text-gray-800 font-medium">{count} pesanan</span>
                      <span className="text-gray-400 ml-2 text-xs">{fmtShort(totalJual)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Ringkasan Margin</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Rata-rata margin</span><span className={`font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>{margin.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Transaksi untung</span><span className="font-medium text-green-600">{filtered.filter(d => calcItem(d).laba > 0).length}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Transaksi rugi</span><span className="font-medium text-red-500">{filtered.filter(d => calcItem(d).laba < 0).length}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">BEP</span><span className="font-medium text-gray-500">{filtered.filter(d => calcItem(d).laba === 0).length}</span></div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Grafik {period === 'tahun' ? 'per Bulan' : 'per Tanggal'}
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tickFormatter={v => fmtShort(v)} tick={{ fontSize: 11, fill: '#9ca3af' }} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Modal" fill="#93c5fd" radius={[4,4,0,0]} />
                  <Bar dataKey="Penjualan" fill="#16a34a" radius={[4,4,0,0]} />
                  <Bar dataKey="Laba/Rugi" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 text-sm py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </div>

          {/* Kategori Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Rekap per Kategori</h3>
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Kategori','Transaksi','Total Penjualan','Dibayar','Kurang','Laba / Rugi','Margin','Status'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byKategori.map(({ kat, count, totalModal, totalJual, totalDibayar, totalKurang, totalLaba }) => {
                    const m = totalModal > 0 ? (totalLaba / totalModal * 100) : 0
                    const badge = totalLaba > 0 ? 'bg-green-50 text-green-700' : totalLaba < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                    const label = totalLaba > 0 ? 'Untung' : totalLaba < 0 ? 'Rugi' : 'BEP'
                    return (
                      <tr key={kat} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-800">{kat}</td>
                        <td className="px-6 py-3 text-gray-500">{count}</td>
                        <td className="px-6 py-3 text-gray-700 whitespace-nowrap">{fmt(totalJual)}</td>
                        <td className="px-6 py-3 text-blue-600 whitespace-nowrap font-medium">{fmt(totalDibayar)}</td>
                        <td className={`px-6 py-3 whitespace-nowrap font-medium ${totalKurang > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{fmt(totalKurang)}</td>
                        <td className={`px-6 py-3 font-semibold whitespace-nowrap ${totalLaba >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(totalLaba)}</td>
                        <td className={`px-6 py-3 whitespace-nowrap ${totalLaba >= 0 ? 'text-green-600' : 'text-red-500'}`}>{m.toFixed(1)}%</td>
                        <td className="px-6 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge}`}>{label}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-6 py-3 font-bold text-gray-800" colSpan={2}>Total</td>
                    <td className="px-6 py-3 font-bold text-gray-800 whitespace-nowrap">{fmt(summary.totalJual)}</td>
                    <td className="px-6 py-3 font-bold text-blue-600 whitespace-nowrap">{fmt(summary.totalDibayar)}</td>
                    <td className={`px-6 py-3 font-bold whitespace-nowrap ${summary.totalKurang > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{fmt(summary.totalKurang)}</td>
                    <td className={`px-6 py-3 font-bold whitespace-nowrap ${summary.totalLaba >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(summary.totalLaba)}</td>
                    <td className={`px-6 py-3 font-bold ${summary.totalLaba >= 0 ? 'text-green-600' : 'text-red-500'}`}>{margin.toFixed(1)}%</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
