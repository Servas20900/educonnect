export default function RegistroAsistencia() {
    const listaEstudiantes = [
        { id: 101, nombre: 'Arias, Laura', estado: 'presente' },
        { id: 102, nombre: 'Castro, Daniel', estado: 'ausente' },
        { id: 103, nombre: 'Mora, Sofía', estado: 'presente' },
    ];

    return (
        <div className="p-6 bg-white rounded-lg shadow-md mt-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-2">
                Registro de Asistencia (Diaria)
            </h2>

            <div className="mb-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Hacerlo dinamico */}
                <div className="text-lg font-medium text-gray-800">
                    Grupo: 10-1 | Fecha: Jueves, 11 de Dic.
                </div>
                <button className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    Guardar Asistencia
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estudiante
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Marcar
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Justificar Falta (Opcional)
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {listaEstudiantes.map(estudiante => (
                            <tr key={estudiante.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {estudiante.nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex space-x-4">
                                        <label className="inline-flex items-center">
                                            <input type="radio" name={`asistencia-${estudiante.id}`} value="presente" defaultChecked={estudiante.estado === 'presente'} className="form-radio text-green-600 h-4 w-4" />
                                            <span className="ml-2 text-green-600">Presente</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input type="radio" name={`asistencia-${estudiante.id}`} value="ausente" defaultChecked={estudiante.estado === 'ausente'} className="form-radio text-red-600 h-4 w-4" />
                                            <span className="ml-2 text-red-600">Ausente</span>
                                        </label>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <input
                                        type="file"
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-end">
                <button className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    Finalizar Registro Diario
                </button>
            </div>
        </div>
    );
};
