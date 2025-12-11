export default function Reportes() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-2">
        Módulo de Reportes y Auditoría
      </h2>

      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Generación de Reportes Institucionales
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition duration-200">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Reporte de Uso del Sistema (RF-010)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Consulta la actividad de usuarios y módulos.
            </p>
            <button
              className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              Generar Reporte
            </button>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition duration-200">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Reporte de Cumplimiento (RF-029)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Generar reporte para rendición de cuentas a instancias externas.
            </p>
            <button
              className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Descargar/Enviar
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Logs de Auditoría y Trazabilidad (RF-036)
        </h2>

        <div className="mb-4 flex space-x-4">
          <input
            type="date"
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
          <input
            type="text"
            placeholder="Filtrar por usuario o acción sensible..."
            className="border border-gray-300 rounded-md p-2 text-sm flex-grow"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción Auditada
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/*Aca se hara un map de cada circular enviada desde el backend */}
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  2025-12-10 10:30:00
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  admin@example.com
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Creación de rol "Auxiliar"
                </td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  2025-12-10 09:15:00
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  docente1@example.com
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Intento de acceso fallido
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button
          className="mt-4 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-100"
        >
          Exportar Histórico
        </button>
      </section>
    </div>
  );
};

