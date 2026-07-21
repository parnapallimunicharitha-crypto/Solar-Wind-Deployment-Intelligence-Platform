/**
 * Modal — reusable dialog overlay.
 * Usage: <Modal title="..." onClose={() => setOpen(false)}><form>...</form></Modal>
 */
export default function Modal({ title, onClose, children, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'max-w-2xl' : 'max-w-lg'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-box w-full ${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="btn-icon text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
