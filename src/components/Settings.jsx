import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Paywall from './Paywall'

export default function Settings({ profile, useSupabase, isTrialExpired, activeTab, onCheckStatus }) {
 const [showPaywallModal, setShowPaywallModal] = useState(false)
 const [isConfirmationPending, setIsConfirmationPending] = useState(false)
 const [paymentHistory, setPaymentHistory] = useState([])

 let savedPlanType = localStorage.getItem('toko_pending_plan_type') || 'Bulanan'
 let savedAmount = localStorage.getItem('toko_pending_amount')
 let nominal = savedAmount ? parseInt(savedAmount) : 149000

 // Calculate plan from dates if active
 if (profile?.stores?.subscription_status === 'active' && profile?.stores?.subscription_ends_at && profile?.stores?.created_at) {
 const diffTime = Math.abs(new Date(profile.stores.subscription_ends_at) - new Date(profile.stores.created_at))
 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
 if (diffDays > 300) {
  savedPlanType = 'Tahunan'
  nominal = 1490000
 } else {
  savedPlanType = 'Bulanan'
  nominal = 149000
 }
 }
 const jenisLangganan = `TokoTrack Premium (${savedPlanType})`

 useEffect(() => {
 if (!useSupabase || !profile?.store_id) return
 const fetchHistory = async () => {
  const { data } = await supabase
  .from('payment_confirmations')
  .select('*')
  .eq('store_id', profile.store_id)
  .order('created_at', { ascending: false })
  
  if (data) {
  setPaymentHistory(data)
  const hasPending = data.some(p => p.status === 'pending')
  if (hasPending) setIsConfirmationPending(true)
  }
 }
 fetchHistory()
 }, [useSupabase, profile])

 return (
 <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 relative">
  {activeTab === 'settings_general' && (
  <div className="space-y-4">
   <h3 className="text-lg font-bold text-gray-900">General Settings</h3>
   <p className="text-sm text-gray-500">
   Pengaturan umum untuk profil dan akun Anda.
   </p>
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
   <div>
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Anda</label>
    <input
    type="email"
    disabled
    value={profile?.email || '-'}
    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
    />
   </div>
   <div>
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role Anda</label>
    <input
    type="text"
    disabled
    value={profile?.role || '-'}
    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed uppercase"
    />
   </div>
   </div>
  </div>
  )}

  {activeTab === 'settings_billing' && (
  <div className="space-y-4">
   <h3 className="text-lg font-bold text-gray-900 mb-2">Billing & Subscription</h3>
   
   <div className="overflow-x-auto border border-gray-100 rounded-xl">
   <table className="w-full text-sm text-left">
    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
    <tr>
     <th className="px-4 py-3">No</th>
     <th className="px-4 py-3">Jenis Langganan</th>
     <th className="px-4 py-3">Mulai Berlangganan</th>
     <th className="px-4 py-3">Berakhirnya</th>
     <th className="px-4 py-3">Jumlah Tagihan</th>
     <th className="px-4 py-3">Status</th>
     <th className="px-4 py-3">Action</th>
    </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
    <tr className="bg-white">
     <td className="px-4 py-4 text-gray-500">1</td>
     <td className="px-4 py-4 font-bold text-gray-900">{jenisLangganan}</td>
     <td className="px-4 py-4 text-gray-600">
     {profile?.stores?.subscription_status === 'pending_payment' 
      ? '-' 
      : (profile?.stores?.created_at 
      ? new Date(profile.stores.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) 
      : '-')}
     </td>
     <td className="px-4 py-4 text-gray-600">
     {profile?.stores?.subscription_status === 'pending_payment' || profile?.stores?.subscription_status === 'trialing'
      ? '-' 
      : (profile?.stores?.subscription_ends_at 
      ? new Date(profile.stores.subscription_ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) 
      : '-')}
     </td>
     <td className="px-4 py-4 font-bold text-gray-900">Rp {nominal.toLocaleString('id-ID')}</td>
     <td className="px-4 py-4">
     <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
      profile?.stores?.subscription_status === 'pending_payment' 
      ? (isConfirmationPending ? 'bg-brand-pale-green text-brand-green' : 'bg-amber-50 text-amber-600') 
      : 'bg-brand-pale-green text-brand-dark-green'
     }`}>
      {profile?.stores?.subscription_status === 'pending_payment' 
      ? (isConfirmationPending ? 'Menunggu Konfirmasi' : 'Menunggu Pembayaran') 
      : 'Aktif'}
     </span>
     </td>
     <td className="px-4 py-4">
     {profile?.stores?.subscription_status === 'pending_payment' ? (
      <button 
      onClick={() => setShowPaywallModal(true)}
      className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors shadow-sm ${
       isConfirmationPending 
        ? 'bg-brand-green hover:bg-brand-green' 
        : 'bg-brand-green hover:bg-brand-dark-green'
      }`}
      >
      {isConfirmationPending ? 'Cek Status' : 'Bayar'}
      </button>
     ) : (
      <span className="text-gray-400 font-bold">-</span>
     )}
     </td>
    </tr>
    </tbody>
   </table>
   </div>
  </div>
  )}

  {activeTab === 'settings_history' && (
  <div className="space-y-6">
   <div className="flex items-center justify-between border-b border-gray-100 pb-4">
   <div>
    <h2 className="text-xl font-bold text-gray-900">Riwayat Transaksi</h2>
    <p className="text-sm text-gray-500 mt-1">Daftar seluruh riwayat pembayaran berlangganan Anda.</p>
   </div>
   </div>
   
   <div className="overflow-x-auto rounded-xl border border-gray-100">
    <table className="w-full text-left text-sm whitespace-nowrap">
    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
     <tr>
     <th className="px-4 py-3">Tanggal</th>
     <th className="px-4 py-3">Nominal</th>
     <th className="px-4 py-3">Metode/Bank</th>
     <th className="px-4 py-3">Status</th>
     </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
     {paymentHistory.length === 0 ? (
     <tr>
      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
      Belum ada riwayat transaksi.
      </td>
     </tr>
     ) : (
     paymentHistory.map((trx, idx) => (
      <tr key={idx} className="bg-white hover:bg-gray-50">
      <td className="px-4 py-4 text-gray-600">
       {new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </td>
      <td className="px-4 py-4 font-bold text-gray-900">Rp {trx.jumlah.toLocaleString('id-ID')}</td>
      <td className="px-4 py-4 text-gray-600">{trx.bank_pengirim} - {trx.nama_pengirim}</td>
      <td className="px-4 py-4">
       <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
       trx.status === 'approved' ? 'bg-brand-pale-green text-brand-dark-green' :
       trx.status === 'pending' ? 'bg-amber-50 text-amber-700' :
       'bg-red-50 text-red-700'
       }`}>
       {trx.status === 'approved' ? 'Berhasil' :
        trx.status === 'pending' ? 'Diproses' :
        'Ditolak'}
       </span>
      </td>
      </tr>
     ))
     )}
    </tbody>
    </table>
   </div>
   </div>
  )}

  {/* Paywall Modal */}
  {showPaywallModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
   <Paywall 
   profile={profile} 
   useSupabase={useSupabase} 
   onCheckStatus={onCheckStatus} 
   nominal={nominal} 
   onClose={() => setShowPaywallModal(false)}
   isConfirmationPending={isConfirmationPending}
   />
  </div>
  )}
 </div>
 )
}
