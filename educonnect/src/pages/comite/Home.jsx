export default function Home() {
    const miembrosActivos = [
        { id: 1, nombre: 'Ana Rojas', rolInterno: 'Presidente' },
        { id: 2, nombre: 'Marco Soto', rolInterno: 'Secretario' },
        { id: 3, nombre: 'Elena Mora', rolInterno: 'Vocal' },
        { id: 4, nombre: 'Carlos Guzmán', rolInterno: 'Ninguno' },
    ];

    const rolesDisponibles = ['Presidente', 'Secretario', 'Vocal', 'Ninguno'];

    return (
        <div className="p-6 bg-white rounded-lg shadow-md min-h-full">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-2">
                Gestión de Roles Internos del Comité
            </h2>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Miembro
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rol Actual
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Asignar Nuevo Rol
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/*Aca se hara un map de cada circular enviada desde el backend */}
                        {miembrosActivos.map(miembro => (
                            <tr key={miembro.id} className="hover:bg-purple-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {miembro.nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${miembro.rolInterno === 'Presidente' ? 'bg-red-100 text-red-800' : miembro.rolInterno === 'Secretario' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {miembro.rolInterno}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex items-center space-x-3">
                                        <select className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-purple-500 focus:border-purple-500">
                                            {/*Aca se hara un map de cada circular enviada desde el backend */}
                                            {rolesDisponibles.map(rol => (
                                                <option key={rol} value={rol}>
                                                    {rol}
                                                </option>
                                            ))}
                                        </select>
                                        <button className="px-3 py-2 text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                                            Guardar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 p-4 bg-gray-50 border-l-4 border-gray-400">
                <p className="text-sm text-gray-600">
                    Los roles internos deben ser asignados para definir responsabilidades dentro del comité.
                </p>
            </div>
        </div>
    );
}