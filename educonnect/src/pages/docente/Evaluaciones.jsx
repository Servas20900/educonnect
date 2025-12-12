export default function GestionEvaluaciones () {
  const evaluacionesSimuladas = [
    { id: 1, nombre: 'Primer Examen', ponderacion: 30, fecha: '2025-12-15' },
    { id: 2, nombre: 'Tarea Corta #1', ponderacion: 10, fecha: '2025-11-20' },
  ];
  
  const estudiantesSimulados = [
    { id: 10, nombre: 'Estudiante A', nota: 85 },
    { id: 20, nombre: 'Estudiante B', nota: 92 },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-2">
        Gestión de Evaluaciones y Calificaciones
      </h2>
      <section className="mb-8">
        <h3 className="text-xl font-medium text-gray-800 mb-4">
          Evaluaciones del Curso
        </h3>
        
        <div className="flex flex-wrap items-end gap-4 p-4 border rounded-md bg-gray-50 mb-6">
          <input 
            type="text" 
            placeholder="Nombre de la Evaluación"
            className="flex-grow border border-gray-300 rounded-md p-2 text-sm"
          />
          <input 
            type="number" 
            placeholder="Ponderación (%)"
            className="w-24 border border-gray-300 rounded-md p-2 text-sm"
          />
          <input 
            type="date" 
            className="w-36 border border-gray-300 rounded-md p-2 text-sm"
          />
          <button className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
            Crear Evaluación
          </button>
        </div>

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
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evaluacionesSimuladas.map(evaluacion => (
                <tr key={evaluacion.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {evaluacion.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {evaluacion.ponderacion}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button className="text-red-600 hover:text-red-900">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 pt-4 border-t">
        <h3 className="text-xl font-medium text-gray-800 mb-4">
          Ingreso de Calificaciones (Seleccionar Evaluación)
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nota (RF-016)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio Actual (RF-017)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {estudiantesSimulados.map(estudiante => (
                <tr key={estudiante.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {estudiante.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <input 
                      type="number" 
                      defaultValue={estudiante.nota}
                      className="w-20 border border-gray-300 rounded-md p-1 text-sm text-center focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">
                    90.5
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Guardar Calificaciones
          </button>
        </div>
      </section>
    </div>
  );
};
