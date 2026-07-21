import { useState, useEffect } from 'react'
import { sitesAPI, projectsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import AlertMessage from '../components/AlertMessage'
import CircularProgress from '../components/CircularProgress'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const ROLES_CAN_WRITE  = ['Project Manager', 'Administrator', 'Renewable Energy Planner']
const TERRAIN_TYPES    = ['Flat', 'Undulating', 'Hilly', 'Rocky', 'Coastal', 'Desert']
const LAND_USE_TYPES   = ['Agricultural', 'Barren', 'Forest', 'Industrial', 'Waste Land', 'Pasture']
const OWNERSHIP_TYPES  = ['Government', 'Private', 'Community', 'Joint']
const SITE_STATUS_OPT  = ['Registered', 'Under Assessment', 'Assessment Complete', 'Approved', 'Rejected']

const EMPTY_FORM = {
  site_name: '', site_code: '', latitude: '', longitude: '', elevation: '', land_area: '',
  region: '', district: '', state: '', country: 'India', postal_code: '', address: '',
  terrain_type: 'Flat', land_use: 'Barren', infrastructure: '', ownership: 'Government',
  nearest_road: '', road_distance: '', nearest_substation: '', grid_distance: '',
  grid_availability: true, road_access: true, water_availability: false,
  environmental_constraints: '', remarks: '', site_status: 'Registered', project_id: '',
}

// ── Mock environmental data per site ─────────────────────────────────────────
function getMockSiteData(site) {
  const seed = (site.id || 1) % 10
  return {
    solarIrr:    +(4.8 + seed * 0.12).toFixed(2),
    windSpeed:   +(5.2 + seed * 0.18).toFixed(2),
    temperature: +(26 + seed * 0.4).toFixed(1),
    humidity:    60 + seed,
    rainfall:    820 + seed * 30,
    cloudCover:  35 + seed * 2,
    elevation:   site.elevation || (280 + seed * 15),
    slope:       +(2.4 + seed * 0.3).toFixed(1),
    solarScore:  65 + seed * 3,
    windScore:   58 + seed * 4,
    terrainScore:70 + seed * 2,
    infraScore:  60 + seed * 3,
    envScore:    72 + seed * 2,
    overallScore:Math.round((65+seed*3+58+seed*4+70+seed*2+60+seed*3+72+seed*2)/5),
    peakSunHours:+(4.8 + seed * 0.12 * 0.85).toFixed(1),
    optimalTilt: 22 + seed,
    annualEnergy:`${(120 + seed * 15).toFixed(0)} MWh/yr`,
    panelRec:    'Mono PERC 450W',
    turbineRec:  '2.5 MW IEC-S',
    roadDist:    +(2.1 + seed * 0.3).toFixed(1),
    substDist:   +(8.4 + seed * 0.5).toFixed(1),
    nearestCity: `${40 + seed * 3} km`,
    accessScore: 70 + seed * 3,
    roi:         `${(12 + seed * 0.4).toFixed(1)}%`,
    co2:         `${(280 + seed * 40).toFixed(0)} tCO₂/yr`,
    cost:        `₹${(3.8 + seed * 0.2).toFixed(1)} Cr/MW`,
    workflowStep:(seed % 7) + 1,
    nasaPower:   seed > 3 ? 'Connected'  : 'Processing',
    gwa:         seed > 5 ? 'Completed'  : 'Connected',
    srtm:        seed > 4 ? 'Completed'  : 'Processing',
    osm:         'Completed',
    reportStatus:seed > 5 ? 'Generated'  : 'Pending',
    riskLevel:   seed > 7 ? 'High' : seed > 4 ? 'Medium' : 'Low',
  }
}

// ── Map click handler ─────────────────────────────────────────────────────────
function MapClickHandler({ onCoordClick }) {
  useMapEvents({ click: (e) => onCoordClick(e.latlng.lat, e.latlng.lng) })
  return null
}

// ── Workflow status dot ───────────────────────────────────────────────────────
function StatusDot({ status }) {
  const cls = {
    Connected: 'bg-blue-500', Completed: 'bg-emerald-500',
    Processing: 'bg-amber-400 animate-pulse', Loaded: 'bg-emerald-500',
    Pending: 'bg-gray-300', Error: 'bg-red-400',
  }[status] || 'bg-gray-300'
  return <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />
}

// ── Site Card ────────────────────────────────────────────────────────────────
function SiteCard({ site, project, canWrite, onEdit, onDelete, onMapView, onDetail }) {
  const [expanded, setExpanded] = useState(false)
  const md = getMockSiteData(site)
  const pct = Math.round(((md.workflowStep - 1) / 7) * 100)

  return (
    <div className="card-hover group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-black text-gray-900 text-base truncate">{site.site_name || `Site #${site.id}`}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              md.riskLevel === 'Low' ? 'bg-emerald-100 text-emerald-700' :
              md.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
            }`}>{md.riskLevel} Risk</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>📍 {site.region || site.district || 'Unknown'}</span>
            <span>🌐 {site.latitude?.toFixed(4)}, {site.longitude?.toFixed(4)}</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">{project || 'Unknown Project'}</p>
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          <button className="btn-icon" title="Map" onClick={() => onMapView(site)}>🗺️</button>
          {canWrite && <>
            <button className="btn-icon" title="Edit" onClick={() => onEdit(site)}>✏️</button>
            <button className="btn-icon text-red-400 hover:bg-red-50" title="Delete" onClick={() => onDelete(site.id)}>🗑️</button>
          </>}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500 font-medium">Assessment Progress</span>
          <span className="font-bold text-emerald-600">{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Env quick stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center bg-amber-50 rounded-lg p-2">
          <p className="text-xs font-black text-amber-700">{md.solarIrr}</p>
          <p className="text-[9px] text-amber-500 font-semibold">kWh/m²/d</p>
        </div>
        <div className="text-center bg-sky-50 rounded-lg p-2">
          <p className="text-xs font-black text-sky-700">{md.windSpeed} m/s</p>
          <p className="text-[9px] text-sky-500 font-semibold">Wind</p>
        </div>
        <div className="text-center bg-emerald-50 rounded-lg p-2">
          <p className="text-xs font-black text-emerald-700">{site.elevation != null ? `${site.elevation}m` : `${md.elevation}m`}</p>
          <p className="text-[9px] text-emerald-500 font-semibold">Elev.</p>
        </div>
        <div className="text-center bg-violet-50 rounded-lg p-2">
          <p className="text-xs font-black text-violet-700">{md.overallScore}/100</p>
          <p className="text-[9px] text-violet-500 font-semibold">Score</p>
        </div>
      </div>

      {/* GIS status */}
      <div className="flex items-center gap-3 text-xs border-t border-gray-50 pt-3 mb-3">
        <span className="text-gray-400 font-semibold">Datasets:</span>
        {[{n:'NASA',s:md.nasaPower},{n:'GWA',s:md.gwa},{n:'SRTM',s:md.srtm},{n:'OSM',s:md.osm}].map(g=>(
          <div key={g.n} className="flex items-center gap-1">
            <StatusDot status={g.s} /><span className="text-gray-600 font-medium">{g.n}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-gray-50 pt-3">
        <button onClick={() => setExpanded(!expanded)} className="btn-secondary text-xs py-1.5 flex-1">
          {expanded ? '▲ Less' : '▼ Details'}
        </button>
        <button onClick={() => onDetail(site, md)} className="btn-primary text-xs py-1.5 flex-1">
          📊 Full Report
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-fade-in">
          <div className="grid grid-cols-3 gap-3">
            <CircularProgress value={md.solarScore}   label="Solar"   size={76} />
            <CircularProgress value={md.windScore}    label="Wind"    size={76} />
            <CircularProgress value={md.terrainScore} label="Terrain" size={76} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div className="bg-emerald-50 rounded-lg p-2"><p className="font-black text-emerald-700">{md.roi}</p><p className="text-emerald-500">ROI</p></div>
            <div className="bg-blue-50 rounded-lg p-2"><p className="font-black text-blue-700">{md.co2}</p><p className="text-blue-500">CO₂ Red.</p></div>
            <div className="bg-amber-50 rounded-lg p-2"><p className="font-black text-amber-700">{md.annualEnergy}</p><p className="text-amber-500">Energy</p></div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Sites Page ───────────────────────────────────────────────────────────
export default function Sites() {
  const { user } = useAuth()
  const canWrite = ROLES_CAN_WRITE.includes(user?.role)

  const [sites, setSites]       = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filterPid, setFilterPid] = useState('')
  const [search, setSearch]     = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [activeTab, setActiveTab] = useState('sites')  // 'sites' | 'map'
  const [viewMode, setViewMode] = useState('card')

  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit]     = useState(null)
  const [showDelete, setShowDelete] = useState(null)
  const [showMap, setShowMap]       = useState(null)
  const [showDetail, setShowDetail] = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [mapPickMode, setMapPickMode] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [sRes, pRes] = await Promise.all([
        sitesAPI.getAll(filterPid || undefined),
        projectsAPI.getAll(),
      ])
      setSites(sRes.data)
      setProjects(pRes.data)
    } catch { setError('Failed to load sites.') }
    finally   { setLoading(false) }
  }
  useEffect(() => { load() }, [filterPid])

  const filtered = sites.filter(s => {
    const q = search.toLowerCase()
    return (
      (s.site_name || `Site #${s.id}`).toLowerCase().includes(q) ||
      (s.region || '').toLowerCase().includes(q) ||
      s.latitude?.toString().includes(q) ||
      s.longitude?.toString().includes(q)
    )
  })

  const projectName = id => projects.find(p => p.id === id)?.project_name || `Project #${id}`

  // Auto-generate site code
  const genSiteCode = () => `SITE-${Date.now().toString(36).toUpperCase()}`

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = {
        latitude:    parseFloat(form.latitude),
        longitude:   parseFloat(form.longitude),
        elevation:   form.elevation   ? parseFloat(form.elevation)  : null,
        land_area:   form.land_area   ? parseFloat(form.land_area)  : null,
        project_id:  parseInt(form.project_id),
        region:      form.region      || form.district || form.state,
        infrastructure: form.infrastructure,
        ownership:   form.ownership,
      }
      await sitesAPI.create(payload)
      setSuccess('Site registered! Environmental feature extraction running in background.')
      setShowCreate(false); setForm(EMPTY_FORM); load()
    } catch (err) { setError(err.response?.data?.detail || 'Create failed.') }
    finally { setSaving(false) }
  }

  function openEdit(site) {
    setForm({
      ...EMPTY_FORM,
      latitude:      site.latitude,
      longitude:     site.longitude,
      elevation:     site.elevation     ?? '',
      land_area:     site.land_area     ?? '',
      region:        site.region        ?? '',
      infrastructure:site.infrastructure ?? '',
      ownership:     site.ownership     ?? '',
      project_id:    site.project_id,
    })
    setShowEdit(site)
  }

  async function handleEdit(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await sitesAPI.update(showEdit.id, {
        latitude:   parseFloat(form.latitude),
        longitude:  parseFloat(form.longitude),
        elevation:  form.elevation  ? parseFloat(form.elevation)  : null,
        land_area:  form.land_area  ? parseFloat(form.land_area)  : null,
        project_id: parseInt(form.project_id),
        region:     form.region,
        infrastructure: form.infrastructure,
        ownership:  form.ownership,
      })
      setSuccess('Site updated.'); setShowEdit(null); setForm(EMPTY_FORM); load()
    } catch (err) { setError(err.response?.data?.detail || 'Update failed.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    try {
      await sitesAPI.delete(showDelete)
      setSuccess('Site deleted.'); setShowDelete(null); load()
    } catch { setError('Delete failed.') }
  }

  const counts = {
    total:    sites.length,
    active:   sites.length,
    assess:   Math.round(sites.length * 0.4),
    approved: Math.round(sites.length * 0.3),
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Renewable Energy Sites</h1>
          <p className="page-subtitle">GIS & Environmental Intelligence Workspace · {sites.length} site{sites.length !== 1 ? 's' : ''} registered</p>
        </div>
        {canWrite && (
          <button className="btn-primary" onClick={() => { setForm({ ...EMPTY_FORM, site_code: genSiteCode() }); setShowCreate(true) }}>
            + Register New Site
          </button>
        )}
      </div>

      <AlertMessage type="error"   message={error}   />
      <AlertMessage type="success" message={success} />

      {/* ── Overview Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sites',          value: counts.total,    icon: '📍', grad: 'from-emerald-500 to-teal-600' },
          { label: 'Active Sites',         value: counts.active,   icon: '🟢', grad: 'from-sky-500 to-blue-600' },
          { label: 'Under Assessment',     value: counts.assess,   icon: '🔬', grad: 'from-amber-500 to-orange-600' },
          { label: 'Approved Sites',       value: counts.approved, icon: '✅', grad: 'from-violet-500 to-purple-600' },
        ].map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.grad} rounded-2xl p-5 text-white shadow-md hover:scale-[1.02] transition-transform`}>
            <span className="text-2xl">{c.icon}</span>
            <p className="text-3xl font-black mt-1">{c.value}</p>
            <p className="text-white/80 text-xs font-medium mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs & Filters ─────────────────────────────────────────────────── */}
      <div className="card p-3 space-y-3">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { id: 'sites', label: '📍 Sites List' },
            { id: 'map',   label: '🗺️ GIS Map' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${activeTab===t.id ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input className="input pl-9" placeholder="Search by name, region, coordinates…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select" value={filterPid} onChange={e => setFilterPid(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
          </select>
          <div className="flex gap-1.5">
            <button onClick={() => setViewMode('card')}  className={`flex-1 btn-icon text-xs ${viewMode==='card'  ? 'bg-emerald-100 text-emerald-700' : ''}`}>⊞ Cards</button>
            <button onClick={() => setViewMode('table')} className={`flex-1 btn-icon text-xs ${viewMode==='table' ? 'bg-emerald-100 text-emerald-700' : ''}`}>≡ Table</button>
          </div>
        </div>
      </div>

      {/* ── GIS Map Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="section-title">🗺️ Interactive GIS Map</h2>
              <span className="text-xs text-gray-400">{sites.length} sites plotted</span>
            </div>
            {sites.length > 0 ? (
              <MapContainer center={[sites[0].latitude, sites[0].longitude]} zoom={5} style={{ height: '420px' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                {sites.map(s => (
                  <Marker key={s.id} position={[s.latitude, s.longitude]}>
                    <Popup>
                      <strong>{s.site_name || `Site #${s.id}`}</strong><br />
                      {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}<br />
                      {s.elevation != null && <>Elevation: {s.elevation} m<br /></>}
                      Project: {projectName(s.project_id)}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 flex-col gap-3">
                <span className="text-4xl">🗺️</span>
                <p className="text-gray-400 text-sm">Register sites to see them on the map</p>
              </div>
            )}
          </div>

          {/* GIS Layer Panel */}
          <div className="card">
            <h2 className="section-title mb-4">🔷 GIS Layer Panel</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Road Network',    icon: '🛣️', status: 'Available' },
                { name: 'Power Grid',      icon: '⚡', status: 'Available' },
                { name: 'Water Bodies',    icon: '💧', status: 'Loaded' },
                { name: 'Land Use',        icon: '🌿', status: 'Processing' },
                { name: 'Protected Areas', icon: '🏞️', status: 'Available' },
                { name: 'Elevation',       icon: '⛰️', status: 'Loaded' },
                { name: 'Slope',           icon: '📐', status: 'Loaded' },
                { name: 'Population',      icon: '👥', status: 'Available' },
              ].map(layer => (
                <div key={layer.name} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span>{layer.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{layer.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <StatusDot status={layer.status} />
                      <span className={`text-[10px] font-bold ${layer.status === 'Loaded' ? 'text-emerald-600' : layer.status === 'Processing' ? 'text-amber-600' : 'text-blue-600'}`}>{layer.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sites Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'sites' && (
        <>
          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="card text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-4">🌏</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {search || filterPid ? 'No sites match your filters' : 'Register your first Renewable Energy Site'}
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                {search || filterPid ? 'Try adjusting your search criteria.' : 'Add a site location to start GIS data collection, environmental analysis, and AI site assessment.'}
              </p>
              {canWrite && !search && !filterPid && (
                <button className="btn-primary text-base px-8 py-3" onClick={() => setShowCreate(true)}>
                  + Register New Site
                </button>
              )}
            </div>
          )}

          {/* Card view */}
          {viewMode === 'card' && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(s => (
                <SiteCard
                  key={s.id}
                  site={s}
                  project={projectName(s.project_id)}
                  canWrite={canWrite}
                  onEdit={openEdit}
                  onDelete={setShowDelete}
                  onMapView={setShowMap}
                  onDetail={(site, md) => setShowDetail({ site, md })}
                />
              ))}
            </div>
          )}

          {/* Table view */}
          {viewMode === 'table' && filtered.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="table-wrapper">
                <table className="table min-w-[900px]">
                  <thead>
                    <tr>
                      <th>#</th><th>Site Name</th><th>Coordinates</th><th>Region</th>
                      <th>Elevation</th><th>Land Area</th><th>Score</th><th>Project</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => {
                      const md = getMockSiteData(s)
                      return (
                        <tr key={s.id}>
                          <td className="text-gray-400 text-xs">{s.id}</td>
                          <td className="font-semibold">{s.site_name || `Site #${s.id}`}</td>
                          <td className="font-mono text-xs">{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</td>
                          <td>{s.region || '—'}</td>
                          <td>{s.elevation != null ? `${s.elevation} m` : '—'}</td>
                          <td>{s.land_area != null ? `${s.land_area} ha` : '—'}</td>
                          <td><span className="font-black text-emerald-700">{md.overallScore}/100</span></td>
                          <td className="text-primary-600 text-xs">{projectName(s.project_id)}</td>
                          <td>
                            <div className="flex gap-1">
                              <button className="btn-icon" onClick={() => setShowMap(s)}>🗺️</button>
                              <button className="btn-icon" onClick={() => setShowDetail({ site: s, md })}>📊</button>
                              {canWrite && <>
                                <button className="btn-icon" onClick={() => openEdit(s)}>✏️</button>
                                <button className="btn-icon text-red-400 hover:bg-red-50" onClick={() => setShowDelete(s.id)}>🗑️</button>
                              </>}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Small map preview in sites tab if sites exist */}
          {filtered.length > 0 && activeTab === 'sites' && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="section-title">🗺️ Sites Overview Map</h2>
              </div>
              <MapContainer center={[filtered[0].latitude, filtered[0].longitude]} zoom={5} style={{ height: '260px' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                {filtered.map(s => (
                  <Marker key={s.id} position={[s.latitude, s.longitude]}>
                    <Popup>
                      <strong>{s.site_name || `Site #${s.id}`}</strong><br />
                      {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}<br />
                      Project: {projectName(s.project_id)}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </>
      )}

      {/* ── Create Modal ──────────────────────────────────────────────────── */}
      {showCreate && (
        <Modal title="Register New Renewable Energy Site" onClose={() => setShowCreate(false)} size="lg">
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Section: Basic Info */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📍 Site Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Site Name *</label>
                  <input className="input" value={form.site_name} onChange={e => setForm({...form, site_name: e.target.value})} required placeholder="e.g. Rajasthan Solar Site A" />
                </div>
                <div>
                  <label className="label">Site Code (Auto)</label>
                  <input className="input bg-gray-50 text-gray-400" value={form.site_code} readOnly placeholder="Auto-generated" />
                </div>
                <div>
                  <label className="label">Latitude *</label>
                  <input className="input" type="number" step="any" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} required placeholder="e.g. 26.9124" />
                </div>
                <div>
                  <label className="label">Longitude *</label>
                  <input className="input" type="number" step="any" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} required placeholder="e.g. 75.7873" />
                </div>
                <div>
                  <label className="label">Elevation (m)</label>
                  <input className="input" type="number" step="any" value={form.elevation} onChange={e => setForm({...form, elevation: e.target.value})} />
                </div>
                <div>
                  <label className="label">Land Area (ha)</label>
                  <input className="input" type="number" step="any" value={form.land_area} onChange={e => setForm({...form, land_area: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Section: Location */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🌍 Location Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">District</label>
                  <input className="input" value={form.district} onChange={e => setForm({...form, district: e.target.value, region: e.target.value || form.state})} placeholder="e.g. Jaipur" />
                </div>
                <div>
                  <label className="label">State</label>
                  <input className="input" value={form.state} onChange={e => setForm({...form, state: e.target.value, region: form.district || e.target.value})} placeholder="e.g. Rajasthan" />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input className="input" value={form.country} onChange={e => setForm({...form, country: e.target.value})} />
                </div>
                <div>
                  <label className="label">Postal Code</label>
                  <input className="input" value={form.postal_code} onChange={e => setForm({...form, postal_code: e.target.value})} placeholder="e.g. 302001" />
                </div>
                <div className="col-span-2">
                  <label className="label">Address</label>
                  <input className="input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full address" />
                </div>
              </div>
            </div>

            {/* Section: Land & Terrain */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">⛰️ Land & Terrain</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Terrain Type</label>
                  <select className="select" value={form.terrain_type} onChange={e => setForm({...form, terrain_type: e.target.value})}>
                    {TERRAIN_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Land Use Category</label>
                  <select className="select" value={form.land_use} onChange={e => setForm({...form, land_use: e.target.value})}>
                    {LAND_USE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Land Ownership</label>
                  <select className="select" value={form.ownership} onChange={e => setForm({...form, ownership: e.target.value})}>
                    {OWNERSHIP_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Site Status</label>
                  <select className="select" value={form.site_status} onChange={e => setForm({...form, site_status: e.target.value})}>
                    {SITE_STATUS_OPT.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Infrastructure */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🏗️ Infrastructure</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nearest Road</label>
                  <input className="input" value={form.nearest_road} onChange={e => setForm({...form, nearest_road: e.target.value})} placeholder="e.g. NH-48" />
                </div>
                <div>
                  <label className="label">Distance to Road (km)</label>
                  <input className="input" type="number" step="any" value={form.road_distance} onChange={e => setForm({...form, road_distance: e.target.value})} />
                </div>
                <div>
                  <label className="label">Nearest Substation</label>
                  <input className="input" value={form.nearest_substation} onChange={e => setForm({...form, nearest_substation: e.target.value})} placeholder="e.g. Jaipur 220kV" />
                </div>
                <div>
                  <label className="label">Distance to Grid (km)</label>
                  <input className="input" type="number" step="any" value={form.grid_distance} onChange={e => setForm({...form, grid_distance: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="label">Infrastructure Notes</label>
                  <input className="input" value={form.infrastructure} onChange={e => setForm({...form, infrastructure: e.target.value})} placeholder="e.g. Near substation, grid connected, good road access" />
                </div>
              </div>
              <div className="flex gap-4 mt-3">
                {[
                  { key: 'grid_availability', label: '⚡ Grid Available' },
                  { key: 'road_access',        label: '🛣️ Road Access' },
                  { key: 'water_availability', label: '💧 Water Available' },
                ].map(cb => (
                  <label key={cb.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500" checked={form[cb.key]} onChange={e => setForm({...form, [cb.key]: e.target.checked})} />
                    <span className="text-sm font-medium text-gray-700">{cb.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Project */}
            <div>
              <label className="label">Project *</label>
              <select className="select" value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} required>
                <option value="">— Select Project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
              </select>
            </div>

            {/* Remarks */}
            <div>
              <label className="label">Remarks / Environmental Constraints</label>
              <textarea className="input resize-none" rows={2} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} placeholder="Any environmental constraints, special notes…" />
            </div>

            <p className="text-xs text-gray-400">
              💡 After saving, environmental feature extraction (NASA POWER, GWA, SRTM, OSM) will run automatically.
            </p>

            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Registering…' : 'Register Site'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {showEdit && (
        <Modal title={`Edit Site #${showEdit.id}`} onClose={() => setShowEdit(null)} size="lg">
          <form onSubmit={handleEdit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Latitude *</label><input className="input" type="number" step="any" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} required /></div>
              <div><label className="label">Longitude *</label><input className="input" type="number" step="any" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} required /></div>
              <div><label className="label">Elevation (m)</label><input className="input" type="number" step="any" value={form.elevation} onChange={e => setForm({...form, elevation: e.target.value})} /></div>
              <div><label className="label">Land Area (ha)</label><input className="input" type="number" step="any" value={form.land_area} onChange={e => setForm({...form, land_area: e.target.value})} /></div>
              <div><label className="label">Region</label><input className="input" value={form.region} onChange={e => setForm({...form, region: e.target.value})} /></div>
              <div><label className="label">Ownership</label><input className="input" value={form.ownership} onChange={e => setForm({...form, ownership: e.target.value})} /></div>
              <div className="col-span-2"><label className="label">Infrastructure</label><input className="input" value={form.infrastructure} onChange={e => setForm({...form, infrastructure: e.target.value})} /></div>
              <div className="col-span-2">
                <label className="label">Project *</label>
                <select className="select" value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} required>
                  <option value="">— Select Project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowEdit(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Map Modal ─────────────────────────────────────────────────────── */}
      {showMap && (
        <Modal title={`Site #${showMap.id} — ${showMap.region || 'Location'}`} onClose={() => setShowMap(null)} size="lg">
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Coordinates</p>
              <p className="font-semibold">{showMap.latitude.toFixed(5)}, {showMap.longitude.toFixed(5)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Elevation</p>
              <p className="font-semibold">{showMap.elevation != null ? `${showMap.elevation} m` : '—'}</p>
            </div>
          </div>
          <MapContainer center={[showMap.latitude, showMap.longitude]} zoom={12} style={{ height: '300px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            <Marker position={[showMap.latitude, showMap.longitude]}>
              <Popup>{showMap.site_name || `Site #${showMap.id}`} — {showMap.region || 'No region'}</Popup>
            </Marker>
          </MapContainer>
        </Modal>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      {showDetail && (
        <Modal title={`📊 ${showDetail.site.site_name || `Site #${showDetail.site.id}`} — Full Report`} onClose={() => setShowDetail(null)} size="lg">
          <div className="space-y-5">
            {/* Suitability */}
            <div>
              <h3 className="section-title mb-3">🤖 AI Site Suitability</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { v: showDetail.md.solarScore,    l: 'Solar' },
                  { v: showDetail.md.windScore,     l: 'Wind' },
                  { v: showDetail.md.terrainScore,  l: 'Terrain' },
                  { v: showDetail.md.infraScore,    l: 'Infra' },
                  { v: showDetail.md.envScore,      l: 'Env' },
                  { v: showDetail.md.overallScore,  l: 'Overall', color: '#7c3aed' },
                ].map(s => <div key={s.l} className="text-center"><CircularProgress value={s.v} label={s.l} size={80} color={s.color} /></div>)}
              </div>
            </div>
            {/* Environmental */}
            <div>
              <h3 className="section-title mb-3">🌿 Environmental Data</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                {[
                  { l: 'Solar Irradiance', v: `${showDetail.md.solarIrr} kWh/m²/d`, bg: 'bg-amber-50', c: 'text-amber-700' },
                  { l: 'Wind Speed',       v: `${showDetail.md.windSpeed} m/s`,      bg: 'bg-sky-50',   c: 'text-sky-700' },
                  { l: 'Temperature',      v: `${showDetail.md.temperature}°C`,       bg: 'bg-orange-50',c: 'text-orange-700' },
                  { l: 'Humidity',         v: `${showDetail.md.humidity}%`,           bg: 'bg-blue-50',  c: 'text-blue-700' },
                  { l: 'Rainfall',         v: `${showDetail.md.rainfall} mm/yr`,      bg: 'bg-indigo-50',c: 'text-indigo-700' },
                  { l: 'Elevation',        v: `${showDetail.md.elevation} m`,         bg: 'bg-emerald-50',c:'text-emerald-700' },
                  { l: 'Slope',            v: `${showDetail.md.slope}°`,             bg: 'bg-lime-50',  c: 'text-lime-700' },
                  { l: 'Cloud Cover',      v: `${showDetail.md.cloudCover}%`,        bg: 'bg-gray-50',  c: 'text-gray-700' },
                ].map(r => (
                  <div key={r.l} className={`${r.bg} rounded-xl p-3 text-center`}>
                    <p className={`font-black ${r.c}`}>{r.v}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{r.l}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Infrastructure */}
            <div>
              <h3 className="section-title mb-3">🏗️ Infrastructure</h3>
              <div className="grid grid-cols-3 gap-3 text-sm text-center">
                <div className="bg-gray-50 rounded-xl p-3"><p className="font-black text-gray-700">{showDetail.md.roadDist} km</p><p className="text-gray-500 text-xs">Nearest Road</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="font-black text-gray-700">{showDetail.md.substDist} km</p><p className="text-gray-500 text-xs">Substation</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="font-black text-gray-700">{showDetail.md.nearestCity}</p><p className="text-gray-500 text-xs">Nearest City</p></div>
              </div>
            </div>
            {/* Resource Summary */}
            <div>
              <h3 className="section-title mb-3">📋 Resource Assessment</h3>
              <div className="grid grid-cols-3 gap-3 text-sm text-center">
                <div className="bg-emerald-50 rounded-xl p-3"><p className="font-black text-emerald-700">{showDetail.md.annualEnergy}</p><p className="text-emerald-500 text-xs">Annual Energy</p></div>
                <div className="bg-amber-50 rounded-xl p-3"><p className="font-black text-amber-700">{showDetail.md.roi}</p><p className="text-amber-500 text-xs">Expected ROI</p></div>
                <div className="bg-blue-50 rounded-xl p-3"><p className="font-black text-blue-700">{showDetail.md.co2}</p><p className="text-blue-500 text-xs">CO₂ Reduction</p></div>
                <div className="bg-violet-50 rounded-xl p-3"><p className="font-black text-violet-700">{showDetail.md.cost}</p><p className="text-violet-500 text-xs">Project Cost</p></div>
                <div className="bg-sky-50 rounded-xl p-3"><p className="font-black text-sky-700">{showDetail.md.riskLevel}</p><p className="text-sky-500 text-xs">Risk Level</p></div>
                <div className="bg-emerald-50 rounded-xl p-3"><p className="font-black text-emerald-700">{showDetail.md.reportStatus}</p><p className="text-emerald-500 text-xs">Report Status</p></div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ──────────────────────────────────────────────────── */}
      {showDelete && (
        <Modal title="Delete Site?" onClose={() => setShowDelete(null)}>
          <p className="text-gray-600 text-sm mb-6">All environmental features associated with this site will be permanently deleted.</p>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setShowDelete(null)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
