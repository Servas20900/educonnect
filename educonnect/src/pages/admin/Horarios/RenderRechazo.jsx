import { useState } from "react";

export const RenderRechazo = ({ onConfirm, onCancel }) => {
    const [motivo, setMotivo] = useState(""); 

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                <div className="bg-red-500 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-red-800">Rechazar Planificación</h3>
                    <p className="text-sm text-red-600">Esto devolverá el horario a "Borrador" con los comentarios adjuntos.</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Motivo del Rechazo</label>
                <textarea
                    rows="4"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 focus:bg-white bg-gray-50 transition-all outline-none text-sm text-gray-700 resize-none"
                    placeholder="Ej: El docente tiene un cruce de horario los lunes..."
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
                    disabled={!motivo.trim()} 
                    onClick={() => onConfirm(motivo)} 
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all hover:-translate-y-0.5 disabled:bg-gray-300 disabled:shadow-none"
                >
                    Confirmar Rechazo
                </button>
            </div>
        </div>
    );
};