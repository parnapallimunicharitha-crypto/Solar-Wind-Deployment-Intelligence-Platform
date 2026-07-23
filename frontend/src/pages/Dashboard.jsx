import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardAPI, featuresAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import WorkflowStepper from '../components/WorkflowStepper'
import CircularProgress from '../components/CircularProgress'
import MiniChart from '../components/MiniChart'
import {
  Chart as ChartJS,
  RadialLinearScale, ArcElement, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  Tooltip, Legend, Filler
} from 'chart.js'
import { Doughnut, Radar, Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  RadialLinearScale, ArcElement, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  Tooltip, Legend, Filler
)

// ── Mock / computed data helpers ─────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const genMonthly = (base, variance) =>
  MONTHS.map(() => +(base + (Math.random() - 0.5) * variance * 2).toFixed(2))

const SOLAR_MONTHLY  = genMonthly(5.2, 1.4)
const WIND_MONTHLY   = genMonthly(6.8, 2.1)
const ENV_PARAMS     = [72, 65, 58, 80, 68, 74]

const DATA_SOURCES = [
  { name: 'NASA POWER',          icon: '🛰️', status: 'Connected',    updated: '2 min ago',  color: 'emerald' },
  { name: 'Global Wind Atlas',   icon: '💨', status: 'Connected',    updated: '5 min ago',  color: 'sky' },
  { name: 'SRTM Terrain',        icon: '⛰️', status: 'Connected',    updated: '12 min ago', color: 'amber' },
  { name: 'OpenStreetMap',       icon: '🗺️', status: 'Connected',    updated: '1 min ago',  color: 'blue' },
]

const GIS_LAYERS = [
  { name: 'Terrain Layer',      status: 'Loaded',      icon: '⛰️' },
  { name: 'Road Network',       status: 'Loaded',      icon: '🛣️' },
  { name: 'Power Grid',         status: 'Available',   icon: '⚡' },
  { name: 'Water Bodies',       status: 'Loaded',      icon: '💧' },
  { name: 'Land Use',           status: 'Processing',  icon: '🌿' },
  { name: 'Protected Areas',    status: 'Available',   icon: '🏞️' },
  { name: 'Population Density', status: 'Available',   icon: '👥' },
]

const RECENT_ACTIVITIES = [
  { action: 'Project Created',         user: 'admin',   time: '2 min ago',   icon: '📁', color: 'emerald' },
  { action: 'Site Registered',         user: 'planner', time: '8 min ago',   icon: '📍', color: 'teal' },
  { action: 'GIS Data Imported',       user: 'analyst', time: '15 min ago',  icon: '🗺️', color: 'blue' },
  { action: 'Solar Prediction Run',    user: 'admin',   time: '32 min ago',  icon: '☀️', color: 'amber' },
  { action: 'Assessment Generated',    user: 'planner', time: '1 hr ago',    icon: '🤖', color: 'violet' },
  { action: 'Report Downloaded',       user: 'manager', time: '2 hr ago',    icon: '📊', color: 'sky' },
]

const WORKFLOW_STATUS = [
  { name: 'Project Creation',         status: 'Completed', icon: '📁' },
  { name: 'Site Registration & GIS', status: 'Completed', icon: '📍' },
  { name: 'Resource Assessment',     status: 'Completed', icon: '🌿' },
  { name: 'Site Ranking Engine',     status: 'Completed', icon: '🏆' },
  { name: 'Deployment Optimization', status: 'Completed', icon: '⚙️' },
  { name: 'Energy Forecasting',      status: 'Completed', icon: '📈' },
  { name: 'Investment Evaluation',  status: 'Completed', icon: '💰' },
  { name: 'Dashboard Intelligence',   status: 'Completed', icon: '📊' },
]


const ENV_CARDS = [
  { label: 'Solar Irradiance', icon: '☀️', unit: 'kWh/m²/d', key: 'avg_solar_irradiance', avg: 5.2, trend: 'up',   color: '#f59e0b', data: genMonthly(5.2, 1.4) },
  { label: 'Wind Speed',       icon: '💨', unit: 'm/s',       key: 'avg_wind_speed',       avg: 6.8, trend: 'up',   color: '#06b6d4', data: genMonthly(6.8, 1.8) },
  { label: 'Temperature',      icon: '🌡️', unit: '°C',       key: 'temperature',          avg: 28.4,trend: 'flat', color: '#f97316', data: genMonthly(28.4, 3) },
  { label: 'Humidity',         icon: '💧', unit: '%',         key: 'humidity',             avg: 64,  trend: 'down', color: '#3b82f6', data: genMonthly(64, 8) },
  { label: 'Cloud Cover',      icon: '☁️', unit: '%',         key: 'cloud_cover',          avg: 42,  trend: 'down', color: '#8b5cf6', data: genMonthly(42, 12) },
  { label: 'Elevation',        icon: '⛰️', unit: 'm',        key: 'elevation',            avg: 312, trend: 'flat', color: '#10b981', data: genMonthly(312, 40) },
]

// ── Sub-components ────────────────────────────────────────────────────────────
function EnvCard({ label, icon, unit, avg, trend, color, data, statValue }) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
  return (
    <div className="card-hover p-4 group">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-black text-gray-900 mt-0.5">
            {statValue != null ? Number(statValue).toFixed(1) : avg}
            <span className="text-xs font-normal text-gray-400 ml-1">{unit}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Avg: {avg} {unit}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-2xl">{icon}</span>
          <span className={`text-xs font-bold ${trendColor}`}>{trendIcon} {trend}</span>
        </div>
      </div>
      <MiniChart data={data} color={color} trend={trend} height={36} />
    </div>
  )
}

function StatusDot({ status }) {
  const map = {
    Completed: 'bg-emerald-500',
    Running:   'bg-amber-400 animate-pulse',
    Pending:   'bg-gray-300',
    Connected: 'bg-emerald-500',
    Available: 'bg-blue-400',
    Processing:'bg-amber-400 animate-pulse',
    Loaded:    'bg-emerald-500',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status] || 'bg-gray-300'}`} />
}

function QuickActionBtn({ to, icon, label, bg, text }) {
  return (
    <Link to={to} className={`${bg} ${text} p-3.5 rounded-xl transition-all hover:scale-105 flex flex-col items-center justify-center gap-1.5 group border border-transparent hover:shadow-md`}>
      <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-xs font-bold text-center leading-tight">{label}</span>
    </Link>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [recentProjects, setRecentProjects] = useState([])
  const [recentSites, setRecentSites] = useState([])
  const [recentAssessments, setRecentAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, chartsRes, projectsRes, sitesRes, featsRes] = await Promise.all([
          dashboardAPI.stats(),
          dashboardAPI.charts(),
          dashboardAPI.recentProjects(),
          dashboardAPI.recentSites(),
          featuresAPI.getAll()
        ])
        setStats(statsRes.data)
        setChartData(chartsRes.data)
        setRecentProjects(projectsRes.data)
        setRecentSites(sitesRes.data)
        const sorted = (featsRes.data || [])
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
        setRecentAssessments(sorted)
      } catch (e) {
        console.error('Dashboard load error:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <LoadingSpinner />

  const totalFeatures  = stats?.total_features   || 0
  const totalProjects  = stats?.total_projects   || 0
  const totalSites     = stats?.total_sites      || 0
  const avgSolar       = stats?.avg_solar_irradiance || 0
  const avgWind        = stats?.avg_wind_speed   || 0
  const avgTerrain     = stats?.avg_terrain_score || 0

  // Compute suitability scores from stats
  const solarScore    = Math.min(100, Math.round(avgSolar * 14))
  const windScore     = Math.min(100, Math.round(avgWind * 12.5))
  const terrainScore  = Math.min(100, Math.round(avgTerrain))
  const infraScore    = 76
  const envScore      = 82
  const overallScore  = Math.round((solarScore + windScore + terrainScore + infraScore + envScore) / 5)

  // Chart configs
  const projectStatusData = {
    labels: ['Draft', 'Active', 'Completed', 'On Hold'],
    datasets: [{
      data: chartData ? [
        chartData.project_status?.Draft ?? 0,
        chartData.project_status?.Active ?? 0,
        chartData.project_status?.Completed ?? 0,
        chartData.project_status?.OnHold ?? chartData.project_status?.['On Hold'] ?? 0,
      ] : [1, 2, 1, 0],
      backgroundColor: ['#94a3b8', '#22c55e', '#3b82f6', '#f59e0b'],
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }

  const radarData = {
    labels: ['Solar Irradiance', 'Wind Speed', 'Terrain', 'Accessibility', 'Capacity'],
    datasets: [{
      label: 'Platform Avg',
      data: [solarScore, windScore, terrainScore, infraScore, Math.min(100, Math.round((stats?.avg_capacity_factor || 0) * 2.5))],
      backgroundColor: 'rgba(16,185,129,0.15)',
      borderColor: '#10b981',
      pointBackgroundColor: '#10b981',
      borderWidth: 2,
    }],
  }

  const lineChartData = {
    labels: MONTHS,
    datasets: [
      {
        label: 'Solar (kWh/m²/d)',
        data: SOLAR_MONTHLY,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
      {
        label: 'Wind (m/s)',
        data: WIND_MONTHLY,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6,182,212,0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  }

  const suitabilityBarData = {
    labels: ['Solar', 'Wind', 'Terrain', 'Infrastructure', 'Environmental'],
    datasets: [{
      label: 'Score /100',
      data: [solarScore, windScore, terrainScore, infraScore, envScore],
      backgroundColor: ['#f59e0b','#06b6d4','#10b981','#3b82f6','#8b5cf6'],
      borderRadius: 8,
    }],
  }

  const commonOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-6 top-0 text-[120px] opacity-10 select-none pointer-events-none">⚡</div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <p className="text-emerald-200 text-sm font-medium mb-1">☀️ Solar & Wind Deployment Intelligence Platform</p>
            <h1 className="text-2xl font-black">{greeting}, {user?.username}! 👋</h1>
            <p className="text-emerald-100 text-sm mt-1 opacity-90">Renewable Energy Planning Workspace · Infosys Virtual Internship</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/20">
              <p className="text-xs text-emerald-200">Projects</p>
              <p className="text-2xl font-black">{totalProjects}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/20">
              <p className="text-xs text-emerald-200">Sites</p>
              <p className="text-2xl font-black">{totalSites}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/20">
              <p className="text-xs text-emerald-200">Assessments</p>
              <p className="text-2xl font-black">{totalFeatures}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/20">
              <p className="text-xs text-emerald-200">Role</p>
              <p className="text-sm font-bold">{user?.role?.split(' ').map(w=>w[0]).join('')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Milestone 1: Stats Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects',         value: totalProjects,  icon: '📁', grad: 'from-emerald-500 to-teal-600',   today: '+2', sub: 'Active projects' },
          { label: 'Registered Sites',       value: totalSites,     icon: '📍', grad: 'from-sky-500 to-blue-600',       today: '+1', sub: 'Registered locations' },
          { label: 'Assessments Completed',  value: totalFeatures,  icon: '🤖', grad: 'from-violet-500 to-purple-600',  today: '+3', sub: 'Environmental analyses' },
          { label: 'Reports Generated',      value: Math.max(1, Math.round(totalFeatures * 0.6)), icon: '📊', grad: 'from-amber-500 to-orange-600', today: '+1', sub: 'Downloadable reports' },
        ].map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.grad} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
            <div className="absolute right-3 top-3 text-3xl opacity-20 group-hover:opacity-30 transition-opacity">{c.icon}</div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">{c.label}</p>
            <p className="text-4xl font-black">{c.value}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{c.today} today</span>
              <span className="text-white/60 text-[10px]">{c.sub}</span>
            </div>
            <div className="mt-2 bg-white/20 rounded-full h-1">
              <div className="bg-white h-1 rounded-full" style={{ width: `${Math.min(100, (c.value / 20) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab Switcher ─────────────────────────────────────────────────── */}
      <div className="card p-2 flex gap-1.5 overflow-x-auto">
        {[
          { id: 'overview',  label: '📊 Overview' },
          { id: 'env',       label: '🌿 Environmental Intelligence' },
          { id: 'gis',       label: '🗺️ GIS Intelligence' },
          { id: 'prediction',label: '⚡ Predictions & AI' },
          { id: 'workflow',  label: '🔄 Workflow Status' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Charts col-span-2 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Monthly trends */}
              <div className="card">
                <h2 className="section-title mb-4">📈 Monthly Resource Trends</h2>
                <div className="h-56">
                  <Line
                    data={lineChartData}
                    options={{ ...commonOpts, scales: { y: { beginAtZero: false, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } } }}
                  />
                </div>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <h2 className="section-title mb-4">📊 Project Status</h2>
                  <div className="h-48">
                    <Doughnut data={projectStatusData} options={{ ...commonOpts, cutout: '65%' }} />
                  </div>
                </div>
                <div className="card">
                  <h2 className="section-title mb-4">🎯 Site Suitability Scores</h2>
                  <div className="h-48">
                    <Bar data={suitabilityBarData} options={{ ...commonOpts, scales: { y: { beginAtZero: true, max: 100 } } }} />
                  </div>
                </div>
              </div>

              {/* Recent Assessments */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title">🔬 Recent Assessments</h2>
                  <Link to="/assessment" className="text-xs text-emerald-600 hover:underline font-semibold">Run Assessment →</Link>
                </div>
                {recentAssessments.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <div className="text-4xl mb-2">⚙️</div>
                    <p className="text-sm">No assessments yet. Run your first analysis.</p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Coordinates</th><th>Solar Irr.</th><th>Wind Speed</th>
                          <th>Terrain Score</th><th>Wind Class</th><th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentAssessments.map((a) => (
                          <tr key={a.id}>
                            <td className="font-mono text-xs">{a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}</td>
                            <td>{a.solar_irradiance?.toFixed(2) ?? '—'}</td>
                            <td>{a.wind_speed?.toFixed(2) ?? '—'} m/s</td>
                            <td>{a.terrain_score?.toFixed(1) ?? '—'}</td>
                            <td>
                              <span className={`badge-${a.wind_class === 'Excellent' || a.wind_class === 'Good' ? 'good' : 'moderate'}`}>
                                {a.wind_class || 'Unknown'}
                              </span>
                            </td>
                            <td className="text-gray-400 text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="card">
                <h2 className="section-title mb-4">⚡ Quick Actions</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  <QuickActionBtn to="/projects" icon="📁" label="Create New Project"     bg="bg-emerald-50" text="text-emerald-700" />
                  <QuickActionBtn to="/sites"    icon="📍" label="Register New Site"      bg="bg-sky-50"     text="text-sky-700" />
                  <QuickActionBtn to="/sites"    icon="🗺️" label="Import GIS Data"        bg="bg-blue-50"    text="text-blue-700" />
                  <QuickActionBtn to="/assessment" icon="☀️" label="Run Solar Prediction" bg="bg-amber-50"   text="text-amber-700" />
                  <QuickActionBtn to="/assessment" icon="💨" label="Run Wind Prediction"  bg="bg-cyan-50"    text="text-cyan-700" />
                  <QuickActionBtn to="/features"   icon="📊" label="Generate Report"      bg="bg-violet-50"  text="text-violet-700" />
                </div>
              </div>

              {/* Data Sources */}
              <div className="card">
                <h2 className="section-title mb-4">🛰️ Connected Data Sources</h2>
                <div className="space-y-3">
                  {DATA_SOURCES.map(ds => (
                    <div key={ds.name} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <span className="text-xl">{ds.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800">{ds.name}</p>
                        <p className="text-[10px] text-gray-400">Updated {ds.updated}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <StatusDot status={ds.status} />
                        <span className={`text-[10px] font-bold text-${ds.color}-600`}>{ds.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather Summary */}
              <div className="card bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0">
                <h2 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-4">🌦️ Platform Averages</h2>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Daily Irradiance', value: `${avgSolar.toFixed(2)} kWh/m²`, color: 'text-amber-300' },
                    { label: 'Wind Speed',        value: `${avgWind.toFixed(2)} m/s`,     color: 'text-cyan-300' },
                    { label: 'Capacity Factor',   value: `${stats?.avg_capacity_factor?.toFixed(1) ?? '—'} %`, color: 'text-emerald-300' },
                    { label: 'Terrain Score',     value: `${avgTerrain.toFixed(1)} /100`,  color: 'text-violet-300' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between border-b border-white/10 pb-1.5">
                      <span className="text-white/60">{row.label}</span>
                      <span className={`font-bold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Projects */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">📁 Recent Projects</h2>
                  <Link to="/projects" className="text-xs text-emerald-600 hover:underline font-semibold">View All</Link>
                </div>
                {recentProjects.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">No projects yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recentProjects.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                        <span className="font-semibold text-gray-800 truncate max-w-[130px]">{p.project_name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          p.status === 'Active' ? 'bg-green-100 text-green-700' :
                          p.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: ENVIRONMENTAL INTELLIGENCE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'env' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {ENV_CARDS.map(card => (
              <EnvCard
                key={card.label}
                {...card}
                statValue={card.key === 'avg_solar_irradiance' ? avgSolar : card.key === 'avg_wind_speed' ? avgWind : null}
              />
            ))}
          </div>
          {/* Environmental radar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="section-title mb-4">🎯 Resource Radar</h2>
              <div className="h-56">
                <Radar data={radarData} options={{ ...commonOpts, scales: { r: { beginAtZero: true, max: 100, ticks: { display: false } } } }} />
              </div>
            </div>
            <div className="card">
              <h2 className="section-title mb-4">📊 Environmental Parameters</h2>
              <div className="h-56">
                <Bar
                  data={{
                    labels: ['Solar Score', 'Wind Score', 'Terrain', 'Access', 'Env Risk', 'Overall'],
                    datasets: [{ label: 'Score', data: ENV_PARAMS, backgroundColor: '#10b981', borderRadius: 6 }],
                  }}
                  options={{ ...commonOpts, scales: { y: { beginAtZero: true, max: 100 } } }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: GIS INTELLIGENCE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'gis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* GIS Layer Status */}
            <div className="card">
              <h2 className="section-title mb-4">🗺️ GIS Layer Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {GIS_LAYERS.map(layer => (
                  <div key={layer.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors">
                    <span className="text-xl">{layer.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{layer.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={layer.status} />
                      <span className={`text-xs font-bold ${
                        layer.status === 'Loaded' ? 'text-emerald-600' :
                        layer.status === 'Processing' ? 'text-amber-600' : 'text-blue-600'
                      }`}>{layer.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map placeholder */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="section-title">🗺️ GIS Map Preview</h2>
              </div>
              <div className="h-64 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center flex-col gap-3">
                <span className="text-5xl">🗺️</span>
                <p className="text-gray-500 text-sm font-medium">Interactive GIS Map</p>
                <Link to="/sites" className="btn-primary text-xs py-1.5 px-4">Open Full GIS View</Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Data Sources */}
            <div className="card">
              <h2 className="section-title mb-4">🛰️ Data Sources</h2>
              <div className="space-y-3">
                {DATA_SOURCES.map(ds => (
                  <div key={ds.name} className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span>{ds.icon}</span>
                      <span className="text-sm font-bold text-gray-800">{ds.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Last: {ds.updated}</span>
                      <div className="flex items-center gap-1">
                        <StatusDot status={ds.status} />
                        <span className={`font-bold text-${ds.color}-600`}>{ds.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent sites */}
            <div className="card">
              <h2 className="section-title mb-3">📍 Recent Sites</h2>
              {recentSites.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">No sites registered.</p>
              ) : (
                <div className="space-y-2">
                  {recentSites.map(s => (
                    <div key={s.id} className="text-xs flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                      <span className="font-mono text-gray-600">{s.latitude.toFixed(3)}, {s.longitude.toFixed(3)}</span>
                      <span className="text-gray-400 italic truncate max-w-[80px]">{s.region || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/sites" className="block text-center text-xs text-emerald-600 hover:underline font-semibold mt-3">View all sites →</Link>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: PREDICTIONS & AI
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'prediction' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Solar Panel */}
          <div className="card space-y-4">
            <h2 className="section-title flex items-center gap-2">☀️ Solar Prediction Panel</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Avg Solar Irradiance',      value: `${avgSolar.toFixed(2)} kWh/m²/d` },
                { label: 'Peak Sun Hours',             value: `${(avgSolar * 0.85).toFixed(1)} hrs/day` },
                { label: 'Estimated Solar Energy',     value: `${(avgSolar * 365 * 0.18).toFixed(0)} MWh/yr` },
                { label: 'Panel Efficiency',           value: '18.5%' },
                { label: 'Optimal Tilt Angle',         value: '22°' },
                { label: 'Expected Annual Generation', value: `${(avgSolar * 365 * 0.18 * 1.2).toFixed(0)} MWh` },
                { label: 'Confidence Score',           value: '91%' },
              ].map(r => (
                <div key={r.label} className="bg-amber-50 rounded-xl p-3">
                  <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide">{r.label}</p>
                  <p className="text-sm font-black text-gray-900 mt-0.5">{r.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Wind Panel */}
          <div className="card space-y-4">
            <h2 className="section-title flex items-center gap-2">💨 Wind Prediction Panel</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Avg Wind Speed',         value: `${avgWind.toFixed(2)} m/s` },
                { label: 'Wind Direction',         value: 'SW 225°' },
                { label: 'Power Density',          value: `${(0.5 * 1.225 * Math.pow(avgWind,3)).toFixed(0)} W/m²` },
                { label: 'Capacity Factor',        value: `${stats?.avg_capacity_factor?.toFixed(1) ?? 32} %` },
                { label: 'Estimated Energy Output',value: `${(avgWind * 365 * 24 * 0.35).toFixed(0)} MWh/yr` },
                { label: 'Turbine Recommendation', value: '2.5 MW IEC-S' },
                { label: 'Confidence Score',       value: '87%' },
              ].map(r => (
                <div key={r.label} className="bg-sky-50 rounded-xl p-3">
                  <p className="text-[10px] text-sky-600 font-semibold uppercase tracking-wide">{r.label}</p>
                  <p className="text-sm font-black text-gray-900 mt-0.5">{r.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Suitability */}
          <div className="card space-y-4">
            <h2 className="section-title">🤖 AI Site Suitability</h2>
            <div className="grid grid-cols-2 gap-4 place-items-center">
              <CircularProgress value={solarScore}   label="Solar Score"   size={90} />
              <CircularProgress value={windScore}    label="Wind Score"    size={90} />
              <CircularProgress value={terrainScore} label="Terrain Score" size={90} />
              <CircularProgress value={infraScore}   label="Infrastructure"size={90} />
              <CircularProgress value={envScore}     label="Environmental" size={90} />
              <CircularProgress value={overallScore} label="Overall Score" size={90} color="#7c3aed" />
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-600 font-semibold">DEPLOYMENT RECOMMENDATION</p>
              <p className="text-lg font-black text-emerald-700 mt-0.5">
                {overallScore >= 80 ? '✅ Excellent Site' : overallScore >= 60 ? '🟡 Good Potential' : '⚠️ Needs Review'}
              </p>
            </div>
          </div>

          {/* Resource Assessment Summary — full width */}
          <div className="lg:col-span-3 card">
            <h2 className="section-title mb-4">📋 Resource Assessment Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Est. Annual Energy', value: `${((avgSolar + avgWind) * 365 * 0.25).toFixed(0)} GWh`,  icon: '⚡', color: 'emerald' },
                { label: 'Expected ROI',        value: '14.2%',                                                   icon: '💰', color: 'amber' },
                { label: 'CO₂ Reduction',       value: `${(totalFeatures * 42).toFixed(0)} tCO₂/yr`,             icon: '🌿', color: 'green' },
                { label: 'Project Cost',         value: '₹4.2 Cr/MW',                                             icon: '🏗️', color: 'blue' },
                { label: 'Payback Period',       value: '7.5 years',                                              icon: '📅', color: 'violet' },
                { label: 'Recommendation',       value: 'DEPLOY',                                                 icon: '🚀', color: 'sky' },
              ].map(r => (
                <div key={r.label} className={`bg-${r.color}-50 rounded-xl p-4 text-center hover:scale-105 transition-transform`}>
                  <div className="text-2xl mb-1">{r.icon}</div>
                  <p className={`text-lg font-black text-${r.color}-700`}>{r.value}</p>
                  <p className={`text-[10px] text-${r.color}-500 font-semibold uppercase tracking-wide mt-0.5`}>{r.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendation Panel — full width */}
          <div className="lg:col-span-3 card">
            <h2 className="section-title mb-4">🤖 AI Recommendation Panel</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Best Site Recommendation',  value: `Site at ${recentSites[0] ? `${recentSites[0].latitude.toFixed(2)}, ${recentSites[0].longitude.toFixed(2)}` : 'N/A'}`, icon: '📍', color: 'emerald' },
                { label: 'Best Panel Type',            value: 'Monocrystalline PERC 450W',     icon: '☀️', color: 'amber' },
                { label: 'Best Wind Turbine',          value: 'Siemens Gamesa SG 2.1-114',    icon: '💨', color: 'sky' },
                { label: 'Deployment Risk',            value: 'Low (Score: 18/100)',           icon: '⚠️', color: 'green' },
                { label: 'Expected Efficiency',        value: `${(solarScore * 0.22).toFixed(1)}% Solar · ${(windScore * 0.35).toFixed(1)}% Wind`, icon: '📈', color: 'blue' },
                { label: 'Smart Suggestion',           value: 'Hybrid Solar+Wind optimal for this region', icon: '💡', color: 'violet' },
              ].map(r => (
                <div key={r.label} className={`bg-${r.color}-50 border border-${r.color}-100 rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{r.icon}</span>
                    <p className={`text-[10px] text-${r.color}-600 font-bold uppercase tracking-wide`}>{r.label}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: WORKFLOW STATUS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'workflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Stepper */}
          <div className="card">
            <h2 className="section-title mb-4">🔄 Deployment Workflow Progress</h2>
            <WorkflowStepper currentStep={3} />
          </div>

          {/* Workflow Status Widget */}
          <div className="card">
            <h2 className="section-title mb-4">📋 Module Status</h2>
            <div className="space-y-2.5">
              {WORKFLOW_STATUS.map(wf => (
                <div key={wf.name} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-lg">{wf.icon}</span>
                  <span className="text-sm font-semibold text-gray-800 flex-1">{wf.name}</span>
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={wf.status} />
                    <span className={`text-xs font-bold ${
                      wf.status === 'Completed' ? 'text-emerald-600' :
                      wf.status === 'Running'   ? 'text-amber-600'   : 'text-gray-400'
                    }`}>{wf.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="card">
            <h2 className="section-title mb-4">⏱️ Recent Activities</h2>
            <div className="space-y-3">
              {RECENT_ACTIVITIES.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full bg-${a.color}-100 flex items-center justify-center text-sm shrink-0`}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{a.action}</p>
                    <p className="text-xs text-gray-400">by <span className="font-medium text-gray-600">{a.user}</span> · {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
