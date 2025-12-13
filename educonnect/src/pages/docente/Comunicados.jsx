const comunicados = [
  { id: 1, asunto: 'Entrega de proyecto', destinatarios: '10°A', estado: 'Enviado', fecha: '2025-12-10' },
  { id: 2, asunto: 'Cambio de aula', destinatarios: '11°B', estado: 'Borrador', fecha: '—' },
  { id: 3, asunto: 'Reunión con encargados', destinatarios: '10°A, 10°B', estado: 'Programado', fecha: '2025-12-15' }
];

export default function Comunicados() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Comunicados</h2>
          <p className="text-sm text-gray-500">Envía avisos a estudiantes y encargados.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Plantillas</button>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Nuevo comunicado</button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/3" placeholder="Buscar comunicado" />
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-40">
            <option>Estado</option>
            <option>Enviado</option>
            <option>Programado</option>
            <option>Borrador</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Asunto</th>
                <th className="px-3 py-2">Destinatarios</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comunicados.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{c.asunto}</td>
                  <td className="px-3 py-2 text-gray-700">{c.destinatarios}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${c.estado === 'Enviado' ? 'bg-green-50 text-green-700' : c.estado === 'Programado' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{c.fecha}</td>
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
