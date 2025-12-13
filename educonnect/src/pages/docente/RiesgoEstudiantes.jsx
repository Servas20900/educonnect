const riesgos = [
  { id: 1, nombre: 'Luis Pérez', grupo: '10°A', causa: 'Baja nota', nivel: 'Alto' },
  { id: 2, nombre: 'María Gómez', grupo: '10°A', causa: 'Inasistencias', nivel: 'Medio' },
  { id: 3, nombre: 'Jorge Solano', grupo: '10°B', causa: 'Baja nota', nivel: 'Bajo' }
];

export default function RiesgoEstudiantes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estudiantes en Riesgo</h2>
          <p className="text-sm text-gray-500">Identifica estudiantes con riesgo académico o por asistencia.</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Generar plan</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[{ l: 'En riesgo alto', v: 4 }, { l: 'En riesgo medio', v: 6 }, { l: 'Alertas nuevas', v: 3 }].map((s) => (
          <div key={s.l} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{s.l}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/2" placeholder="Buscar estudiante" />
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-40">
            <option>Nivel de riesgo</option>
            <option>Alto</option>
            <option>Medio</option>
            <option>Bajo</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Estudiante</th>
                <th className="px-3 py-2">Grupo</th>
                <th className="px-3 py-2">Causa</th>
                <th className="px-3 py-2">Nivel</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {riesgos.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{r.nombre}</td>
                  <td className="px-3 py-2 text-gray-700">{r.grupo}</td>
                  <td className="px-3 py-2 text-gray-700">{r.causa}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${r.nivel === 'Alto' ? 'bg-red-50 text-red-700' : r.nivel === 'Medio' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                      {r.nivel}
                    </span>
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-800">Ver detalle</button>
                    <button className="text-green-600 hover:text-green-800">Crear plan</button>
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
