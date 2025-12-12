export default function Seguridad() {
    const frecuenciaBackup = ['Diario', 'Semanal', 'Mensual'];
    const politicasRetencion = [
        { id: 1, tipo: 'Logs de Auditoría', retencion: '1 año', accion: 'Archivado' },
        { id: 2, tipo: 'Calificaciones Antiguas', retencion: '5 años', accion: 'Borrado' },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-red-700 mb-8 border-b pb-2">
                Gestión de Backups y Retención de Datos
            </h1>
            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Generar y Programar Backups
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <button className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 md:col-span-1">
                        Solicitar Backup Manual
                    </button>

                    <select className="border border-gray-300 rounded-md p-2 text-sm">
                        <option value="">Programar Ejecución Automática </option>
                        {frecuenciaBackup.map(frecuencia => (
                            <option key={frecuencia} value={frecuencia}>
                                {frecuencia}
                            </option>
                        ))}
                    </select>

                    <button className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                        Guardar Programación
                    </button>
                </div>
            </section>
            <section className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Políticas de Retención de Datos
                </h2>

                <div className="flex flex-col md:flex-row gap-4 mb-4 p-4 border rounded-lg bg-gray-50">
                    <input type="text" placeholder="Tipo de Dato (Ej: Circulares Antiguas)" className="flex-grow border border-gray-300 rounded-md p-2 text-sm" />
                    <input type="number" placeholder="Tiempo (Años)" className="w-24 border border-gray-300 rounded-md p-2 text-sm" />
                    <select className="w-full md:w-1/4 border border-gray-300 rounded-md p-2 text-sm">
                        <option value="">Acción</option>
                        <option value="archivo">Archivado Automático</option>
                        <option value="borrado">Borrado Automático</option>
                    </select>
                    <button className="px-6 py-2 text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700">
                        Aplicar Política
                    </button>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dato
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tiempo de Retención
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acción Automática
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {politicasRetencion.map(politica => (
                                <tr key={politica.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {politica.tipo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {politica.retencion}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {politica.accion}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};