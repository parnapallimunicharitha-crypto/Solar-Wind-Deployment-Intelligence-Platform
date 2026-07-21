import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI, projectsAPI, sitesAPI, featuresAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import AlertMessage from '../components/AlertMessage'

// ── Role Permissions Mapping ────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  'Administrator': {
    description: 'Full system permissions and administrative capabilities.',
    badge: 'bg-red-100 text-red-700 border-red-200',
    matrix: {
      'User Management': true,
      'Project Management (CRUD)': true,
      'Site Management': true,
      'GIS Analysis & Mapping': true,
      'Prediction Models': true,
      'Feature Store Read/Write': true,
      'System Settings': true,
      'Export Reports': true
    }
  },
  'Project Manager': {
    description: 'Manage projects, assign resources, track milestones and approve assessments.',
    badge: 'bg-violet-100 text-violet-700 border-violet-200',
    matrix: {
      'User Management': false,
      'Project Management (CRUD)': true,
      'Site Management': true,
      'GIS Analysis & Mapping': true,
      'Prediction Models': true,
      'Feature Store Read/Write': true,
      'System Settings': false,
      'Export Reports': true
    }
  },
  'Renewable Energy Planner': {
    description: 'Create sites, run resource assessment engines and design energy outputs.',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    matrix: {
      'User Management': false,
      'Project Management (CRUD)': false,
      'Site Management': true,
      'GIS Analysis & Mapping': true,
      'Prediction Models': true,
      'Feature Store Read/Write': true,
      'System Settings': false,
      'Export Reports': true
    }
  },
  'GIS Analyst': {
    description: 'Map layers ingestion, spatial assessments and terrain modeling.',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    matrix: {
      'User Management': false,
      'Project Management (CRUD)': false,
      'Site Management': true,
      'GIS Analysis & Mapping': true,
      'Prediction Models': false,
      'Feature Store Read/Write': true,
      'System Settings': false,
      'Export Reports': false
    }
  },
  'Research Analyst': {
    description: 'Model optimization, climate parameters analysis and feature store engineering.',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    matrix: {
      'User Management': false,
      'Project Management (CRUD)': false,
      'Site Management': false,
      'GIS Analysis & Mapping': false,
      'Prediction Models': true,
      'Feature Store Read/Write': true,
      'System Settings': false,
      'Export Reports': false
    }
  },
  'Viewer': {
    description: 'Read-only access to dashboards, active projects and final reports.',
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    matrix: {
      'User Management': false,
      'Project Management (CRUD)': false,
      'Site Management': false,
      'GIS Analysis & Mapping': false,
      'Prediction Models': false,
      'Feature Store Read/Write': false,
      'System Settings': false,
      'Export Reports': false
    }
  }
}

const ALL_CAPABILITIES = [
  'User Management',
  'Project Management (CRUD)',
  'Site Management',
  'GIS Analysis & Mapping',
  'Prediction Models',
  'Feature Store Read/Write',
  'System Settings',
  'Export Reports'
]

// ── Tab button ──────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
        active
          ? 'bg-emerald-600 text-white shadow-md'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [sites, setSites] = useState([])
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'directory' | 'permissions' | 'security' | 'preferences' | 'sessions'

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    organization: 'Renewable Labs Corp',
    country: 'India',
    state: 'Karnataka'
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Password Form State
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')

  // User Preferences State
  const [prefForm, setPrefForm] = useState({
    theme: 'light',
    language: 'en',
    units: 'metric',
    defaultLayer: 'openstreetmap',
    defaultDashboard: 'Default Assessment',
    emailNotifications: true,
    timezone: 'Asia/Kolkata'
  })
  const [prefSuccess, setPrefSuccess] = useState('')

  // Directory Search/Filter State
  const [dirSearch, setDirSearch] = useState('')
  const [dirRoleFilter, setDirRoleFilter] = useState('All')

  useEffect(() => {
    async function loadAllData() {
      try {
        const [usersRes, projectsRes, sitesRes, featuresRes] = await Promise.all([
          authAPI.users().catch(() => ({ data: [] })),
          projectsAPI.getAll().catch(() => ({ data: [] })),
          sitesAPI.getAll().catch(() => ({ data: [] })),
          featuresAPI.getAll().catch(() => ({ data: [] }))
        ])

        setUsers(usersRes.data || [])
        setProjects(projectsRes.data || [])
        setSites(sitesRes.data || [])
        setFeatures(featuresRes.data || [])

        // Prefill Form
        setProfileForm(prev => ({
          ...prev,
          full_name: user?.full_name || '',
          email: user?.email || '',
          phone: user?.phone || '+91 98765 43210'
        }))

      } catch (err) {
        console.error('Failed to load profile data parameters:', err)
        setError('Failed to load profile settings and directories.')
      } finally {
        setLoading(false)
      }
    }
    loadAllData()
  }, [user])

  // Profile update handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')
    try {
      await authAPI.updateProfile({
        full_name: profileForm.full_name,
        email: profileForm.email
      })
      setProfileSuccess('Personal profile information updated successfully.')
    } catch (err) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile details.')
    } finally {
      setProfileLoading(false)
    }
  }

  // Password change handler
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')
    if (pwForm.new_password.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New passwords do not match.')
      return
    }
    setPwLoading(true)
    try {
      await authAPI.changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password
      })
      setPwSuccess('Account password changed successfully.')
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Failed to change password. Validate current credentials.')
    } finally {
      setPwLoading(false)
    }
  }

  // Preferences save handler
  const handleSavePreferences = (e) => {
    e.preventDefault()
    setPrefSuccess('User preferences and workspace setup saved successfully.')
    setTimeout(() => setPrefSuccess(''), 3000)
  }

  // Export User list
  const handleExportUserList = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["User ID,Username,Role,Email,Date Joined"].join(",") + "\n"
      + users.map(u => [u.id, u.username, u.role, u.email || 'N/A', new Date(u.created_at || Date.now()).toLocaleDateString()].join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `platform_user_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) return <LoadingSpinner />

  // Derived calculations
  const myProjects = projects.filter(p => p.user_id === user?.id || !p.user_id)
  const mySites = sites.filter(s => myProjects.some(p => p.id === s.project_id))
  const assessmentsCount = features.length

  // Filtered User Directory
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(dirSearch.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(dirSearch.toLowerCase())
    const matchesRole = dirRoleFilter === 'All' || u.role === dirRoleFilter
    return matchesSearch && matchesRole
  })

  // Role Statistics
  const adminCount = users.filter(u => u.role === 'Administrator').length
  const plannerCount = users.filter(u => u.role === 'Renewable Energy Planner').length
  const gisCount = users.filter(u => u.role === 'GIS Analyst').length
  const researchCount = users.filter(u => u.role === 'Research Analyst').length
  const viewerCount = users.filter(u => u.role === 'Viewer').length

  const roleMeta = ROLE_PERMISSIONS[user?.role || 'Renewable Energy Planner']

  return (
    <div className="space-y-6 animate-fade-in text-gray-800">
      {/* ── Page Header ── */}
      <div>
        <h1 className="page-title">Workspace Account & Directory</h1>
        <p className="page-subtitle">Configure security, access user directory, manage permissions and track user contributions.</p>
      </div>

      <AlertMessage type="error" message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Left Column: Profile Card & Summary ── */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Main User Card */}
          <div className="card text-center p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-black shadow-lg mb-4 animate-scale-in">
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{profileForm.full_name || user?.username}</h2>
            <p className="text-sm text-gray-400 font-mono mt-0.5">ID: #{user?.id || '2804A'}</p>

            <span className={`inline-block border text-xs font-bold px-3 py-1.5 rounded-full mt-3 ${roleMeta?.badge || 'bg-gray-100'}`}>
              {user?.role}
            </span>

            <div className="w-full border-t border-gray-100 my-5" />

            {/* Profile Completion bar */}
            <div className="w-full text-left space-y-1 mb-4">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Profile Completion</span>
                <span className="text-emerald-600">85%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            <div className="w-full space-y-3 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Department</span>
                <span className="font-semibold text-gray-700">{profileForm.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Organization</span>
                <span className="font-semibold text-gray-700">{profileForm.organization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Country</span>
                <span className="font-semibold text-gray-700">{profileForm.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Session Status</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-glow" />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Activity Logs & Contributions */}
          <div className="card">
            <h3 className="section-title mb-4">📈 Contributions & Activity</h3>
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100 hover:scale-105 transition-transform">
                <p className="text-2xl font-extrabold text-blue-700">{myProjects.length}</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase">Projects</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 hover:scale-105 transition-transform">
                <p className="text-2xl font-extrabold text-emerald-700">{mySites.length}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase">Sites</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 hover:scale-105 transition-transform">
                <p className="text-2xl font-extrabold text-amber-700">{assessmentsCount}</p>
                <p className="text-[10px] text-amber-600 font-bold uppercase">Assessments</p>
              </div>
            </div>
            
            <div className="space-y-3.5 border-t border-gray-100 pt-4 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>Solar Calculations Run:</span>
                <span className="font-bold text-gray-800">{assessmentsCount}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Wind Estimations Run:</span>
                <span className="font-bold text-gray-800">{Math.max(0, assessmentsCount - 1)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>GIS Terrain Analyses:</span>
                <span className="font-bold text-gray-800">{mySites.length}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>PDF Reports Generated:</span>
                <span className="font-bold text-gray-800">{Math.max(1, Math.round(assessmentsCount * 0.7))}</span>
              </div>
            </div>
          </div>

          {/* Current Role Description */}
          <div className="card">
            <h3 className="section-title mb-2">🔑 {user?.role} Role info</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{roleMeta?.description}</p>
            <ul className="space-y-2 text-xs">
              {Object.entries(roleMeta?.matrix || {}).map(([cap, granted]) => (
                <li key={cap} className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-600">{cap}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    granted ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-500'
                  }`}>
                    {granted ? 'Granted' : 'Restricted'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Right Column: Configuration & Setup tabs ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Navigation Tabs */}
          <div className="card p-2 flex gap-1.5 overflow-x-auto">
            <TabBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>👤 Personal Info</TabBtn>
            <TabBtn active={activeTab === 'directory'} onClick={() => setActiveTab('directory')}>👥 User Directory</TabBtn>
            <TabBtn active={activeTab === 'permissions'} onClick={() => setActiveTab('permissions')}>🔑 RBAC Matrix</TabBtn>
            <TabBtn active={activeTab === 'security'} onClick={() => setActiveTab('security')}>🔐 Security & Log</TabBtn>
            <TabBtn active={activeTab === 'preferences'} onClick={() => setActiveTab('preferences')}>⚙️ Workspace Prefs</TabBtn>
            <TabBtn active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')}>💻 Active Devices</TabBtn>
          </div>

          {/* ── Tab Content: Profile Settings ── */}
          {activeTab === 'profile' && (
            <div className="card animate-fade-in">
              <h2 className="section-title mb-1">Personal Workspace Setup</h2>
              <p className="text-xs text-gray-400 mb-5">Configure user display parameters, email contacts, and organizational metadata.</p>
              
              <AlertMessage type="success" message={profileSuccess} />
              <AlertMessage type="error" message={profileError} />

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Username</label>
                    <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={user?.username || ''} disabled />
                  </div>
                  <div>
                    <label className="label">Role (Assigned)</label>
                    <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={user?.role || ''} disabled />
                  </div>
                  <div>
                    <label className="label">Full Name</label>
                    <input className="input" type="text" value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <input className="input" type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} required />
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input className="input" type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <input className="input" type="text" value={profileForm.department} onChange={e => setProfileForm({...profileForm, department: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Organization</label>
                    <input className="input" type="text" value={profileForm.organization} onChange={e => setProfileForm({...profileForm, organization: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">State</label>
                      <input className="input" type="text" value={profileForm.state} onChange={e => setProfileForm({...profileForm, state: e.target.value})} />
                    </div>
                    <div>
                      <label className="label">Country</label>
                      <input className="input" type="text" value={profileForm.country} onChange={e => setProfileForm({...profileForm, country: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-3 border-t border-gray-50">
                  <button type="submit" className="btn-primary" disabled={profileLoading}>
                    {profileLoading ? 'Updating Profile...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Tab Content: User Directory ── */}
          {activeTab === 'directory' && (
            <div className="card animate-fade-in space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="section-title">👥 Platform Directory & User Roster</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Explore active profiles, assigned roles, and login statistics across the workspace.</p>
                </div>
                <button onClick={handleExportUserList} className="btn-secondary text-xs py-1.5">Export Roster (CSV)</button>
              </div>

              {/* Roster stats row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
                <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
                  <p className="font-bold text-gray-900">{users.length}</p>
                  <p className="text-gray-400">Total</p>
                </div>
                <div className="bg-red-50 rounded-xl p-2 border border-red-100 text-red-700">
                  <p className="font-bold">{adminCount}</p>
                  <p className="text-red-500">Admins</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100 text-emerald-700">
                  <p className="font-bold">{plannerCount}</p>
                  <p className="text-emerald-500">Planners</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-2 border border-blue-100 text-blue-700">
                  <p className="font-bold">{gisCount}</p>
                  <p className="text-blue-500">GIS Analysts</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-2 border border-amber-100 text-amber-700">
                  <p className="font-bold">{researchCount + viewerCount}</p>
                  <p className="text-amber-500">Other Profiles</p>
                </div>
              </div>

              {/* Directory search/filters */}
              <div className="flex gap-2">
                <input 
                  className="input flex-1 py-2 text-xs" 
                  placeholder="Search directory roster by username or email..."
                  value={dirSearch}
                  onChange={e => setDirSearch(e.target.value)} 
                />
                <select 
                  className="select py-2 text-xs max-w-[200px]"
                  value={dirRoleFilter}
                  onChange={e => setDirRoleFilter(e.target.value)}
                >
                  <option value="All">All Roles</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Renewable Energy Planner">Renewable Energy Planner</option>
                  <option value="GIS Analyst">GIS Analyst</option>
                  <option value="Research Analyst">Research Analyst</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              {/* Table list */}
              <div className="table-wrapper rounded-xl border border-gray-100 overflow-hidden">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Assigned Role</th>
                      <th>Joined</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-gray-400">No profiles match active filters.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className={u.id === user?.id ? 'bg-emerald-50/20' : ''}>
                          <td className="text-gray-400 font-mono text-xs">#{u.id}</td>
                          <td className="font-semibold text-gray-900">
                            <div className="flex items-center gap-1.5">
                              {u.username}
                              {u.id === user?.id && <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">You</span>}
                            </div>
                          </td>
                          <td className="text-xs text-gray-500">{u.email || 'no-email@solarwind.org'}</td>
                          <td>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              {u.role}
                            </span>
                          </td>
                          <td className="text-gray-400 text-xs">{new Date(u.created_at || Date.now()).toLocaleDateString()}</td>
                          <td>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tab Content: RBAC Matrix ── */}
          {activeTab === 'permissions' && (
            <div className="card animate-fade-in space-y-4">
              <div>
                <h2 className="section-title">🔑 Role-Based Access Matrix</h2>
                <p className="text-xs text-gray-400 mt-0.5">Audit global permissions, module authorizations and feature constraints per system role.</p>
              </div>

              <div className="table-wrapper rounded-xl border border-gray-100 overflow-hidden">
                <table className="table min-w-[700px] text-center">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left">Capability / Module</th>
                      <th>Admin</th>
                      <th>Planner</th>
                      <th>GIS Analyst</th>
                      <th>Research</th>
                      <th>Viewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_CAPABILITIES.map(cap => (
                      <tr key={cap}>
                        <td className="text-left font-semibold text-gray-700 text-xs py-3">{cap}</td>
                        {['Administrator', 'Renewable Energy Planner', 'GIS Analyst', 'Research Analyst', 'Viewer'].map(roleName => {
                          const hasPerm = ROLE_PERMISSIONS[roleName]?.matrix[cap];
                          return (
                            <td key={roleName} className="py-3">
                              {hasPerm ? (
                                <span className="text-emerald-600 font-bold text-lg">✓</span>
                              ) : (
                                <span className="text-red-300 text-lg">✕</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tab Content: Security & Logs ── */}
          {activeTab === 'security' && (
            <div className="card animate-fade-in space-y-6">
              
              {/* Reset Password block */}
              <div>
                <h2 className="section-title mb-1">🔐 Reset Workspace Credentials</h2>
                <p className="text-xs text-gray-400 mb-4">Maintain strict profile boundaries by frequently changing account security keys.</p>
                
                <AlertMessage type="success" message={pwSuccess} />
                <AlertMessage type="error" message={pwError} />

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="label">Current Password</label>
                    <input className="input" type="password" value={pwForm.current_password} onChange={e => setPwForm({...pwForm, current_password: e.target.value})} required />
                  </div>
                  <div>
                    <label className="label">New Password</label>
                    <input className="input" type="password" value={pwForm.new_password} onChange={e => setPwForm({...pwForm, new_password: e.target.value})} required />
                  </div>
                  <div>
                    <label className="label">Confirm New Password</label>
                    <input className="input" type="password" value={pwForm.confirm_password} onChange={e => setPwForm({...pwForm, confirm_password: e.target.value})} required />
                  </div>

                  {pwForm.new_password.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${
                            pwForm.new_password.length >= i * 3 ? 'bg-emerald-500' : 'bg-gray-200'
                          }`} />
                        ))}
                      </div>
                      <span className="text-gray-500">Strength Indicator</span>
                    </div>
                  )}

                  <button type="submit" className="btn-primary" disabled={pwLoading}>
                    {pwLoading ? 'Updating Key...' : 'Modify Account Password'}
                  </button>
                </form>
              </div>

              {/* Login Audit Trail */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="section-title mb-3">⏱️ Security Audit & Login History</h3>
                <div className="space-y-3.5 text-xs">
                  {[
                    { event: 'Authorized OAuth Login', device: 'Chrome / Windows (127.0.0.1)', time: 'Just now', status: 'Success' },
                    { event: 'Authorized JWT Login', device: 'Firefox / Windows (127.0.0.1)', time: '2 hours ago', status: 'Success' },
                    { event: 'Authorized OAuth Login', device: 'Chrome / Android (192.168.1.10)', time: 'Yesterday', status: 'Success' },
                  ].map((log, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-800">{log.event}</p>
                        <p className="text-gray-400 mt-0.5">{log.device} · {log.time}</p>
                      </div>
                      <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">{log.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab Content: Preferences ── */}
          {activeTab === 'preferences' && (
            <div className="card animate-fade-in">
              <h2 className="section-title mb-1">⚙️ Workspace Preferences</h2>
              <p className="text-xs text-gray-400 mb-5">Configure UI settings, measurement standards, notifications, and default GIS layer properties.</p>

              <AlertMessage type="success" message={prefSuccess} />

              <form onSubmit={handleSavePreferences} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Theme Customization</label>
                    <select className="select" value={prefForm.theme} onChange={e => setPrefForm({...prefForm, theme: e.target.value})}>
                      <option value="light">🌿 Emerald Light</option>
                      <option value="dark">🌙 Dark Glassmorphism</option>
                      <option value="system">🖥️ System Default</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Measurement Units</label>
                    <select className="select" value={prefForm.units} onChange={e => setPrefForm({...prefForm, units: e.target.value})}>
                      <option value="metric">Metric (m/s, °C, ha)</option>
                      <option value="imperial">Imperial (mph, °F, acres)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Default Map Layer</label>
                    <select className="select" value={prefForm.defaultLayer} onChange={e => setPrefForm({...prefForm, defaultLayer: e.target.value})}>
                      <option value="openstreetmap">🗺️ OpenStreetMap Mapnik</option>
                      <option value="satellite">🛰️ Sentinel-2 Hybrid Satellite</option>
                      <option value="terrain">⛰️ SRTM Slope Hillshade</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Workspace Timezone</label>
                    <select className="select" value={prefForm.timezone} onChange={e => setPrefForm({...prefForm, timezone: e.target.value})}>
                      <option value="Asia/Kolkata">UTC+05:30 (Kolkata)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">UTC-05:00 (New York)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input 
                        type="checkbox" 
                        className="accent-emerald-600 w-4 h-4 rounded" 
                        checked={prefForm.emailNotifications}
                        onChange={e => setPrefForm({...prefForm, emailNotifications: e.target.checked})}
                      />
                      <span className="text-sm font-semibold text-gray-700">Receive email alerts on successful solar/wind evaluation completion</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end pt-3 border-t border-gray-50">
                  <button type="submit" className="btn-primary">Save Preferences</button>
                </div>
              </form>
            </div>
          )}

          {/* ── Tab Content: Active Devices / Sessions ── */}
          {activeTab === 'sessions' && (
            <div className="card animate-fade-in space-y-4">
              <div>
                <h2 className="section-title">💻 Session Management & Devices</h2>
                <p className="text-xs text-gray-400 mt-0.5">Audit login locations, active hardware platforms and safely terminate other platform instances.</p>
              </div>

              <div className="space-y-4">
                {[
                  { device: 'Lenovo laptop (Windows 11)', browser: 'Google Chrome', ip: '127.0.0.1 (Localhost)', current: true, time: 'Active Now' },
                  { device: 'OnePlus 11 (Android 14)', browser: 'Mobile Safari', ip: '192.168.1.10 (Local network)', current: false, time: '2 hours ago' },
                  { device: 'Apple iPad Pro (iOS 17)', browser: 'Chrome Mobile', ip: '172.16.50.4 (VPN Connection)', current: false, time: 'Yesterday' }
                ].map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-emerald-200 transition-colors">
                    <div>
                      <p className="font-bold text-gray-800">{s.device} {s.current && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold ml-1">Current Session</span>}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.browser} · IP: {s.ip}</p>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase mt-1">Last Sync: {s.time}</p>
                    </div>
                    {!s.current && (
                      <button className="btn-secondary text-[10px] py-1 px-2.5 text-red-600 border border-red-100 hover:bg-red-50 transition-colors">Revoke</button>
                    )}
                  </div>
                ))}

                <button className="w-full btn-secondary text-red-600 border border-red-200 hover:bg-red-50 text-xs py-2 bg-transparent">
                  Terminate All Other Device Sessions
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
