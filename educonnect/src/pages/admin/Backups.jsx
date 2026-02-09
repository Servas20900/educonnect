const jobs = [
  { id: 1, nombre: 'Respaldo diario', frecuencia: 'Diario 02:00', destino: 'S3/backup/daily', ultimo: '2025-12-11', estado: 'OK' },
  { id: 2, nombre: 'Semanal full', frecuencia: 'Domingo 03:00', destino: 'S3/backup/weekly', ultimo: '2025-12-07', estado: 'OK' },
  { id: 3, nombre: 'Mensual', frecuencia: '1er día 04:00', destino: 'S3/backup/monthly', ultimo: '2025-12-01', estado: 'Fallido' }
];

export default function Backups() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Administracion de Respaldos</h2>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Nuevo Respaldo</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[{ l: 'Último Respaldo', v: '2025-12-11' }, { l: 'Fallidos', v: 1 }].map((s) => (
          <div key={s.l} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{s.l}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Frecuencia</th>
                <th className="px-3 py-2">Destino</th>
                <th className="px-3 py-2">Último</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{j.nombre}</td>
                  <td className="px-3 py-2 text-gray-700">{j.frecuencia}</td>
                  <td className="px-3 py-2 text-gray-600">{j.destino}</td>
                  <td className="px-3 py-2 text-gray-600">{j.ultimo}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${j.estado === 'OK' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {j.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-800">Editar</button>
                    <button className="text-blue-600 hover:text-blue-800">Ejecutar</button>
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
