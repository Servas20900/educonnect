const roles = [
  { id: 1, nombre: 'Presidente', persona: 'Ana Rojas', periodo: '2025', estado: 'Activo' },
  { id: 2, nombre: 'Secretario', persona: 'Luis Soto', periodo: '2025', estado: 'Activo' },
  { id: 3, nombre: 'Vocal', persona: 'María Vargas', periodo: '2025', estado: 'Pendiente' }
];

export default function RolesComite() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Roles del Comité</h2>
          <p className="text-sm text-gray-500">Asigna responsabilidades dentro del comité.</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Asignar rol</button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Rol</th>
                <th className="px-3 py-2">Persona</th>
                <th className="px-3 py-2">Período</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{r.nombre}</td>
                  <td className="px-3 py-2 text-gray-700">{r.persona}</td>
                  <td className="px-3 py-2 text-gray-700">{r.periodo}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${r.estado === 'Activo' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-800">Editar</button>
                    <button className="text-red-600 hover:text-red-800">Remover</button>
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
