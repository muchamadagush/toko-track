import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Checkout from './components/Checkout'
import CatatBarang from './components/CatatBarang'
import DaftarTransaksi from './components/DaftarTransaksi'
import Rekap from './components/Rekap'
import KelolaKategori from './components/KelolaKategori'
import CatatPengeluaran from './components/CatatPengeluaran'
import DaftarPengeluaran from './components/DaftarPengeluaran'
import Auth from './components/Auth'
import Paywall from './components/Paywall'
import SuperadminDashboard from './components/SuperadminDashboard'
import ManajemenToko from './components/ManajemenToko'
import Settings from './components/Settings'
import { useTransactions } from './hooks/useTransactions'
import { useExpenses } from './hooks/useExpenses'
import { useCategories } from './hooks/useCategories'
import { calcSummary, fmtShort, fmt } from './lib/utils'
import { supabase, signOut } from './lib/supabase'

// ─── App Dashboard (existing app logic) ───────────────────────────
function AppDashboard() {
  const [tab, setTab] = useState('catat')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const useSupabase = !!supabase

  const [selectedBranchId, setSelectedBranchId] = useState('all')
  const [storeBranches, setStoreBranches] = useState([])

  const fetchStoreBranches = async (storeId) => {
    if (!useSupabase) {
      setStoreBranches([
        { id: 'branch-1', name: 'Cabang Bandung' },
        { id: 'branch-2', name: 'Cabang Jakarta' }
      ])
      return
    }
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('store_id', storeId)
      if (error) throw error
      setStoreBranches(data || [])
    } catch (err) {
      console.error('Gagal memuat daftar cabang:', err.message)
    }
  }

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, stores(name, trial_ends_at, subscription_ends_at, subscription_status, created_at), branches(name)')
        .eq('id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setProfile(data)
      } else {
        // Fallback for user without profile (like default superadmin)
        setProfile({ id: userId, role: 'owner' })
      }
    } catch (err) {
      console.error('Error fetching profile:', err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    if (!useSupabase) {
      setAuthLoading(false)
      return
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setAuthLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setAuthLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [useSupabase])

  useEffect(() => {
    if (profile) {
      if (profile.role === 'owner' || profile.role === 'manager') {
        setSelectedBranchId('all')
      } else {
        setSelectedBranchId(profile.branch_id || 'all')
      }
      
      if (profile.store_id) {
        fetchStoreBranches(profile.store_id)
      }
    }
  }, [profile, useSupabase])

  const handleLogout = async () => {
    if (useSupabase) {
      await signOut()
    }
    setUser(null)
    setProfile(null)
  }

  // Load hooks with profile and branch context
  const { transactions, loading: tLoading, error: tError, addTransaction, updateTransaction, deleteTransaction, deleteAll } = useTransactions(profile, selectedBranchId)
  const { expenses, loading: eLoading, addExpense, deleteExpense, deleteAll: deleteAllExpenses } = useExpenses(profile, selectedBranchId)
  const { categories, loading: cLoading, addCategory, updateCategory, deleteCategory } = useCategories(profile)

  const loading = tLoading || eLoading
  const error = tError
  const summary = calcSummary(transactions, expenses)
  const isOwner = profile?.role === 'owner'

  // Check Trial Status
  let isTrialExpired = false
  if (profile && profile.role !== 'superadmin' && profile.stores) {
    if (useSupabase) {
      const { trial_ends_at, subscription_status } = profile.stores
      if (subscription_status !== 'active') {
        const endDate = new Date(trial_ends_at).getTime()
        const now = new Date().getTime()
        if (now > endDate || subscription_status === 'expired' || subscription_status === 'pending_payment') {
          isTrialExpired = true
        }
      }
    } else {
      // Local fallback logic
      const localStatus = localStorage.getItem('local_subscription_status')
      if (localStatus !== 'active') {
        const localStartDate = localStorage.getItem('local_trial_start')
        if (!localStartDate) {
          localStorage.setItem('local_trial_start', new Date().toISOString())
        } else {
          const endDate = new Date(localStartDate).getTime() + (7 * 24 * 60 * 60 * 1000) // +7 days
          if (new Date().getTime() > endDate) {
            isTrialExpired = true
          }
        }
      }
    }
  }

  // Configure navigation items dynamically based on role
  let navItems = []

  if (!isTrialExpired) {
    navItems = [
      { id: 'catat', label: 'Catat Barang', icon: '📝' },
      { id: 'daftar', label: 'Transaksi', icon: '💰' },
      { id: 'pengeluaran', label: 'Pengeluaran', icon: '💸' },
      { id: 'rekap', label: 'Rekap Laporan', icon: '📊' },
    ]

    if (profile?.role === 'owner') {
      navItems.push({ id: 'kategori', label: 'Kelola Kategori', icon: '🏷️' })
      navItems.push({ id: 'manajemen', label: 'Manajemen Toko', icon: '🏪' })
    }
  }

  navItems.push({
    id: 'group_settings',
    label: 'Pengaturan',
    isGroup: true,
    subItems: [
      { id: 'settings_general', label: 'Umum', icon: '⚙️' },
      { id: 'settings_billing', label: 'Langganan', icon: '💳' },
      { id: 'settings_history', label: 'Riwayat Transaksi', icon: '📜' }
    ]
  })
  // Force tab to settings_billing if trial expired
  useEffect(() => {
    if (isTrialExpired && !tab.startsWith('settings_')) {
      setTab('settings_billing')
    }
  }, [isTrialExpired, tab])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-medium">Memuat aplikasi...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Auth onAuthSuccess={(u, p) => { setUser(u); setProfile(p); }} useSupabase={useSupabase} />
      </div>
    )
  }

  // If role is superadmin
  if (profile?.role === 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <SuperadminDashboard onLogout={handleLogout} useSupabase={useSupabase} profile={profile} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col md:flex-row relative">
      
      {/* Drawer Overlay for Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar (Desktop & Mobile Sliding Drawer) */}
      <aside className={`fixed top-0 bottom-0 left-0 bg-white border-r border-gray-100 w-[260px] z-30 transition-transform duration-300 md:translate-x-0 md:static md:flex md:flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header inside Sidebar */}
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center shadow-md shadow-green-100 flex-shrink-0">
            <span className="text-white text-sm font-bold">T</span>
          </div>
          <div className="min-w-0">
            <span className="font-bold text-gray-900 text-sm block leading-tight truncate">
              {profile?.stores?.name || 'TS Clothing'}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">
              Role: {profile?.role || 'Owner'}
            </span>
          </div>
        </div>

        {/* Branch Selector Section */}
        <div className="px-6 py-4 border-b border-gray-50 space-y-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Cabang Aktif</label>
          {(profile?.role === 'owner' || profile?.role === 'manager') ? (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 font-bold text-gray-600"
            >
              <option value="all">🌐 Semua Cabang</option>
              {storeBranches.map(b => (
                <option key={b.id} value={b.id}>📍 {b.name}</option>
              ))}
            </select>
          ) : (
            <div className="text-xs bg-gray-50 border border-gray-50 rounded-xl px-3 py-2 font-bold text-gray-600 flex items-center gap-1.5">
              <span>📍</span>
              <span className="truncate">{profile?.branches?.name || 'Cabang Utama'}</span>
            </div>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <div key={item.id}>
              {item.isGroup ? (
                <div className="mt-4 mb-1">
                  <span className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                  <div className="mt-2 space-y-1">
                    {item.subItems.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setTab(sub.id)
                          setMobileMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${tab === sub.id ? 'bg-green-50 text-green-700 shadow-sm shadow-green-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span className="text-base leading-none pl-1">{sub.icon}</span>
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTab(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${tab === item.id ? 'bg-green-50 text-green-700 shadow-sm shadow-green-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* Footer Area inside Sidebar */}
        <div className="p-4 border-t border-gray-50 space-y-2">
          {profile?.email && (
            <div className="px-3 py-2 text-[10px] text-gray-400 font-bold uppercase truncate">
              👤 {profile.email}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <span>🚪</span>
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Navbar Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10 md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-gray-500 font-bold"
            >
              ☰
            </button>
            <div className="min-w-0">
              <span className="font-bold text-gray-900 text-sm block leading-tight truncate">
                {profile?.stores?.name || 'TS Clothing'}
              </span>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">
                {selectedBranchId === 'all' ? '🌐 Semua Cabang' : `📍 ${storeBranches.find(b => b.id === selectedBranchId)?.name || 'Cabang'}`}
              </span>
            </div>
          </div>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${useSupabase ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {useSupabase ? 'Supabase' : 'Lokal'}
          </span>
        </header>

        {/* Main Viewport Container */}
        <main className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              ⚠️ Error: {error}
            </div>
          )}

          {/* Summary Strip (Hide when viewing management or settings page) */}
          {tab !== 'manajemen' && !tab.startsWith('settings_') && (
            <div className={`grid grid-cols-2 ${isOwner ? 'sm:grid-cols-5' : 'sm:grid-cols-3'} gap-3 mb-6`}>
              {[
                { label: 'Total Transaksi', val: `${summary.count} item` },
                isOwner && { label: 'Total Modal', val: fmt(summary.totalModal) },
                { label: 'Total Penjualan', val: fmt(summary.totalJual) },
                { label: 'Pengeluaran', val: fmt(summary.totalExpense), highlight: 'red' },
                isOwner && { label: summary.totalLaba >= 0 ? 'Laba Bersih' : 'Rugi Bersih', val: fmt(summary.totalLaba), highlight: summary.totalLaba >= 0 ? 'green' : 'red' },
              ].filter(Boolean).map(c => (
                <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">{c.label}</p>
                  <p className={`text-base sm:text-lg font-bold ${c.highlight === 'green' ? 'text-green-600' : c.highlight === 'red' ? 'text-red-500' : 'text-gray-800'}`}>
                    {summary.count === 0 && c.label !== 'Pengeluaran' ? (c.label === 'Total Transaksi' ? '0 item' : 'Rp 0') : c.val}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* View Dispatcher */}
          {tab === 'catat' && <CatatBarang onAdd={addTransaction} categories={categories} profile={profile} />}
          {tab === 'daftar' && <DaftarTransaksi transactions={transactions} categories={categories} onDelete={deleteTransaction} onUpdate={updateTransaction} onDeleteAll={deleteAll} loading={loading} profile={profile} />}
          {tab === 'pengeluaran' && (
            <div className="space-y-6">
              <CatatPengeluaran onAdd={addExpense} />
              <DaftarPengeluaran expenses={expenses} onDelete={deleteExpense} onDeleteAll={deleteAllExpenses} loading={loading} />
            </div>
          )}
          {tab === 'rekap' && <Rekap transactions={transactions} expenses={expenses} />}
          {tab === 'kategori' && profile?.role === 'owner' && (
            <KelolaKategori
              categories={categories}
              transactions={transactions}
              onAdd={addCategory}
              onUpdate={updateCategory}
              onDelete={deleteCategory}
              loading={cLoading}
            />
          )}
          {tab === 'manajemen' && profile?.role === 'owner' && (
            <ManajemenToko profile={profile} useSupabase={useSupabase} />
          )}
          {tab.startsWith('settings_') && (
            <Settings 
              profile={profile} 
              useSupabase={useSupabase} 
              isTrialExpired={isTrialExpired} 
              activeTab={tab}
              onCheckStatus={() => {
                setAuthLoading(true)
                if (user) fetchProfile(user.id)
              }} 
            />
          )}
        </main>
      </div>
    </div>
  )
}

// ─── Root App with Routes ─────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/app" element={<AppDashboard />} />
    </Routes>
  )
}
