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
          weather_summary: weather, candidate_ranking: ranking,
          energy_estimation: energyEstFromData,
          deployment_optimization: optData,
          forecasting: forecastData,
          investment_recommendation: investmentData } = data

  const energyEst = energyEstFromData || {
    solar_energy: rec.deployment === 'Wind' ? 0 : roundVal((sol.capacity_factor / 100) * 1000 * 8760),
    wind_energy: rec.deployment === 'Solar' ? 0 : roundVal((wind.capacity_factor / 100) * 1000 * 8760),
    total_energy: rec.deployment === 'Solar' ? roundVal((sol.capacity_factor / 100) * 1000 * 8760) :
                  rec.deployment === 'Wind' ? roundVal((wind.capacity_factor / 100) * 1000 * 8760) :
                  roundVal(((sol.capacity_factor / 100) * 1000 * 8760) + ((wind.capacity_factor / 100) * 1000 * 8760)),
    deployment_type: rec.deployment,
    installed_capacity: 1000,
    operating_hours: 8760
  }

  function roundVal(n) { return Math.round(n * 100) / 100 }

  const combinedEnergy = energyEst.solar_energy + energyEst.wind_energy
  const solarPct = combinedEnergy > 0 ? ((energyEst.solar_energy / combinedEnergy) * 100).toFixed(1) : (rec.deployment === 'Solar' ? '100.0' : '0.0')
  const windPct = combinedEnergy > 0 ? ((energyEst.wind_energy / combinedEnergy) * 100).toFixed(1) : (rec.deployment === 'Wind' ? '100.0' : '0.0')

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

      {/* ── Deployment Optimization Pipeline Cards ───────────────────────── */}
      {optData && (
        <SectionCard title="⚙️ Deployment Optimization Engine" icon="🛠️">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Optimal Installed Capacity</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{optData.optimal_installed_capacity?.toLocaleString()} <span className="text-xs font-normal text-gray-500">kW</span></p>
              <p className="text-[10px] text-gray-400 mt-0.5">Status: <span className="font-bold text-emerald-600">{optData.optimization_status}</span></p>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-3.5">
              <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider">Renewable Mix %</p>
              <p className="text-base font-bold text-gray-900 mt-1">☀️ Solar: {optData.renewable_mix?.solar_pct}%</p>
              <p className="text-base font-bold text-gray-900">💨 Wind: {optData.renewable_mix?.wind_pct}%</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Optimization Score</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{optData.overall_optimization_score} <span className="text-xs font-normal text-gray-400">/100</span></p>
              <p className="text-[10px] text-gray-500 mt-0.5">Feasible: {optData.feasible ? '✅ Yes' : '❌ No'}</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3.5">
              <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider">Constraint Satisfaction</p>
              <p className="text-2xl font-black text-purple-700 mt-1">{optData.constraint_satisfaction_score}%</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Violations: {optData.constraint_violations?.length || 0}</p>
            </div>
          </div>

          {optData.constraint_violations && optData.constraint_violations.length > 0 && optData.constraint_violations[0] !== 'No constraint violations' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
              <p className="font-bold uppercase tracking-wider text-[10px] text-amber-700">Constraint Violations & Alerts:</p>
              {optData.constraint_violations.map((v, i) => (
                <p key={i}>• {v}</p>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Investment Recommendation Module ──────────────────────────────── */}
      {investmentData && (
        <SectionCard title="💰 Investment Recommendation & Financial Metrics" icon="📊">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-[10px] text-emerald-600 font-bold uppercase">CAPEX</p>
              <p className="text-base font-black text-gray-900">${(investmentData.capex / 1000).toFixed(0)}k</p>
            </div>
            <div className="bg-sky-50 rounded-xl p-3">
              <p className="text-[10px] text-sky-600 font-bold uppercase">Annual OPEX</p>
              <p className="text-base font-black text-gray-900">${(investmentData.opex / 1000).toFixed(1)}k</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-[10px] text-amber-600 font-bold uppercase">Annual Revenue</p>
              <p className="text-base font-black text-gray-900">${(investmentData.annual_revenue / 1000).toFixed(0)}k</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-3">
              <p className="text-[10px] text-teal-600 font-bold uppercase">ROI</p>
              <p className="text-base font-black text-emerald-600">{investmentData.roi}%</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3">
              <p className="text-[10px] text-indigo-600 font-bold uppercase">Payback</p>
              <p className="text-base font-black text-gray-900">{investmentData.payback_period} yrs</p>
            </div>
            <div className="bg-violet-50 rounded-xl p-3">
              <p className="text-[10px] text-violet-600 font-bold uppercase">NPV</p>
              <p className="text-base font-black text-gray-900">${(investmentData.npv / 1000).toFixed(0)}k</p>
            </div>
            <div className="bg-cyan-50 rounded-xl p-3">
              <p className="text-[10px] text-cyan-600 font-bold uppercase">IRR</p>
              <p className="text-base font-black text-cyan-700">{investmentData.irr}%</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-[10px] text-purple-600 font-bold uppercase">LCOE</p>
              <p className="text-base font-black text-purple-700">${investmentData.lcoe}/kWh</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-4 gap-3">
            <div>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Final Investment Verdict</p>
              <p className="text-xl font-black mt-0.5 text-white">{investmentData.investment_recommendation}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                investmentData.investment_recommendation === 'Recommended' ? 'bg-emerald-500 text-white' :
                investmentData.investment_recommendation.includes('Conditionally') ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {investmentData.investment_recommendation}
              </span>
              <span className="text-xs text-slate-300 font-semibold">Risk: <strong className="text-amber-300">{investmentData.investment_risk}</strong></span>
            </div>
          </div>
        </SectionCard>
      )}


      {/* ── Energy Estimation Module ────────────────────────────────────────── */}
      <SectionCard title="⚡ Energy Estimation & Hybrid Analysis" icon="🔋">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-700 pb-4 gap-3">
            <div>
              <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Estimated Total Annual Energy</p>
              <p className="text-3xl font-black text-white mt-1">
                {energyEst.total_energy.toLocaleString()} <span className="text-base font-normal text-slate-300">kWh/year</span>
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-right">
              <p className="text-xs text-slate-400">Installed Capacity</p>
              <p className="text-lg font-bold text-emerald-400">{energyEst.installed_capacity} kW</p>
              <p className="text-[10px] text-slate-400">{energyEst.operating_hours} hrs/yr</p>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-3.5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">☀️ Solar Contribution</span>
                <span className="text-xs font-bold text-amber-400">{solarPct}%</span>
              </div>
              <p className="text-xl font-bold text-white">{energyEst.solar_energy.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kWh</span></p>
            </div>

            <div className="bg-cyan-950/40 border border-cyan-800/40 rounded-xl p-3.5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-cyan-300 font-semibold flex items-center gap-1.5">💨 Wind Contribution</span>
                <span className="text-xs font-bold text-cyan-400">{windPct}%</span>
              </div>
              <p className="text-xl font-bold text-white">{energyEst.wind_energy.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kWh</span></p>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3.5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">⚡ Combined Energy</span>
                <span className="text-xs font-bold text-emerald-400">100%</span>
              </div>
              <p className="text-xl font-bold text-white">{energyEst.total_energy.toLocaleString()} <span className="text-xs text-slate-400 font-normal">kWh</span></p>
            </div>
          </div>

          {/* Visual Contribution Bar */}
          <div className="pt-2 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>Resource Split</span>
              <span>Solar: {solarPct}% | Wind: {windPct}%</span>
            </div>
            <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden flex">
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${solarPct}%` }}
                title={`Solar: ${solarPct}%`}
              />
              <div
                className="bg-cyan-400 h-full transition-all duration-500"
                style={{ width: `${windPct}%` }}
                title={`Wind: ${windPct}%`}
              />
            </div>
          </div>
        </div>
      </SectionCard>


      {/* ── Candidate Site Ranking ───────────────────────────────────────── */}
      {ranking && ranking.length > 0 && (
        <SectionCard title="Candidate Site Ranking" icon="🏆">
          <div className="table-wrapper overflow-x-auto">
            <table className="table min-w-[600px] w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-2 px-3">Rank</th>
                  <th className="py-2 px-3">Site Name</th>
                  <th className="py-2 px-3">Overall Score</th>
                  <th className="py-2 px-3">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {ranking.map((site) => (
                  <tr
                    key={site.site_id || site.rank}
                    className={site.is_best ? 'bg-amber-50/80 font-semibold' : 'hover:bg-gray-50'}
                  >
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-extrabold ${site.is_best ? 'bg-amber-400 text-amber-950' : 'bg-gray-200 text-gray-700'}`}>
                        {site.rank}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-gray-900">{site.site_name}</span>
                      {site.region && site.region !== 'N/A' && (
                        <span className="text-xs text-gray-400 ml-2">({site.region})</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-black text-primary-700">{site.overall_score?.toFixed ? site.overall_score.toFixed(1) : site.overall_score}</span>
                      <span className="text-xs text-gray-400 ml-1">/100</span>
                    </td>
                    <td className="py-2.5 px-3">
                      {site.is_best ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-sm">
                          ⭐ Best Recommended Site
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {site.recommendation}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

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
