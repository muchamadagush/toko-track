import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Paywall({ profile, useSupabase, onCheckStatus, nominal, onClose, isConfirmationPending }) {
 const [bank, setBank] = useState('')
 const [nama, setNama] = useState('')
 const [jumlah, setJumlah] = useState(nominal ? String(nominal) : '')
 const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10))
 const [loading, setLoading] = useState(false)
 const [message, setMessage] = useState('')
 const [isPending, setIsPending] = useState(isConfirmationPending || false)

 // Check if there is already a pending confirmation
 useEffect(() => {
 if (!useSupabase || !profile?.store_id) return
 const checkPending = async () => {
  const { data } = await supabase
  .from('payment_confirmations')
  .select('status')
  .eq('store_id', profile.store_id)
  .eq('status', 'pending')
  .limit(1)
  .maybeSingle()
  if (data) setIsPending(true)
 }
 checkPending()
 }, [useSupabase, profile])

 const handleSubmit = async (e) => {
 e.preventDefault()
 if (!useSupabase) {
  setMessage('Mode lokal: Pembayaran otomatis disetujui (simulasi). Muat ulang aplikasi.')
  localStorage.setItem('local_subscription_status', 'active')
  setTimeout(onCheckStatus, 1500)
  return
 }

 setLoading(true)
 setMessage('')
 try {
  const { error } = await supabase.from('payment_confirmations').insert({
  store_id: profile.store_id,
  bank_pengirim: bank,
  nama_pengirim: nama,
  jumlah: parseFloat(jumlah),
  tanggal_transfer: tanggal
  })
  if (error) throw error
  setIsPending(true)
  setMessage('Konfirmasi berhasil dikirim. Menunggu verifikasi admin.')
 } catch (err) {
  setMessage('Gagal mengirim konfirmasi: ' + err.message)
 } finally {
  setLoading(false)
 }
 }

 return (
 <div className="flex items-center justify-center p-4">
  <div className="max-w-md w-full bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-gray-100 max-h-[90vh] overflow-y-auto scrollbar-hide">
  <div className="text-center mb-6 relative">
   {onClose && (
   <button onClick={onClose} className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
    ✕
   </button>
   )}
   <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
   ⏳
   </div>
   <h2 className="text-2xl font-bold text-gray-900">
   {profile?.stores?.subscription_status === 'pending_payment' 
    ? 'Selesaikan Pembayaran' 
    : 'Masa Trial Habis'}
   </h2>
   <p className="text-sm text-gray-500 mt-2">
   {profile?.stores?.subscription_status === 'pending_payment'
    ? 'Satu langkah lagi! Silakan selesaikan pembayaran untuk mulai menggunakan TokoTrack.'
    : 'Masa uji coba gratis 7 hari Anda telah berakhir. Silakan lakukan pembayaran untuk melanjutkan penggunaan aplikasi.'}
   </p>
   {nominal && (
   <div className="mt-4 p-4 bg-brand-pale-green border border-brand-pale-green rounded-xl">
    <p className="text-xs text-brand-dark-green font-bold uppercase tracking-wider mb-1">Total Tagihan</p>
    <p className="text-2xl font-bold text-brand-dark-green">Rp {Number(nominal).toLocaleString('id-ID')}</p>
   </div>
   )}
  </div>

  {isPending ? (
   <div className="bg-brand-pale-green border border-brand-light-green rounded-2xl p-6 text-center">
   <span className="text-3xl block mb-2">⏳</span>
   <h3 className="font-bold text-brand-dark-purple">Menunggu Konfirmasi</h3>
   <p className="text-sm text-brand-dark-green mt-2">
    Pembayaran Anda sedang diverifikasi oleh tim kami. Silakan cek kembali beberapa saat lagi.
   </p>
   <button 
    onClick={onCheckStatus}
    className="mt-4 px-4 py-2 bg-brand-green text-white rounded-xl text-sm font-semibold hover:bg-brand-dark-green"
   >
    Cek Status Sekarang
   </button>
   </div>
  ) : (
   <>
   <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 text-sm text-gray-700">
    <p className="font-semibold mb-2">Transfer ke Rekening Berikut:</p>
    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 mb-2">
    <span>BCA</span>
    <span className="font-bold text-gray-900">1234567890</span>
    </div>
    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
    <span>Mandiri</span>
    <span className="font-bold text-gray-900">0987654321</span>
    </div>
    <p className="mt-3 text-center text-xs text-gray-500">A.n. PT TokoTrack Digital</p>
   </div>

   <form onSubmit={handleSubmit} className="space-y-4">
    <div>
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Pengirim</label>
    <input required type="text" value={bank} onChange={e => setBank(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-green" placeholder="Contoh: BCA / BRI / Mandiri" />
    </div>
    <div>
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Pemilik Rekening</label>
    <input required type="text" value={nama} onChange={e => setNama(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-green" placeholder="Sesuai buku tabungan" />
    </div>
    <div>
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jumlah Transfer (Rp)</label>
    <input required type="number" value={jumlah} onChange={e => setJumlah(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-green" placeholder="Misal: 149000" />
    </div>
    <div>
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Transfer</label>
    <input required type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-green" />
    </div>

    {message && <div className={`text-xs p-3 rounded-xl ${message.includes('Gagal') ? 'bg-red-50 text-red-600' : 'bg-brand-pale-green text-brand-green'}`}>{message}</div>}

    <button disabled={loading} type="submit" className="w-full py-3.5 bg-brand-green hover:bg-brand-dark-green bg-brand-green hover:bg-brand-dark-green text-white font-bold rounded-xl shadow-lg shadow-brand-light-green transition-all disabled:opacity-50">
    {loading ? 'Mengirim...' : 'Kirim Konfirmasi'}
    </button>
   </form>
   </>
  )}
  </div>
 </div>
 )
}
