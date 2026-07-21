import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const routeMeta = {
  '/dashboard':  { title: 'Dashboard',     icon: '📊', subtitle: 'Renewable Intelligence Overview' },
  '/projects':   { title: 'Projects',      icon: '📁', subtitle: 'Manage renewable energy projects' },
  '/sites':      { title: 'Sites',         icon: '📍', subtitle: 'Geographic site management' },
  '/assessment': { title: 'Assessment',    icon: '🔬', subtitle: 'GIS & environmental resource analysis' },
  '/features':   { title: 'Feature Store', icon: '⚡', subtitle: 'Spatial feature engineering records' },
  '/profile':    { title: 'Profile',       icon: '👤', subtitle: 'Account settings & permissions' },
}

export default function Navbar() {
  const { user } = useAuth()
  const location = useLocation()
  const meta = routeMeta[location.pathname] || { title: 'Platform', icon: '🌿', subtitle: 'Solar & Wind Intelligence' }

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm shrink-0">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <span className="text-xl">{meta.icon}</span>
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">{meta.title}</h1>
          <p className="text-xs text-gray-400 hidden sm:block">{meta.subtitle}</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Status pill */}
        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-glow" />
          System Online
        </div>

        {/* Notification bell */}
        <button className="btn-icon relative">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-gray-800 leading-tight">{user.username}</p>
              <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
