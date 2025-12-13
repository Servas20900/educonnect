const informes = [
  { id: 1, titulo: 'Informe PAT 2025 Q3', fecha: '2025-11-30', estado: 'Publicado' },
  { id: 2, titulo: 'Informe PAT 2025 Q4', fecha: '—', estado: 'Borrador' }
];

export default function InformesPAT() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Informes PAT</h2>
          <p className="text-sm text-gray-500">Consulta informes PAT y su seguimiento.</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Subir informe</button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
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
              {informes.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{i.titulo}</td>
                  <td className="px-3 py-2 text-gray-700">{i.fecha}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${i.estado === 'Publicado' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {i.estado}
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
