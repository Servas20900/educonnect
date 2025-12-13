const pendientes = [
  { id: 1, nombre: 'Horario 10°A', docente: 'María López', estado: 'Pendiente', enviado: '2025-12-10' },
  { id: 2, nombre: 'Horario 11°B', docente: 'Carlos Díaz', estado: 'En revisión', enviado: '2025-12-09' },
  { id: 3, nombre: 'Horario 9°C', docente: 'Ana Ruiz', estado: 'Pendiente', enviado: '2025-12-08' }
];

export default function AprobacionesHorarios() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Validación de Horarios</h2>
          <p className="text-sm text-gray-500">Revisa y aprueba horarios enviados por docentes.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Descargar PDF</button>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Asignar revisor</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[{ l: 'Pendientes', v: 7 }, { l: 'En revisión', v: 3 }, { l: 'Aprobados esta semana', v: 5 }].map((s) => (
          <div key={s.l} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{s.l}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/3" placeholder="Buscar por docente o grupo" />
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-40">
            <option>Estado</option>
            <option>Pendiente</option>
            <option>En revisión</option>
            <option>Aprobado</option>
            <option>Rechazado</option>
          </select>
          <input type="date" className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-48" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Horario</th>
                <th className="px-3 py-2">Docente</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Enviado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendientes.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{h.nombre}</td>
                  <td className="px-3 py-2 text-gray-700">{h.docente}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${h.estado === 'Aprobado' ? 'bg-green-50 text-green-700' : h.estado === 'En revisión' ? 'bg-yellow-50 text-yellow-700' : 'bg-indigo-50 text-indigo-700'}`}>
                      {h.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{h.enviado}</td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-800">Ver</button>
                    <button className="text-green-600 hover:text-green-800">Aprobar</button>
                    <button className="text-red-600 hover:text-red-800">Rechazar</button>
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
