import { useState, useEffect } from 'react'
import { projectsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import AlertMessage from '../components/AlertMessage'
import WorkflowStepper from '../components/WorkflowStepper'
import CircularProgress from '../components/CircularProgress'

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_OPTIONS    = ['Draft', 'Active', 'Completed', 'On Hold']
const TYPE_OPTIONS      = ['Solar Farm', 'Wind Farm', 'Hybrid Plant', 'Microgrid']
const PRIORITY_OPTIONS  = ['Low', 'Medium', 'High', 'Critical']
const ROLES_CAN_WRITE   = ['Project Manager', 'Administrator']

const EMPTY_FORM = {
  project_name: '', region: '', description: '', status: 'Draft',
  project_type: 'Solar Farm', capacity_mw: '', budget: '',
  start_date: '', completion_date: '', project_manager: '',
  latitude: '', longitude: '', priority: 'Medium',
}

// ── GIS / AI mock data per project ───────────────────────────────────────────
function getMockProjectData(pid) {
  const seed = pid % 10
  return {
    solarScore:   65 + seed * 3,
    windScore:    58 + seed * 4,
    terrainScore: 70 + seed * 2,
    infraScore:   60 + seed * 3,
    envScore:     72 + seed * 2,
    overallScore: Math.round((65 + seed*3 + 58 + seed*4 + 70 + seed*2 + 60 + seed*3 + 72 + seed*2) / 5),
    solarIrradiance: (4.8 + seed * 0.12).toFixed(2),
    windSpeed:       (5.2 + seed * 0.18).toFixed(2),
    temperature:     (26 + seed * 0.4).toFixed(1),
    rainfall:        (820 + seed * 30).toFixed(0),
    humidity:        (62 + seed).toFixed(0),
    elevation:       (280 + seed * 15).toFixed(0),
    annualEnergy:    `${(120 + seed * 15).toFixed(0)} MWh`,
    roi:             `${(12 + seed * 0.4).toFixed(1)}%`,
    co2:             `${(280 + seed * 40).toFixed(0)} tCO₂/yr`,
    reportStatus:    seed > 5 ? 'Generated' : 'Pending',
    workflowStep:    (seed % 7) + 1,
    nasaPower:       seed > 3 ? 'Connected'  : 'Processing',
    gwa:             seed > 5 ? 'Completed'  : 'Connected',
    srtm:            seed > 4 ? 'Completed'  : 'Processing',
    osm:             'Completed',
  }
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    'Draft':     'badge-status-draft',
    'Active':    'badge-status-active',
    'Completed': 'badge-status-completed',
    'On Hold':   'badge-status-hold',
  }
  return <span className={map[status] || 'badge-status-draft'}>{status}</span>
}

function PriorityBadge({ priority }) {
  const map = {
    'Low':      'bg-gray-100 text-gray-600',
    'Medium':   'bg-blue-100 text-blue-700',
    'High':     'bg-amber-100 text-amber-700',
    'Critical': 'bg-red-100 text-red-700',
  }
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[priority] || 'bg-gray-100 text-gray-600'}`}>{priority}</span>
}

function GISStatusDot({ status }) {
  const cls = status === 'Completed' ? 'bg-emerald-500' : status === 'Processing' ? 'bg-amber-400 animate-pulse' : status === 'Connected' ? 'bg-blue-500' : 'bg-red-400'
  return <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, canWrite, onEdit, onDelete, onViewDetail }) {
  const [expanded, setExpanded] = useState(false)
  const md = getMockProjectData(project.id)
  const pct = Math.round(((md.workflowStep - 1) / 7) * 100)

  return (
    <div className="card-hover group hover:border-emerald-200 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-black text-gray-900 text-base truncate">{project.project_name}</h3>
            <StatusBadge status={project.status} />
            <PriorityBadge priority={project.priority || 'Medium'} />
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>📍 {project.region}</span>
            <span>⚡ {project.project_type || 'Solar Farm'}</span>
            <span>📅 {new Date(project.created_date).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          {canWrite && <>
            <button className="btn-icon" title="Edit" onClick={() => onEdit(project)}>✏️</button>
            <button className="btn-icon text-red-400 hover:bg-red-50" title="Delete" onClick={() => onDelete(project.id)}>🗑️</button>
          </>}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500 font-medium">Deployment Progress</span>
          <span className="font-bold text-emerald-600">{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          Step {md.workflowStep}/8 · {['Project Created','Site Registration','GIS Collection','Environmental Analysis','Solar Prediction','Wind Prediction','AI Assessment','Report Generation'][md.workflowStep - 1]}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center bg-amber-50 rounded-lg p-2">
          <p className="text-xs font-black text-amber-700">{md.solarIrradiance}</p>
          <p className="text-[9px] text-amber-500 font-semibold">kWh/m²/d</p>
        </div>
        <div className="text-center bg-sky-50 rounded-lg p-2">
          <p className="text-xs font-black text-sky-700">{md.windSpeed} m/s</p>
          <p className="text-[9px] text-sky-500 font-semibold">Wind</p>
        </div>
        <div className="text-center bg-emerald-50 rounded-lg p-2">
          <p className="text-xs font-black text-emerald-700">{md.annualEnergy}</p>
          <p className="text-[9px] text-emerald-500 font-semibold">Energy</p>
        </div>
        <div className="text-center bg-violet-50 rounded-lg p-2">
          <p className="text-xs font-black text-violet-700">{md.overallScore}/100</p>
          <p className="text-[9px] text-violet-500 font-semibold">Score</p>
        </div>
      </div>

      {/* GIS Status */}
      <div className="flex items-center gap-3 text-xs mb-3 border-t border-gray-50 pt-3">
        <span className="text-gray-400 font-semibold">GIS:</span>
        {[
          { name: 'NASA', status: md.nasaPower },
          { name: 'GWA',  status: md.gwa },
          { name: 'SRTM', status: md.srtm },
          { name: 'OSM',  status: md.osm },
        ].map(g => (
          <div key={g.name} className="flex items-center gap-1">
            <GISStatusDot status={g.status} />
            <span className="text-gray-600 font-medium">{g.name}</span>
          </div>
        ))}
      </div>

      {/* Actions footer */}
      <div className="flex gap-2 border-t border-gray-50 pt-3">
        <button onClick={() => setExpanded(!expanded)} className="btn-secondary text-xs py-1.5 px-3 flex-1">
          {expanded ? '▲ Less' : '▼ Details'}
        </button>
        <button onClick={() => onViewDetail(project, md)} className="btn-primary text-xs py-1.5 px-3 flex-1">
          📊 Dashboard
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in">
          <div className="text-center">
            <CircularProgress value={md.solarScore}   label="Solar Score"   size={80} />
          </div>
          <div className="text-center">
            <CircularProgress value={md.windScore}    label="Wind Score"    size={80} />
          </div>
          <div className="text-center">
            <CircularProgress value={md.terrainScore} label="Terrain Score" size={80} />
          </div>
          <div className="col-span-2 md:col-span-3">
            <div className="grid grid-cols-3 gap-2 text-xs text-center mt-2">
              <div className="bg-emerald-50 rounded-lg p-2"><p className="font-black text-emerald-700">{md.roi}</p><p className="text-emerald-500">ROI</p></div>
              <div className="bg-blue-50 rounded-lg p-2"><p className="font-black text-blue-700">{md.co2}</p><p className="text-blue-500">CO₂ Red.</p></div>
              <div className="bg-amber-50 rounded-lg p-2"><p className="font-black text-amber-700">{md.reportStatus}</p><p className="text-amber-500">Report</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Projects Page ────────────────────────────────────────────────────────
export default function Projects() {
  const { user } = useAuth()
  const canWrite = ROLES_CAN_WRITE.includes(user?.role)

  const [projects, setProjects]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('All')
  const [typeFilter, setTypeFilter]       = useState('All')
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState('')
  const [currentPage, setCurrentPage]     = useState(1)
  const [viewMode, setViewMode]           = useState('card')  // 'card' | 'table'
  const ITEMS_PER_PAGE = 6

  const [showCreate, setShowCreate]   = useState(false)
  const [showEdit, setShowEdit]       = useState(null)
  const [showDelete, setShowDelete]   = useState(null)
  const [showDetail, setShowDetail]   = useState(null)  // { project, md }
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await projectsAPI.getAll()
      setProjects(res.data)
    } catch { setError('Failed to load projects.') }
    finally  { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => { setCurrentPage(1) }, [search, statusFilter, typeFilter])

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = p.project_name.toLowerCase().includes(q) || p.region.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'All' || p.status === statusFilter
    const matchType   = typeFilter === 'All'   || (p.project_type || 'Solar Farm') === typeFilter
    return matchSearch && matchStatus && matchType
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const counts = {
    total:     projects.length,
    active:    projects.filter(p => p.status === 'Active').length,
    completed: projects.filter(p => p.status === 'Completed').length,
    draft:     projects.filter(p => p.status === 'Draft').length,
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await projectsAPI.create({ project_name: form.project_name, region: form.region, description: form.description, status: form.status })
      setSuccess('Project created!'); setShowCreate(false); setForm(EMPTY_FORM); load()
    } catch (err) { setError(err.response?.data?.detail || 'Create failed.') }
    finally { setSaving(false) }
  }

  function openEdit(project) {
    setForm({ project_name: project.project_name, region: project.region, description: project.description || '', status: project.status, project_type: project.project_type || 'Solar Farm', capacity_mw: '', budget: '', start_date: '', completion_date: '', project_manager: '', latitude: '', longitude: '', priority: 'Medium' })
    setShowEdit(project)
  }

  async function handleEdit(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await projectsAPI.update(showEdit.id, { project_name: form.project_name, region: form.region, description: form.description, status: form.status })
      setSuccess('Project updated.'); setShowEdit(null); setForm(EMPTY_FORM); load()
    } catch (err) { setError(err.response?.data?.detail || 'Update failed.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    try {
      await projectsAPI.delete(showDelete)
      setSuccess('Project deleted.'); setShowDelete(null); load()
    } catch { setError('Delete failed.') }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Renewable Energy Projects</h1>
          <p className="page-subtitle">Professional Project Management Workspace · {projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {canWrite && (
          <button className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowCreate(true) }}>
            + Create New Project
          </button>
        )}
      </div>

      <AlertMessage type="error"   message={error} />
      <AlertMessage type="success" message={success} />

      {/* ── Summary Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects',  value: counts.total,     icon: '📁', grad: 'from-emerald-500 to-teal-600',  pct: 100 },
          { label: 'Active Projects', value: counts.active,    icon: '🟢', grad: 'from-sky-500 to-blue-600',      pct: counts.total ? Math.round(counts.active/counts.total*100) : 0 },
          { label: 'Completed',       value: counts.completed, icon: '✅', grad: 'from-violet-500 to-purple-600', pct: counts.total ? Math.round(counts.completed/counts.total*100) : 0 },
          { label: 'Draft',           value: counts.draft,     icon: '📝', grad: 'from-amber-500 to-orange-600',  pct: counts.total ? Math.round(counts.draft/counts.total*100) : 0 },
        ].map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.grad} rounded-2xl p-5 text-white shadow-md hover:scale-[1.02] transition-transform`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{c.icon}</span>
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{c.pct}%</span>
            </div>
            <p className="text-3xl font-black">{c.value}</p>
            <p className="text-white/80 text-xs font-medium mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters & Search ────────────────────────────────────────────────── */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              className="input pl-9"
              placeholder="Search by name, region, manager…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="All">All Types</option>
            {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''} found</p>
          <div className="flex gap-1.5">
            <button onClick={() => setViewMode('card')}  className={`btn-icon text-xs px-3 ${viewMode==='card'  ? 'bg-emerald-100 text-emerald-700' : ''}`}>⊞ Cards</button>
            <button onClick={() => setViewMode('table')} className={`btn-icon text-xs px-3 ${viewMode==='table' ? 'bg-emerald-100 text-emerald-700' : ''}`}>≡ Table</button>
          </div>
        </div>
      </div>

      {/* ── Empty State ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="card text-center py-20">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-4">🌱</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {search || statusFilter !== 'All' || typeFilter !== 'All'
              ? 'No projects match your filters'
              : 'Create your first Renewable Energy Project'}
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            {search || statusFilter !== 'All' || typeFilter !== 'All'
              ? 'Try adjusting your search criteria or clear filters.'
              : 'Start planning solar farms, wind farms, or hybrid plants. Track every stage of your deployment.'}
          </p>
          {canWrite && !search && statusFilter === 'All' && typeFilter === 'All' && (
            <button className="btn-primary text-base px-8 py-3" onClick={() => setShowCreate(true)}>
              + Create New Project
            </button>
          )}
        </div>
      )}

      {/* ── Card View ──────────────────────────────────────────────────────── */}
      {viewMode === 'card' && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginated.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              canWrite={canWrite}
              onEdit={openEdit}
              onDelete={setShowDelete}
              onViewDetail={(proj, md) => setShowDetail({ project: proj, md })}
            />
          ))}
        </div>
      )}

      {/* ── Table View ─────────────────────────────────────────────────────── */}
      {viewMode === 'table' && filtered.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Type</th><th>Region</th>
                  <th>Status</th><th>Score</th><th>Description</th><th>Created</th>
                  {canWrite && <th className="text-right pr-5">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => {
                  const md = getMockProjectData(p.id)
                  return (
                    <tr key={p.id}>
                      <td className="text-gray-400 text-xs">{p.id}</td>
                      <td className="font-semibold text-gray-900">{p.project_name}</td>
                      <td><span className="badge-solar text-[10px]">{p.project_type || 'Solar Farm'}</span></td>
                      <td>{p.region}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td><span className="font-black text-emerald-700">{md.overallScore}/100</span></td>
                      <td className="text-gray-500 max-w-xs truncate text-xs">{p.description || '—'}</td>
                      <td className="text-gray-400 text-xs">{new Date(p.created_date).toLocaleDateString()}</td>
                      {canWrite && (
                        <td className="text-right">
                          <div className="flex gap-1 justify-end">
                            <button className="btn-icon" title="Edit" onClick={() => openEdit(p)}>✏️</button>
                            <button className="btn-icon text-red-400 hover:bg-red-50" title="Delete" onClick={() => setShowDelete(p.id)}>🗑️</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">Page {currentPage} of {totalPages} · {filtered.length} total</span>
              <div className="flex gap-2">
                <button className="btn-secondary py-1 px-3 text-xs" onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1}>◀ Prev</button>
                <button className="btn-secondary py-1 px-3 text-xs" onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} disabled={currentPage===totalPages}>Next ▶</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination for card view */}
      {viewMode === 'card' && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button className="btn-secondary py-1 px-3 text-xs" onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1}>◀ Prev</button>
            <button className="btn-secondary py-1 px-3 text-xs" onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} disabled={currentPage===totalPages}>Next ▶</button>
          </div>
        </div>
      )}

      {/* ── Create Modal ──────────────────────────────────────────────────── */}
      {showCreate && (
        <Modal title="Create Renewable Energy Project" onClose={() => setShowCreate(false)} size="lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Project Name *</label>
                <input className="input" value={form.project_name} onChange={e => setForm({...form, project_name: e.target.value})} required placeholder="e.g. Rajasthan Solar Farm Phase 1" />
              </div>
              <div>
                <label className="label">Project Type</label>
                <select className="select" value={form.project_type} onChange={e => setForm({...form, project_type: e.target.value})}>
                  {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Region / Location *</label>
                <input className="input" value={form.region} onChange={e => setForm({...form, region: e.target.value})} required placeholder="e.g. Jaipur, Rajasthan" />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Capacity (MW)</label>
                <input className="input" type="number" step="any" value={form.capacity_mw} onChange={e => setForm({...form, capacity_mw: e.target.value})} placeholder="e.g. 50" />
              </div>
              <div>
                <label className="label">Estimated Budget (₹ Cr)</label>
                <input className="input" type="number" step="any" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} placeholder="e.g. 210" />
              </div>
              <div>
                <label className="label">Start Date</label>
                <input className="input" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div>
                <label className="label">Expected Completion</label>
                <input className="input" type="date" value={form.completion_date} onChange={e => setForm({...form, completion_date: e.target.value})} />
              </div>
              <div>
                <label className="label">Latitude</label>
                <input className="input" type="number" step="any" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} placeholder="e.g. 26.9124" />
              </div>
              <div>
                <label className="label">Longitude</label>
                <input className="input" type="number" step="any" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} placeholder="e.g. 75.7873" />
              </div>
              <div className="col-span-2">
                <label className="label">Project Manager</label>
                <input className="input" value={form.project_manager} onChange={e => setForm({...form, project_manager: e.target.value})} placeholder="Manager name" />
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Project overview, objectives, and key milestones…" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Project'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {showEdit && (
        <Modal title={`Edit — ${showEdit.project_name}`} onClose={() => setShowEdit(null)} size="lg">
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Project Name *</label>
                <input className="input" value={form.project_name} onChange={e => setForm({...form, project_name: e.target.value})} required />
              </div>
              <div>
                <label className="label">Region *</label>
                <input className="input" value={form.region} onChange={e => setForm({...form, region: e.target.value})} required />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowEdit(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Modal ──────────────────────────────────────────────────── */}
      {showDelete && (
        <Modal title="Delete Project?" onClose={() => setShowDelete(null)}>
          <p className="text-gray-600 text-sm mb-6">This will permanently delete the project and all associated sites and assessments.</p>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setShowDelete(null)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      {showDetail && (
        <Modal title={`📊 ${showDetail.project.project_name} — Full Dashboard`} onClose={() => setShowDetail(null)} size="lg">
          <div className="space-y-5">
            {/* Suitability scores */}
            <div>
              <h3 className="section-title mb-3">🤖 AI Suitability Scores</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { v: showDetail.md.solarScore,   l: 'Solar' },
                  { v: showDetail.md.windScore,    l: 'Wind' },
                  { v: showDetail.md.terrainScore, l: 'Terrain' },
                  { v: showDetail.md.infraScore,   l: 'Infra' },
                  { v: showDetail.md.envScore,     l: 'Env' },
                  { v: showDetail.md.overallScore, l: 'Overall', color: '#7c3aed' },
                ].map(s => (
                  <div key={s.l} className="text-center">
                    <CircularProgress value={s.v} label={s.l} size={80} color={s.color} />
                  </div>
                ))}
              </div>
            </div>
            {/* Workflow */}
            <div>
              <h3 className="section-title mb-3">🔄 Deployment Workflow</h3>
              <WorkflowStepper currentStep={showDetail.md.workflowStep} />
            </div>
            {/* Resource summary */}
            <div>
              <h3 className="section-title mb-3">📋 Resource Assessment</h3>
              <div className="grid grid-cols-3 gap-3 text-sm text-center">
                <div className="bg-emerald-50 rounded-xl p-3"><p className="font-black text-emerald-700">{showDetail.md.annualEnergy}</p><p className="text-emerald-500 text-xs">Annual Energy</p></div>
                <div className="bg-amber-50 rounded-xl p-3"><p className="font-black text-amber-700">{showDetail.md.roi}</p><p className="text-amber-500 text-xs">Expected ROI</p></div>
                <div className="bg-blue-50 rounded-xl p-3"><p className="font-black text-blue-700">{showDetail.md.co2}</p><p className="text-blue-500 text-xs">CO₂ Reduction</p></div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
