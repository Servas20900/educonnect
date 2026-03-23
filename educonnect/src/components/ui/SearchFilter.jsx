/**
 * @typedef {Object} FilterOption
 * @property {string} value
 * @property {string} label
 */

/**
 * @typedef {Object} FilterConfig
 * @property {string} key
 * @property {string} label
 * @property {FilterOption[]} options
 */

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {string} [props.placeholder='Buscar...']
 * @param {FilterConfig[]} [props.filters]
 * @param {(payload: { key: string, value: string }) => void} [props.onFilterChange]
 */
export default function SearchFilter({
  value,
  onChange,
  placeholder = 'Buscar...',
  filters,
  onFilterChange,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-slate-500">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>

        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
        />
      </div>

      {filters?.length
        ? filters.map((filter) => (
            <label key={filter.key} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="whitespace-nowrap">{filter.label}</span>
              <select
                defaultValue=""
                onChange={(event) => {
                  if (onFilterChange) {
                    onFilterChange({ key: filter.key, value: event.target.value })
                  }
                }}
                className="min-w-36 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
              >
                <option value="">Todos</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))
        : null}
    </div>
  )
}
