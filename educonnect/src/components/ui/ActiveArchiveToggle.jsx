export default function ActiveArchiveToggle({
  viewMode,
  onChange,
  activeLabel = 'Activos',
  archivedLabel = 'Archivados',
  activeCount,
  archivedCount,
  className = '',
}) {
  const activeText = activeCount === undefined ? activeLabel : `${activeLabel} (${activeCount})`;
  const archivedText =
    archivedCount === undefined ? archivedLabel : `${archivedLabel} (${archivedCount})`;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      <button
        type="button"
        onClick={() => onChange('activos')}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === 'activos'
            ? 'bg-[#185fa5] text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        {activeText}
      </button>
      <button
        type="button"
        onClick={() => onChange('archivados')}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === 'archivados'
            ? 'bg-[#185fa5] text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        {archivedText}
      </button>
    </div>
  );
}
