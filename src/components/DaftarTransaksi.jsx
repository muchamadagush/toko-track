import { useState } from 'react'
import { fmt, calcItem, STATUS_PESANAN, STATUS_COLOR } from '../lib/utils'

export default function DaftarTransaksi({ transactions, categories, onDelete, onUpdate, onDeleteAll, loading }) {
  const [search, setSearch] = useState('')
  const [filterKat, setFilterKat] = useState('Semua')
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [sortBy, setSortBy] = useState('tanggal_desc')
  const [deleting, setDeleting] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [addPay, setAddPay] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  const filtered = transactions
    .filter(d => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        d.nama.toLowerCase().includes(q) ||
        (d.nama_pembeli || '').toLowerCase().includes(q) ||
        (d.bahan_model || '').toLowerCase().includes(q) ||
        (d.catatan || '').toLowerCase().includes(q)
      const matchKat = filterKat === 'Semua' || d.kategori === filterKat
      const matchStatus = filterStatus === 'Semua' || d.status_pesanan === filterStatus
      return matchSearch && matchKat && matchStatus
    })
    .sort((a, b) => {
      if (sortBy === 'tanggal_desc') return new Date(b.tanggal) - new Date(a.tanggal)
      if (sortBy === 'tanggal_asc') return new Date(a.tanggal) - new Date(b.tanggal)
      if (sortBy === 'deadline') return new Date(a.deadline || '9999') - new Date(b.deadline || '9999')
      if (sortBy === 'laba_desc') return calcItem(b).laba - calcItem(a).laba
      if (sortBy === 'laba_asc') return calcItem(a).laba - calcItem(b).laba
      if (sortBy === 'nama') return a.nama.localeCompare(b.nama)
      if (sortBy === 'pembeli') return (a.nama_pembeli || '').localeCompare(b.nama_pembeli || '')
      return 0
    })

  function deadlineBadge(deadline) {
    if (!deadline) return null
    const diff = Math.ceil((new Date(deadline) - new Date(today)) / 86400000)
    if (diff < 0) return <span className="text-xs text-red-500 font-medium">Lewat {Math.abs(diff)}h</span>
    if (diff === 0) return <span className="text-xs text-orange-500 font-medium">Hari ini!</span>
    if (diff <= 3) return <span className="text-xs text-amber-500 font-medium">{diff} hari lagi</span>
    return <span className="text-xs text-gray-400">{deadline}</span>
  }

  async function handleDelete(id) {
    if (!confirm('Hapus transaksi ini?')) return
    setDeleting(id)
    try { await onDelete(id) } catch (e) { alert(e.message) }
    setDeleting(null)
  }

  async function handleDeleteAll() {
    if (!confirm('Hapus SEMUA data transaksi? Tindakan ini tidak dapat dibatalkan.')) return
    try { await onDeleteAll() } catch (e) { alert(e.message) }
  }

  async function handleSetLunas(id, totalJual) {
    if (!confirm('Set transaksi ini sebagai lunas?')) return
    setUpdating(id)
    try {
      await onUpdate(id, {
        status_pesanan: 'Lunas',
        uang_dibayarkan: totalJual
      })
    } catch (e) {
      alert(e.message)
    }
    setUpdating(null)
  }

  async function handleAddPay(id, currentPaid, totalJual) {
    const nominal = parseFloat(addPay) || 0
    if (nominal <= 0) return
    setUpdating(id)
    try {
      const newPaid = currentPaid + nominal
      const isLunas = newPaid >= totalJual
      await onUpdate(id, {
        uang_dibayarkan: newPaid,
        status_pesanan: isLunas ? 'Lunas' : 'DP / Belum Lunas'
      })
      setAddPay('')
    } catch (e) {
      alert(e.message)
    }
    setUpdating(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Daftar Transaksi</h2>
        {transactions.length > 0 && (
          <button onClick={handleDeleteAll} className="text-xs text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
            Hapus Semua
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input placeholder="Cari barang, pembeli, bahan..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
        <select value={filterKat} onChange={e => setFilterKat(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="Semua">Semua Kategori</option>
          {categories.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="Semua">Semua Status</option>
          {STATUS_PESANAN.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="tanggal_desc">Terbaru</option>
          <option value="tanggal_asc">Terlama</option>
          <option value="deadline">Deadline Terdekat</option>
          <option value="laba_desc">Laba Terbesar</option>
          <option value="laba_asc">Laba Terkecil</option>
          <option value="nama">Nama Barang A-Z</option>
          <option value="pembeli">Nama Pembeli A-Z</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {transactions.length === 0 ? 'Belum ada data. Tambahkan pencatatan barang terlebih dahulu.' : 'Tidak ada hasil yang cocok.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const { totalModal, totalJual, laba, margin, modalLain, dibayar, kurang } = calcItem(d)
            const statusCls = STATUS_COLOR[d.status_pesanan] || 'bg-gray-100 text-gray-600'
            const profitCls = laba > 0 ? 'text-green-600' : laba < 0 ? 'text-red-500' : 'text-gray-500'
            const profitBadge = laba > 0 ? 'bg-green-50 text-green-700' : laba < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
            const profitLabel = laba > 0 ? 'Untung' : laba < 0 ? 'Rugi' : 'BEP'
            const isOpen = expanded === d.id

            return (
              <div key={d.id} className="border border-gray-100 rounded-xl overflow-hidden">
                {/* Row utama */}
                <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : d.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{d.nama}</span>
                      {d.bahan_model && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{d.bahan_model}</span>}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${profitBadge}`}>{profitLabel}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCls}`}>{d.status_pesanan}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                      <span>📅 {d.tanggal}</span>
                      {d.nama_pembeli && <span>👤 {d.nama_pembeli}</span>}
                      {d.deadline && <span>⏰ Deadline: {deadlineBadge(d.deadline)}</span>}
                      <span>×{d.jumlah} unit</span>
                      <span>{d.kategori}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${profitCls}`}>{fmt(laba)}</p>
                    <p className="text-xs text-gray-400">{margin.toFixed(1)}% margin</p>
                  </div>
                  <span className="text-gray-300 text-sm mt-1">{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Detail expanded */}
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Harga Modal / unit</p>
                        <p className="font-medium text-gray-800">{fmt(d.modal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Harga Jual / unit</p>
                        <p className="font-medium text-gray-800">{fmt(d.jual)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Total Modal Barang</p>
                        <p className="font-medium text-gray-800">{fmt(d.modal * d.jumlah)}</p>
                      </div>
                      {modalLain > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Modal Lain</p>
                          <p className="font-medium text-gray-800">{fmt(modalLain)}</p>
                          {d.modal_lain && <p className="text-xs text-gray-400 mt-0.5">{d.modal_lain}</p>}
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Total Modal</p>
                        <p className="font-semibold text-gray-900">{fmt(totalModal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Total Penjualan</p>
                        <p className="font-semibold text-gray-900">{fmt(totalJual)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Laba / Rugi</p>
                        <p className={`font-bold ${profitCls}`}>{fmt(laba)} ({margin.toFixed(1)}%)</p>
                      </div>
                      <div className="border-l border-gray-200 pl-4">
                        <p className="text-xs text-gray-400 mb-0.5">Dibayar</p>
                        <p className="font-semibold text-blue-600">{fmt(d.uang_dibayarkan || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Kurang</p>
                        <p className={`font-bold ${kurang > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{fmt(kurang)}</p>
                      </div>
                    </div>

                    {kurang > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Update Pembayaran</p>
                        <div className="flex flex-wrap gap-3 items-end">
                          <button onClick={() => handleSetLunas(d.id, totalJual)} disabled={updating === d.id}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                            {updating === d.id ? 'Loading...' : 'Set Lunas'}
                          </button>
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] text-gray-400 mb-1">Tambah Bayar (Rp)</label>
                            <div className="flex gap-2">
                              <input type="number" placeholder="0" value={addPay} onChange={e => setAddPay(e.target.value)}
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-green-500 outline-none" />
                              <button onClick={() => handleAddPay(d.id, d.uang_dibayarkan || 0, totalJual)} disabled={updating === d.id || !addPay}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                                Simpan
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(d.catatan || d.bahan_model || d.nama_pembeli) && (
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4 pt-3 border-t border-gray-200">
                        {d.nama_pembeli && <span><span className="text-gray-400">Pembeli:</span> {d.nama_pembeli}</span>}
                        {d.bahan_model && <span><span className="text-gray-400">Bahan/Model:</span> {d.bahan_model}</span>}
                        {d.catatan && <span><span className="text-gray-400">Catatan:</span> {d.catatan}</span>}
                        {d.modal_lain && !modalLain && <span><span className="text-gray-400">Modal Lain:</span> {d.modal_lain}</span>}
                      </div>
                    )}

                    <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id}
                      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 border border-red-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                      {deleting === d.id ? 'Menghapus...' : 'Hapus transaksi ini'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-3">{filtered.length} dari {transactions.length} transaksi</p>
      )}
    </div>
  )
}
