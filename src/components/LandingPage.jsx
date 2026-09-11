import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PRICING_PLANS, formatPrice, redirectToCheckout } from '../lib/stripe'

// ─── Scroll Reveal Hook ───────────────────────────────────────────
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function RevealSection({ children, className = '' }) {
  const ref = useReveal()
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  )
}

// ─── NAVBAR ───────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Fitur', href: '#fitur' },
    { label: 'Harga', href: '#harga' },
    { label: 'Testimoni', href: '#testimoni' },
    { label: 'FAQ', href: '#faq' },
  ]

  const handleNavClick = (href) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-lg shadow-black/5 border-b border-white/20' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md shadow-brand-200 group-hover:shadow-brand-300 transition-shadow">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="font-bold text-lg text-gray-900">
              Toko<span className="text-brand-600">Track</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(link => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-sm font-semibold text-gray-600 hover:text-brand-600 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/app')}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Masuk
            </button>
            <button
              onClick={() => navigate('/app')}
              className="text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 px-5 py-2.5 rounded-xl shadow-md shadow-brand-200 hover:shadow-brand-300 transition-all hover:-translate-y-0.5"
            >
              Coba Gratis
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-gray-600"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-white/20 shadow-xl">
          <div className="px-4 py-4 space-y-1">
            {links.map(link => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="block w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-brand-50 hover:text-brand-700 rounded-xl transition-colors"
              >
                {link.label}
              </button>
            ))}
            <hr className="border-gray-100 my-2" />
            <button
              onClick={() => { setMobileOpen(false); navigate('/app') }}
              className="block w-full text-left px-4 py-3 text-sm font-semibold text-gray-600"
            >
              Masuk
            </button>
            <button
              onClick={() => { setMobileOpen(false); navigate('/app') }}
              className="w-full mt-2 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3 rounded-xl shadow-md"
            >
              Coba Gratis →
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate()

  return (
    <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-32 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-100 rounded-full blur-3xl opacity-60 animate-float" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-accent-100 rounded-full blur-3xl opacity-40 shimmer" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-brand-50/80 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 border border-brand-100 rounded-full mb-8">
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Platform #1 untuk Toko Pakaian</span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Kelola Toko Pakaian
            <br />
            <span className="text-gradient">Lebih Cerdas & Efisien</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-in-up-delay text-lg sm:text-xl text-gray-500 mt-6 max-w-2xl mx-auto leading-relaxed">
            Catat transaksi, kelola stok, pantau keuntungan, dan buat laporan otomatis — semua dalam satu dashboard yang mudah digunakan.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up-delay-2 flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <button
              onClick={() => navigate('/app')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-base rounded-2xl shadow-xl shadow-brand-200 hover:shadow-brand-300 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Mulai Gratis 14 Hari
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>
            <button
              onClick={() => {
                const el = document.querySelector('#fitur')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-200 hover:border-brand-300 text-gray-700 hover:text-brand-700 font-bold text-base rounded-2xl transition-all hover:-translate-y-0.5"
            >
              Lihat Fitur ↓
            </button>
          </div>

          {/* Trust badges */}
          <div className="animate-fade-in-up-delay-2 flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-14 text-sm text-gray-400 font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              <span><strong className="text-gray-700">500+</strong> Toko Terdaftar</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <span><strong className="text-gray-700">50K+</strong> Transaksi/Bulan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span><strong className="text-gray-700">99.9%</strong> Uptime</span>
            </div>
          </div>
        </div>

        {/* App Preview Mockup */}
        <RevealSection className="mt-16 sm:mt-20">
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-accent-500 rounded-3xl blur-2xl opacity-20 scale-95" />
            <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-2xl overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-400 text-center max-w-xs mx-auto">
                    app.tokotrack.com
                  </div>
                </div>
              </div>
              {/* Mock dashboard content */}
              <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-white min-h-[250px] sm:min-h-[400px]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  {[
                    { label: 'Total Transaksi', value: '1,247', color: 'text-gray-800' },
                    { label: 'Pendapatan', value: 'Rp 45.2jt', color: 'text-brand-600' },
                    { label: 'Pengeluaran', value: 'Rp 12.8jt', color: 'text-red-500' },
                    { label: 'Laba Bersih', value: 'Rp 32.4jt', color: 'text-brand-700' },
                  ].map(card => (
                    <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm">
                      <p className="text-[10px] sm:text-xs text-gray-400 mb-1">{card.label}</p>
                      <p className={`text-sm sm:text-lg font-bold ${card.color}`}>{card.value}</p>
                    </div>
                  ))}
                </div>
                {/* Mock chart bars */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
                  <p className="text-xs text-gray-400 mb-4 font-semibold">Rekap Penjualan Mingguan</p>
                  <div className="flex items-end gap-2 sm:gap-3 h-24 sm:h-32">
                    {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-gradient-to-t from-brand-500 to-brand-300 rounded-t-lg transition-all"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[8px] sm:text-[10px] text-gray-400 font-medium">
                          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  )
}

// ─── FEATURES ─────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: '📝',
      title: 'Pencatatan Instan',
      desc: 'Input transaksi dengan kalkulasi otomatis harga modal, harga jual, dan margin keuntungan secara realtime.',
      gradient: 'from-green-50 to-emerald-50',
      iconBg: 'bg-green-100',
    },
    {
      icon: '📊',
      title: 'Laporan Otomatis',
      desc: 'Rekap mingguan, bulanan, tahunan lengkap dengan grafik interaktif dan breakdown per kategori.',
      gradient: 'from-blue-50 to-indigo-50',
      iconBg: 'bg-blue-100',
    },
    {
      icon: '💰',
      title: 'Pembayaran & DP',
      desc: 'Dukungan pembayaran parsial (down payment), tracking sisa bayar, dan pelunasan dengan satu klik.',
      gradient: 'from-amber-50 to-yellow-50',
      iconBg: 'bg-amber-100',
    },
    {
      icon: '🏷️',
      title: 'Kategori Dinamis',
      desc: 'Buat dan kelola kategori barang tanpa batas. Proteksi data mencegah penghapusan kategori yang digunakan.',
      gradient: 'from-purple-50 to-fuchsia-50',
      iconBg: 'bg-purple-100',
    },
    {
      icon: '👥',
      title: 'Multi-Cabang & Staff',
      desc: 'Kelola banyak cabang dari satu dashboard. Atur peran staff dengan kontrol akses berbasis role.',
      gradient: 'from-pink-50 to-rose-50',
      iconBg: 'bg-pink-100',
    },
    {
      icon: '🔒',
      title: 'Aman & Terpercaya',
      desc: 'Data tersimpan di cloud dengan enkripsi. Backup otomatis dan uptime 99.9% untuk ketenangan pikiran.',
      gradient: 'from-teal-50 to-cyan-50',
      iconBg: 'bg-teal-100',
    },
  ]

  return (
    <section id="fitur" className="py-20 sm:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RevealSection className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-brand-600 uppercase tracking-wider bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            Fitur Unggulan
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Semua yang Kamu Butuhkan,{' '}
            <span className="text-gradient">Satu Platform</span>
          </h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg">
            Dirancang khusus untuk pemilik toko pakaian yang ingin mengelola bisnis secara digital tanpa ribet.
          </p>
        </RevealSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <RevealSection key={f.title}>
              <div
                className={`group bg-gradient-to-br ${f.gradient} border border-gray-100 rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full`}
                style={{ transitionDelay: `${i * 0.05}s` }}
              >
                <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── PRICING ──────────────────────────────────────────────────────
function Pricing() {
  const [isYearly, setIsYearly] = useState(false)
  const plans = Object.values(PRICING_PLANS)

  return (
    <section id="harga" className="py-20 sm:py-28 bg-gray-50 relative overflow-hidden">
      {/* Background deco */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <RevealSection className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-brand-600 uppercase tracking-wider bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            Harga Transparan
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Pilih Paket yang{' '}
            <span className="text-gradient">Sesuai Bisnis</span>mu
          </h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg">
            Mulai gratis 14 hari, tanpa kartu kredit. Upgrade kapan saja.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-semibold transition-colors ${!isYearly ? 'text-gray-900' : 'text-gray-400'}`}>
              Bulanan
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isYearly ? 'bg-brand-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isYearly ? 'translate-x-7' : ''}`} />
            </button>
            <span className={`text-sm font-semibold transition-colors ${isYearly ? 'text-gray-900' : 'text-gray-400'}`}>
              Tahunan
            </span>
            {isYearly && (
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full animate-fade-in-up">
                Hemat 20%
              </span>
            )}
          </div>
        </RevealSection>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const price = isYearly
              ? (plan.yearlyPrice ? Math.round(plan.yearlyPrice / 12) : null)
              : plan.monthlyPrice

            return (
              <RevealSection key={plan.id}>
                <div className={`pricing-card relative bg-white rounded-3xl border-2 p-6 sm:p-8 h-full flex flex-col ${plan.popular
                  ? 'border-brand-500 shadow-xl shadow-brand-100'
                  : 'border-gray-100 hover:border-gray-200'
                  }`}>
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md shadow-brand-200">
                        🔥 Paling Populer
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {price != null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          {formatPrice(price)}
                        </span>
                        <span className="text-sm text-gray-400 font-medium">/bulan</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-4xl font-bold text-gray-900">Custom</span>
                        <p className="text-sm text-gray-400 mt-1">Hubungi tim kami</p>
                      </div>
                    )}
                    {isYearly && plan.yearlyPrice && (
                      <p className="text-xs text-brand-600 font-semibold mt-2">
                        {formatPrice(plan.yearlyPrice)} / tahun
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => redirectToCheckout(plan.id, isYearly)}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 ${plan.popular
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-lg shadow-brand-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                  >
                    {plan.cta}
                  </button>

                  {/* Features */}
                  <div className="mt-8 flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Yang didapat:</p>
                    <ul className="space-y-3">
                      {plan.features.map(feature => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <svg className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                      {plan.limitations?.map(lim => (
                        <li key={lim} className="flex items-start gap-2.5 text-sm text-gray-400">
                          <svg className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {lim}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </RevealSection>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────
function Testimonials() {
  const testimonials = [
    {
      name: 'Rina Kartika',
      store: 'Boutique Rina, Bandung',
      avatar: '👩‍💼',
      rating: 5,
      quote: 'Sejak pakai TokoTrack, pencatatan barang dan laporan keuangan jadi jauh lebih rapi. Saya bisa tahu untung-rugi per kategori tanpa harus hitung manual!',
    },
    {
      name: 'Ahmad Fauzi',
      store: 'AF Fashion, Jakarta',
      avatar: '👨‍💼',
      rating: 5,
      quote: 'Fitur multi-cabang sangat membantu. Saya bisa monitor 3 toko sekaligus dari HP. Laporan otomatis setiap minggu membuat saya lebih fokus jualan.',
    },
    {
      name: 'Siti Nurhaliza',
      store: 'Hijab Corner, Surabaya',
      avatar: '👩‍🦰',
      rating: 5,
      quote: 'Dulu pakai buku tulis, sekarang semua digital dan aman. Fitur DP/cicilan sangat cocok untuk toko saya yang banyak pelanggan bayar bertahap.',
    },
  ]

  return (
    <section id="testimoni" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RevealSection className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-brand-600 uppercase tracking-wider bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            Testimoni
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Dipercaya Ratusan{' '}
            <span className="text-gradient">Pemilik Toko</span>
          </h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg">
            Dengarkan langsung dari mereka yang sudah merasakan manfaatnya.
          </p>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <RevealSection key={t.name}>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 sm:p-8 h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <span key={j} className="text-amber-400 text-lg">★</span>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-sm text-gray-600 leading-relaxed flex-1 mb-6">
                  "{t.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.store}</p>
                  </div>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────
function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      q: 'Apakah ada masa percobaan gratis?',
      a: 'Ya! Setiap pendaftaran baru mendapatkan 14 hari trial gratis untuk paket Pro. Tanpa perlu kartu kredit.',
    },
    {
      q: 'Bagaimana jika saya ingin upgrade atau downgrade paket?',
      a: 'Kamu bisa upgrade atau downgrade kapan saja dari dashboard. Perubahan akan berlaku di siklus billing berikutnya dan kami akan menghitung prorata.',
    },
    {
      q: 'Apakah data saya aman?',
      a: 'Keamanan data adalah prioritas kami. Semua data dienkripsi dan disimpan di cloud dengan backup otomatis. Kami menggunakan Supabase (berbasis PostgreSQL) dengan standar keamanan enterprise.',
    },
    {
      q: 'Bisa digunakan tanpa internet?',
      a: 'TokoTrack memiliki mode offline menggunakan localStorage. Data akan otomatis tersinkronisasi ketika koneksi internet kembali tersedia.',
    },
    {
      q: 'Berapa banyak staff yang bisa saya tambahkan?',
      a: 'Tergantung paket: Starter (2 staff), Pro (10 staff), Enterprise (unlimited). Setiap staff bisa diatur aksesnya berdasarkan role (owner, manager, kasir).',
    },
    {
      q: 'Apakah bisa digunakan di HP?',
      a: 'Tentu! TokoTrack adalah web app yang responsive dan bisa diakses dari browser HP, tablet, maupun komputer tanpa perlu install aplikasi.',
    },
    {
      q: 'Bagaimana cara menghubungi support?',
      a: 'Starter mendapat dukungan via email. Pro mendapat prioritas support dengan respon < 4 jam. Enterprise mendapat dedicated account manager.',
    },
    {
      q: 'Apakah bisa cancel subscription kapan saja?',
      a: 'Ya, kamu bisa cancel kapan saja. Akun tetap aktif hingga akhir periode billing yang sudah dibayar. Tidak ada biaya penalti.',
    },
  ]

  return (
    <section id="faq" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <RevealSection className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-brand-600 uppercase tracking-wider bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Pertanyaan yang{' '}
            <span className="text-gradient">Sering Ditanyakan</span>
          </h2>
        </RevealSection>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <RevealSection key={i}>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                >
                  <span className="text-sm font-bold text-gray-800">{faq.q}</span>
                  <span className={`text-gray-400 transition-transform duration-300 flex-shrink-0 ${openIndex === i ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <div className={`faq-answer ${openIndex === i ? 'open' : ''}`}>
                  <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">
                    {faq.a}
                  </div>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA SECTION ──────────────────────────────────────────────────
function CTASection() {
  const navigate = useNavigate()

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RevealSection>
          <div className="relative bg-gradient-to-br from-brand-600 via-brand-500 to-emerald-400 rounded-3xl p-10 sm:p-16 text-center overflow-hidden">
            {/* Deco */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Siap Mengembangkan
                <br />
                Bisnis Tokomu?
              </h2>
              <p className="text-brand-100 mt-4 text-lg max-w-xl mx-auto">
                Bergabung dengan 500+ pemilik toko pakaian yang sudah mendigitalisasi bisnis mereka bersama TokoTrack.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => navigate('/app')}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-brand-700 font-bold text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  Mulai 14 Hari Gratis →
                </button>
                <button
                  onClick={() => {
                    const el = document.querySelector('#harga')
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur border-2 border-white/30 text-white font-bold text-base rounded-2xl hover:bg-white/20 transition-all"
                >
                  Lihat Paket Harga
                </button>
              </div>
              <p className="text-brand-200 text-xs mt-6 font-medium">
                Tanpa kartu kredit · Setup dalam 2 menit · Cancel kapan saja
              </p>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  )
}

// ─── FOOTER ───────────────────────────────────────────────────────
function Footer() {
  const footerLinks = {
    Produk: [
      { label: 'Fitur', href: '#fitur' },
      { label: 'Harga', href: '#harga' },
      { label: 'Integrasi', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
    Perusahaan: [
      { label: 'Tentang Kami', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Karir', href: '#' },
      { label: 'Kontak', href: '#' },
    ],
    Dukungan: [
      { label: 'Pusat Bantuan', href: '#' },
      { label: 'Dokumentasi', href: '#' },
      { label: 'Status', href: '#' },
      { label: 'Komunitas', href: '#' },
    ],
    Legal: [
      { label: 'Kebijakan Privasi', href: '#' },
      { label: 'Syarat & Ketentuan', href: '#' },
      { label: 'Keamanan', href: '#' },
    ],
  }

  const handleFooterClick = (e, href) => {
    if (href.startsWith('#') && href.length > 1) {
      e.preventDefault()
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-bold">T</span>
              </div>
              <span className="font-bold text-lg text-white">
                Toko<span className="text-brand-400">Track</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Platform pencatatan dan manajemen toko pakaian terlengkap di Indonesia. Kelola bisnis lebih cerdas.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-6">
              {['Instagram', 'Twitter', 'YouTube', 'LinkedIn'].map((social) => (
                <a
                  key={social}
                  href="#"
                  aria-label={social}
                  className="w-9 h-9 bg-gray-800 hover:bg-brand-600 rounded-lg flex items-center justify-center transition-colors"
                >
                  <span className="text-xs font-bold text-gray-400 hover:text-white">
                    {social[0]}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={(e) => handleFooterClick(e, link.href)}
                      className="text-sm text-gray-400 hover:text-brand-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} TokoTrack. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Dibuat dengan ❤️ di Indonesia 🇮🇩
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  )
}
