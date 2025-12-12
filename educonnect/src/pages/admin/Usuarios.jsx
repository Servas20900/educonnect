export default function Usuarios() {
  const usuariosSimulados = [
    { id: 1, nombre: 'Admin General', rol: 'Administrador' },
    { id: 2, nombre: 'Ana Pérez', rol: 'Docente' },
    { id: 3, nombre: 'Carlos Mora', rol: 'Miembro de Comité' },
  ];
  const rolesPrincipales = ['Administrador', 'Docente', 'Comités', 'Órganos Auxiliares', 'Usuarios'];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-700 mb-8 border-b pb-2">
        Gestión Centralizada de Usuarios y Roles
      </h1>

      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Crear/Editar Usuario
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" placeholder="Nombre Completo" className="border border-gray-300 rounded-md p-2 text-sm" />
          <input type="email" placeholder="Correo Electrónico (ID)" className="border border-gray-300 rounded-md p-2 text-sm" />

          <div className="flex space-x-2">
            <select className="flex-grow border border-gray-300 rounded-md p-2 text-sm">
              <option value="">Asignar Rol</option>
              {rolesPrincipales.map(rol => (
                <option key={rol} value={rol}>
                  {rol}
                </option>
              ))}
            </select>
            <button className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Guardar
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Listado de Personal y Usuarios
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuariosSimulados.map(usuario => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {usuario.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button className="text-indigo-600 hover:text-indigo-900">
                      Editar
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Desactivar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};