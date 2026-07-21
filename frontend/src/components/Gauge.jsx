/**
 * Gauge — a beautiful, highly customized circular progress gauge.
 * Perfect for Material, Azure, or Cloud Console themed suitability scoring.
 *
 * Props:
 *   value    — score from 0 to 100
 *   label    — display label below score (e.g. "Suitability Score")
 *   category — suitability text (e.g. "Excellent")
 */
export default function Gauge({ value, label = 'Suitability Score', category = 'Moderately Suitable' }) {
  const score = Math.min(100, Math.max(0, value))
  const radius = 50
  const strokeWidth = 10
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (score / 100) * circumference

  // Color selection based on score
  let strokeColor = 'stroke-red-500' // low
  let bgColor = 'bg-red-50 text-red-700 border-red-100'
  if (score >= 85) {
    strokeColor = 'stroke-emerald-500'
    bgColor = 'bg-emerald-50 text-emerald-700 border-emerald-100'
  } else if (score >= 70) {
    strokeColor = 'stroke-sky-500'
    bgColor = 'bg-sky-50 text-sky-700 border-sky-100'
  } else if (score >= 50) {
    strokeColor = 'stroke-amber-500'
    bgColor = 'bg-amber-50 text-amber-700 border-amber-100'
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 card border border-gray-100/60 bg-white/80 backdrop-blur-sm animate-scale-in">
      <div className="relative flex items-center justify-center w-36 h-36">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          {/* Base background circle */}
          <circle
            className="text-gray-100 stroke-current"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={normalizedRadius}
            cx={50}
            cy={50}
          />
          {/* Filled progress circle */}
          <circle
            className={`${strokeColor} stroke-current transition-all duration-1000 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={50}
            cy={50}
          />
        </svg>

        {/* Text values in center */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none">
            {score.toFixed(1)}
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            % Score
          </span>
        </div>
      </div>

      <div className="text-center mt-3 space-y-1.5">
        <span className={`inline-block border text-[11px] font-bold px-3 py-0.5 rounded-full ${bgColor}`}>
          {category}
        </span>
        <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase">{label}</p>
      </div>
    </div>
  )
}
