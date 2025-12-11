import FormularioCircular from './HelperComponents/FormularioCircular';

export default function CircularesList() {
  const circularesExistentes = [
    { id: 1, titulo: 'Circular de Vacaciones', estado: 'Publicado', programada: 'N/A' },
    { id: 2, titulo: 'Comunicado de Junta', estado: 'Borrador', programada: '2026-01-15 ' },
    { id: 3, titulo: 'Oficio Interno de Prueba', estado: 'Archivado', programada: 'N/A' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-3xl font-bold text-grey-700">
          Gestión de Circulares 
        </h2>
        <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Crear Circular 
        </button>
      </div>

      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <FormularioCircular />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Publicación Programada 
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/*Aca se hara un map de cada circular enviada desde el backend */}
            {circularesExistentes.map((circular) => (
              <tr key={circular.id} className="hover:bg-gray-100">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {circular.titulo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${circular.estado === 'Publicado' ? 'bg-green-100 text-green-800' : circular.estado === 'Borrador' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    {circular.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {circular.programada}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                  <button className="text-indigo-600 hover:text-indigo-900">
                    Editar
                  </button>
                  {circular.estado !== 'Publicado' && (
                    <button className="text-green-600 hover:text-green-900">
                      Publicar 
                    </button>
                  )}
                  {circular.estado !== 'Archivado' && (
                    <button className="text-orange-600 hover:text-orange-900">
                      Archivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

