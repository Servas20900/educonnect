export const RenderRechazo = ({ onConfirm, onCancel }) => (
    <div className="space-y-6 p-4">
        <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
            <div className="bg-red-500 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div>
                <h3 className="text-lg font-bold text-red-800">Rechazar Planificación</h3>
                <p className="text-sm text-red-600">Esta acción devolverá el horario a estado "Borrador".</p>
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Motivo del Rechazo</label>
            <textarea
                rows="4"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 focus:bg-white bg-gray-50 transition-all outline-none text-sm text-gray-700 resize-none"
                placeholder="Explique detalladamente por qué no se aprueba este horario (ej: cruce de aulas, docente no disponible...)"
            ></textarea>
        </div>

        <div className="flex gap-3 pt-2">
            <button 
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
            >
                Volver
            </button>
            <button 
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all hover:-translate-y-0.5"
            >
                Confirmar Rechazo
            </button>
        </div>
    </div>
);