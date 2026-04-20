import { useNavigate } from 'react-router-dom';

/**
 * @typedef {Object} PageHeaderAction
 * @property {string} label
 * @property {() => void} onClick
 * @property {import('react').ReactNode} [icon]
 */

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {PageHeaderAction} [props.action]
 * @param {boolean} [props.showBackButton]
 */
export default function PageHeader({ title, subtitle, action, showBackButton = true }) {
  const navigate = useNavigate();

  return (
    <header className="mb-6 border-b border-slate-200 pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {showBackButton ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-2 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Volver
            </button>
          ) : null}
          <h1 className="text-2xl font-bold text-[#0b2545] sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>

        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#185fa5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0c447c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#185fa5] focus-visible:ring-offset-2"
          >
            {action.icon ? <span className="shrink-0">{action.icon}</span> : null}
            <span>{action.label}</span>
          </button>
        ) : null}
      </div>
    </header>
  )
}
