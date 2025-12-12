export default function Home() {
  const evaluacionesRecientes = [
    { id: 1, nombre: 'Examen de Español', ponderacion: 30, notaObtenida: 88, promedioGrupo: 85 },
    { id: 2, nombre: 'Tarea de Ciencias', ponderacion: 10, notaObtenida: 95, promedioGrupo: 90 },
    { id: 3, nombre: 'Proyecto de Matemáticas', ponderacion: 40, notaObtenida: 75, promedioGrupo: 80 },
  ];

  const promedioGeneral = 86.5;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-700 mb-8 border-b pb-2">
        Mi Rendimiento Académico
      </h1>

      <div className="mb-8 p-6 bg-white rounded-lg shadow-xl border-t-4 border-teal-500">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Promedio General del Periodo
        </h2>
        <p className="text-5xl font-extrabold text-teal-600">
          {promedioGeneral}%
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Calculado automáticamente con base en las evaluaciones registradas.
        </p>
      </div>

      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Detalle de Evaluaciones Recientes
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evaluación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ponderación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nota Obtenida
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio del Grupo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evaluacionesRecientes.map(evaluacion => (
                <tr key={evaluacion.id} className="hover:bg-teal-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {evaluacion.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {evaluacion.ponderacion}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg font-bold">
                    {evaluacion.notaObtenida}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {evaluacion.promedioGrupo}%
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