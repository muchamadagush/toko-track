export function fmt(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export function fmtShort(n) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(1)}M`
  if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(1)}jt`
  if (abs >= 1e3) return `${sign}Rp ${(abs / 1e3).toFixed(1)}rb`
  return `${sign}Rp ${Math.round(abs).toLocaleString('id-ID')}`
}

export const STATUS_PESANAN = ['Lunas', 'DP / Belum Lunas', 'Belum Bayar']

export const STATUS_COLOR = {
  'Lunas':            'bg-green-50 text-green-700',
  'DP / Belum Lunas': 'bg-amber-50 text-amber-700',
  'Belum Bayar':      'bg-red-50 text-red-600',
}

export function calcItem(item) {
  const modalLain = parseFloat(item.modal_lain_nominal) || 0
  const totalModal = (item.modal * item.jumlah) + modalLain
  const totalJual = item.jual * item.jumlah
  const laba = totalJual - totalModal
  const margin = totalModal > 0 ? (laba / totalModal) * 100 : 0
  
  const dibayar = parseFloat(item.uang_dibayarkan) || 0
  const kurang = totalJual - dibayar
  
  return { totalModal, totalJual, laba, margin, modalLain, dibayar, kurang }
}

export function calcSummary(items, expenses = []) {
  const summary = items.reduce(
    (acc, item) => {
      const { totalModal, totalJual, laba, dibayar, kurang } = calcItem(item)
      acc.totalModal += totalModal
      acc.totalJual += totalJual
      acc.totalGrossLaba += laba // Rename internal totalLaba to Gross
      acc.totalDibayar += dibayar
      acc.totalKurang += kurang
      acc.count++
      return acc
    },
    { totalModal: 0, totalJual: 0, totalGrossLaba: 0, totalDibayar: 0, totalKurang: 0, count: 0, totalExpense: 0, totalLaba: 0 }
  )

  summary.totalExpense = expenses.reduce((acc, ex) => acc + (parseFloat(ex.nominal) || 0), 0)
  summary.totalLaba = summary.totalGrossLaba - summary.totalExpense
  
  return summary
}

export const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
export const MONTHS_FULL = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
