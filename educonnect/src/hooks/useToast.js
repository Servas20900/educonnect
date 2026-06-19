import { useCallback, useState } from 'react'

/**
 * Returns { toast, showSuccess, showError, clearToast }
 * toast = { message, variant } | null
 *
 * Usage:
 *   const { toast, showSuccess, showError, clearToast } = useToast()
 *   <Toast message={toast?.message} variant={toast?.variant} onClose={clearToast} />
 */
export default function useToast() {
  const [toast, setToast] = useState(null)

  const showSuccess = useCallback((message) => setToast({ message, variant: 'success' }), [])
  const showError   = useCallback((message) => setToast({ message, variant: 'error' }), [])
  const clearToast  = useCallback(() => setToast(null), [])

  return { toast, showSuccess, showError, clearToast }
}
