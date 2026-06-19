import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

const VARIANTS = {
  success: {
    icon: CheckCircle,
    classes: 'border-green-200 bg-green-50 text-green-800',
    iconClass: 'text-green-500',
  },
  error: {
    icon: XCircle,
    classes: 'border-red-200 bg-red-50 text-red-800',
    iconClass: 'text-red-500',
  },
}

/**
 * @param {Object} props
 * @param {string | null} props.message
 * @param {'success' | 'error'} [props.variant='success']
 * @param {() => void} props.onClose
 * @param {number} [props.duration=3500]
 */
export default function Toast({ message, variant = 'success', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [message, duration, onClose])

  if (!message) return null

  const config = VARIANTS[variant] || VARIANTS.success
  const Icon = config.icon

  return (
    <div className={`fixed bottom-5 right-5 z-[1400] flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all ${config.classes}`}>
      <Icon size={18} className={`mt-0.5 shrink-0 ${config.iconClass}`} />
      <p className="text-sm font-medium leading-snug">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="ml-1 shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
        aria-label="Cerrar"
      >
        <X size={14} />
      </button>
    </div>
  )
}
