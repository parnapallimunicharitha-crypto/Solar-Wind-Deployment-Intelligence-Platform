import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { value: 'Renewable Energy Planner', label: '🌱 Renewable Energy Planner', desc: 'Site scouting & assessments' },
  { value: 'GIS Analyst',              label: '🗺️ GIS Analyst',              desc: 'Spatial data & terrain analysis' },
  { value: 'Project Manager',          label: '📋 Project Manager',          desc: 'Project lifecycle management' },
  { value: 'Administrator',            label: '⚙️ Administrator',            desc: 'Full system access' },
]

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirm: '',
    role: 'Renewable Energy Planner',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [shake, setShake] = useState(false)
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      triggerShake(); return
    }
    if (form.password.length < 4) {
      setError('Password must be at least 4 characters')
      triggerShake(); return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      triggerShake(); return
    }

    const result = await register({
      username: form.username.trim(),
      password: form.password,
      role: form.role,
    })

    if (result.success) {
      setSuccess('Account created successfully! Redirecting...')
      setTimeout(() => navigate('/login'), 1600)
    } else {
      setError(result.error || 'Registration failed.')
      triggerShake()
    }
  }

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  const pwStrength = form.password.length === 0 ? 0
    : form.password.length < 4 ? 1
    : form.password.length < 7 ? 2
    : form.password.length < 10 ? 3 : 4

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="w-full max-w-lg relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md mb-4 text-3xl shadow-lg">
            🌱
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Create Account</h1>
          <p className="text-white/60 text-sm mt-1.5">Join the Renewable Intelligence Platform</p>
        </div>

        {/* Glass card */}
        <div className={`card-glass p-8 shadow-2xl ${shake ? 'animate-shake' : ''}`}>
          {/* Messages */}
          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-500/15 border border-red-400/30 text-red-200 rounded-xl px-4 py-3 text-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 flex items-center gap-3 bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 rounded-xl px-4 py-3 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Choose a username (3+ chars)"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  autoComplete="username"
                  required
                  minLength={3}
                />
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Platform Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all duration-200 ${
                      form.role === r.value
                        ? 'bg-emerald-500/25 border-emerald-400/60 text-white'
                        : 'bg-white/5 border-white/15 text-white/60 hover:bg-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="font-semibold text-[11px] mb-0.5">{r.label}</div>
                    <div className="text-[10px] opacity-70">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  className="input-glass pl-10"
                  type="password"
                  placeholder="Create a password (4+ chars)"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                  required
                />
              </div>
              {/* Strength meter */}
              {form.password.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        pwStrength >= i
                          ? i === 1 ? 'bg-red-400' : i === 2 ? 'bg-amber-400' : i === 3 ? 'bg-blue-400' : 'bg-emerald-400'
                          : 'bg-white/15'
                      }`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-white/50 shrink-0">
                    {['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  className={`input-glass pl-10 ${
                    form.confirm && form.confirm !== form.password ? 'border-red-400/60' : ''
                  }`}
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  autoComplete="new-password"
                  required
                />
                {form.confirm && form.confirm === form.password && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-white/60 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Sign in →
            </Link>
          </p>
        </div>

        <p className="text-center text-white/30 text-xs mt-5">
          Infosys Virtual Internship Project · Solar & Wind Intelligence Platform v1.0
        </p>
      </div>
    </div>
  )
}
