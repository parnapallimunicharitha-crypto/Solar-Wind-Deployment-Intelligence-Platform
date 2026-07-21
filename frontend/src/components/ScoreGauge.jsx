export default function ScoreGauge({ score, label, category }) {
  const pct = Math.min(100, Math.max(0, score ?? 0))

  const getColor = () => {
    if (pct >= 85) return '#22c55e'
    if (pct >= 70) return '#3b82f6'
    if (pct >= 55) return '#f59e0b'
    if (pct >= 40) return '#f97316'
    return '#ef4444'
  }

  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference * (1 - pct / 100)

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke={getColor()}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="50" y="54" textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">
          {Math.round(pct)}
        </text>
      </svg>
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      {category && (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          pct >= 85 ? 'bg-green-100 text-green-700' :
          pct >= 70 ? 'bg-blue-100 text-blue-700' :
          pct >= 55 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {category}
        </span>
      )}
    </div>
  )
}
