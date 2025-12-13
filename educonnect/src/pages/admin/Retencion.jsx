const politicas = [
  { id: 1, nombre: 'Circulares publicadas', retencion: '12 meses', accion: 'Archivar', alcance: 'Todos' },
  { id: 2, nombre: 'Backups incrementales', retencion: '30 días', accion: 'Borrar', alcance: 'Admin' },
  { id: 3, nombre: 'Actas de comité', retencion: 'Indefinido', accion: 'Guardar', alcance: 'Comité' }
];

export default function Retencion() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Retención y Archivo</h2>
          <p className="text-sm text-gray-500">Define políticas de retención, borrado y archivado.</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Nueva política</button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Retención</th>
                <th className="px-3 py-2">Acción</th>
                <th className="px-3 py-2">Alcance</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {politicas.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-3 py-2 text-gray-700">{p.retencion}</td>
                  <td className="px-3 py-2 text-gray-700">{p.accion}</td>
                  <td className="px-3 py-2 text-gray-600">{p.alcance}</td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-800">Editar</button>
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
