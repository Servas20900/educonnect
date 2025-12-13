const calificaciones = [
  { id: 1, estudiante: 'Luis Pérez', evaluacion: 'Examen 1', nota: 85, grupo: '10°A' },
  { id: 2, estudiante: 'María Gómez', evaluacion: 'Examen 1', nota: 93, grupo: '10°A' },
  { id: 3, estudiante: 'Jorge Solano', evaluacion: 'Quiz 2', nota: 74, grupo: '10°B' }
];

export default function Calificaciones() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Calificaciones</h2>
          <p className="text-sm text-gray-500">Registra notas por evaluación y estudiante.</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Nueva nota</button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/3" placeholder="Buscar estudiante" />
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-40">
            <option>Grupo</option>
            <option>10°A</option>
            <option>10°B</option>
          </select>
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-48">
            <option>Evaluación</option>
            <option>Examen 1</option>
            <option>Quiz 2</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Estudiante</th>
                <th className="px-3 py-2">Grupo</th>
                <th className="px-3 py-2">Evaluación</th>
                <th className="px-3 py-2">Nota</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {calificaciones.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{c.estudiante}</td>
                  <td className="px-3 py-2 text-gray-700">{c.grupo}</td>
                  <td className="px-3 py-2 text-gray-700">{c.evaluacion}</td>
                  <td className="px-3 py-2 text-gray-900">{c.nota}</td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-800">Editar</button>
                    <button className="text-red-600 hover:text-red-800">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
