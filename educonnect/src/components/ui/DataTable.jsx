import { useEffect, useMemo, useState } from 'react'
import EmptyState from './EmptyState'

const CONTROL_BUTTON_BASE =
  'rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const CONTROL_BUTTON_PRIMARY = `${CONTROL_BUTTON_BASE} bg-[#185fa5] hover:bg-[#0c447c]`
const CONTROL_BUTTON_SECONDARY = `${CONTROL_BUTTON_BASE} bg-[#0b2545] hover:bg-[#081a31]`

/**
 * @typedef {Object} DataTableColumn
 * @property {string} key
 * @property {string} label
 * @property {(row: Record<string, any>) => import('react').ReactNode} [render]
 */

/**
 * @typedef {Object} EmptyAction
 * @property {string} label
 * @property {() => void} onClick
 */

/**
 * @param {Object} props
 * @param {DataTableColumn[]} props.columns
 * @param {Record<string, any>[]} props.data
 * @param {boolean} [props.loading=false]
 * @param {string} [props.emptyMessage='No hay registros']
 * @param {EmptyAction} [props.emptyAction]
 * @param {number} [props.pageSize=10]
 */
export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'No hay registros',
  emptyAction,
  pageSize = 10,
}) {
  const [currentPage, setCurrentPage] = useState(1)

  const hasRows = Array.isArray(data) && data.length > 0
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))

  useEffect(() => {
    setCurrentPage(1)
  }, [data.length, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedRows = useMemo(() => {
    if (!hasRows) return []
    const startIndex = (currentPage - 1) * pageSize
    return data.slice(startIndex, startIndex + pageSize)
  }, [data, currentPage, pageSize, hasRows])

  if (!loading && !hasRows) {
    return (
      <EmptyState
        title="Sin resultados"
        message={emptyMessage}
        action={emptyAction}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {loading
              ? Array.from({ length: Math.min(3, pageSize) }).map((_, rowIndex) => (
                  <tr key={`skeleton-row-${rowIndex}`}>
                    {columns.map((column) => (
                      <td key={`${column.key}-${rowIndex}`} className="px-4 py-3">
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              : paginatedRows.map((row, rowIndex) => (
                  <tr key={row.id || rowIndex} className="transition-colors hover:bg-[#e6f1fb]">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm text-slate-700">
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!loading && hasRows && data.length > pageSize ? (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Mostrando {Math.min((currentPage - 1) * pageSize + 1, data.length)}-{Math.min(currentPage * pageSize, data.length)} de {data.length}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
              className={CONTROL_BUTTON_SECONDARY}
            >
              Anterior
            </button>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={CONTROL_BUTTON_PRIMARY}
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
