const ConsultaHorarios = () => {
    const horariosSimulados = [
        { id: 1, curso: 'Matemáticas', docente: 'Pérez', dia: 'Lunes', hora: '7:00 AM' },
        { id: 2, curso: 'Español', docente: 'Rodríguez', dia: 'Lunes', hora: '9:00 AM' },
        { id: 3, curso: 'Ciencias', docente: 'González', dia: 'Martes', hora: '8:00 AM' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="selectDocente" className="block text-sm font-medium text-gray-700 mb-1">
                        Filtrar por Docente
                    </label>
                    <select
                        id="selectDocente"
                        className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md shadow-sm"
                    >
                        <option value="">Seleccione un docente...</option>
                        <option value="perez">Pérez</option>
                        <option value="rodriguez">Rodríguez</option>
                    </select>
                </div>

                <div className="flex-1">
                    <label htmlFor="selectCurso" className="block text-sm font-medium text-gray-700 mb-1">
                        Filtrar por Curso
                    </label>
                    <select
                        id="selectCurso"
                        className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md shadow-sm"
                    >
                        <option value="">Seleccione un curso...</option>
                        <option value="mat">Matemáticas</option>
                        <option value="esp">Español</option>
                    </select>
                </div>
            </div>

            <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Día
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hora
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Curso
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Docente
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {horariosSimulados.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.dia}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.hora}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.curso}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.docente}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ConsultaHorarios;