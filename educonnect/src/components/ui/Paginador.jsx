import { useState, useMemo, useEffect } from "react";

const Paginador = ({ items, itemsPorPagina = 5, children }) => {
    const [paginaActual, setPaginaActual] = useState(1);

    useEffect(() => {
        setPaginaActual(1);
    }, [items.length]);

    const totalPaginas = Math.ceil(items.length / itemsPorPagina);

    const itemsPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * itemsPorPagina;
        return items.slice(inicio, inicio + itemsPorPagina);
    }, [items, paginaActual, itemsPorPagina]);

    return (
        <div className="flex flex-col w-full">
            {children(itemsPaginados)}

            {items.length > itemsPorPagina && (
                <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Página {paginaActual} de {totalPaginas}
                    </span>
                    
                    <div className="flex gap-2">
                        <button
                            disabled={paginaActual === 1}
                            onClick={() => setPaginaActual(p => p - 1)}
                            className="px-4 py-2 text-[11px] font-black text-gray-500 bg-white border border-gray-200 rounded-xl disabled:opacity-40 transition-all shadow-sm"
                        >
                            ANTERIOR
                        </button>
                        
                        <button
                            disabled={paginaActual === totalPaginas}
                            onClick={() => setPaginaActual(p => p + 1)}
                            className="px-4 py-2 text-[11px] font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-lg shadow-indigo-100"
                        >
                            SIGUIENTE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Paginador;