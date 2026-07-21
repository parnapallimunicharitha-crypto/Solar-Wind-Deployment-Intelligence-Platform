import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ── Professional SVG Icon Components ─────────────────────────────────────────
function IconDashboard() {
  return (
    <svg className="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}
function IconProjects() {
  return (
    <svg className="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 012-2h3l2 2h9a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  )
}
function IconSites() {
  return (
    <svg className="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
function IconAssessment() {
  return (
    <svg className="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9l-6-6z" />
      <polyline points="9 3 9 9 15 9" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  )
}
function IconFeatures() {
  return (
    <svg className="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}
function IconProfile() {
  return (
    <svg className="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function IconLogout() {
  return (
    <svg className="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
function IconChevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',   Icon: IconDashboard },
  { to: '/projects',   label: 'Projects',     Icon: IconProjects },
  { to: '/sites',      label: 'Sites',        Icon: IconSites },
  { to: '/assessment', label: 'Assessment',   Icon: IconAssessment },
  { to: '/features',   label: 'Feature Store',Icon: IconFeatures },
  { to: '/profile',    label: 'Profile',      Icon: IconProfile },
]

const ROLE_COLORS = {
  'Administrator':            'bg-red-100 text-red-700',
  'Project Manager':          'bg-violet-100 text-violet-700',
  'GIS Analyst':              'bg-blue-100 text-blue-700',
  'Renewable Energy Planner': 'bg-emerald-100 text-emerald-700',
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleColor = ROLE_COLORS[user?.role] || 'bg-gray-100 text-gray-600'
  const roleShort = user?.role?.split(' ').map(w => w[0]).join('') || '??'

  return (
    <aside
      className={`min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm transition-all duration-300 ease-in-out shrink-0 ${collapsed ? 'sidebar-collapsed w-[72px]' : 'w-[260px]'}`}
    >
      {/* ── Logo + collapse toggle ── */}
      <div className={`flex items-center border-b border-gray-100 ${collapsed ? 'justify-center py-5 px-3' : 'justify-between px-5 py-5'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
              ⚡
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight truncate">Solar & Wind</p>
              <p className="text-[10px] text-emerald-600 font-semibold truncate">Intelligence Platform</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
            ⚡
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all duration-200 shrink-0 ${collapsed ? 'rotate-180 mt-3' : ''}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="w-4 h-4">
            <IconChevron />
          </div>
        </button>
      </div>

      {/* ── User pill ── */}
      {user && (
        <div className={`mx-3 mt-4 mb-1 rounded-xl transition-all duration-300 ${collapsed ? 'p-2 flex justify-center' : 'px-3 py-2.5 bg-gray-50'}`}>
          {collapsed ? (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${roleColor}`}
              title={`${user.username} — ${user.role}`}
            >
              {roleShort}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${roleColor}`}>
                {user.username?.[0]?.toUpperCase()}{user.username?.[1]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-800 truncate">{user.username}</p>
                <p className="text-[10px] text-gray-500 truncate">{user.role}</p>
              </div>
              <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 animate-pulse-glow" title="Active" />
            </div>
          )}
        </div>
      )}

      {/* ── Navigation label ── */}
      {!collapsed && (
        <div className="px-5 pt-4 pb-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Navigation</span>
        </div>
      )}

      {/* ── Nav links ── */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon />
            <span className="link-label text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Role badge (expanded only) ── */}
      {!collapsed && user && (
        <div className="mx-3 mb-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 px-3 py-2.5">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Active Role</p>
            <p className="text-xs font-semibold text-gray-700 leading-tight">{user.role}</p>
          </div>
        </div>
      )}

      {/* ── Logout ── */}
      <div className="px-3 pb-5 border-t border-gray-100 pt-3">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className="sidebar-link w-full text-red-400 hover:bg-red-50 hover:text-red-600"
        >
          <IconLogout />
          <span className="link-label text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
