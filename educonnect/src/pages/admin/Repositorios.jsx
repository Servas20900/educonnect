const carpetas = [
  { id: 1, nombre: 'Actas Comité', permisos: 'Comité, Admin', ultima: '2025-12-01' },
  { id: 2, nombre: 'Circulares Publicadas', permisos: 'Todos', ultima: '2025-11-25' },
  { id: 3, nombre: 'Backups', permisos: 'Admin', ultima: '2025-11-20' }
];

export default function Repositorios() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Repositorios y Carpetas</h2>
          <p className="text-sm text-gray-500">Organiza archivos en almacenamiento compatible S3 y controla accesos.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Subir archivo</button>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Nueva carpeta</button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/2" placeholder="Buscar carpeta o archivo" />
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-48">
            <option>Permisos</option>
            <option>Todos</option>
            <option>Admin</option>
            <option>Comité</option>
          </select>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {carpetas.map((c) => (
            <div key={c.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm hover:border-indigo-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">{c.nombre}</h3>
                <span className="text-xs text-gray-500">{c.ultima}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Permisos: {c.permisos}</p>
              <div className="mt-3 flex gap-3 text-sm">
                <button className="text-indigo-600 hover:text-indigo-800">Abrir</button>
                <button className="text-gray-700 hover:text-gray-900">Compartir</button>
                <button className="text-orange-600 hover:text-orange-800">Mover</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
