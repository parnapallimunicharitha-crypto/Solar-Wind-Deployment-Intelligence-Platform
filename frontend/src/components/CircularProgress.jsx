// CircularProgress.jsx — Circular score indicator with gradient ring
export default function CircularProgress({ value = 0, max = 100, label = '', size = 100, strokeWidth = 8, color = '#10b981' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(Math.max(value / max, 0), 1)
  const offset = circumference * (1 - pct)

  const getCategory = (v) => {
    if (v >= 85) return { label: 'Excellent', color: '#10b981' }
    if (v >= 70) return { label: 'Good',      color: '#3b82f6' }
    if (v >= 50) return { label: 'Moderate',  color: '#f59e0b' }
    return                { label: 'Poor',     color: '#ef4444' }
  }

  const cat = getCategory(value)
  const ringColor = color || cat.color

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={ringColor} strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black text-gray-900 leading-none">{Math.round(value)}</span>
          <span className="text-[9px] text-gray-400 font-medium">/{max}</span>
        </div>
      </div>
      {label && <p className="text-xs font-semibold text-gray-600 text-center leading-tight">{label}</p>}
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ringColor + '22', color: ringColor }}>
        {cat.label}
      </span>
    </div>
  )
}
