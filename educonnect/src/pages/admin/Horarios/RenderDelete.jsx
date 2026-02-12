export const RenderDelete = ({ nombre, onCancel, onDelete }) => (
    <div className="flex flex-col items-center text-center p-4 space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
            <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
            </svg>
        </div>
        <div>
            <h3 className="text-xl font-bold text-gray-800">Confirmar Aprobación</h3>
            <p className="text-gray-500 mt-2">
                ¿Estás seguro de querer archivar el horario <span className="font-semibold text-red-600">{nombre}</span>?
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
                onClick={onDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
            >
                Sí, Archivar
            </button>
        </div>
    </div>
);