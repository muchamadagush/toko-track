import { useState, useMemo } from 'react'
import { fmt, fmtShort, MONTHS_FULL, STATUS_COLOR } from '../lib/utils'
import { buildDailyAccountingData, exportAccountingToExcel } from '../lib/accountingExport'

const TabelBukuKas = ({
  transactions = [],
  expenses = [],
  selMonth,
  selYear,
  setSelMonth,
  setSelYear,
  years = [],
  profile,
  branchName = 'Semua Cabang',
}) => {
  const isOwner = profile?.role === 'owner' || !profile
  const storeName = profile?.stores?.name || 'TS Clothing'

  const [onlyActiveDays, setOnlyActiveDays] = useState(true)
  const [selectedDetailDay, setSelectedDetailDay] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [yearlyViewType, setYearlyViewType] = useState('monthly')

  // Bangun data harian / bulanan & total akumulatif
  const accountingData = useMemo(() => {
    return buildDailyAccountingData({
      transactions,
      expenses,
      year: selYear,
      monthIndex: selMonth,
      onlyActiveDays,
    })
  }, [transactions, expenses, selYear, selMonth, onlyActiveDays])

  const {
    isYearly = false,
    months = [],
    days = [],
    totals = {},
    monthTransactions = [],
    monthExpenses = [],
    monthLabel = '',
  } = accountingData

  // Handler Download Excel
  const handleDownloadExcel = async () => {
    setExporting(true)
    try {
      const fullData = buildDailyAccountingData({
        transactions,
        expenses,
        year: selYear,
        monthIndex: selMonth,
        onlyActiveDays: false,
      })

      exportAccountingToExcel({
        storeName,
        branchName,
        monthIndex: selMonth,
        year: selYear,
        dailyData: fullData.days,
        totals: fullData.totals,
        monthTransactions: fullData.monthTransactions,
        monthExpenses: fullData.monthExpenses,
        isOwner,
        isYearly,
        months: fullData.months,
      })
    } catch (err) {
      console.error('Gagal mengekspor Excel:', err)
      alert('Gagal mengekspor data ke Excel: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Control Bar: Filter Periode & Tombol Unduh ─────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <span className="text-sm font-bold text-gray-700">Pilih Periode:</span>
          </div>

          <select
            value={selMonth}
            onChange={e => setSelMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="all">🗓️ Semua Bulan (1 Tahun {selYear})</option>
            <optgroup label="Pilih Bulan Spesifik">
              {MONTHS_FULL.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </optgroup>
          </select>

          <select
            value={selYear}
            onChange={e => setSelYear(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {(!isYearly || yearlyViewType === 'daily') && (
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer ml-1 select-none">
              <input
                type="checkbox"
                checked={onlyActiveDays}
                onChange={e => setOnlyActiveDays(e.target.checked)}
                className="rounded text-brand-green focus:ring-brand-green w-4 h-4"
              />
              <span>Hanya hari aktif (ada transaksi/pengeluaran)</span>
            </label>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadExcel}
            disabled={exporting}
            className="w-full md:w-auto flex items-center justify-center gap-2.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-sm transition-all"
            title={`Unduh laporan ${isYearly ? `1 Tahun (${selYear})` : '1 Bulan'} ke format Excel (.xlsx)`}
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyiapkan Excel...</span>
              </>
            ) : (
              <>
                <span className="text-base">📥</span>
                <span>Unduh Excel {isYearly ? `1 Tahun (${selYear})` : 'Bulanan'} (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Ringkasan Akumulatif (Summary KPI Cards) ────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Total Penjualan</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900">{fmt(totals.totalPenjualan || 0)}</p>
          <span className="text-[11px] text-gray-400 font-medium">{totals.totalTrx || 0} transaksi</span>
        </div>

        {isOwner && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Total Modal (HPP)</p>
            <p className="text-lg sm:text-xl font-bold text-gray-800">{fmt(totals.totalModal || 0)}</p>
            <span className="text-[11px] text-gray-400 font-medium">Beban Pokok Barang</span>
          </div>
        )}

        {isOwner && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Laba Kotor</p>
            <p className={`text-lg sm:text-xl font-bold ${(totals.totalLabaKotor || 0) >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
              {fmt(totals.totalLabaKotor || 0)}
            </p>
            <span className="text-[11px] text-gray-400 font-medium">Sebelum Biaya Ops</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Pengeluaran Toko</p>
          <p className="text-lg sm:text-xl font-bold text-red-500">{fmt(totals.totalPengeluaran || 0)}</p>
          <span className="text-[11px] text-gray-400 font-medium">{monthExpenses.length} pengeluaran</span>
        </div>

        {isOwner && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">{(totals.totalLabaBersih || 0) >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}</p>
            <p className={`text-lg sm:text-xl font-black ${(totals.totalLabaBersih || 0) >= 0 ? 'text-brand-green' : 'text-red-600'}`}>
              {fmt(totals.totalLabaBersih || 0)}
            </p>
            <span className="text-[11px] text-gray-400 font-medium">Bathi Riil Toko</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Kas Masuk Riil</p>
          <p className="text-lg sm:text-xl font-bold text-brand-green">{fmt(totals.totalKasMasuk || 0)}</p>
          <span className={`text-[11px] font-semibold ${(totals.totalPiutang || 0) > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
            {(totals.totalPiutang || 0) > 0 ? `Piutang: ${fmtShort(totals.totalPiutang || 0)}` : 'Tagihan Lunas'}
          </span>
        </div>
      </div>

      {/* ─── Kontainer Tabel Buku Kas ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {isYearly ? `Laporan Keuangan Tahunan: Tahun ${selYear}` : `Buku Rekap Harian: ${monthLabel}`}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isYearly
                ? 'Rekap arus keuangan komprehensif selama 1 tahun penuh'
                : 'Rincian arus penjualan, modal, pengeluaran, dan laba harian toko'}
            </p>
          </div>

          {/* Opsi Switcher jika sedang melihat 1 Tahun Penuh */}
          {isYearly ? (
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setYearlyViewType('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${yearlyViewType === 'monthly'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                📊 Rekap 12 Bulan
              </button>
              <button
                onClick={() => setYearlyViewType('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${yearlyViewType === 'daily'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                📅 Rekap Harian ({days.length} hari)
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-600 rounded-lg">
              {days.length} Baris Data
            </span>
          )}
        </div>

        {/* ─── KONTEN TABEL: PILIHAN TAHUNAN (12 BULAN) ─────────── */}
        {isYearly && yearlyViewType === 'monthly' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3.5 text-center">No</th>
                  <th className="px-4 py-3.5">Bulan</th>
                  <th className="px-3 py-3.5 text-center">Trx</th>
                  <th className="px-4 py-3.5 text-right">Penjualan (Omzet)</th>
                  {isOwner && <th className="px-4 py-3.5 text-right">Modal (HPP)</th>}
                  {isOwner && <th className="px-4 py-3.5 text-right">Laba Kotor</th>}
                  <th className="px-4 py-3.5 text-right">Pengeluaran</th>
                  {isOwner && <th className="px-4 py-3.5 text-right">Laba Bersih</th>}
                  <th className="px-4 py-3.5 text-right">Kas Masuk</th>
                  <th className="px-4 py-3.5 text-right">Sisa Tagihan</th>
                  <th className="px-4 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {months.map((m, index) => {
                  const isNetPositive = m.labaBersih > 0
                  const isNetNegative = m.labaBersih < 0

                  return (
                    <tr
                      key={m.monthIndex}
                      className={`hover:bg-gray-50/80 transition-colors ${!m.hasActivity ? 'opacity-40 bg-gray-50/10' : ''
                        }`}
                    >
                      <td className="px-4 py-3 text-center text-xs text-gray-400 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">
                        {m.monthName}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap font-medium text-gray-600">
                        {m.trxCount > 0 ? (
                          <span className="px-2 py-0.5 bg-green-50 text-brand-dark-green rounded-full text-xs font-bold">
                            {m.trxCount}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-gray-800">
                        {m.penjualan > 0 ? fmt(m.penjualan) : 'Rp 0'}
                      </td>
                      {isOwner && (
                        <td className="px-4 py-3 text-right whitespace-nowrap text-gray-600 font-medium">
                          {m.modal > 0 ? fmt(m.modal) : 'Rp 0'}
                        </td>
                      )}
                      {isOwner && (
                        <td className={`px-4 py-3 text-right whitespace-nowrap font-semibold ${m.labaKotor > 0 ? 'text-blue-600' : m.labaKotor < 0 ? 'text-red-500' : 'text-gray-400'
                          }`}>
                          {fmt(m.labaKotor)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-red-500">
                        {m.pengeluaran > 0 ? fmt(m.pengeluaran) : 'Rp 0'}
                      </td>
                      {isOwner && (
                        <td className="px-4 py-3 text-right whitespace-nowrap font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold inline-block ${isNetPositive
                                ? 'bg-green-50 text-green-700'
                                : isNetNegative
                                  ? 'bg-red-50 text-red-600'
                                  : 'text-gray-400'
                              }`}
                          >
                            {fmt(m.labaBersih)}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-brand-green">
                        {m.kasMasuk > 0 ? fmt(m.kasMasuk) : 'Rp 0'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-medium">
                        {m.piutang > 0 ? (
                          <span className="text-orange-600 font-semibold">{fmt(m.piutang)}</span>
                        ) : (
                          <span className="text-gray-300">Rp 0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelMonth(m.monthIndex)}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          title={`Buka rekap harian bulan ${m.monthName}`}
                        >
                          📅 Buka Bulan
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-100/90 font-bold text-gray-900 border-t-2 border-gray-200">
                <tr>
                  <td className="px-4 py-4 text-center font-bold text-xs uppercase" colSpan={2}>
                    TOTAL TAHUN {selYear}
                  </td>
                  <td className="px-3 py-4 text-center text-xs">
                    <span className="px-2 py-1 bg-white rounded-md shadow-xs">
                      {totals.totalTrx || 0}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    {fmt(totals.totalPenjualan || 0)}
                  </td>
                  {isOwner && (
                    <td className="px-4 py-4 text-right whitespace-nowrap text-gray-700">
                      {fmt(totals.totalModal || 0)}
                    </td>
                  )}
                  {isOwner && (
                    <td className={`px-4 py-4 text-right whitespace-nowrap ${(totals.totalLabaKotor || 0) >= 0 ? 'text-blue-700' : 'text-red-600'
                      }`}>
                      {fmt(totals.totalLabaKotor || 0)}
                    </td>
                  )}
                  <td className="px-4 py-4 text-right whitespace-nowrap text-red-600">
                    {fmt(totals.totalPengeluaran || 0)}
                  </td>
                  {isOwner && (
                    <td className={`px-4 py-4 text-right whitespace-nowrap ${(totals.totalLabaBersih || 0) >= 0 ? 'text-green-700' : 'text-red-600'
                      }`}>
                      <span className="text-sm px-2.5 py-1 bg-white rounded-lg shadow-xs">
                        {fmt(totals.totalLabaBersih || 0)}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-4 text-right whitespace-nowrap text-emerald-700">
                    {fmt(totals.totalKasMasuk || 0)}
                  </td>
                  <td className={`px-4 py-4 text-right whitespace-nowrap ${(totals.totalPiutang || 0) > 0 ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                    {fmt(totals.totalPiutang || 0)}
                  </td>
                  <td className="px-4 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* ─── KONTEN TABEL: REKAP HARIAN (BULANAN / TAHUNAN) ─── */
          days.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              <p className="text-3xl mb-2">📂</p>
              <p>Tidak ada transaksi atau pengeluaran pada {monthLabel}</p>
              {onlyActiveDays && (
                <button
                  onClick={() => setOnlyActiveDays(false)}
                  className="mt-3 text-xs text-brand-green hover:underline font-semibold"
                >
                  Tampilkan semua tanggal (1 - akhir bulan)
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3.5 text-center">No</th>
                    <th className="px-4 py-3.5">Tanggal</th>
                    {isYearly && <th className="px-3 py-3.5">Bulan</th>}
                    <th className="px-3 py-3.5 text-center">Trx</th>
                    <th className="px-4 py-3.5 text-right">Penjualan (Omzet)</th>
                    {isOwner && <th className="px-4 py-3.5 text-right">Modal (HPP)</th>}
                    {isOwner && <th className="px-4 py-3.5 text-right">Laba Kotor</th>}
                    <th className="px-4 py-3.5 text-right">Pengeluaran</th>
                    {isOwner && <th className="px-4 py-3.5 text-right">Laba Bersih</th>}
                    <th className="px-4 py-3.5 text-right">Kas Masuk</th>
                    <th className="px-4 py-3.5 text-right">Sisa Tagihan</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {days.map((d, index) => {
                    const isWeekend = d.dayName === 'Min' || d.dayName === 'Sab'
                    const isNetProfitPositive = d.labaBersih > 0
                    const isNetProfitNegative = d.labaBersih < 0

                    return (
                      <tr
                        key={d.dateKey}
                        className={`hover:bg-gray-50/80 transition-colors ${!d.hasActivity ? 'opacity-40 bg-gray-50/20' : ''
                          } ${isWeekend ? 'bg-amber-50/10' : ''}`}
                      >
                        <td className="px-4 py-3 text-center text-xs text-gray-400 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.dayName === 'Min'
                                  ? 'bg-red-50 text-red-600'
                                  : d.dayName === 'Sab'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                              {d.dayName}
                            </span>
                            <span className="font-semibold text-gray-800">
                              {new Date(d.dateKey).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        </td>
                        {isYearly && (
                          <td className="px-3 py-3 whitespace-nowrap text-xs font-semibold text-gray-500">
                            {d.monthName}
                          </td>
                        )}
                        <td className="px-3 py-3 text-center whitespace-nowrap font-medium text-gray-600">
                          {d.trxCount > 0 ? (
                            <span className="px-2 py-0.5 bg-green-50 text-brand-dark-green rounded-full text-xs font-bold">
                              {d.trxCount}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-gray-800">
                          {d.penjualan > 0 ? fmt(d.penjualan) : 'Rp 0'}
                        </td>
                        {isOwner && (
                          <td className="px-4 py-3 text-right whitespace-nowrap text-gray-600 font-medium">
                            {d.modal > 0 ? fmt(d.modal) : 'Rp 0'}
                          </td>
                        )}
                        {isOwner && (
                          <td className={`px-4 py-3 text-right whitespace-nowrap font-semibold ${d.labaKotor > 0 ? 'text-blue-600' : d.labaKotor < 0 ? 'text-red-500' : 'text-gray-400'
                            }`}>
                            {fmt(d.labaKotor)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-red-500">
                          {d.pengeluaran > 0 ? fmt(d.pengeluaran) : 'Rp 0'}
                        </td>
                        {isOwner && (
                          <td className="px-4 py-3 text-right whitespace-nowrap font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-bold inline-block ${isNetProfitPositive
                                  ? 'bg-green-50 text-green-700'
                                  : isNetProfitNegative
                                    ? 'bg-red-50 text-red-600'
                                    : 'text-gray-400'
                                }`}
                            >
                              {fmt(d.labaBersih)}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-brand-green">
                          {d.kasMasuk > 0 ? fmt(d.kasMasuk) : 'Rp 0'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-medium">
                          {d.piutang > 0 ? (
                            <span className="text-orange-600 font-semibold">{fmt(d.piutang)}</span>
                          ) : (
                            <span className="text-gray-300">Rp 0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {d.hasActivity ? (
                            <button
                              onClick={() => setSelectedDetailDay(d)}
                              className="px-2.5 py-1 text-xs font-bold text-brand-dark-green bg-brand-pale-green hover:bg-green-100 rounded-lg transition-colors"
                              title="Lihat rincian transaksi & pengeluaran hari ini"
                            >
                              👁️ Detail
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-gray-100/90 font-bold text-gray-900 border-t-2 border-gray-200">
                  <tr>
                    <td className="px-4 py-4 text-center font-bold text-xs uppercase" colSpan={isYearly ? 3 : 2}>
                      {isYearly ? `TOTAL TAHUN ${selYear}` : 'TOTAL BULANAN'}
                    </td>
                    <td className="px-3 py-4 text-center text-xs">
                      <span className="px-2 py-1 bg-white rounded-md shadow-xs">
                        {totals.totalTrx || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      {fmt(totals.totalPenjualan || 0)}
                    </td>
                    {isOwner && (
                      <td className="px-4 py-4 text-right whitespace-nowrap text-gray-700">
                        {fmt(totals.totalModal || 0)}
                      </td>
                    )}
                    {isOwner && (
                      <td className={`px-4 py-4 text-right whitespace-nowrap ${(totals.totalLabaKotor || 0) >= 0 ? 'text-blue-700' : 'text-red-600'
                        }`}>
                        {fmt(totals.totalLabaKotor || 0)}
                      </td>
                    )}
                    <td className="px-4 py-4 text-right whitespace-nowrap text-red-600">
                      {fmt(totals.totalPengeluaran || 0)}
                    </td>
                    {isOwner && (
                      <td className={`px-4 py-4 text-right whitespace-nowrap ${(totals.totalLabaBersih || 0) >= 0 ? 'text-green-700' : 'text-red-600'
                        }`}>
                        <span className="text-sm px-2.5 py-1 bg-white rounded-lg shadow-xs">
                          {fmt(totals.totalLabaBersih || 0)}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-4 text-right whitespace-nowrap text-emerald-700">
                      {fmt(totals.totalKasMasuk || 0)}
                    </td>
                    <td className={`px-4 py-4 text-right whitespace-nowrap ${(totals.totalPiutang || 0) > 0 ? 'text-orange-600' : 'text-gray-500'
                      }`}>
                      {fmt(totals.totalPiutang || 0)}
                    </td>
                    <td className="px-4 py-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        )}
      </div>

      {/* ─── Modal Pop-up Rincian Harian ─────────────────────────── */}
      {selectedDetailDay && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <span className="text-xs font-bold text-brand-green uppercase tracking-wider block mb-1">
                  Rincian Keuangan Harian
                </span>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>📅</span>
                  <span>
                    {new Date(selectedDetailDay.dateKey).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailDay(null)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-lg font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Quick Badges */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                <span className="text-gray-400 block">Penjualan (Omzet)</span>
                <span className="font-bold text-gray-900 text-sm">{fmt(selectedDetailDay.penjualan)}</span>
              </div>
              {isOwner && (
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block">Modal (HPP)</span>
                  <span className="font-bold text-gray-800 text-sm">{fmt(selectedDetailDay.modal)}</span>
                </div>
              )}
              <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                <span className="text-gray-400 block">Pengeluaran Toko</span>
                <span className="font-bold text-red-500 text-sm">{fmt(selectedDetailDay.pengeluaran)}</span>
              </div>
              {isOwner && (
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block">Laba Bersih Hari Ini</span>
                  <span className={`font-black text-sm ${selectedDetailDay.labaBersih >= 0 ? 'text-brand-green' : 'text-red-600'}`}>
                    {fmt(selectedDetailDay.labaBersih)}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Transaksi Penjualan */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🛍️</span>
                  <span>Transaksi Penjualan ({selectedDetailDay.transactions.length})</span>
                </h4>
                {selectedDetailDay.transactions.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Tidak ada transaksi penjualan pada tanggal ini.</p>
                ) : (
                  <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                          <th className="px-3 py-2.5">Barang</th>
                          <th className="px-3 py-2.5">Pembeli</th>
                          <th className="px-2 py-2.5 text-center">Qty</th>
                          <th className="px-3 py-2.5 text-right">Total Jual</th>
                          <th className="px-3 py-2.5 text-right">Dibayar</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedDetailDay.transactions.map((t, i) => {
                          const itemTotalJual = (parseFloat(t.jual) || 0) * (parseFloat(t.jumlah) || 1)
                          const itemDibayar = parseFloat(t.uang_dibayarkan) || 0
                          return (
                            <tr key={t.id || i} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2 font-medium text-gray-800">
                                {t.nama}
                                {t.jenis && <span className="text-[10px] text-gray-400 block">{t.jenis}</span>}
                              </td>
                              <td className="px-3 py-2 text-gray-600">{t.nama_pembeli || '-'}</td>
                              <td className="px-2 py-2 text-center font-bold text-gray-700">{t.jumlah}</td>
                              <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmt(itemTotalJual)}</td>
                              <td className="px-3 py-2 text-right text-brand-green font-semibold">{fmt(itemDibayar)}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[t.status_pesanan] || 'bg-gray-100'}`}>
                                  {t.status_pesanan}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pengeluaran Operasional */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>💸</span>
                  <span>Pengeluaran Operasional Toko ({selectedDetailDay.expenses.length})</span>
                </h4>
                {selectedDetailDay.expenses.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Tidak ada pengeluaran operasional pada tanggal ini.</p>
                ) : (
                  <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                          <th className="px-3 py-2.5">Keterangan Pengeluaran</th>
                          <th className="px-3 py-2.5 text-right">Nominal (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedDetailDay.expenses.map((ex, i) => (
                          <tr key={ex.id || i} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2.5 text-gray-800 font-medium">{ex.keterangan}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-red-500">{fmt(ex.nominal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedDetailDay(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TabelBukuKas
