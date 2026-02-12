export const RenderAprobar = ({ nombre, onConfirm, onCancel }) => (
    <div className="flex flex-col items-center text-center p-4 space-y-6">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <div>
            <h3 className="text-xl font-bold text-gray-800">Confirmar Aprobación</h3>
            <p className="text-gray-500 mt-2">
                ¿Estás seguro de querer aprobar el horario <span className="font-semibold text-indigo-600">{nombre}</span>? 
                Esta acción notificará a los docentes involucrados.
            </p>
        </div>
        <div className="flex gap-3 w-full">
            <button 
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
                No, cancelar
            </button>
            <button 
                onClick={()=>onConfirm()}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
                Sí, aprobar
            </button>
        </div>
    </div>
);