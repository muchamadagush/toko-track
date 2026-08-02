import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export default function SuperadminDashboard({ onLogout, useSupabase }) {
  const [stores, setStores] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (!useSupabase) {
      // Mock data for local simulation
      setStores([
        { id: 'store-1', name: 'TS Clothing Pusat', address: 'Jl. Sudirman No. 12', phone: '08123456789', created_at: new Date().toISOString() },
        { id: 'store-2', name: 'Zaria Hijab', address: 'Jl. Diponegoro No. 45', phone: '08765432100', created_at: new Date().toISOString() }
      ])
      setBranches([
        { id: 'branch-1', store_id: 'store-1', name: 'Cabang Bandung', address: 'Jl. Riau No. 10', phone: '08123456701' },
        { id: 'branch-2', store_id: 'store-1', name: 'Cabang Jakarta', address: 'Jl. Senopati No. 5', phone: '08123456702' },
        { id: 'branch-3', store_id: 'store-2', name: 'Cabang Surabaya', address: 'Jl. Tunjungan No. 3', phone: '08765432103' }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard Superadmin</h1>
          <p className="text-sm text-gray-400">Ikhtisar toko dan cabang yang aktif di platform</p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-all"
        >
          Keluar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">
          ⚠️ Error: {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400 font-medium">
          Memuat data toko dan cabang...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stores.map((store) => {
            const storeBranches = branches.filter((b) => b.store_id === store.id)

            return (
              <div key={store.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
                {/* Store Info */}
                <div className="flex items-start justify-between border-b border-gray-50 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{store.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">Terdaftar: {new Date(store.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                    {storeBranches.length} Cabang
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {store.address && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-400 w-16">Alamat:</span>
                      <span className="flex-1 text-gray-700">{store.address}</span>
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-400 w-16">Telepon:</span>
                      <span className="flex-1 text-gray-700">{store.phone}</span>
                    </div>
                  )}
                </div>

                {/* Branches Sub-List */}
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Daftar Cabang</h4>
                  {storeBranches.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Tidak ada cabang terdaftar.</p>
                  ) : (
                    <div className="space-y-3">
                      {storeBranches.map((branch) => (
                        <div key={branch.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1">
                          <div className="font-bold text-gray-800">{branch.name}</div>
                          {branch.address && <div className="text-gray-500">📍 {branch.address}</div>}
                          {branch.phone && <div className="text-gray-500">📞 {branch.phone}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
