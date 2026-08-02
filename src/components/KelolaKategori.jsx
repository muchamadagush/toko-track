import { useState } from 'react'

export default function KelolaKategori({ categories, transactions, onAdd, onUpdate, onDelete, loading }) {
  const [name, setName] = useState('')
  const [modal, setModal] = useState('')
  const [modalLain, setModalLain] = useState('')
  const [modalLainNominal, setModalLainNominal] = useState('')

  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [editModal, setEditModal] = useState('')
  const [editModalLain, setEditModalLain] = useState('')
  const [editModalLainNominal, setEditModalLainNominal] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await onAdd(
        name.trim(), 
        parseFloat(modal) || 0, 
        modalLain.trim(), 
        parseFloat(modalLainNominal) || 0
      )
      setName('')
      setModal('')
      setModalLain('')
      setModalLainNominal('')
    } catch (e) {
      alert(e.message)
    }
    setSubmitting(false)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    if (!editName.trim() || !editing) return
    setSubmitting(true)
    try {
      await onUpdate(
        editing.id, 
        editName.trim(),
        parseFloat(editModal) || 0,
        editModalLain.trim(),
        parseFloat(editModalLainNominal) || 0
      )
      setEditing(null)
    } catch (e) {
      alert(e.message)
    }
    setSubmitting(false)
  }

  async function handleDelete(cat) {
    // Check usage
    const isUsed = transactions.some(t => t.kategori === cat.name)
    if (isUsed) {
      alert(`Kategori "${cat.name}" sedang digunakan dalam transaksi dan tidak dapat dihapus.`)
      return
    }

    if (!confirm(`Hapus kategori "${cat.name}"?`)) return
    try {
      await onDelete(cat.id)
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Form Tambah */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tambah Kategori Baru</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Nama Kategori *</label>
              <input 
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Contoh: Otomotif, Pakaian..."
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hrg Modal / HPP *</label>
              <input 
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="0"
                value={modal}
                onChange={e => setModal(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Modal Lain (Keterangan)</label>
              <input 
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Contoh: Ongkos jahit, Bensin..."
                value={modalLain}
                onChange={e => setModalLain(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nominal Modal Lain (Rp)</label>
              <input 
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="0"
                value={modalLainNominal}
                onChange={e => setModalLainNominal(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button 
              type="submit"
              disabled={submitting || !name.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Menyimpan...' : '+ Tambah Kategori'}
            </button>
          </div>
        </form>
      </div>

      {/* List Kategori */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Daftar Kategori & Modal Default</h2>
          <span className="text-xs text-gray-400">{categories.length} Kategori</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Memuat kategori...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">Belum ada kategori.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {categories.map(cat => (
              <div key={cat.id} className="px-6 py-4 flex flex-col gap-3 hover:bg-gray-50/50 transition-colors">
                {editing?.id === cat.id ? (
                  <form onSubmit={handleUpdate} className="space-y-3 w-full bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Edit Kategori</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">Nama Kategori</label>
                        <input 
                          autoFocus
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 outline-none bg-white"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">Hrg Modal / HPP</label>
                        <input 
                          type="number"
                          min="0"
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 outline-none bg-white"
                          value={editModal}
                          onChange={e => setEditModal(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">Nominal Modal Lain</label>
                        <input 
                          type="number"
                          min="0"
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 outline-none bg-white"
                          value={editModalLainNominal}
                          onChange={e => setEditModalLainNominal(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">Modal Lain (Keterangan)</label>
                      <input 
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 outline-none bg-white"
                        value={editModalLain}
                        onChange={e => setEditModalLain(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="submit" className="text-green-600 text-xs font-bold px-3 py-1.5 bg-white border border-green-200 rounded-lg shadow-sm hover:bg-green-50">Simpan</button>
                      <button type="button" onClick={() => setEditing(null)} className="text-gray-500 text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">Batal</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">{cat.name}</span>
                        {transactions.some(t => t.kategori === cat.name) && (
                          <span className="text-[9px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-semibold">Digunakan</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span>💰 Hrg Modal: <strong>Rp {(cat.modal || 0).toLocaleString('id-ID')}</strong></span>
                        {(cat.modal_lain_nominal > 0 || cat.modal_lain) && (
                          <span>📦 Modal Lain: <strong>Rp {(cat.modal_lain_nominal || 0).toLocaleString('id-ID')}</strong> ({cat.modal_lain || '-'})</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 self-center">
                      <button 
                        onClick={() => { 
                          setEditing(cat); 
                          setEditName(cat.name); 
                          setEditModal(cat.modal || '');
                          setEditModalLain(cat.modal_lain || '');
                          setEditModalLainNominal(cat.modal_lain_nominal || '');
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(cat)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
