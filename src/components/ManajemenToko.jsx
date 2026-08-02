import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export default function ManajemenToko({ profile, useSupabase }) {
  const [activeTab, setActiveTab] = useState('branches') // 'branches', 'staff'
  
  // Branch state
  const [branches, setBranches] = useState([])
  const [newBranchName, setNewBranchName] = useState('')
  const [newBranchAddress, setNewBranchAddress] = useState('')
  const [newBranchPhone, setNewBranchPhone] = useState('')
  
  // Staff list state
  const [staffList, setStaffList] = useState([])
  
  // New Staff creation form state
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [staffRole, setStaffRole] = useState('cashier')
  const [staffBranchId, setStaffBranchId] = useState('')
  
  // Global loading/error
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    if (!profile?.store_id) return
    if (!useSupabase) {
      // Mock local branches
      const local = localStorage.getItem('toko_mock_branches')
      if (local) {
        setBranches(JSON.parse(local))
      } else {
        const initial = [
          { id: 'branch-1', name: 'Cabang Bandung', address: 'Jl. Riau No. 10', phone: '08123456701' },
          { id: 'branch-2', name: 'Cabang Jakarta', address: 'Jl. Senopati No. 5', phone: '08123456702' }
        ]
        localStorage.setItem('toko_mock_branches', JSON.stringify(initial))
        setBranches(initial)
      }
      return
    }

    try {
      const { data, error: err } = await supabase
        .from('branches')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('created_at', { ascending: true })
      if (err) throw err
      setBranches(data || [])
      if (data && data.length > 0 && !staffBranchId) {
        setStaffBranchId(data[0].id)
      }
    } catch (err) {
      setError(err.message)
    }
  }, [profile?.store_id, useSupabase, staffBranchId])

  // Fetch staff list
  const fetchStaff = useCallback(async () => {
    if (!profile?.store_id) return
    if (!useSupabase) {
      // Mock local staff
      const local = localStorage.getItem('toko_mock_staff')
      if (local) {
        setStaffList(JSON.parse(local))
      } else {
        const initial = [
          { id: 'staff-1', email: 'budi@toko.com', role: 'cashier', branch_id: 'branch-1' },
          { id: 'staff-2', email: 'siti@toko.com', role: 'manager', branch_id: 'branch-2' }
        ]
        localStorage.setItem('toko_mock_staff', JSON.stringify(initial))
        setStaffList(initial)
      }
      return
    }

    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('created_at', { ascending: true })
      if (err) throw err
      setStaffList(data || [])
    } catch (err) {
      setError(err.message)
    }
  }, [profile?.store_id, useSupabase])

  useEffect(() => {
    fetchBranches()
    fetchStaff()
  }, [fetchBranches, fetchStaff])

  // Add Branch
  const handleAddBranch = async (e) => {
    e.preventDefault()
    if (!newBranchName.trim()) return
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!useSupabase) {
      const newB = {
        id: 'branch-' + Date.now(),
        name: newBranchName.trim(),
        address: newBranchAddress.trim(),
        phone: newBranchPhone.trim()
      }
      const updated = [...branches, newB]
      localStorage.setItem('toko_mock_branches', JSON.stringify(updated))
      setBranches(updated)
      setNewBranchName('')
      setNewBranchAddress('')
      setNewBranchPhone('')
      setMessage('Cabang baru berhasil ditambahkan!')
      setLoading(false)
      return
    }

    try {
      const { error: err } = await supabase
        .from('branches')
        .insert([{
          store_id: profile.store_id,
          name: newBranchName.trim(),
          address: newBranchAddress.trim(),
          phone: newBranchPhone.trim()
        }])
      if (err) throw err
      
      await fetchBranches()
      setNewBranchName('')
      setNewBranchAddress('')
      setNewBranchPhone('')
      setMessage('Cabang baru berhasil ditambahkan!')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Create Staff
  const handleCreateStaff = async (e) => {
    e.preventDefault()
    if (!staffEmail.trim() || !staffPassword.trim()) return
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!useSupabase) {
      // Mock local staff registration
      const mockNewStaff = {
        id: 'staff-' + Date.now(),
        email: staffEmail.trim(),
        role: staffRole,
        branch_id: staffBranchId || null
      }
      const updated = [...staffList, mockNewStaff]
      localStorage.setItem('toko_mock_staff', JSON.stringify(updated))
      setStaffList(updated)
      setStaffEmail('')
      setStaffPassword('')
      setMessage('Akun staff baru (Simulasi Lokal) berhasil dibuat!')
      setLoading(false)
      return
    }

    try {
      // Initialize temporary client with session persistence disabled
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      )

      // Sign up staff user in Supabase auth (without logging out current owner)
      const { data: authData, error: authErr } = await tempClient.auth.signUp({
        email: staffEmail.trim(),
        password: staffPassword.trim()
      })
      if (authErr) throw authErr

      const staffUser = authData.user
      if (staffUser) {
        // Insert profile using main supabase client
        const { error: profileErr } = await supabase
          .from('profiles')
          .insert([{
            id: staffUser.id,
            store_id: profile.store_id,
            branch_id: staffBranchId || null,
            role: staffRole
          }])
        if (profileErr) throw profileErr

        setMessage(`Staff ${staffEmail.trim()} berhasil dibuat! Silakan minta staff untuk memeriksa kotak masuk email mereka untuk konfirmasi.`);
        setStaffEmail('')
        setStaffPassword('')
        await fetchStaff()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Update Staff Role / Branch
  const handleUpdateStaff = async (staffId, updates) => {
    setError(null)
    setMessage(null)

    if (!useSupabase) {
      const updated = staffList.map(s => s.id === staffId ? { ...s, ...updates } : s)
      localStorage.setItem('toko_mock_staff', JSON.stringify(updated))
      setStaffList(updated)
      setMessage('Profil staff berhasil diperbarui!')
      return
    }

    try {
      const { error: err } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', staffId)
      if (err) throw err
      
      await fetchStaff()
      setMessage('Profil staff berhasil diperbarui!')
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete Staff Access
  const handleDeleteStaff = async (staffId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus akses staff ini?')) return
    setError(null)
    setMessage(null)

    if (!useSupabase) {
      const updated = staffList.filter(s => s.id !== staffId)
      localStorage.setItem('toko_mock_staff', JSON.stringify(updated))
      setStaffList(updated)
      setMessage('Akses staff berhasil dicabut!')
      return
    }

    try {
      // Disconnect profile from store
      const { error: err } = await supabase
        .from('profiles')
        .update({ store_id: null, branch_id: null, role: 'cashier' })
        .eq('id', staffId)
      if (err) throw err
      
      await fetchStaff()
      setMessage('Akses staff berhasil dicabut!')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title & Copy Store ID */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Toko</h1>
          <p className="text-sm text-gray-400">Atur cabang toko dan hak akses pengguna/staff</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('branches')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'branches' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          🏬 Cabang ({branches.length})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'staff' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          👥 Staff & Kasir ({staffList.length})
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-2xl text-xs font-medium">
          ✓ {message}
        </div>
      )}

      {/* Content tabs */}
      {activeTab === 'branches' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List Cabang */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Daftar Cabang</h3>
            {branches.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Belum ada cabang terdaftar.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((b) => (
                  <div key={b.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-2">
                    <h4 className="font-bold text-gray-900 text-base">📍 {b.name}</h4>
                    {b.address && <p className="text-xs text-gray-500">Alamat: {b.address}</p>}
                    {b.phone && <p className="text-xs text-gray-500">Telepon: {b.phone}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Tambah Cabang */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Tambah Cabang Baru</h3>
            <form onSubmit={handleAddBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Cabang</label>
                <input
                  type="text"
                  required
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="e.g. Cabang Bandung"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Alamat</label>
                <input
                  type="text"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  placeholder="Jl. Merdeka No. 5"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Telepon</label>
                <input
                  type="text"
                  value={newBranchPhone}
                  onChange={(e) => setNewBranchPhone(e.target.value)}
                  placeholder="0812xxxx"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold text-xs transition-all shadow-sm"
              >
                {loading ? 'Menambahkan...' : 'Simpan Cabang'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Staff List Table */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm overflow-x-auto space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">Daftar Pengguna / Staff</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                  <th className="pb-3">User / Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Cabang Bertugas</th>
                  <th className="pb-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50">
                    <td className="py-4 font-medium text-gray-900 break-all pr-2">
                      {staff.email || `Staff (${staff.id.slice(0, 8)})`}
                    </td>
                    <td className="py-4">
                      {staff.id === profile.id ? (
                        <span className="px-2 py-1 bg-green-50 text-green-700 font-bold rounded-lg capitalize text-[10px]">
                          {staff.role} (Anda)
                        </span>
                      ) : (
                        <select
                          value={staff.role}
                          onChange={(e) => handleUpdateStaff(staff.id, { role: e.target.value })}
                          className="bg-gray-50 border border-gray-100 rounded-xl px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 font-semibold text-gray-700"
                        >
                          <option value="cashier">Kasir / Cashier</option>
                          <option value="manager">Manajer / Manager</option>
                          <option value="owner">Pemilik / Owner</option>
                        </select>
                      )}
                    </td>
                    <td className="py-4">
                      {staff.id === profile.id ? (
                        <span className="text-gray-500 italic">Semua Cabang</span>
                      ) : (
                        <select
                          value={staff.branch_id || ''}
                          onChange={(e) => handleUpdateStaff(staff.id, { branch_id: e.target.value || null })}
                          className="bg-gray-50 border border-gray-100 rounded-xl px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 font-semibold text-gray-700"
                        >
                          <option value="">-- Tidak Ditugaskan --</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      {staff.id !== profile.id && (
                        <button
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all text-[10px]"
                        >
                          Cabut Akses
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Form Tambah Staff Baru */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Buat Akun Staff Baru</h3>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email Staff</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="staff@toko.com"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Password Staff</label>
                <input
                  type="password"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Peran (Role)</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 focus:bg-white font-semibold"
                >
                  <option value="cashier">Kasir / Cashier</option>
                  <option value="manager">Manajer / Manager</option>
                  <option value="owner">Pemilik / Owner</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Cabang Penugasan</label>
                <select
                  value={staffBranchId}
                  onChange={(e) => setStaffBranchId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 focus:bg-white font-semibold"
                >
                  <option value="">-- Tidak Ditugaskan --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold text-xs transition-all shadow-sm"
              >
                {loading ? 'Memproses...' : 'Buat Akun Staff'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
