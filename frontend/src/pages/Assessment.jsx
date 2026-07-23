import { useState, useEffect } from 'react'
import { assessmentAPI, sitesAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import AlertMessage from '../components/AlertMessage'
import SiteMap from '../components/SiteMap'
import AssessmentDisplay from '../components/AssessmentDisplay'
import Gauge from '../components/Gauge'
import {
  Chart as ChartJS,
  RadialLinearScale, PointElement, LineElement, Filler,
  CategoryScale, LinearScale, BarElement,
  Tooltip, Legend
} from 'chart.js'
import { Radar, Bar } from 'react-chartjs-2'

ChartJS.register(
  RadialLinearScale, PointElement, LineElement, Filler,
  CategoryScale, LinearScale, BarElement,
  Tooltip, Legend
)

// ── Mini metric tile ──────────────────────────────────────────────────────────
function MetricTile({ label, value, unit, icon, bgClass = 'bg-gray-50' }) {
  return (
    <div className={`${bgClass} rounded-xl p-3.5 text-center`}>
      <div className="text-xl mb-0.5">{icon}</div>
      <div className="text-lg font-extrabold text-gray-900">
        {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 2) : (value ?? '—')}
        {unit && <span className="text-xs font-normal text-gray-500 ml-0.5">{unit}</span>}
      </div>
      <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  )
}

export default function Assessment() {
  const [coords, setCoords] = useState({ latitude: '', longitude: '' })
  const [installedCapacity, setInstalledCapacity] = useState('1000')
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [sites, setSites] = useState([])
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sitesLoading, setSitesLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await sitesAPI.getAll()
        setSites(res.data)
      } catch (err) {
        console.error('Error loading sites:', err)
      } finally {
        setSitesLoading(false)
      }
    }
    fetchSites()
  }, [])

  const handleSiteSelect = (siteId) => {
    setSelectedSiteId(siteId)
    if (siteId) {
      const site = sites.find((s) => s.id === parseInt(siteId))
      if (site) setCoords({ latitude: site.latitude.toString(), longitude: site.longitude.toString() })
    } else {
      setCoords({ latitude: '', longitude: '' })
    }
  }

  const handleInputChange = (field, value) => {
    setCoords({ ...coords, [field]: value })
    setSelectedSiteId('')
  }

  const handleRunAssessment = async (e) => {
    e.preventDefault()
    setError('')
    setAssessment(null)

    const lat = parseFloat(coords.latitude)
    const lon = parseFloat(coords.longitude)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90')
      return
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError('Longitude must be between -180 and 180')
      return
    }

    setLoading(true)
    try {
      const res = await assessmentAPI.getAssessment(lat, lon)
      let data = res.data
      const capacityVal = parseFloat(installedCapacity) || 1000
      if (data.deployment_recommendation) {
        try {
          const energyRes = await assessmentAPI.estimateEnergy({
            site_evaluation_result: data,
            deployment_type: data.deployment_recommendation.deployment,
            installed_capacity: capacityVal,
            operating_hours: 8760
          })
          data.energy_estimation = energyRes.data
        } catch (e) {
          console.warn('Energy estimate API call failed, using default:', e)
        }
      }
      setAssessment(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Assessment failed. Check backend connection.')
    } finally {
      setLoading(false)
    }
  }


  // ── Charts from assessment data ────────────────────────────────────────────
  const radarData = assessment ? {
    labels: ['Solar Irradiance', 'Wind Speed', 'Terrain Score', 'Accessibility', 'Capacity Factor'],
    datasets: [{
      label: 'Site Profile',
      data: [
        Math.min(100, (assessment.weather_summary?.solar_irradiance || 0) * 14),
        Math.min(100, (assessment.wind_assessment?.wind_speed || 0) * 12.5),
        assessment.terrain_assessment?.terrain_score || 0,
        assessment.infrastructure_assessment?.accessibility_score || 0,
        (assessment.wind_assessment?.capacity_factor || 0) * 2.5,
      ],
      backgroundColor: 'rgba(16,185,129,0.2)',
      borderColor: 'rgba(16,185,129,0.9)',
      pointBackgroundColor: '#10b981',
      borderWidth: 2,
      pointRadius: 4,
    }],
  } : null

  const barData = assessment ? {
    labels: ['Renewable\nResource', 'Terrain', 'Infrastructure', 'Environmental', 'Economic'],
    datasets: [{
      label: 'Score (/100)',
      data: [
        assessment.suitability_score?.renewable_resource_score || 0,
        assessment.suitability_score?.terrain_score || 0,
        assessment.suitability_score?.infrastructure_score || 0,
        assessment.suitability_score?.environmental_score || 0,
        assessment.suitability_score?.economic_score || 0,
      ],
      backgroundColor: [
        'rgba(251,191,36,0.8)', 'rgba(16,185,129,0.8)',
        'rgba(59,130,246,0.8)', 'rgba(139,92,246,0.8)', 'rgba(20,184,166,0.8)'
      ],
      borderRadius: 8,
      borderSkipped: false,
    }],
  } : null

  const suitScore = assessment?.suitability_score?.overall_score || 0
  const suitCategory = assessment?.suitability_score?.category || ''

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Resource Assessment Engine</h1>
        <p className="page-subtitle">Full-spectrum solar, wind, terrain & infrastructure analysis using multi-source GIS data.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left column: controls ─────────────────────────────────────────── */}
        <div className="xl:col-span-1 space-y-5">
          {/* Input card */}
          <div className="card">
            <h2 className="section-title mb-4">📍 Location Configuration</h2>
            <form onSubmit={handleRunAssessment} className="space-y-4">
              <AlertMessage type="error" message={error} />

              <div>
                <label className="label">Select Registered Site</label>
                <select
                  className="select"
                  value={selectedSiteId}
                  onChange={(e) => handleSiteSelect(e.target.value)}
                  disabled={sitesLoading}
                >
                  <option value="">— Use Custom Coordinates —</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      Site #{s.id} ({s.region || 'Unknown'} — {s.latitude.toFixed(3)}, {s.longitude.toFixed(3)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Latitude</label>
                  <input
                    className="input"
                    type="number"
                    step="any"
                    placeholder="e.g. 13.6288"
                    value={coords.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Longitude</label>
                  <input
                    className="input"
                    type="number"
                    step="any"
                    placeholder="e.g. 79.4192"
                    value={coords.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Installed Capacity (kW)</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  min="1"
                  placeholder="e.g. 1000"
                  value={installedCapacity}
                  onChange={(e) => setInstalledCapacity(e.target.value)}
                  required
                />
              </div>


              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-1"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Analyze Location
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Map Preview */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="section-title">🗺️ Spatial Map Preview</h2>
            </div>
            <SiteMap
              latitude={coords.latitude ? parseFloat(coords.latitude) : null}
              longitude={coords.longitude ? parseFloat(coords.longitude) : null}
              label={selectedSiteId ? `Site #${selectedSiteId}` : 'Assessed Coordinates'}
            />
          </div>

          {/* Gauge (visible once assessment runs) */}
          {assessment && (
            <div className="card p-4">
              <h2 className="section-title mb-3">🎯 Suitability Score</h2>
              <Gauge
                value={suitScore}
                label="Overall Suitability"
                category={suitCategory}
              />
            </div>
          )}
        </div>

        {/* ── Right column: results ──────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-5">
          {loading && (
            <div className="card h-64 flex flex-col items-center justify-center gap-4">
              <LoadingSpinner />
              <div className="text-center">
                <p className="text-gray-700 font-semibold text-sm">Running GIS Assessment</p>
                <p className="text-gray-400 text-xs mt-1">Querying NASA POWER · GWA · SRTM · OpenStreetMap...</p>
              </div>
            </div>
          )}

          {!loading && !assessment && (
            <div className="card h-72 flex flex-col items-center justify-center text-center text-gray-400 p-8">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-5xl mb-4">⚙️</div>
              <h3 className="font-bold text-gray-700 mb-1 text-base">Assessment Engine Idle</h3>
              <p className="text-sm max-w-sm text-gray-500 leading-relaxed">
                Enter coordinates or select an existing site and click <strong>Analyze Location</strong> to generate the full environmental report.
              </p>
            </div>
          )}

          {!loading && assessment && (
            <div className="space-y-5">
              {/* Quick metrics strip */}
              <div className="card p-4">
                <h2 className="section-title mb-3">📊 Key Parameters</h2>
                <div className="grid grid-cols-4 gap-3">
                  <MetricTile label="Solar Irr." value={assessment.weather_summary?.solar_irradiance} unit="kWh/m²" icon="☀️" bgClass="bg-amber-50" />
                  <MetricTile label="Wind Speed" value={assessment.wind_assessment?.wind_speed} unit="m/s" icon="💨" bgClass="bg-cyan-50" />
                  <MetricTile label="Temperature" value={assessment.weather_summary?.temperature} unit="°C" icon="🌡️" bgClass="bg-orange-50" />
                  <MetricTile label="Humidity" value={assessment.weather_summary?.humidity} unit="%" icon="💧" bgClass="bg-sky-50" />
                  <MetricTile label="Elevation" value={assessment.terrain_assessment?.elevation} unit="m" icon="⛰️" bgClass="bg-green-50" />
                  <MetricTile label="Slope" value={assessment.terrain_assessment?.slope} unit="°" icon="📐" bgClass="bg-lime-50" />
                  <MetricTile label="Road Dist." value={assessment.infrastructure_assessment?.nearest_road} unit="km" icon="🛣️" bgClass="bg-blue-50" />
                  <MetricTile label="Terrain Score" value={assessment.terrain_assessment?.terrain_score} unit="/100" icon="📈" bgClass="bg-emerald-50" />
                </div>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Radar */}
                <div className="card">
                  <h2 className="section-title mb-3">🎯 Resource Radar</h2>
                  {radarData && (
                    <div className="h-52">
                      <Radar
                        data={radarData}
                        options={{
                          responsive: true, maintainAspectRatio: false,
                          scales: { r: { beginAtZero: true, max: 100, ticks: { display: false }, grid: { color: 'rgba(0,0,0,0.06)' } } },
                          plugins: { legend: { display: false } },
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Bar */}
                <div className="card">
                  <h2 className="section-title mb-3">📊 Suitability Breakdown</h2>
                  {barData && (
                    <div className="h-52">
                      <Bar
                        data={barData}
                        options={{
                          responsive: true, maintainAspectRatio: false,
                          scales: {
                            y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
                            x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                          },
                          plugins: { legend: { display: false } },
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Full assessment details */}
              <div>
                <h2 className="section-title mb-3">📋 Full Assessment Report</h2>
                <AssessmentDisplay data={assessment} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
