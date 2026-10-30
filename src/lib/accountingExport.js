import * as XLSX from 'xlsx'
import { calcItem, MONTHS_FULL } from './utils.js'

/**
 * Agregasi data transaksi & pengeluaran menjadi buku kas harian untuk 1 bulan atau 1 tahun penuh
 */
export function buildDailyAccountingData({ transactions = [], expenses = [], year, monthIndex, onlyActiveDays = false }) {
  const y = parseInt(year, 10)
  const isYearly = monthIndex === 'all' || monthIndex === -1

  // Filter transaksi & pengeluaran untuk tahun yang dipilih
  const allYearTransactions = transactions.filter(t => {
    if (!t.tanggal) return false
    const d = new Date(t.tanggal)
    return d.getFullYear() === y
  })

  const allYearExpenses = expenses.filter(e => {
    if (!e.tanggal) return false
    const d = new Date(e.tanggal)
    return d.getFullYear() === y
  })

  const totals = {
    totalTrx: 0,
    totalPenjualan: 0,
    totalModal: 0,
    totalLabaKotor: 0,
    totalPengeluaran: 0,
    totalLabaBersih: 0,
    totalKasMasuk: 0,
    totalPiutang: 0,
  }

  // JIKA FILTER 1 TAHUN PENUH
  if (isYearly) {
    const months = []
    const allDays = []

    for (let m = 0; m < 12; m++) {
      const monthTrx = allYearTransactions.filter(t => new Date(t.tanggal).getMonth() === m)
      const monthExp = allYearExpenses.filter(e => new Date(e.tanggal).getMonth() === m)
      const daysInMonth = new Date(y, m + 1, 0).getDate()

      let mPenjualan = 0
      let mModal = 0
      let mKasMasuk = 0
      let mPiutang = 0

      monthTrx.forEach(item => {
        const { totalModal, totalJual, dibayar, kurang } = calcItem(item)
        mPenjualan += totalJual
        mModal += totalModal
        mKasMasuk += dibayar
        mPiutang += kurang
      })

      const mLabaKotor = mPenjualan - mModal
      const mPengeluaran = monthExp.reduce((acc, curr) => acc + (parseFloat(curr.nominal) || 0), 0)
      const mLabaBersih = mLabaKotor - mPengeluaran

      const monthSummary = {
        monthIndex: m,
        monthName: MONTHS_FULL[m],
        trxCount: monthTrx.length,
        penjualan: mPenjualan,
        modal: mModal,
        labaKotor: mLabaKotor,
        pengeluaran: mPengeluaran,
        labaBersih: mLabaBersih,
        kasMasuk: mKasMasuk,
        piutang: mPiutang,
        transactions: monthTrx,
        expenses: monthExp,
        hasActivity: monthTrx.length > 0 || monthExp.length > 0,
      }

      months.push(monthSummary)

      // Hitung juga rekaman harian per bulan
      const trxByDate = {}
      monthTrx.forEach(t => {
        const key = t.tanggal.slice(0, 10)
        if (!trxByDate[key]) trxByDate[key] = []
        trxByDate[key].push(t)
      })

      const expByDate = {}
      monthExp.forEach(e => {
        const key = e.tanggal.slice(0, 10)
        if (!expByDate[key]) expByDate[key] = []
        expByDate[key].push(e)
      })

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0')
        const monthStr = String(m + 1).padStart(2, '0')
        const dateKey = `${y}-${monthStr}-${dayStr}`
        const dateObj = new Date(y, m, day)
        const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' })

        const dayTrx = trxByDate[dateKey] || []
        const dayExp = expByDate[dateKey] || []
        const hasActivity = dayTrx.length > 0 || dayExp.length > 0

        let dayPenjualan = 0
        let dayModal = 0
        let dayKasMasuk = 0
        let dayPiutang = 0

        dayTrx.forEach(item => {
          const { totalModal, totalJual, dibayar, kurang } = calcItem(item)
          dayPenjualan += totalJual
          dayModal += totalModal
          dayKasMasuk += dibayar
          dayPiutang += kurang
        })

        const dayLabaKotor = dayPenjualan - dayModal
        const dayPengeluaran = dayExp.reduce((acc, curr) => acc + (parseFloat(curr.nominal) || 0), 0)
        const dayLabaBersih = dayLabaKotor - dayPengeluaran

        const dayRecord = {
          day,
          dateKey,
          dayName,
          hasActivity,
          trxCount: dayTrx.length,
          penjualan: dayPenjualan,
          modal: dayModal,
          labaKotor: dayLabaKotor,
          pengeluaran: dayPengeluaran,
          labaBersih: dayLabaBersih,
          kasMasuk: dayKasMasuk,
          piutang: dayPiutang,
          transactions: dayTrx,
          expenses: dayExp,
          monthName: MONTHS_FULL[m],
        }

        if (!onlyActiveDays || hasActivity) {
          allDays.push(dayRecord)
        }
      }

      // Akumulasi total tahunan
      totals.totalTrx += monthSummary.trxCount
      totals.totalPenjualan += monthSummary.penjualan
      totals.totalModal += monthSummary.modal
      totals.totalLabaKotor += monthSummary.labaKotor
      totals.totalPengeluaran += monthSummary.pengeluaran
      totals.totalLabaBersih += monthSummary.labaBersih
      totals.totalKasMasuk += monthSummary.kasMasuk
      totals.totalPiutang += monthSummary.piutang
    }

    return {
      isYearly: true,
      months,
      days: allDays,
      totals,
      monthTransactions: allYearTransactions,
      monthExpenses: allYearExpenses,
      periodLabel: `Tahun ${y} (1 Tahun Penuh)`,
      monthLabel: `Tahun ${y} (1 Tahun Penuh)`,
      year: y,
    }
  }

  // JIKA FILTER 1 BULAN SPESIFIK
  const m = parseInt(monthIndex, 10)
  const daysInMonth = new Date(y, m + 1, 0).getDate()

  const monthTransactions = allYearTransactions.filter(t => new Date(t.tanggal).getMonth() === m)
  const monthExpenses = allYearExpenses.filter(e => new Date(e.tanggal).getMonth() === m)

  const trxByDate = {}
  monthTransactions.forEach(t => {
    const key = t.tanggal.slice(0, 10)
    if (!trxByDate[key]) trxByDate[key] = []
    trxByDate[key].push(t)
  })

  const expByDate = {}
  monthExpenses.forEach(e => {
    const key = e.tanggal.slice(0, 10)
    if (!expByDate[key]) expByDate[key] = []
    expByDate[key].push(e)
  })

  const days = []

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0')
    const monthStr = String(m + 1).padStart(2, '0')
    const dateKey = `${y}-${monthStr}-${dayStr}`
    const dateObj = new Date(y, m, day)
    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' })

    const dayTrx = trxByDate[dateKey] || []
    const dayExp = expByDate[dateKey] || []
    const hasActivity = dayTrx.length > 0 || dayExp.length > 0

    let dayPenjualan = 0
    let dayModal = 0
    let dayKasMasuk = 0
    let dayPiutang = 0

    dayTrx.forEach(item => {
      const { totalModal, totalJual, dibayar, kurang } = calcItem(item)
      dayPenjualan += totalJual
      dayModal += totalModal
      dayKasMasuk += dibayar
      dayPiutang += kurang
    })

    const dayLabaKotor = dayPenjualan - dayModal
    const dayPengeluaran = dayExp.reduce((acc, curr) => acc + (parseFloat(curr.nominal) || 0), 0)
    const dayLabaBersih = dayLabaKotor - dayPengeluaran

    const dayRecord = {
      day,
      dateKey,
      dayName,
      hasActivity,
      trxCount: dayTrx.length,
      penjualan: dayPenjualan,
      modal: dayModal,
      labaKotor: dayLabaKotor,
      pengeluaran: dayPengeluaran,
      labaBersih: dayLabaBersih,
      kasMasuk: dayKasMasuk,
      piutang: dayPiutang,
      transactions: dayTrx,
      expenses: dayExp,
      monthName: MONTHS_FULL[m],
    }

    totals.totalTrx += dayRecord.trxCount
    totals.totalPenjualan += dayRecord.penjualan
    totals.totalModal += dayRecord.modal
    totals.totalLabaKotor += dayRecord.labaKotor
    totals.totalPengeluaran += dayRecord.pengeluaran
    totals.totalLabaBersih += dayRecord.labaBersih
    totals.totalKasMasuk += dayRecord.kasMasuk
    totals.totalPiutang += dayRecord.piutang

    if (!onlyActiveDays || hasActivity) {
      days.push(dayRecord)
    }
  }

  return {
    isYearly: false,
    days,
    totals,
    monthTransactions,
    monthExpenses,
    daysInMonth,
    monthLabel: `${MONTHS_FULL[m]} ${y}`,
    periodLabel: `${MONTHS_FULL[m]} ${y}`,
    year: y,
    monthIndex: m,
  }
}

/**
 * Ekspor Buku Rekap Kas ke file Excel (.xlsx) dengan SheetJS
 */
export function exportAccountingToExcel({
  storeName = 'TS Clothing',
  branchName = 'Semua Cabang',
  monthIndex,
  year,
  dailyData = [],
  totals = {},
  monthTransactions = [],
  monthExpenses = [],
  isOwner = true,
  isYearly = false,
  months = [],
}) {
  const isAllYear = isYearly || monthIndex === 'all' || monthIndex === -1
  const monthName = isAllYear ? `Tahun ${year}` : (MONTHS_FULL[monthIndex] || `Bulan ${Number(monthIndex) + 1}`)
  const now = new Date()
  const printDate = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const wb = XLSX.utils.book_new()

  if (isAllYear) {
    // ─────────────────────────────────────────────────────────────
    // SHEET 1: REKAP 12 BULAN (TAHUNAN)
    // ─────────────────────────────────────────────────────────────
    const s1Rows = [
      [storeName.toUpperCase()],
      ['LAPORAN KEUANGAN TAHUNAN (1 TAHUN PENUH)'],
      [`Periode: Tahun ${year}  |  Cabang: ${branchName}`],
      [`Dicetak pada: ${printDate}`],
      [],
    ]

    let s1Headers = ['No', 'Bulan', 'Jml Transaksi', 'Total Penjualan (Omzet)']
    if (isOwner) {
      s1Headers.push('Total Modal (HPP)', 'Laba Kotor')
    }
    s1Headers.push('Pengeluaran Toko')
    if (isOwner) {
      s1Headers.push('Laba Bersih')
    }
    s1Headers.push('Kas Masuk (Dibayar)', 'Sisa Tagihan (Piutang)')
    s1Rows.push(s1Headers)

    months.forEach((m, idx) => {
      const row = [
        idx + 1,
        m.monthName,
        m.trxCount,
        m.penjualan,
      ]
      if (isOwner) {
        row.push(m.modal, m.labaKotor)
      }
      row.push(m.pengeluaran)
      if (isOwner) {
        row.push(m.labaBersih)
      }
      row.push(m.kasMasuk, m.piutang)
      s1Rows.push(row)
    })

    const totalRow = [
      'TOTAL',
      `1 Tahun (${year})`,
      totals.totalTrx || 0,
      totals.totalPenjualan || 0,
    ]
    if (isOwner) {
      totalRow.push(totals.totalModal || 0, totals.totalLabaKotor || 0)
    }
    totalRow.push(totals.totalPengeluaran || 0)
    if (isOwner) {
      totalRow.push(totals.totalLabaBersih || 0)
    }
    totalRow.push(totals.totalKasMasuk || 0, totals.totalPiutang || 0)
    s1Rows.push(totalRow)

    const ws1 = XLSX.utils.aoa_to_sheet(s1Rows)
    ws1['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 14 },
      { wch: 22 },
      ...(isOwner ? [{ wch: 20 }, { wch: 20 }] : []),
      { wch: 20 },
      ...(isOwner ? [{ wch: 20 }] : []),
      { wch: 22 },
      { wch: 22 },
    ]
    XLSX.utils.book_append_sheet(wb, ws1, `Rekap 12 Bulan ${year}`)

    // ─────────────────────────────────────────────────────────────
    // SHEET 2: REKAP HARIAN (SEMUA TANGGAL 1 TAHUN)
    // ─────────────────────────────────────────────────────────────
    const s2DailyRows = [
      [storeName.toUpperCase()],
      [`REKAP HARIAN SEPANJANG TAHUN ${year}`],
      [`Dicetak pada: ${printDate}`],
      [],
    ]
    let s2Headers = ['No', 'Tanggal', 'Bulan', 'Hari', 'Jml Transaksi', 'Total Penjualan']
    if (isOwner) s2Headers.push('Modal (HPP)', 'Laba Kotor')
    s2Headers.push('Pengeluaran')
    if (isOwner) s2Headers.push('Laba Bersih')
    s2Headers.push('Kas Masuk', 'Sisa Tagihan')
    s2DailyRows.push(s2Headers)

    dailyData.forEach((d, idx) => {
      const formattedDate = new Date(d.dateKey).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      const row = [
        idx + 1,
        formattedDate,
        d.monthName || '-',
        d.dayName,
        d.trxCount,
        d.penjualan,
      ]
      if (isOwner) row.push(d.modal, d.labaKotor)
      row.push(d.pengeluaran)
      if (isOwner) row.push(d.labaBersih)
      row.push(d.kasMasuk, d.piutang)
      s2DailyRows.push(row)
    })

    const ws2Daily = XLSX.utils.aoa_to_sheet(s2DailyRows)
    ws2Daily['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 14 },
      { wch: 8 },
      { wch: 14 },
      { wch: 20 },
      ...(isOwner ? [{ wch: 18 }, { wch: 18 }] : []),
      { wch: 18 },
      ...(isOwner ? [{ wch: 18 }] : []),
      { wch: 20 },
      { wch: 20 },
    ]
    XLSX.utils.book_append_sheet(wb, ws2Daily, `Rekap Harian ${year}`)

  } else {
    // ─────────────────────────────────────────────────────────────
    // SHEET 1: REKAP HARIAN (BUKU KAS 1 BULAN)
    // ─────────────────────────────────────────────────────────────
    const s1Rows = [
      [storeName.toUpperCase()],
      ['LAPORAN KEUANGAN & BUKU KAS HARIAN'],
      [`Periode: ${monthName} ${year}  |  Cabang: ${branchName}`],
      [`Dicetak pada: ${printDate}`],
      [],
    ]

    let s1Headers = ['No', 'Tanggal', 'Hari', 'Jml Transaksi', 'Total Penjualan (Omzet)']
    if (isOwner) {
      s1Headers.push('Total Modal (HPP)', 'Laba Kotor')
    }
    s1Headers.push('Pengeluaran Toko')
    if (isOwner) {
      s1Headers.push('Laba Bersih')
    }
    s1Headers.push('Kas Masuk (Dibayar)', 'Sisa Tagihan (Piutang)')
    s1Rows.push(s1Headers)

    dailyData.forEach((d, idx) => {
      const formattedDate = new Date(d.dateKey).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })

      const row = [
        idx + 1,
        formattedDate,
        d.dayName,
        d.trxCount,
        d.penjualan,
      ]

      if (isOwner) {
        row.push(d.modal, d.labaKotor)
      }

      row.push(d.pengeluaran)

      if (isOwner) {
        row.push(d.labaBersih)
      }

      row.push(d.kasMasuk, d.piutang)
      s1Rows.push(row)
    })

    const totalRow = [
      'TOTAL',
      `${dailyData.length} Hari`,
      '-',
      totals.totalTrx || 0,
      totals.totalPenjualan || 0,
    ]

    if (isOwner) {
      totalRow.push(totals.totalModal || 0, totals.totalLabaKotor || 0)
    }

    totalRow.push(totals.totalPengeluaran || 0)

    if (isOwner) {
      totalRow.push(totals.totalLabaBersih || 0)
    }

    totalRow.push(totals.totalKasMasuk || 0, totals.totalPiutang || 0)
    s1Rows.push(totalRow)

    const ws1 = XLSX.utils.aoa_to_sheet(s1Rows)
    ws1['!cols'] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 8 },
      { wch: 14 },
      { wch: 22 },
      ...(isOwner ? [{ wch: 20 }, { wch: 20 }] : []),
      { wch: 20 },
      ...(isOwner ? [{ wch: 20 }] : []),
      { wch: 22 },
      { wch: 22 },
    ]

    XLSX.utils.book_append_sheet(wb, ws1, 'Rekap Kas Harian')
  }

  // ─────────────────────────────────────────────────────────────
  // SHEET: DAFTAR TRANSAKSI PENJUALAN
  // ─────────────────────────────────────────────────────────────
  const sTrxRows = [
    [storeName.toUpperCase()],
    [`RINCIAN PENJUALAN — ${monthName.toUpperCase()} ${year}`],
    [],
  ]

  let sTrxHeaders = [
    'No',
    'Tanggal',
    'Nama Barang',
    'Jenis/Model',
    'Kategori',
    'Nama Pembeli',
    'Jumlah (Qty)',
  ]
  if (isOwner) {
    sTrxHeaders.push('Harga Modal (Satuan)', 'Total Modal')
  }
  sTrxHeaders.push('Harga Jual (Satuan)', 'Total Penjualan', 'Dibayar', 'Kurang', 'Status Pembayaran')
  sTrxRows.push(sTrxHeaders)

  let tCount = 0
  monthTransactions.forEach(t => {
    tCount++
    const { totalModal, totalJual, dibayar, kurang } = calcItem(t)
    const formattedDate = new Date(t.tanggal).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

    const row = [
      tCount,
      formattedDate,
      t.nama || '-',
      t.jenis || t.bahan_model || '-',
      t.kategori || 'Lainnya',
      t.nama_pembeli || '-',
      parseFloat(t.jumlah) || 1,
    ]

    if (isOwner) {
      row.push(parseFloat(t.modal) || 0, totalModal)
    }

    row.push(
      parseFloat(t.jual) || 0,
      totalJual,
      dibayar,
      kurang,
      t.status_pesanan || 'Lunas'
    )

    sTrxRows.push(row)
  })

  if (monthTransactions.length === 0) {
    sTrxRows.push(['Tidak ada transaksi penjualan pada periode ini'])
  }

  const wsTrx = XLSX.utils.aoa_to_sheet(sTrxRows)
  wsTrx['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    { wch: 12 },
    ...(isOwner ? [{ wch: 18 }, { wch: 18 }] : []),
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, wsTrx, 'Daftar Penjualan')

  // ─────────────────────────────────────────────────────────────
  // SHEET: DAFTAR PENGELUARAN TOKO
  // ─────────────────────────────────────────────────────────────
  const sExpRows = [
    [storeName.toUpperCase()],
    [`RINCIAN PENGELUARAN OPERASIONAL — ${monthName.toUpperCase()} ${year}`],
    [],
  ]

  sExpRows.push(['No', 'Tanggal', 'Keterangan Pengeluaran', 'Nominal (Rp)'])

  let eCount = 0
  let totalExps = 0
  monthExpenses.forEach(e => {
    eCount++
    const nom = parseFloat(e.nominal) || 0
    totalExps += nom
    const formattedDate = new Date(e.tanggal).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

    sExpRows.push([eCount, formattedDate, e.keterangan || '-', nom])
  })

  if (monthExpenses.length === 0) {
    sExpRows.push(['Tidak ada pengeluaran operasional pada periode ini'])
  } else {
    sExpRows.push(['TOTAL', `${eCount} Pengeluaran`, '-', totalExps])
  }

  const wsExp = XLSX.utils.aoa_to_sheet(sExpRows)
  wsExp['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 35 },
    { wch: 20 },
  ]
  XLSX.utils.book_append_sheet(wb, wsExp, 'Daftar Pengeluaran')

  // ─────────────────────────────────────────────────────────────
  // SIMPAN & DOWNLOAD FILE EXCEL
  // ─────────────────────────────────────────────────────────────
  const sanitizedStore = storeName.replace(/[^a-zA-Z0-9]/g, '_')
  const filename = isAllYear
    ? `Rekap_Keuangan_${sanitizedStore}_Tahun_${year}.xlsx`
    : `Rekap_Keuangan_${sanitizedStore}_${monthName}_${year}.xlsx`

  XLSX.writeFile(wb, filename)
}
