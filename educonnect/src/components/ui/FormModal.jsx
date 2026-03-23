import { Dialog, DialogContent } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {() => void} props.onClose
 * @param {(event: import('react').FormEvent<HTMLFormElement>) => void} props.onSubmit
 * @param {string} [props.submitLabel='Guardar']
 * @param {boolean} [props.loading=false]
 * @param {'sm' | 'md' | 'lg'} [props.maxWidth='sm']
 * @param {import('react').ReactNode} props.children
 */
export default function FormModal({
  open,
  title,
  onClose,
  onSubmit,
  submitLabel = 'Guardar',
  loading = false,
  maxWidth = 'sm',
  children,
}) {
  const handleClose = (_event, reason) => {
    if (loading && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return
    }
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth={maxWidth}
      disableEscapeKeyDown={loading}
      PaperProps={{ className: 'rounded-xl' }}
    >
      <form onSubmit={onSubmit}>
        <DialogContent className="p-0">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-[#0b2545]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Cerrar"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>

          <div className="px-6 py-5">{children}</div>

          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[#0b2545] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#185fa5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitLabel}
            </button>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  )
}
