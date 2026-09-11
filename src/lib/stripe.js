import { loadStripe } from '@stripe/stripe-js'

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

/**
 * Stripe instance — null jika key belum dikonfigurasi.
 * Gunakan di komponen checkout untuk redirect ke Stripe Checkout.
 */
export const stripePromise = stripeKey ? loadStripe(stripeKey) : null

/**
 * Data pricing plans untuk TokoTrack.
 * stripePriceId diambil dari env var — set di Stripe Dashboard.
 */
export const PRICING_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Untuk toko kecil yang baru memulai digitalisasi',
    monthlyPrice: 49000,
    yearlyPrice: 470400, // 20% diskon
    features: [
      '500 transaksi / bulan',
      '1 cabang',
      '2 akun staff',
      'Laporan dasar',
      'Dukungan email',
      'Backup harian',
    ],
    limitations: [
      'Export PDF saja',
      'Tanpa API access',
    ],
    cta: 'Mulai Starter',
    popular: false,
    stripePriceIdMonthly: import.meta.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID || null,
    stripePriceIdYearly: import.meta.env.VITE_STRIPE_STARTER_YEARLY_PRICE_ID || null,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Untuk toko berkembang dengan banyak cabang',
    monthlyPrice: 149000,
    yearlyPrice: 1430400, // 20% diskon
    features: [
      'Transaksi unlimited',
      'Hingga 5 cabang',
      '10 akun staff',
      'Laporan lengkap + Export',
      'Dukungan prioritas',
      'Backup realtime',
      'Rekap per kategori',
      'Manajemen DP / cicilan',
    ],
    limitations: [],
    cta: 'Pilih Pro',
    popular: true,
    stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID || null,
    stripePriceIdYearly: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID || null,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Untuk jaringan toko besar dengan kebutuhan khusus',
    monthlyPrice: null, // Custom pricing
    yearlyPrice: null,
    features: [
      'Transaksi unlimited',
      'Cabang unlimited',
      'Staff unlimited',
      'Laporan custom + API',
      'Account manager dedicated',
      'SLA 99.9%',
      'Integrasi marketplace',
      'White-label option',
    ],
    limitations: [],
    cta: 'Hubungi Kami',
    popular: false,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
  },
}

/**
 * Format harga ke Rupiah.
 */
export function formatPrice(amount) {
  if (amount == null) return 'Custom'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Redirect ke Stripe Checkout.
 */
export async function redirectToCheckout(planKey, isYearly = false) {
  const plan = PRICING_PLANS[planKey]
  if (!plan) {
    console.error('Plan tidak ditemukan:', planKey)
    return
  }

  // Enterprise → hubungi via WhatsApp / email
  if (planKey === 'enterprise') {
    window.open('mailto:hello@tokotrack.com?subject=Enterprise Plan Inquiry', '_blank')
    return
  }

  const priceId = isYearly ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly

  if (!stripePromise || !priceId) {
    // Fallback jika tidak ada konfigurasi Stripe
    console.warn('Stripe belum dikonfigurasi. Redirect ke halaman register.')
    window.location.href = '/app'
    return
  }

  try {
    const stripe = await stripePromise
    
    // Gunakan supabase dari file supabase.js yang ada (import di bawah)
    const { supabase } = await import('./supabase')
    
    if (!supabase) {
      throw new Error("Supabase client is not initialized")
    }

    // Panggil Edge Function
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId }
    })

    if (error) {
      throw new Error(error.message || 'Gagal memanggil fungsi checkout')
    }

    if (data && data.sessionId) {
      // Redirect ke Stripe Checkout menggunakan Session ID
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })
      if (stripeError) {
        throw new Error(stripeError.message)
      }
    } else {
      throw new Error('Tidak mendapatkan Session ID dari backend')
    }

  } catch (err) {
    console.error('Stripe checkout error:', err)
    alert('Maaf, terjadi kesalahan saat menyiapkan pembayaran: ' + err.message)
  }
}

