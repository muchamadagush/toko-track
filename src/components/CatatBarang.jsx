import { useEffect, useState } from 'react'
import { STATUS_PESANAN, fmt, calcItem } from '../lib/utils'

const EMPTY = {
  nama: '',
  tanggal: '',
  jumlah: 1,
  modal: '',
  jual: '',
  kategori: 'Lainnya',
  catatan: '',
  nama_pembeli: '',
  status_pesanan: STATUS_PESANAN[0],
  deadline: '',
  bahan_model: '',
  modal_lain: '',
  modal_lain_nominal: '',
  uang_dibayarkan: '',
}

export default function CatatBarang({ onAdd, categories }) {
  const [form, setForm] = useState({ ...EMPTY, tanggal: today() })
  
  useEffect(() => {
    if (categories.length > 0 && !form.kategori) {
      set('kategori', categories[0].name)
    }
  }, [categories])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function today() { return new Date().toISOString().slice(0, 10) }
  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  const modal = parseFloat(form.modal) || 0
  const jual = parseFloat(form.jual) || 0
  const jumlah = parseFloat(form.jumlah) || 1
  const showPreview = modal > 0 && jual > 0
  const preview = showPreview
    ? calcItem({ modal, jual, jumlah, modal_lain_nominal: form.modal_lain_nominal })
    : null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nama.trim() || !form.tanggal || !modal || !jual || jumlah < 1) return
    setLoading(true)
    try {
      await onAdd({
        nama: form.nama.trim(),
        tanggal: form.tanggal,
        jumlah,
        modal,
        jual,
        kategori: form.kategori,
        catatan: form.catatan.trim(),
        nama_pembeli: form.nama_pembeli.trim(),
        status_pesanan: form.status_pesanan,
        deadline: form.deadline || null,
        bahan_model: form.bahan_model.trim(),
        modal_lain: form.modal_lain.trim(),
        modal_lain_nominal: parseFloat(form.modal_lain_nominal) || 0,
        uang_dibayarkan: parseFloat(form.uang_dibayarkan) || 0,
      })
      setForm({ ...EMPTY, tanggal: today() })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">Tambah Pencatatan Barang</h2>

      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium flex items-center gap-2">
          <span>✓</span> Data berhasil disimpan!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Info Barang */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Info Barang</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Nama Barang *</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Contoh: Beras 5kg" value={form.nama} onChange={e => set('nama', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.kategori} onChange={e => set('kategori', e.target.value)}>
                {categories.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bahan / Model</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Katun, Model A" value={form.bahan_model} onChange={e => set('bahan_model', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Catatan</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Catatan tambahan" value={form.catatan} onChange={e => set('catatan', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal *</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.tanggal} onChange={e => set('tanggal', e.target.value)} required />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Harga & Jumlah */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Harga & Jumlah</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Jumlah (unit) *</label>
              <input type="number" min="1" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.jumlah} onChange={e => set('jumlah', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Harga Modal / unit (Rp) *</label>
              <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0" value={form.modal} onChange={e => set('modal', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Harga Jual / unit (Rp) *</label>
              <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0" value={form.jual} onChange={e => set('jual', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Modal Lain (keterangan)</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Ongkos jahit, Packaging, Bensin"
                value={form.modal_lain} onChange={e => set('modal_lain', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nominal Modal Lain (Rp)</label>
              <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0" value={form.modal_lain_nominal} onChange={e => set('modal_lain_nominal', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Info Pembeli */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Info Pembeli & Pesanan</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nama Pembeli</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nama pelanggan" value={form.nama_pembeli} onChange={e => set('nama_pembeli', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status Pembayaran</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.status_pesanan} onChange={e => set('status_pesanan', e.target.value)}>
                {STATUS_PESANAN.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal Deadline</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {form.status_pesanan === 'DP / Belum Lunas' ? 'Jumlah DP (Rp)' : 'Uang Dibayarkan (Rp)'}
              </label>
              <div className="relative">
                <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0" value={form.uang_dibayarkan} onChange={e => set('uang_dibayarkan', e.target.value)} />
                {form.status_pesanan === 'Lunas' && (
                  <button type="button" onClick={() => set('uang_dibayarkan', preview?.totalJual || 0)}
                    className="absolute right-2 top-1.5 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-md transition-colors">
                    Set Lunas
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Modal Barang</p>
              <p className="font-semibold text-gray-800">{fmt(modal * jumlah)}</p>
            </div>
            {preview.modalLain > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Modal Lain</p>
                <p className="font-semibold text-gray-800">{fmt(preview.modalLain)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total Modal</p>
              <p className="font-semibold text-gray-800">{fmt(preview.totalModal)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total Harga Jual</p>
              <p className="font-semibold text-gray-800">{fmt(preview.totalJual)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{preview.laba >= 0 ? 'Keuntungan' : 'Kerugian'}</p>
              <p className={`font-semibold ${preview.laba >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {fmt(preview.laba)} <span className="text-xs font-normal">({preview.margin.toFixed(1)}%)</span>
              </p>
            </div>
            <div className="border-l border-gray-200 pl-4">
              <p className="text-xs text-gray-400 mb-0.5">Kekurangan</p>
              <p className={`font-bold ${preview.kurang > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                {fmt(preview.kurang)}
              </p>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
          {loading ? 'Menyimpan...' : '+ Simpan Pencatatan'}
        </button>
      </form>
    </div>
  )
}
