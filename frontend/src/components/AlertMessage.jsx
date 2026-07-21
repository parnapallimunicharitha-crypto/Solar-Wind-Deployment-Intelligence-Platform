export default function AlertMessage({ type = 'error', message }) {
  if (!message) return null
  const styles = {
    error:   'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info:    'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
  }
  const icons = { error: '⚠️', success: '✅', info: 'ℹ️', warning: '⚡' }
  return (
    <div className={`border rounded-xl px-4 py-3 flex items-center gap-2 text-sm ${styles[type]}`}>
      <span>{icons[type]}</span>
      <span>{message}</span>
    </div>
  )
}
