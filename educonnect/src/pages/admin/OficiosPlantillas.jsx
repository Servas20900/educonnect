const plantillas = [
  { id: 1, nombre: 'Oficio estándar', categoria: 'General', ultima: '2025-12-01', estado: 'Publicado' },
  { id: 2, nombre: 'Circular oficial', categoria: 'Comunicados', ultima: '2025-11-20', estado: 'Publicado' },
  { id: 3, nombre: 'Acta de reunión', categoria: 'Comité', ultima: '2025-11-05', estado: 'Borrador' }
];

export default function OficiosPlantillas() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Oficios y Plantillas</h2>
          <p className="text-sm text-gray-500">Catálogo de formatos oficiales para agilizar documentos.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Importar</button>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700">Nueva plantilla</button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/2" placeholder="Buscar por nombre" />
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-40">
            <option>Categoría</option>
            <option>General</option>
            <option>Comunicados</option>
            <option>Comité</option>
          </select>
          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-32">
            <option>Estado</option>
            <option>Publicado</option>
            <option>Borrador</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Última actualización</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plantillas.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-3 py-2 text-gray-700">{p.categoria}</td>
                  <td className="px-3 py-2 text-gray-600">{p.ultima}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${p.estado === 'Publicado' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-800">Editar</button>
                    <button className="text-blue-600 hover:text-blue-800">Duplicar</button>
                    <button className="text-gray-600 hover:text-gray-800">Descargar</button>
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
