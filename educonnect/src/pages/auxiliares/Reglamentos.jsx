const reglamentos = [
  { id: 1, titulo: 'Reglamento interno 2025', fecha: '2025-10-01', estado: 'Vigente' },
  { id: 2, titulo: 'Política de seguridad', fecha: '2025-11-15', estado: 'Borrador' }
];

export default function Reglamentos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reglamentos y Resoluciones</h2>
          <p className="text-sm text-gray-500">Repositorio de reglamentos oficiales y resoluciones.</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Subir documento</button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/2" placeholder="Buscar reglamento" />
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-40">
            <option>Estado</option>
            <option>Vigente</option>
            <option>Borrador</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Título</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reglamentos.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{r.titulo}</td>
                  <td className="px-3 py-2 text-gray-700">{r.fecha}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${r.estado === 'Vigente' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-800">Ver</button>
                    <button className="text-gray-700 hover:text-gray-900">Descargar</button>
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
