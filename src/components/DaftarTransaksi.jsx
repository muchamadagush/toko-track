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

  // 1. Grouping logic
  const groupsMap = transactions.reduce((acc, d) => {
    const key = d.batch_id || d.id
    if (!acc[key]) acc[key] = {
      id: d.id,
      batch_id: d.batch_id,
      nama: d.nama,
      tanggal: d.tanggal,
      kategori: d.kategori,
      nama_pembeli: d.nama_pembeli,
      bahan_model: d.bahan_model,
      catatan: d.catatan,
      status_pesanan: d.status_pesanan,
      deadline: d.deadline,
      created_at: d.created_at,
      items: []
    }
    acc[key].items.push(d)
    return acc
  }, {})

  const allGroups = Object.values(groupsMap).map(g => {
    const s = g.items.reduce((acc, it) => {
      const res = calcItem(it)
      acc.totalModal += res.totalModal
      acc.totalJual += res.totalJual
      acc.laba += res.laba
      acc.dibayar += res.dibayar
      acc.kurang += res.kurang
      return acc
    }, { totalModal: 0, totalJual: 0, laba: 0, dibayar: 0, kurang: 0 })
    return { ...g, ...s, margin: s.totalModal > 0 ? (s.laba / s.totalModal) * 100 : 0 }
  })

  // 2. Filter groups
  const filteredGroups = allGroups
    .filter(g => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        g.nama.toLowerCase().includes(q) ||
        g.items.some(it => (it.jenis || '').toLowerCase().includes(q)) ||
        (g.nama_pembeli || '').toLowerCase().includes(q) ||
        (g.bahan_model || '').toLowerCase().includes(q) ||
        (g.catatan || '').toLowerCase().includes(q)
      const matchKat = filterKat === 'Semua' || g.kategori === filterKat
      const matchStatus = filterStatus === 'Semua' || g.status_pesanan === filterStatus
      return matchSearch && matchKat && matchStatus
    })
    .sort((a, b) => {
      if (sortBy === 'tanggal_desc') return new Date(b.tanggal) - new Date(a.tanggal) || new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'tanggal_asc') return new Date(a.tanggal) - new Date(b.tanggal) || new Date(a.created_at) - new Date(b.created_at)
      if (sortBy === 'deadline') return new Date(a.deadline || '9999') - new Date(b.deadline || '9999')
      if (sortBy === 'laba_desc') return b.laba - a.laba
      if (sortBy === 'laba_asc') return a.laba - b.laba
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

  async function handleDelete(id, batchId) {
    if (!confirm('Hapus transaksi ini? (Seluruh grup akan dihapus)')) return
    setDeleting(id)
    try { await onDelete(id, batchId) } catch (e) { alert(e.message) }
    setDeleting(null)
  }

  async function handleDeleteAll() {
    if (!confirm('Hapus SEMUA data transaksi? Tindakan ini tidak dapat dibatalkan.')) return
    try { await onDeleteAll() } catch (e) { alert(e.message) }
  }

  async function handleSetLunas(group) {
    if (!confirm('Set semua item dalam grup ini sebagai lunas?')) return
    setUpdating(group.id)
    try {
      for (const it of group.items) {
        const { totalJual } = calcItem(it)
        await onUpdate(it.id, {
          status_pesanan: 'Lunas',
          uang_dibayarkan: totalJual
        })
      }
    } catch (e) {
      alert(e.message)
    }
    setUpdating(null)
  }

  async function handleAddPay(group) {
    const nominal = parseFloat(addPay) || 0
    if (nominal <= 0) return
    setUpdating(group.id)
    try {
      // Proportional payment or just pay the first item with debt?
      // Let's just pay the first non-paid item for simplicity
      let remaining = nominal
      for (const it of group.items) {
        if (remaining <= 0) break
        const { totalJual, dibayar } = calcItem(it)
        const debt = totalJual - dibayar
        if (debt > 0) {
          const pay = Math.min(remaining, debt)
          const newPaid = dibayar + pay
          await onUpdate(it.id, {
            uang_dibayarkan: newPaid,
            status_pesanan: newPaid >= totalJual ? 'Lunas' : 'DP / Belum Lunas'
          })
          remaining -= pay
        }
      }
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
        <input placeholder="Cari barang, jenis, pembeli..."
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
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {transactions.length === 0 ? 'Belum ada data. Tambahkan pencatatan barang terlebih dahulu.' : 'Tidak ada hasil yang cocok.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map(g => {
            const statusCls = STATUS_COLOR[g.status_pesanan] || 'bg-gray-100 text-gray-600'
            const profitCls = g.laba > 0 ? 'text-green-600' : g.laba < 0 ? 'text-red-500' : 'text-gray-500'
            const profitBadge = g.laba > 0 ? 'bg-green-50 text-green-700' : g.laba < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
            const profitLabel = g.laba > 0 ? 'Untung' : g.laba < 0 ? 'Rugi' : 'BEP'
            const isOpen = expanded === g.id

            return (
              <div key={g.id} className={`border rounded-2xl overflow-hidden transition-all ${isOpen ? 'border-green-200 ring-4 ring-green-50' : 'border-gray-100 hover:border-gray-200'}`}>
                {/* Row utama */}
                <div className="flex items-start gap-3 p-4 cursor-pointer bg-white"
                  onClick={() => setExpanded(isOpen ? null : g.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-bold text-gray-900 text-base">{g.nama}</span>
                      {g.items.length > 1 && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-bold">{g.items.length} JENIS</span>}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${profitBadge}`}>{profitLabel}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCls}`}>{g.status_pesanan}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>📅 {g.tanggal}</span>
                      {g.nama_pembeli && <span>👤 {g.nama_pembeli}</span>}
                      {g.deadline && <span>⏰ Deadline: {deadlineBadge(g.deadline)}</span>}
                      <span>{g.kategori}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-black text-base ${profitCls}`}>{fmt(g.laba)}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{g.margin.toFixed(1)}% margin</p>
                  </div>
                </div>

                {/* Detail expanded */}
                {isOpen && (
                  <div className="bg-gray-50 border-t border-gray-100 p-4">
                    {/* Items List */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-400 font-semibold border-b border-gray-100">
                          <tr>
                            <th className="px-3 py-2">Jenis</th>
                            <th className="px-3 py-2 text-center">Qty</th>
                            <th className="px-3 py-2 text-right">Hrg Jual / u</th>
                            <th className="px-3 py-2 text-right">Laba</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {g.items.map((it, i) => {
                            const res = calcItem(it)
                            return (
                              <tr key={i}>
                                <td className="px-3 py-2.5 font-medium text-gray-700">{it.jenis || '-'}</td>
                                <td className="px-3 py-2.5 text-center text-gray-500">{it.jumlah}</td>
                                <td className="px-3 py-2.5 text-right text-gray-700">{fmt(it.jual)}</td>
                                <td className={`px-3 py-2.5 text-right font-bold ${res.laba >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(res.laba)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Total Modal</p>
                        <p className="font-semibold text-gray-900">{fmt(g.totalModal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Total Jual</p>
                        <p className="font-semibold text-gray-900">{fmt(g.totalJual)}</p>
                      </div>
                      <div className="border-l border-gray-200 pl-4">
                        <p className="text-xs text-gray-400 mb-0.5">Sudah Bayar</p>
                        <p className="font-bold text-blue-600">{fmt(g.dibayar)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Kekurangan</p>
                        <p className={`font-bold ${g.kurang > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{fmt(g.kurang)}</p>
                      </div>
                    </div>

                    {g.kurang > 0 && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                          Pelunasan Transaksi
                        </p>
                        <div className="flex flex-wrap gap-3 items-end">
                          <button onClick={() => handleSetLunas(g)} disabled={updating === g.id}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-green-100">
                            {updating === g.id ? 'Loading...' : 'Set Semua Lunas'}
                          </button>
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] text-gray-400 mb-1 font-bold">TAMBAH PEMBAYARAN (RP)</label>
                            <div className="flex gap-2">
                              <input type="number" placeholder="0" value={addPay} onChange={e => setAddPay(e.target.value)}
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                              <button onClick={() => handleAddPay(g)} disabled={updating === g.id || !addPay}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-sm shadow-blue-100">
                                Simpan
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(g.catatan || g.bahan_model) && (
                      <div className="text-xs text-gray-500 mb-4 pt-3 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {g.bahan_model && <p><span className="text-gray-400 font-medium">Bahan/Model:</span> {g.bahan_model}</p>}
                        {g.catatan && <p><span className="text-gray-400 font-medium">Catatan:</span> {g.catatan}</p>}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-100">
                      <button onClick={() => handleDelete(g.id, g.batch_id)} disabled={deleting === g.id}
                        className="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        🗑️ {deleting === g.id ? 'Menghapus...' : 'Hapus Grup'}
                      </button>
                      <span className="text-[10px] text-gray-300 font-mono">{g.batch_id || 'single-item'}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {filteredGroups.length > 0 && (
        <p className="text-xs text-gray-400 mt-4 font-medium italic">Menampilkan {filteredGroups.length} grup transaksi</p>
      )}
    </div>
  )
}
