import { useState } from 'react'
import { supabase, signIn, signUp, resetPassword } from '../lib/supabase'

export default function Auth({ onAuthSuccess, useSupabase }) {
  const [mode, setMode] = useState('login') // 'login', 'register', 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [branchName, setBranchName] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!useSupabase) {
      // Mock mode for local fallback
      if (mode === 'login') {
        if (email === 'admin@toko.com' && password === 'admin123') {
          onAuthSuccess(
            { id: 'mock-admin', email },
            { role: 'superadmin' }
          )
        } else if (email && password) {
          onAuthSuccess(
            { id: 'mock-owner', email },
            { role: 'owner', store_id: 'mock-store-id', branch_id: 'branch-1', stores: { name: 'Toko Baju Lokal' }, branches: { name: 'Cabang Utama' } }
          )
        } else {
          setError('Email dan password harus diisi')
        }
      } else if (mode === 'register') {
        if (!storeName.trim() || !branchName.trim()) {
          setError('Nama Toko dan Cabang Utama harus diisi.')
          setLoading(false)
          return
        }
        onAuthSuccess(
          { id: 'mock-owner', email },
          { role: 'owner', store_id: 'mock-store-id', branch_id: 'mock-branch-id', stores: { name: storeName.trim() }, branches: { name: branchName.trim() } }
        )
      } else {
        setMessage('Link reset sandi simulasi telah dikirim ke email Anda.')
      }
      setLoading(false)
      return
    }

    try {
      if (mode === 'login') {
        const { data, error: err } = await signIn(email, password)
        if (err) throw err
        
        // Fetch user profile
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('*, stores(name), branches(name)')
          .eq('id', data.user.id)
          .single()
        
        if (profErr && profErr.code !== 'PGRST116') throw profErr
        
        onAuthSuccess(data.user, profile)
      } else if (mode === 'register') {
        if (!storeName.trim() || !branchName.trim()) {
          throw new Error('Nama Toko dan Cabang Utama harus diisi.')
        }

        const { data, error: err } = await signUp(email, password)
        if (err) throw err

        const user = data.user
        const session = data.session

        if (user && !session) {
          setMessage('Registrasi akun berhasil! Silakan periksa kotak masuk email Anda untuk melakukan verifikasi akun terlebih dahulu sebelum masuk (login).')
          setMode('login')
          setLoading(false)
          return
        }

        if (user && session) {
          // 1. Create Store
          const { data: store, error: storeErr } = await supabase
            .from('stores')
            .insert([{ name: storeName.trim() }])
            .select()
            .single()
          if (storeErr) throw storeErr

          // 2. Create Branch
          const { data: branch, error: branchErr } = await supabase
            .from('branches')
            .insert([{ store_id: store.id, name: branchName.trim() }])
            .select()
            .single()
          if (branchErr) throw branchErr

          // 3. Create Profile
          const { error: profileErr } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              store_id: store.id,
              branch_id: branch.id,
              role: 'owner',
              email: email.trim()
            }])
          if (profileErr) throw profileErr

          setMessage('Registrasi toko dan akun berhasil! Anda telah masuk secara otomatis.')
          onAuthSuccess(user, {
            id: user.id,
            store_id: store.id,
            branch_id: branch.id,
            role: 'owner',
            stores: store,
            branches: branch
          })
        }
      } else if (mode === 'forgot') {
        const { error: err } = await resetPassword(email)
        if (err) throw err
        setMessage('Tautan reset password telah dikirim ke email Anda.')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl p-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-50 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-green-100">
              <span className="text-white text-xl font-bold">T</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">TS Clothing</h2>
            <p className="text-sm text-gray-400 mt-1">
              {mode === 'login' && 'Masuk ke akun toko Anda'}
              {mode === 'register' && 'Buat akun baru'}
              {mode === 'forgot' && 'Reset sandi akun Anda'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-3 bg-green-50 border border-green-100 text-green-700 rounded-2xl text-xs font-medium">
              ✓ {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-gray-800"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-gray-800"
                />
              </div>
            )}

            {mode === 'register' && (
              <>
                <hr className="border-gray-100 my-4" />
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Nama Toko</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Toko Baju Utama"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Nama Cabang Utama</label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Cabang Pusat"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-gray-800"
                  />
                </div>
              </>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-green-600 hover:text-green-700 font-semibold"
                >
                  Lupa Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold text-sm transition-all shadow-md shadow-green-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  {mode === 'login' && 'Masuk'}
                  {mode === 'register' && 'Daftar Toko & Akun'}
                  {mode === 'forgot' && 'Kirim Link Reset'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-gray-400 font-medium">
            {mode === 'login' && (
              <p>
                Belum punya akun?{' '}
                <button
                  onClick={() => { setMode('register'); setError(null); setMessage(null); }}
                  className="text-green-600 hover:text-green-700 font-bold"
                >
                  Daftar Sekarang
                </button>
              </p>
            )}
            {mode === 'register' && (
              <p>
                Sudah memiliki akun?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                  className="text-green-600 hover:text-green-700 font-bold"
                >
                  Masuk di sini
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p>
                Kembali ke halaman{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                  className="text-green-600 hover:text-green-700 font-bold"
                >
                  Masuk
                </button>
              </p>
            )}
          </div>

          {!useSupabase && (
            <div className="mt-6 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-[10px] text-amber-700 leading-normal">
              💡 <strong>Simulasi Mode Lokal:</strong> Gunakan email bebas untuk mendaftar/masuk. Untuk masuk sebagai <strong>Superadmin</strong>, gunakan <code>admin@toko.com</code> dan password <code>admin123</code>.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
