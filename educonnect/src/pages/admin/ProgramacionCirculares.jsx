const mockProgramaciones = [
  { id: 1, titulo: 'Circular de matrícula', estado: 'Programada', fechaPub: '2026-01-05', fechaFin: '2026-02-01' },
  { id: 2, titulo: 'Aviso de seguridad', estado: 'Activa', fechaPub: '2025-12-15', fechaFin: '2026-01-15' },
  { id: 3, titulo: 'Calendario académico', estado: 'Borrador', fechaPub: '—', fechaFin: '—' }
];

export default function ProgramacionCirculares() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Programación de Circulares</h2>
          <p className="text-sm text-gray-500">Administra publicación y caducidad de circulares sin editar su contenido.</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Programar circular</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Activas', value: 12 },
          { label: 'Programadas', value: 8 },
          { label: 'Caducadas este mes', value: 3 }
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/3" placeholder="Buscar circular" />
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-40">
            <option>Estado</option>
            <option>Activa</option>
            <option>Programada</option>
            <option>Borrador</option>
            <option>Caducada</option>
          </select>
          <input type="date" className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-48" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Título</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Publicación</th>
                <th className="px-3 py-2">Fin</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockProgramaciones.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{c.titulo}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${c.estado === 'Activa' ? 'bg-green-50 text-green-700' : c.estado === 'Programada' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{c.fechaPub}</td>
                  <td className="px-3 py-2 text-gray-600">{c.fechaFin}</td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-800">Editar</button>
                    <button className="text-green-600 hover:text-green-800">Activar</button>
                    <button className="text-orange-600 hover:text-orange-800">Caducar</button>
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
