const reportes = [
  { id: 1, nombre: 'Cumplimiento Q3', destino: 'MEP', estado: 'Enviado', fecha: '2025-11-28' },
  { id: 2, nombre: 'Cumplimiento Q4', destino: 'MEP', estado: 'Borrador', fecha: '—' }
];

export default function ReportesCumplimiento() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reportes de Cumplimiento</h2>
          <p className="text-sm text-gray-500">Genera y envía reportes a instancias externas.</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Nuevo reporte</button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Destino</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportes.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{r.nombre}</td>
                  <td className="px-3 py-2 text-gray-700">{r.destino}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${r.estado === 'Enviado' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{r.fecha}</td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-800">Ver</button>
                    <button className="text-green-600 hover:text-green-800">Enviar</button>
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
