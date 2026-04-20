/**
 * @typedef {Object} EmptyStateAction
 * @property {string} label
 * @property {() => void} onClick
 */

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.message]
 * @param {EmptyStateAction} [props.action]
 * @param {import('react').ReactNode} [props.icon]
 */
export default function EmptyState({ title, message, action, icon }) {
  return (
    <div className="flex min-h-[260px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white p-6">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-500">
          {icon || (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M3.75 7.5A2.25 2.25 0 0 1 6 5.25h4.19a2.25 2.25 0 0 1 1.59.66l1.31 1.31c.42.42.99.66 1.59.66H18a2.25 2.25 0 0 1 2.25 2.25v6A2.25 2.25 0 0 1 18 18.75H6a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
              <path d="M8.25 12.75h7.5" />
            </svg>
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {message ? <p className="mt-1 text-sm text-slate-600">{message}</p> : null}

        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-5 rounded-md bg-[#185fa5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0c447c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#185fa5] focus-visible:ring-offset-2"
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </div>
  )
}
