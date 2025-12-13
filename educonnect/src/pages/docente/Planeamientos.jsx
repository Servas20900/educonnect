const planes = [
  { id: 1, titulo: 'Planeamiento Q1', estado: 'En revisión', enviado: '2025-12-05', comentarios: 2 },
  { id: 2, titulo: 'Planeamiento Q2', estado: 'Aprobado', enviado: '2025-10-01', comentarios: 1 },
  { id: 3, titulo: 'Planeamiento Q3', estado: 'Borrador', enviado: '—', comentarios: 0 }
];

export default function Planeamientos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planeamientos Académicos</h2>
          <p className="text-sm text-gray-500">Carga tus planeamientos y monitorea estado y comentarios.</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Subir plan</button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/2" placeholder="Buscar planeamiento" />
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-40">
            <option>Estado</option>
            <option>Aprobado</option>
            <option>En revisión</option>
            <option>Borrador</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Título</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Enviado</th>
                <th className="px-3 py-2">Comentarios</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {planes.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{p.titulo}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${p.estado === 'Aprobado' ? 'bg-green-50 text-green-700' : p.estado === 'En revisión' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{p.enviado}</td>
                  <td className="px-3 py-2 text-gray-700">{p.comentarios}</td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-800">Ver</button>
                    <button className="text-green-600 hover:text-green-800">Enviar</button>
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
