import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PRICING_PLANS, formatPrice } from '../lib/stripe'

import { Navbar } from './LandingPage'

export default function Checkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('plan') || 'pro'
  const isYearly = searchParams.get('yearly') === 'true'
  
  const plan = PRICING_PLANS[planId] || PRICING_PLANS['pro']
  const price = isYearly && plan.yearlyPrice 
    ? Math.round(plan.yearlyPrice / 12) 
    : plan.monthlyPrice

  const [formData, setFormData] = useState({
    namaToko: '',
    namaCabang: 'Pusat',
    email: '',
    password: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleCheckout = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    
    try {
      // 1. Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })
      if (authError) throw authError
      if (!authData.user) throw new Error("Gagal mendaftar, coba lagi nanti.")

      // 2. Create Store with pending_payment so they get hit by the Paywall immediately without trial text
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert([{
          name: formData.namaToko,
          subscription_status: 'pending_payment',
          trial_ends_at: new Date().toISOString() // Expired immediately
        }])
        .select()
        .single()
      if (storeError) throw storeError

      // 3. Create Branch
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .insert([{
          store_id: store.id,
          name: formData.namaCabang
        }])
        .select()
        .single()
      if (branchError) throw branchError

      // 4. Upsert Profile (email added here for safety, though trigger handles owner creation)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          store_id: store.id,
          branch_id: branch.id,
          role: 'owner',
          email: formData.email.trim()
        })
      if (profileError) throw profileError

      // Done! Navigate to App. The AppWrapper will detect 'expired' and show Paywall.
      navigate('/app')
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar minimal={true} />
      <div className="min-h-screen pt-16 md:pt-20 bg-gray-50 flex flex-col md:flex-row">
        {/* Left Panel - Order Summary */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white p-8 md:p-12 md:w-5/12 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <button onClick={() => navigate('/')} className="text-white/70 hover:text-white mb-10 flex items-center gap-2 text-sm font-semibold transition-colors">
            ← Kembali
          </button>
          
          <h2 className="text-3xl font-bold mb-2">Ringkasan Pesanan</h2>
          <p className="text-brand-200 mb-8">Anda selangkah lagi untuk mendigitalisasi toko Anda.</p>
          
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-brand-200">{isYearly ? 'Tagihan Tahunan' : 'Tagihan Bulanan'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatPrice(price)}</p>
                <p className="text-xs text-brand-200">/ bulan</p>
              </div>
            </div>
            
            <hr className="border-white/20 my-4" />
            
            <ul className="space-y-3">
              {plan.features.slice(0, 3).map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-brand-50">
                  <span className="text-brand-300">✓</span> {feature}
                </li>
              ))}
            </ul>
          </div>
          

        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="p-8 md:p-12 md:w-7/12 flex items-center justify-center">
        <div className="max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Buat Akun Toko</h2>
          <p className="text-gray-500 mb-8 text-sm">Isi data di bawah ini untuk membuat toko Anda. Pembayaran dilakukan di langkah selanjutnya.</p>
          
          <form onSubmit={handleCheckout} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Toko</label>
                <input required type="text" name="namaToko" value={formData.namaToko} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 transition-shadow" placeholder="Contoh: Toko Maju" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Cabang</label>
                <input required type="text" name="namaCabang" value={formData.namaCabang} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 transition-shadow" placeholder="Contoh: Pusat" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 transition-shadow" placeholder="email@contoh.com" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
              <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 transition-shadow" placeholder="Minimal 6 karakter" minLength={6} />
            </div>
            
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
                {errorMsg}
              </div>
            )}
            
            <button disabled={loading} type="submit" className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 flex justify-center items-center gap-2">
              {loading ? 'Memproses...' : 'Daftar & Lanjutkan Pembayaran →'}
            </button>
            
            <p className="text-center text-xs text-gray-400 mt-4">
              Sudah punya akun? <a href="/app" className="text-brand-600 font-bold hover:underline">Masuk di sini</a>
            </p>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}
