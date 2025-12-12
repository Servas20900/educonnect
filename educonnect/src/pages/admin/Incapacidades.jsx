export default function Incapacidades() {
    const documentosPendientes = [
        { id: 1, nombrePersonal: 'Andrea López', tipo: 'Incapacidad', fechaSubida: '2025-12-08' },
        { id: 2, nombrePersonal: 'Javier Solís', tipo: 'Justificante Médico', fechaSubida: '2025-12-10' },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-700 mb-8 border-b pb-2">
                Registro y Validación de Incapacidades
            </h1>

            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Subir Nuevo Justificante o Incapacidad
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="Nombre del Empleado" className="border border-gray-300 rounded-md p-2 text-sm" />
                        <select className="border border-gray-300 rounded-md p-2 text-sm">
                            <option value="">Tipo de Ausencia</option>
                            <option value="incapacidad">Incapacidad</option>
                            <option value="justificante">Justificante</option>
                        </select>
                        <input
                            type="date"
                            placeholder="Fecha de Inicio"
                            className="border border-gray-300 rounded-md p-2 text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="archivo" className="block text-sm font-medium text-gray-700 mb-1">
                            Adjuntar Archivo de Incapacidad/Justificante
                        </label>
                        <input
                            type="file"
                            id="archivo"
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700">
                            Registrar Ausencia
                        </button>
                    </div>
                </div>
            </section>

            <section className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Documentos Pendientes de Validación
                </h2>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Personal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones de Validación
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {documentosPendientes.map(doc => (
                                <tr key={doc.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {doc.nombrePersonal}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {doc.tipo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                        <button className="text-green-600 hover:text-green-900">
                                            Validar
                                        </button>
                                        <button className="text-red-600 hover:text-red-900">
                                            Rechazar
                                        </button>
                                        <button className="text-blue-600 hover:text-blue-900">
                                            Ver Documento
                                        </button>
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