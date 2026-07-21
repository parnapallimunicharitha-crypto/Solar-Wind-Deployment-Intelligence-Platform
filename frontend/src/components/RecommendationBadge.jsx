/**
 * RecommendationBadge — renders a styled badge for Solar / Wind / Hybrid / Not Recommended.
 */
const CONFIG = {
  Solar:           { cls: 'badge-solar',    icon: '☀️',  label: 'Solar Deployment' },
  Wind:            { cls: 'badge-wind',     icon: '💨',  label: 'Wind Deployment' },
  Hybrid:          { cls: 'badge-hybrid',   icon: '⚡',  label: 'Hybrid Deployment' },
  'Not Recommended': { cls: 'badge-poor',  icon: '⚠️',  label: 'Not Recommended' },
}

export default function RecommendationBadge({ deployment, confidence, reason, large = false }) {
  const cfg = CONFIG[deployment] || CONFIG['Not Recommended']

  if (large) {
    return (
      <div className="flex flex-col items-center text-center gap-3">
        <div className="text-5xl">{cfg.icon}</div>
        <div>
          <span className={`${cfg.cls} text-sm px-4 py-1.5`}>{cfg.label}</span>
          {confidence !== undefined && (
            <p className="text-xs text-gray-500 mt-1">Confidence: {confidence}%</p>
          )}
        </div>
        {reason && <p className="text-sm text-gray-600 max-w-xs">{reason}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">{cfg.icon}</span>
      <span className={cfg.cls}>{cfg.label}</span>
      {confidence !== undefined && (
        <span className="text-xs text-gray-400">{confidence}% confidence</span>
      )}
    </div>
  )
}
