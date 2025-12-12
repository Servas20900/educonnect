export default function Comites() {
    const comitesExistentes = [
        { id: 1, nombre: 'Comité de Evaluación', miembros: 5 },
        { id: 2, nombre: 'Comité de Ética', miembros: 3 },
    ];
    const personalDisponible = ['Ana Solano (Docente)', 'Luis Mena (Admin)', 'Sofía Castro (Docente)'];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-700 mb-8 border-b pb-2">
                Creación y Gestión de Comités
            </h1>

            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Crear Nuevo Comité
                </h2>
                <div className="space-y-4">

                    <input type="text" placeholder="Nombre del Comité" className="block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-teal-500 focus:border-teal-500" />

                    <textarea rows="3" placeholder="Definir descripción y propósito del comité..." className="block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-teal-500 focus:border-teal-500"></textarea>

                    <div>
                        <label htmlFor="miembros" className="block text-sm font-medium text-gray-700 mb-1">
                            Agregar Miembros
                        </label>
                        <select
                            id="miembros"
                            multiple
                            className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md shadow-sm h-28"
                        >
                            {personalDisponible.map(persona => (
                                <option key={persona} value={persona}>
                                    {persona}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700">
                            Registrar Comité
                        </button>
                    </div>
                </div>
            </section>
            <section className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Listado de Comités
                </h2>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Miembros
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {comitesExistentes.map(comite => (
                                <tr key={comite.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {comite.nombre}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {comite.miembros}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                        <button className="text-teal-600 hover:text-teal-900">
                                            Editar Estructura
                                        </button>
                                        <button className="text-red-600 hover:text-red-900">
                                            Eliminar Comité
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