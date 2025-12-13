const promedios = [
  { id: 1, grupo: '10°A', semestre: 'I', promedio: 86, riesgo: 'Bajo' },
  { id: 2, grupo: '10°B', semestre: 'I', promedio: 78, riesgo: 'Medio' },
  { id: 3, grupo: '11°A', semestre: 'II', promedio: 81, riesgo: 'Bajo' }
];

export default function Promedios() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Promedios y Estadísticas</h2>
          <p className="text-sm text-gray-500">Resumen de rendimiento por grupo y semestre.</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Exportar</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[{ l: 'Promedio general', v: '82.3' }, { l: 'Grupos en riesgo', v: 2 }, { l: 'Evaluaciones cargadas', v: 24 }].map((s) => (
          <div key={s.l} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{s.l}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-40">
            <option>Semestre</option>
            <option>I</option>
            <option>II</option>
          </select>
          <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/3" placeholder="Filtrar por grupo" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Grupo</th>
                <th className="px-3 py-2">Semestre</th>
                <th className="px-3 py-2">Promedio</th>
                <th className="px-3 py-2">Riesgo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promedios.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{p.grupo}</td>
                  <td className="px-3 py-2 text-gray-700">{p.semestre}</td>
                  <td className="px-3 py-2 text-gray-900">{p.promedio}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${p.riesgo === 'Bajo' ? 'bg-green-50 text-green-700' : p.riesgo === 'Medio' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                      {p.riesgo}
                    </span>
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
