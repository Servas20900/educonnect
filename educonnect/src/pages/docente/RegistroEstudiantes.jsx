const estudiantes = [
  { id: 1, nombre: 'Luis Pérez', grupo: '10°A', estado: 'Activo' },
  { id: 2, nombre: 'María Gómez', grupo: '10°A', estado: 'Activo' },
  { id: 3, nombre: 'Jorge Solano', grupo: '10°B', estado: 'Pendiente' }
];

export default function RegistroEstudiantes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Registro de Estudiantes</h2>
          <p className="text-sm text-gray-500">Añade estudiantes a tu grupo para evaluaciones y asistencia.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Importar CSV</button>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Nuevo estudiante</button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/3" placeholder="Buscar estudiante" />
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-40">
            <option>Grupo</option>
            <option>10°A</option>
            <option>10°B</option>
          </select>
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-36">
            <option>Estado</option>
            <option>Activo</option>
            <option>Pendiente</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Grupo</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estudiantes.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{e.nombre}</td>
                  <td className="px-3 py-2 text-gray-700">{e.grupo}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${e.estado === 'Activo' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {e.estado}
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
