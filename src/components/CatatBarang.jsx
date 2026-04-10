import { useEffect, useState, useRef } from 'react'
import { STATUS_PESANAN, fmt, calcItem } from '../lib/utils'
import { toPng } from 'html-to-image'
import Receipt from './Receipt'

const EMPTY_ITEM = { jenis: '', jumlah: 1, modal: '', jual: '' }
const EMPTY = {
  nama: '',
  tanggal: '',
  items: [{ ...EMPTY_ITEM }],
  kategori: '',
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
  }, [categories, form.kategori])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const receiptRef = useRef(null)

  function today() { return new Date().toISOString().slice(0, 10) }
  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }
  function setItem(idx, k, v) {
    const newItems = [...form.items]
    newItems[idx] = { ...newItems[idx], [k]: v }
    set('items', newItems)
  }
  function addItem() { set('items', [...form.items, { ...EMPTY_ITEM }]) }
  function removeItem(idx) {
    if (form.items.length <= 1) return
    set('items', form.items.filter((_, i) => i !== idx))
  }

  const items = form.items.map(it => ({
    ...it,
    modal: parseFloat(it.modal) || 0,
    jual: parseFloat(it.jual) || 0,
    jumlah: parseFloat(it.jumlah) || 1
  }))

  const showPreview = items.some(it => it.modal > 0 && it.jual > 0)
  const preview = showPreview ? items.reduce((acc, it, idx) => {
    const res = calcItem({ ...it, modal_lain_nominal: idx === 0 ? form.modal_lain_nominal : 0 })
    acc.totalModal += res.totalModal
    acc.totalJual += res.totalJual
    acc.modalLain += res.modalLain
    acc.laba += res.laba
    acc.dibayar = parseFloat(form.uang_dibayarkan) || 0
    acc.kurang = acc.totalJual - acc.dibayar
    acc.margin = acc.totalModal > 0 ? (acc.laba / acc.totalModal) * 100 : 0
    return acc
  }, { totalModal: 0, totalJual: 0, modalLain: 0, laba: 0, dibayar: 0, kurang: 0, margin: 0 }) : null

  async function handleDownloadLastReceipt() {
    if (!lastSaved) return
    setDownloading(true)
    setTimeout(async () => {
      try {
        if (receiptRef.current) {
          const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 2 })
          const link = document.createElement('a')
          link.download = `Nota-${lastSaved.nama_pembeli || 'Pelanggan'}-${lastSaved.nama.replace(/\s+/g, '-')}.png`
          link.href = dataUrl
          link.click()
        }
      } catch (err) {
        console.error('Download failed:', err)
        alert('Gagal mendownload nota: ' + err.message)
      } finally {
        setDownloading(false)
      }
    }, 100)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validItems = items.filter(it => it.modal > 0 && it.jual > 0)
    if (!form.nama.trim() || !form.tanggal || validItems.length === 0) return

    const batch_id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    setLoading(true)
    try {
      for (let i = 0; i < validItems.length; i++) {
        const it = validItems[i]
        await onAdd({
          nama: form.nama.trim(),
          tanggal: form.tanggal,
          jumlah: it.jumlah,
          modal: it.modal,
          jual: it.jual,
          jenis: it.jenis.trim(),
          batch_id,
          kategori: form.kategori,
          catatan: form.catatan.trim(),
          nama_pembeli: form.nama_pembeli.trim(),
          status_pesanan: form.status_pesanan,
          deadline: form.deadline || null,
          bahan_model: form.bahan_model.trim(),
          modal_lain: i === 0 ? form.modal_lain.trim() : '',
          modal_lain_nominal: i === 0 ? (parseFloat(form.modal_lain_nominal) || 0) : 0,
          uang_dibayarkan: i === 0 ? (parseFloat(form.uang_dibayarkan) || 0) : 0,
        })
      }
      
      const savedGroup = {
        nama: form.nama,
        tanggal: form.tanggal,
        nama_pembeli: form.nama_pembeli,
        items: validItems.map(it => ({ ...it })),
        totalJual: preview.totalJual,
        dibayar: preview.dibayar,
        kurang: preview.kurang,
        catatan: form.catatan,
        bahan_model: form.bahan_model
      }
      setLastSaved(savedGroup)
      setForm({ ...EMPTY, tanggal: today() })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setLastSaved(null)
      }, 10000) // Keep success message longer to allow download
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">Tambah Pencatatan Barang</h2>

      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>✓</span> Data berhasil disimpan!
          </div>
          {lastSaved && (
            <button type="button" onClick={handleDownloadLastReceipt} disabled={downloading}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
              📄 {downloading ? 'Memproses...' : 'Download Nota Terakhir'}
            </button>
          )}
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
                placeholder="Contoh: Jersey" value={form.nama} onChange={e => set('nama', e.target.value)} required />
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

        {/* Harga & Jumlah (Multiple Items) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Harga & Jumlah</p>
            <button type="button" onClick={addItem} className="text-xs text-green-600 font-bold hover:text-green-700">+ Tambah Jenis</button>
          </div>

          <div className="space-y-4">
            {form.items.map((it, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-4 relative group">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Jenis / Ukuran</label>
                    <input className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-green-500 outline-none"
                      placeholder="Contoh: 5kg, XL, Merah" value={it.jenis} onChange={e => setItem(idx, 'jenis', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Jumlah *</label>
                    <input type="number" min="1" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-green-500 outline-none"
                      value={it.jumlah} onChange={e => setItem(idx, 'jumlah', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Hrg Modal *</label>
                    <input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-green-500 outline-none"
                      placeholder="0" value={it.modal} onChange={e => setItem(idx, 'modal', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Hrg Jual *</label>
                    <input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-green-500 outline-none"
                      placeholder="0" value={it.jual} onChange={e => setItem(idx, 'jual', e.target.value)} required />
                  </div>
                </div>
                {form.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)}
                    className="absolute -right-2 -top-2 bg-white border border-red-100 text-red-400 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                )}
              </div>
            ))}
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
              <p className="text-xs text-gray-400 mb-0.5">Total Modal Barang</p>
              <p className="font-semibold text-gray-800">{fmt(preview.totalModal - preview.modalLain)}</p>
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
      {/* Hidden Receipt for Capture */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {lastSaved && <Receipt ref={receiptRef} transaction={lastSaved} />}
      </div>
    </div>
  )
}
