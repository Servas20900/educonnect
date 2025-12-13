const exportables = [
  { id: 1, nombre: 'Notas 10°A - Q1', tipo: 'CSV', actualizado: '2025-12-10' },
  { id: 2, nombre: 'Actas 11°B - Q1', tipo: 'PDF', actualizado: '2025-12-08' },
  { id: 3, nombre: 'Asistencia 10°B', tipo: 'XLSX', actualizado: '2025-12-05' }
];

export default function Exportaciones() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exportación de Planillas</h2>
          <p className="text-sm text-gray-500">Descarga planillas de notas, actas o asistencia.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Configurar columnas</button>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Exportar</button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/2" placeholder="Buscar planilla" />
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-40">
            <option>Formato</option>
            <option>PDF</option>
            <option>CSV</option>
            <option>XLSX</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Formato</th>
                <th className="px-3 py-2">Actualizado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {exportables.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{e.nombre}</td>
                  <td className="px-3 py-2 text-gray-700">{e.tipo}</td>
                  <td className="px-3 py-2 text-gray-600">{e.actualizado}</td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-800">Descargar</button>
                    <button className="text-gray-700 hover:text-gray-900">Compartir</button>
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
