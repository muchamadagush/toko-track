import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export default function SuperadminDashboard({ onLogout, useSupabase, profile }) {
  const [stores, setStores] = useState([])
  const [branches, setBranches] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('payments')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (!useSupabase) {
      // Mock data for local simulation
      setStores([
        { id: 'store-1', name: 'TS Clothing Pusat', address: 'Jl. Sudirman No. 12', phone: '08123456789', created_at: new Date().toISOString(), subscription_status: 'trialing' },
        { id: 'store-2', name: 'Zaria Hijab', address: 'Jl. Diponegoro No. 45', phone: '08765432100', created_at: new Date().toISOString(), subscription_status: 'active' }
      ])
      setBranches([
        { id: 'branch-1', store_id: 'store-1', name: 'Cabang Bandung' },
        { id: 'branch-2', store_id: 'store-1', name: 'Cabang Jakarta' }
      ])
      setPayments([
        { id: 'pay-1', store_id: 'store-1', bank_pengirim: 'BCA', nama_pengirim: 'Budi Santoso', jumlah: 149000, tanggal_transfer: '2026-10-02', status: 'pending', stores: { name: 'TS Clothing Pusat' } }
      ])
      setLoading(false)
      return
    }

    try {
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })
      if (storesError) throw storesError

      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false })
      if (branchesError) throw branchesError

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_confirmations')
        .select('*, stores(name)')
        .order('created_at', { ascending: false })
      
      if (!paymentsError) {
        setPayments(paymentsData || [])
      }

      setStores(storesData || [])
      setBranches(branchesData || [])
    } catch (err) {
      setError(err.message || 'Gagal memuat data superadmin.')
    } finally {
      setLoading(false)
    }
  }, [useSupabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApprovePayment = async (paymentId, storeId) => {
    if (!useSupabase) {
      alert('Mode lokal: Aksi disimulasikan')
      setPayments(p => p.map(x => x.id === paymentId ? { ...x, status: 'approved' } : x))
      setStores(s => s.map(x => x.id === storeId ? { ...x, subscription_status: 'active' } : x))
      return
    }
    try {
      setLoading(true)
      await supabase.from('payment_confirmations').update({ status: 'approved' }).eq('id', paymentId)
      await supabase.from('stores').update({ subscription_status: 'active' }).eq('id', storeId)
      await fetchData()
    } catch (err) {
      alert('Gagal approve: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRejectPayment = async (paymentId) => {
    if (!useSupabase) {
      alert('Mode lokal: Aksi disimulasikan')
      setPayments(p => p.map(x => x.id === paymentId ? { ...x, status: 'rejected' } : x))
      return
    }
    try {
      setLoading(true)
      await supabase.from('payment_confirmations').update({ status: 'rejected' }).eq('id', paymentId)
      await fetchData()
    } catch (err) {
      alert('Gagal reject: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStoreStatus = async (storeId, newStatus) => {
    if (!window.confirm(`Yakin ingin mengubah status toko ini menjadi ${newStatus}?`)) return
    
    if (!useSupabase) {
      alert('Mode lokal: Aksi disimulasikan')
      setStores(s => s.map(x => x.id === storeId ? { ...x, subscription_status: newStatus } : x))
      return
    }
    
    try {
      setLoading(true)
      const { error } = await supabase.from('stores').update({ subscription_status: newStatus }).eq('id', storeId)
      if (error) throw error
      await fetchData()
    } catch (err) {
      alert('Gagal update status: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { id: 'payments', label: 'Pembayaran', icon: '💳', badge: payments.filter(p => p.status === 'pending').length },
    { id: 'stores', label: 'Toko & Pelanggan', icon: '🏪' },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static top-0 bottom-0 left-0 z-30 w-[260px] bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
            <span className="text-white text-lg font-bold">SA</span>
          </div>
          <div className="min-w-0">
            <span className="font-bold text-gray-900 text-sm block leading-tight truncate">
              TokoTrack HQ
            </span>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block mt-0.5">
              Superadmin
            </span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                setMobileMenuOpen(false)
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-50 space-y-2">
          {profile?.email && (
            <div className="px-3 py-2 text-[10px] text-gray-400 font-bold uppercase truncate">
              👤 {profile.email}
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <span>🚪</span>
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-gray-500 font-bold"
            >
              ☰
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">
                {activeTab === 'payments' ? 'Konfirmasi Pembayaran' : 'Manajemen Toko & Pelanggan'}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeTab === 'payments' ? 'Tinjau dan verifikasi pembayaran masuk' : 'Pantau aktivitas langganan pengguna'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors" title="Muat Ulang">
              🔄
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-gray-500 font-medium">Memuat data...</p>
              </div>
            ) : (
              <>
                {/* Pembayaran Tab */}
                {activeTab === 'payments' && (
                  <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                    {payments.length === 0 ? (
                      <div className="text-center py-12">
                        <span className="text-4xl block mb-4">✨</span>
                        <h3 className="text-gray-900 font-bold text-lg">Tidak ada pembayaran pending</h3>
                        <p className="text-gray-400 text-sm mt-1">Semua konfirmasi pembayaran sudah diverifikasi.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {payments.map(pay => (
                          <div key={pay.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-white border border-gray-100 hover:border-blue-100 rounded-2xl shadow-sm hover:shadow-md transition-all gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                                🏦
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-gray-900 text-base">{pay.stores?.name || 'Toko Tidak Diketahui'}</h3>
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${pay.status === 'pending' ? 'bg-amber-100 text-amber-700' : pay.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {pay.status}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                  <span>👤 {pay.nama_pengirim}</span>
                                  <span>🏦 {pay.bank_pengirim}</span>
                                  <span>💰 Rp {pay.jumlah.toLocaleString('id-ID')}</span>
                                  <span>📅 {new Date(pay.tanggal_transfer).toLocaleDateString('id-ID')}</span>
                                </div>
                              </div>
                            </div>
                            
                            {pay.status === 'pending' && (
                              <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                                <button onClick={() => handleRejectPayment(pay.id)} className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl text-sm font-bold transition-colors">Tolak</button>
                                <button onClick={() => handleApprovePayment(pay.id, pay.store_id)} className="flex-1 md:flex-none px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5">Setujui Pembayaran</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Toko Tab */}
                {activeTab === 'stores' && (
                  <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Toko</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kontak</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Cabang</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal Daftar</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {stores.map((store) => {
                            const storeBranches = branches.filter((b) => b.store_id === store.id)
                            const isExpired = store.subscription_status === 'expired' || 
                              (store.subscription_status !== 'active' && new Date().getTime() > new Date(store.trial_ends_at).getTime())

                            return (
                              <tr key={store.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-gray-900">{store.name}</div>
                                  <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate">{store.address || 'Alamat belum diisi'}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-600">{store.phone || '-'}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-semibold text-gray-700">{storeBranches.length}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-600">{new Date(store.created_at).toLocaleDateString('id-ID')}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${store.subscription_status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : isExpired ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                    {store.subscription_status === 'active' ? 'Aktif' : isExpired ? 'Expired' : 'Trial'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {store.subscription_status === 'active' ? (
                                    <button 
                                      onClick={() => handleUpdateStoreStatus(store.id, 'expired')}
                                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap"
                                    >
                                      Blokir
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleUpdateStoreStatus(store.id, 'active')}
                                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors whitespace-nowrap"
                                    >
                                      Aktifkan
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                          {stores.length === 0 && (
                            <tr>
                              <td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-sm">
                                Belum ada toko yang terdaftar.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
