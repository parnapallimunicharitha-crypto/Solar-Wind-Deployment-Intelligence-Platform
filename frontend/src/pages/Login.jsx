import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'

// SVG solar/wind decorative icons
function SunIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      <circle cx="32" cy="32" r="14" fill="rgba(251,191,36,0.9)" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line key={i}
          x1={32 + 18 * Math.cos(deg * Math.PI / 180)}
          y1={32 + 18 * Math.sin(deg * Math.PI / 180)}
          x2={32 + 28 * Math.cos(deg * Math.PI / 180)}
          y2={32 + 28 * Math.sin(deg * Math.PI / 180)}
          stroke="rgba(251,191,36,0.7)" strokeWidth="3" strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

function WindTurbineIcon() {
  return (
    <svg viewBox="0 0 80 120" fill="none" className="w-full h-full">
      {/* Mast */}
      <rect x="37" y="55" width="6" height="60" rx="3" fill="rgba(255,255,255,0.4)" />
      {/* Blades */}
      <ellipse cx="40" cy="50" rx="5" ry="28" fill="rgba(255,255,255,0.6)" transform="rotate(0 40 50)" />
      <ellipse cx="40" cy="50" rx="5" ry="28" fill="rgba(255,255,255,0.5)" transform="rotate(120 40 50)" />
      <ellipse cx="40" cy="50" rx="5" ry="28" fill="rgba(255,255,255,0.5)" transform="rotate(240 40 50)" />
      {/* Hub */}
      <circle cx="40" cy="50" r="6" fill="rgba(255,255,255,0.9)" />
    </svg>
  )
}

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '', remember: false })
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const { login, loginWithToken, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const role = params.get('role')
    const ssoError = params.get('error')

    if (token && role) {
      loginWithToken(token, role).then((res) => {
        if (res.success) {
          navigate('/dashboard')
        } else {
          setError(res.error)
        }
      })
    } else if (ssoError) {
      setError(decodeURIComponent(ssoError))
    }
  }, [navigate, loginWithToken])

  const handleGoogleLogin = async () => {
    setError('')
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/google/config`
    console.log('[Google OAuth] Calling:', url)
    try {
      const res = await authAPI.googleConfig()
      const config = res.data
      console.log('[Google OAuth] Config response:', config)
      if (config.configured === true) {
        // Backend confirmed Google OAuth is configured — redirect immediately
        const loginUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/google/login`
        console.log('[Google OAuth] Redirecting to:', loginUrl)
        window.location.href = loginUrl
      } else {
        // Backend explicitly says it is not configured
        const missingVars = (config.missing || []).join(', ')
        setError(`Google OAuth is not configured on the backend. Missing environment variables: ${missingVars || 'unknown'}`)
      }
    } catch (err) {
      console.error('[Google OAuth] Request failed:', err)
      setError(
        'Failed to reach backend for Google OAuth check. ' +
        'Ensure the backend is running at ' +
        (import.meta.env.VITE_API_URL || 'http://localhost:8000') +
        ' and CORS allows this origin.'
      )
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.username.trim()) {
      setError('Username is required')
      triggerShake()
      return
    }
    if (form.password.length < 3) {
      setError('Password must be at least 3 characters')
      triggerShake()
      return
    }

    const result = await login(form.username, form.password)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Invalid credentials. Please try again.')
      triggerShake()
    }
  }

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  return (
    <div className="min-h-screen hero-gradient flex">
      {/* ── Floating orbs ── */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ── Left hero panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[55%] flex-col items-center justify-center px-16 relative z-10">
        {/* Illustrations row */}
        <div className="flex items-end justify-center gap-12 mb-10">
          <div className="w-24 h-24 animate-spin-slow opacity-90">
            <SunIcon />
          </div>
          <div className="w-20 h-28 opacity-80" style={{ animation: 'float-orb 4s ease-in-out infinite' }}>
            <WindTurbineIcon />
          </div>
          <div className="w-16 h-16 animate-spin-slow opacity-70" style={{ animationDirection: 'reverse', animationDuration: '12s' }}>
            <SunIcon />
          </div>
        </div>

        {/* Hero text */}
        <div className="text-center max-w-lg">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-emerald-300 text-xs font-semibold mb-5 backdrop-blur-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            AI-Powered • Real-Time • GIS Intelligence
          </div>
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Solar & Wind{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Intelligence
            </span>{' '}
            Platform
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-8">
            Advanced renewable energy site assessment using NASA POWER, Global Wind Atlas,
            SRTM terrain data, and OpenStreetMap infrastructure analysis.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {['☀️ Solar Analysis', '🌬️ Wind Prediction', '⛰️ Terrain Scoring',
              '🗺️ GIS Mapping', '📊 Feature Engineering', '🤖 AI Assessment'].map(f => (
              <span key={f} className="bg-white/10 border border-white/15 text-white/80 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-medium">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
          {[
            { label: 'Data Sources', value: '4' },
            { label: 'Parameters', value: '14+' },
            { label: 'Accuracy', value: '94%' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-black text-white">{s.value}</div>
              <div className="text-white/50 text-xs font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md animate-fade-in-up">

          {/* Logo mark */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md mb-4 text-3xl shadow-lg">
              🌿
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-white/60 text-sm mt-1">Sign in to your intelligence workspace</p>
          </div>

          {/* Glassmorphism card */}
          <div className={`card-glass p-8 shadow-2xl ${shake ? 'animate-shake' : ''}`}>

            {/* Error message */}
            {error && (
              <div className="mb-5 flex items-start gap-3 bg-red-500/15 border border-red-400/30 text-red-200 rounded-xl px-4 py-3 text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Username</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    className="input-glass pl-10"
                    type="text"
                    placeholder="Enter your username"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-white/80">Password</label>
                  <button type="button" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    className="input-glass pl-10"
                    type="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 rounded accent-emerald-500"
                  checked={form.remember}
                  onChange={e => setForm({ ...form, remember: e.target.checked })}
                />
                <label htmlFor="remember" className="text-sm text-white/70 select-none cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              {/* Sign in button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In to Platform
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider my-5">
              <span className="text-white/40 text-xs font-medium">OR CONTINUE WITH</span>
            </div>

            {/* Google OAuth button */}
            <button
              type="button"
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-sm"
              onClick={handleGoogleLogin}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            {/* Register link */}
            <p className="text-center text-sm text-white/60 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Create account →
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-white/30 text-xs mt-6">
            Infosys Virtual Internship Project · Solar & Wind Intelligence Platform v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
