import { useState } from 'react'

export default function KelolaKategori({ categories, transactions, onAdd, onUpdate, onDelete, loading }) {
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await onAdd(name.trim())
      setName('')
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
      await onUpdate(editing.id, editName.trim())
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
        <form onSubmit={handleAdd} className="flex gap-3">
          <input 
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="Contoh: Otomotif, Perhiasan..."
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={submitting}
            required
          />
          <button 
            type="submit"
            disabled={submitting || !name.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {submitting ? '...' : '+ Tambah'}
          </button>
        </form>
      </div>

      {/* List Kategori */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Daftar Kategori</h2>
          <span className="text-xs text-gray-400">{categories.length} Kategori</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Memuat kategori...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">Belum ada kategori.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {categories.map(cat => (
              <div key={cat.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                {editing?.id === cat.id ? (
                  <form onSubmit={handleUpdate} className="flex-1 flex gap-2 mr-4">
                    <input 
                      autoFocus
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                    <button type="submit" className="text-green-600 text-xs font-bold px-2 py-1">Simpan</button>
                    <button type="button" onClick={() => setEditing(null)} className="text-gray-400 text-xs px-2 py-1">Batal</button>
                  </form>
                ) : (
                  <>
                    <div>
                      <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                      {transactions.some(t => t.kategori === cat.name) && (
                        <span className="ml-3 text-[10px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-semibold">Digunakan</span>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => { setEditing(cat); setEditName(cat.name); }}
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
