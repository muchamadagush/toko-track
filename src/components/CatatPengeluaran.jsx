import { useState } from 'react'

const EMPTY = {
  tanggal: new Date().toISOString().slice(0, 10),
  nominal: '',
  keterangan: '',
}

export default function CatatPengeluaran({ onAdd }) {
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.tanggal || !form.nominal || !form.keterangan.trim()) return

    setLoading(true)
    try {
      await onAdd(form)
      setForm({ ...EMPTY })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">Tambah Pencatatan Pengeluaran</h2>

      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
          ✓ Pengeluaran berhasil disimpan!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal *</label>
            <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={form.tanggal} onChange={e => set('tanggal', e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nominal (Rp) *</label>
            <input type="number" min="1" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="0" value={form.nominal} onChange={e => set('nominal', e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Keterangan *</label>
          <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[100px]"
            placeholder="Contoh: Bayar listrik, Sewa toko, Plastik packing" 
            value={form.keterangan} onChange={e => set('keterangan', e.target.value)} required />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
          {loading ? 'Menyimpan...' : '+ Simpan Pengeluaran'}
        </button>
      </form>
    </div>
  )
}
