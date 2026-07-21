import RecommendationBadge from './RecommendationBadge'

/**
 * ScoreRow — inline progress row with label, score, and colour.
 */
function ScoreRow({ label, score, max = 100, colour = 'bg-primary-500' }) {
  const pct = max > 0 ? (score / max) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-semibold">{score?.toFixed ? score.toFixed(1) : score}</span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${colour}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/**
 * SectionCard — compact card wrapper for each assessment section.
 */
function SectionCard({ title, icon, children }) {
  return (
    <div className="card animate-fade-in">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

/**
 * AssessmentDisplay — renders the full assessment API response in structured sections.
 *
 * Props:
 *   data — the full AssessmentResponse object from GET /assessment
 */
export default function AssessmentDisplay({ data }) {
  if (!data) return null
  const { solar_assessment: sol, wind_assessment: wind,
          terrain_assessment: terrain, infrastructure_assessment: infra,
          suitability_score: suit, deployment_recommendation: rec,
          weather_summary: weather } = data

  return (
    <div className="space-y-6">

      {/* ── Deployment Recommendation ──────────────────────────────────────── */}
      <div className="card flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-primary-900 to-ocean-800 text-white border-0">
        <div>
          <p className="text-sm text-white/60 uppercase tracking-wider font-semibold mb-1">Deployment Recommendation</p>
          <p className="text-3xl font-extrabold">{rec.deployment}</p>
          <p className="text-white/70 text-sm mt-1">{rec.reason}</p>
        </div>
        <div className="text-center shrink-0">
          <div className="text-5xl mb-1">
            {rec.deployment === 'Solar' ? '☀️' : rec.deployment === 'Wind' ? '💨' : rec.deployment === 'Hybrid' ? '⚡' : '⚠️'}
          </div>
          <p className="text-white/60 text-xs">Confidence</p>
          <p className="text-2xl font-bold">{rec.confidence}%</p>
        </div>
      </div>

      {/* ── Suitability Score ─────────────────────────────────────────────── */}
      <SectionCard title="Site Suitability Score" icon="🎯">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl font-extrabold text-primary-700">{suit.overall_score}</div>
          <div>
            <span className={`badge-${suit.category === 'Excellent' ? 'excellent' : suit.category.includes('Highly') ? 'good' : suit.category.includes('Moderate') ? 'moderate' : 'poor'}`}>
              {suit.category}
            </span>
            <p className="text-xs text-gray-400 mt-1">Weighted composite score</p>
          </div>
        </div>
        <ScoreRow label="Renewable Resource (35%)" score={suit.renewable_resource_score} colour="bg-amber-400" />
        <ScoreRow label="Geographic Suitability (25%)" score={suit.terrain_score} colour="bg-green-400" />
        <ScoreRow label="Infrastructure Accessibility (15%)" score={suit.infrastructure_score} colour="bg-ocean-400" />
        <ScoreRow label="Environmental Impact (15%)" score={suit.environmental_score} colour="bg-violet-400" />
        <ScoreRow label="Economic Feasibility (10%)" score={suit.economic_score} colour="bg-teal-400" />
      </SectionCard>

      {/* ── Solar + Wind ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Solar Assessment" icon="☀️">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { l: 'Daily Irradiance',  v: weather?.solar_irradiance,            u: 'kWh/m²/d' },
              { l: 'Annual Irradiance', v: sol.annual_irradiance?.toFixed(1),    u: 'kWh/m²/yr' },
              { l: 'Peak Sun Hours',   v: sol.peak_sun_hours,                   u: 'hrs' },
              { l: 'Performance Ratio',v: sol.performance_ratio,                u: '' },
              { l: 'Capacity Factor',  v: `${sol.capacity_factor}%`,            u: '' },
              { l: 'Energy Output',    v: `${sol.expected_energy_output?.toFixed(0)}`, u: 'kWh/kWp/yr' },
            ].map(({ l, v, u }) => (
              <div key={l} className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">{l}</p>
                <p className="font-bold text-gray-800">{v} <span className="text-xs font-normal text-gray-400">{u}</span></p>
              </div>
            ))}
            <div className="bg-amber-100 rounded-xl p-3 flex flex-col items-center justify-center">
              <p className="text-xs text-gray-500">Solar Suitability</p>
              <p className="font-bold text-amber-700 text-xs mt-1">{sol.solar_suitability}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Wind Assessment" icon="💨">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { l: 'Wind Speed',      v: wind.wind_speed,                 u: 'm/s' },
              { l: 'Wind Class',      v: wind.wind_class,                 u: '' },
              { l: 'Resource Score',  v: wind.wind_resource_score,        u: '/100' },
              { l: 'Capacity Factor', v: `${wind.capacity_factor}%`,      u: '' },
              { l: 'Annual Energy',   v: `${wind.annual_energy_production?.toFixed(0)}`, u: 'kWh/kW/yr' },
            ].map(({ l, v, u }) => (
              <div key={l} className="bg-cyan-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">{l}</p>
                <p className="font-bold text-gray-800">{v} <span className="text-xs font-normal text-gray-400">{u}</span></p>
              </div>
            ))}
            <div className="bg-cyan-100 rounded-xl p-3 flex flex-col items-center justify-center">
              <p className="text-xs text-gray-500">Wind Suitability</p>
              <p className="font-bold text-cyan-700 text-xs mt-1">{wind.wind_suitability}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Terrain + Infrastructure ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Terrain Assessment" icon="⛰️">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { l: 'Elevation',          v: terrain.elevation,              u: 'm' },
              { l: 'Slope',              v: terrain.slope,                  u: '°' },
              { l: 'Terrain Score',      v: terrain.terrain_score,          u: '/100' },
              { l: 'Terrain Suitability',v: terrain.terrain_suitability,    u: '' },
            ].map(({ l, v, u }) => (
              <div key={l} className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">{l}</p>
                <p className="font-bold text-gray-800">{typeof v === 'number' ? v.toFixed(2) : v} <span className="text-xs font-normal text-gray-400">{u}</span></p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Infrastructure Assessment" icon="🔌">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { l: 'Nearest Road',       v: infra.nearest_road,             u: 'km' },
              { l: 'Nearest Substation', v: infra.nearest_substation,       u: 'km' },
              { l: 'Transmission Line',  v: infra.transmission_line_distance,u: 'km' },
              { l: 'Accessibility Score',v: infra.accessibility_score,       u: '/100' },
            ].map(({ l, v, u }) => (
              <div key={l} className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">{l}</p>
                <p className="font-bold text-gray-800">{typeof v === 'number' ? v.toFixed(2) : v} <span className="text-xs font-normal text-gray-400">{u}</span></p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Weather Summary ─────────────────────────────────────────────────── */}
      {weather && (
        <SectionCard title="Weather Summary" icon="🌤️">
          <div className="grid grid-cols-5 gap-3 text-center text-sm">
            {[
              { l: 'Temperature', v: weather.temperature, u: '°C', bg: 'bg-orange-50' },
              { l: 'Humidity',    v: weather.humidity,    u: '%',  bg: 'bg-sky-50' },
              { l: 'Rainfall',    v: weather.rainfall,    u: 'mm', bg: 'bg-blue-50' },
              { l: 'Cloud Cover', v: weather.cloud_cover, u: '%',  bg: 'bg-gray-50' },
              { l: 'Irradiance',  v: weather.solar_irradiance, u: 'kWh/m²', bg: 'bg-yellow-50' },
            ].map(({ l, v, u, bg }) => (
              <div key={l} className={`${bg} rounded-xl p-3`}>
                <p className="text-xs text-gray-500">{l}</p>
                <p className="font-bold text-gray-800 text-base">{typeof v === 'number' ? v.toFixed(1) : v}</p>
                <p className="text-xs text-gray-400">{u}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
