import EmptyState from './EmptyState'

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
 */
export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'No hay registros',
  emptyAction,
}) {
  const hasRows = Array.isArray(data) && data.length > 0

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
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
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
            ? Array.from({ length: 3 }).map((_, rowIndex) => (
                <tr key={`skeleton-row-${rowIndex}`}>
                  {columns.map((column) => (
                    <td key={`${column.key}-${rowIndex}`} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((row, rowIndex) => (
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
  )
}
