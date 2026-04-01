const STATUS_STYLES = {
  activo: { backgroundColor: '#EAF3DE', color: '#3B6D11' },
  active: { backgroundColor: '#EAF3DE', color: '#3B6D11' },
  inactivo: { backgroundColor: '#FCEBEB', color: '#A32D2D' },
  inactive: { backgroundColor: '#FCEBEB', color: '#A32D2D' },
  pendiente: { backgroundColor: '#FAEEDA', color: '#854F0B' },
  pending: { backgroundColor: '#FAEEDA', color: '#854F0B' },
  aprobado: { backgroundColor: '#E1F5EE', color: '#085041' },
  approved: { backgroundColor: '#E1F5EE', color: '#085041' },
  borrador: { backgroundColor: '#F1EFE8', color: '#5F5E5A' },
  draft: { backgroundColor: '#F1EFE8', color: '#5F5E5A' },
  'en revision': { backgroundColor: '#E6F1FB', color: '#185FA5' },
  review: { backgroundColor: '#E6F1FB', color: '#185FA5' },
  rechazado: { backgroundColor: '#FCEBEB', color: '#A32D2D' },
  rejected: { backgroundColor: '#FCEBEB', color: '#A32D2D' },
  critico: { backgroundColor: '#FCEBEB', color: '#A32D2D' },
  critical: { backgroundColor: '#FCEBEB', color: '#A32D2D' },
  intermedio: { backgroundColor: '#FAEEDA', color: '#854F0B' },
  warning: { backgroundColor: '#FAEEDA', color: '#854F0B' },
  preventivo: { backgroundColor: '#FAEEDA', color: '#633806' },
  preventive: { backgroundColor: '#FAEEDA', color: '#633806' },
}

const DEFAULT_STYLE = { backgroundColor: '#F1EFE8', color: '#5F5E5A' }

const SIZE_CLASSES = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
}

function normalizeStatus(status) {
  return String(status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * @param {Object} props
 * @param {string} props.status
 * @param {'sm' | 'md'} [props.size='md']
 */
export default function StatusBadge({ status, size = 'md' }) {
  const normalized = normalizeStatus(status)
  const badgeStyle = STATUS_STYLES[normalized] || DEFAULT_STYLE
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClass}`}
      style={badgeStyle}
    >
      {status}
    </span>
  )
}
