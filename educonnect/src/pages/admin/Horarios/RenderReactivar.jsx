export const RenderReactivar = ({ nombre, onConfirm, onCancel }) => (
    <div className="flex flex-col items-center text-center p-6 space-y-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg 
                className="w-8 h-8 text-emerald-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
            </svg>
        </div>

        <div>
            <h3 className="text-xl font-bold text-gray-800">Reactivar Horario</h3>
            <p className="text-gray-500 mt-2 max-w-sm">
                ¿Deseas restaurar el horario <span className="font-semibold text-emerald-600">{nombre}</span>? 
                Al reactivarlo, volverá a estar disponible para su publicación.
            </p>
        </div>

        <div className="flex gap-3 w-full">
            <button 
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={() => onConfirm("Reactivado por administración")}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all"
            >
                Confirmar Reactivación
            </button>
        </div>
    </div>
);