/**
 * MetricCard — displays a single metric value with icon, label, unit, and optional progress bar.
 *
 * Props:
 *   label    — display label
 *   value    — numeric or string value
 *   unit     — unit suffix (e.g. "kWh/m²/day")
 *   icon     — emoji or JSX icon
 *   gradient — CSS gradient class name (e.g. "grad-solar")
 *   progress — 0-100 value for progress bar (optional)
 *   sub      — sub-label text below value
 */
export default function MetricCard({ label, value, unit = '', icon, gradient = 'grad-green', progress, sub }) {
  const displayValue = value !== undefined && value !== null
    ? (typeof value === 'number' ? value.toFixed(typeof value === 'number' && value % 1 === 0 ? 0 : 2) : value)
    : '—'

  return (
    <div className={`card-gradient ${gradient} animate-fade-in`}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-3xl">{icon}</div>
        {progress !== undefined && (
          <span className="text-white/80 text-xs font-semibold">{Math.round(progress)}%</span>
        )}
      </div>

      <div className="mt-1">
        <p className="text-4xl font-extrabold text-white leading-none">
          {displayValue}
          {unit && <span className="text-lg font-medium ml-1 text-white/70">{unit}</span>}
        </p>
        <p className="text-white/80 text-sm font-medium mt-1">{label}</p>
        {sub && <p className="text-white/60 text-xs mt-0.5">{sub}</p>}
      </div>

      {progress !== undefined && (
        <div className="progress-bar mt-3 bg-white/20">
          <div
            className="progress-fill bg-white/60"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  )
}
