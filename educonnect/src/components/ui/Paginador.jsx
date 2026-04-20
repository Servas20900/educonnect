import { useState, useMemo, useEffect } from 'react';

const CONTROL_BUTTON_BASE =
    'rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const Paginador = ({ items, itemsPorPagina = 5, children }) => {
    const safeItems = Array.isArray(items) ? items : [];
    const [paginaActual, setPaginaActual] = useState(1);

    useEffect(() => {
        setPaginaActual(1);
    }, [safeItems.length, itemsPorPagina]);

    const totalPaginas = Math.max(1, Math.ceil(safeItems.length / itemsPorPagina));

    const itemsPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * itemsPorPagina;
        return safeItems.slice(inicio, inicio + itemsPorPagina);
    }, [safeItems, paginaActual, itemsPorPagina]);

    return (
        <div className="flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            {children(itemsPaginados)}

            {safeItems.length > itemsPorPagina && (
                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Mostrando {(paginaActual - 1) * itemsPorPagina + 1}-{Math.min(paginaActual * itemsPorPagina, safeItems.length)} de {safeItems.length}
                    </span>
                    
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={paginaActual === 1}
                            onClick={() => setPaginaActual(p => p - 1)}
                            className={`${CONTROL_BUTTON_BASE} bg-[#0b2545] hover:bg-[#081a31]`}
                        >
                            Anterior
                        </button>
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Página {paginaActual} de {totalPaginas}
                        </span>
                        
                        <button
                            type="button"
                            disabled={paginaActual === totalPaginas}
                            onClick={() => setPaginaActual(p => p + 1)}
                            className={`${CONTROL_BUTTON_BASE} bg-[#185fa5] hover:bg-[#0c447c]`}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Paginador;