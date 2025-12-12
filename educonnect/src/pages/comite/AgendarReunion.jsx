export default function AgendarReunion() {
    const miembrosComite = [
        { id: 1, nombre: 'Secretario' },
        { id: 2, nombre: 'Vocal 1' },
        { id: 3, nombre: 'Presidente' },
    ];
    const actasDisponibles = [
        { id: 101, titulo: 'Acta Sesión Ordinaria Dic.' },
        { id: 102, titulo: 'Reporte Trimestral Financiero' },
    ];

    return (
        <div className="p-6 bg-white rounded-lg shadow-md min-h-full">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-2">
                Agendar Reunión y Coordinar Seguimientos
            </h2>

            <form className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de la Reunión
                        </label>
                        <input type="date" id="fecha" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500" />
                    </div>
                    <div>
                        <label htmlFor="hora" className="block text-sm font-medium text-gray-700 mb-1">
                            Hora y Lugar
                        </label>
                        <input type="text" id="hora" placeholder="Ej: 10:00 AM / Sala de Juntas" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500" />
                    </div>
                </div>

                <div>
                    <label htmlFor="asistentes" className="block text-sm font-medium text-gray-700 mb-1">
                        Seleccionar Asistentes
                    </label>
                    <select
                        id="asistentes"
                        multiple
                        className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm h-32"
                    >
                        {miembrosComite.map(miembro => (
                            <option key={miembro.id} value={miembro.id}>
                                {miembro.nombre}
                            </option>
                        ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-500">Mantenga Ctrl (o Cmd) presionado para seleccionar múltiples.</p>
                </div>
                <div>
                    <label htmlFor="actas" className="block text-sm font-medium text-gray-700 mb-1">
                        Adjuntar Actas o Documentos Relacionados
                    </label>
                    <select
                        id="actas"
                        multiple
                        className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm h-24"
                    >
                        {actasDisponibles.map(acta => (
                            <option key={acta.id} value={acta.id}>
                                {acta.titulo}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                        Registrar Reunión y Enviar Notificaciones
                    </button>
                </div>
            </form>
        </div>
    );
};

