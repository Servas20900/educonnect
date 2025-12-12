export default function Permisos() {
    const estructuraCarpetas = [
        { id: 1, nombre: 'Circulares Oficiales', permisos: 'Lectura Pública' },
        { id: 2, nombre: 'Plantillas de Oficios', permisos: 'Solo Admin (Write)' },
        { id: 3, nombre: 'Informes Financieros', permisos: 'Órganos Auxiliares' },
    ];
    const rolesDisponibles = ['Administrador', 'Docente', 'Comités', 'Órganos Auxiliares', 'Usuario'];
    const tiposOficio = ['Nombramiento', 'Renuncia', 'Solicitud', 'General'];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-700 mb-8 border-b pb-2">
                Gestión de Repositorios y Documentos
            </h1>

            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Crear y Almacenar Oficios / Plantillas
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Seleccione Tipo de Oficio</option>
                            {tiposOficio.map(tipo => (
                                <option key={tipo} value={tipo}>
                                    {tipo}
                                </option>
                            ))}
                        </select>
                        <input type="text" placeholder="Título del Oficio/Documento" className="col-span-2 border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>

                    <textarea rows="4" placeholder="Contenido o detalles del oficio..." className="block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"></textarea>

                    <div className="flex justify-end pt-2">
                        <button className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                            Generar y Guardar Documento (RF-006)
                        </button>
                    </div>
                </div>
            </section>

            <section className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Estructura de Carpetas y Permisos
                </h2>

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <input type="text" placeholder="Nombre de la Nueva Carpeta" className="flex-grow border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                    <select className="w-full md:w-1/3 border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Permiso por Defecto</option>
                        {rolesDisponibles.map(rol => (
                            <option key={rol} value={rol}>
                                {rol} (Acceso Total)
                            </option>
                        ))}
                    </select>
                    <button className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                        Crear Carpeta (RF-007)
                    </button>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Carpeta
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Permisos
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {estructuraCarpetas.map(carpeta => (
                                <tr key={carpeta.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {carpeta.nombre}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {carpeta.permisos}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                        <button className="text-green-600 hover:text-green-900">
                                            Gestionar Archivos
                                        </button>
                                        <button className="text-red-600 hover:text-red-900">
                                            Editar Permisos
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