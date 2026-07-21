// MiniChart.jsx — Inline sparkline mini chart using SVG
export default function MiniChart({ data = [], color = '#10b981', height = 36, trend = 'up' }) {
  if (!data || data.length < 2) {
    return <div className="w-full" style={{ height }} />
  }
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 120
  const h = height
  const pad = 2

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `${pad},${h} ` + points + ` ${w - pad},${h}`
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : color

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={trendColor} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#grad-${color.replace('#','')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={trendColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {data.length > 0 && (() => {
        const last = data[data.length - 1]
        const x = w - pad
        const y = h - pad - ((last - min) / range) * (h - pad * 2)
        return <circle cx={x} cy={y} r={2.5} fill={trendColor} />
      })()}
    </svg>
  )
}
