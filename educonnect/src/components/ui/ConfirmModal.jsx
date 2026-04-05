import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'

const VARIANT_CONFIG = {
  danger: {
    icon: DeleteOutlineIcon,
    iconClasses: 'bg-red-100 text-red-700',
    confirmButtonClasses:
      'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400',
  },
  warning: {
    icon: WarningAmberOutlinedIcon,
    iconClasses: 'bg-amber-100 text-amber-700',
    confirmButtonClasses:
      'bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-400',
  },
  info: {
    icon: InfoOutlinedIcon,
    iconClasses: 'bg-[#e6f1fb] text-[#185fa5]',
    confirmButtonClasses:
      'bg-[#185fa5] text-white hover:bg-[#0b2545] focus-visible:ring-[#378add]',
  },
}

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {import('react').ReactNode} props.message
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 * @param {string} [props.confirmLabel='Confirmar']
 * @param {string} [props.cancelLabel='Cancelar']
 * @param {'danger' | 'warning' | 'info'} [props.variant='danger']
 * @param {boolean} [props.loading=false]
 */
export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}) {
  const currentVariant = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger
  const Icon = currentVariant.icon

  const handleClose = () => {
    if (!loading) {
      onCancel()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ className: 'overflow-hidden rounded-2xl shadow-xl' }}
      slotProps={{
        backdrop: {
          className: 'bg-slate-900/40 backdrop-blur-[2px]',
        },
      }}
    >
      <DialogTitle className="sr-only">{title}</DialogTitle>

      <DialogContent className="px-5 pb-5 pt-8 sm:px-6 sm:pb-6 sm:pt-9">
        <div className="flex flex-col items-center text-center">
          <div className={`mb-5 mt-1 rounded-full p-3.5 ${currentVariant.iconClasses}`}>
            <Icon fontSize="small" />
          </div>

          <h2 className="text-lg font-semibold leading-tight text-slate-900">{title}</h2>
          <div className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{message}</div>

          <div className="mt-6 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`inline-flex min-w-28 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${currentVariant.confirmButtonClasses}`}
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : confirmLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
