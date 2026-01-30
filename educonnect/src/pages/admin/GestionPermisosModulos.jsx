import { useState, useEffect } from 'react';
import * as PermisosAPI from '../../api/permisosService';

export default function GestionPermisosModulos() {
  // Estados para datos del backend
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para formularios
  const [vistaActual, setVistaActual] = useState('usuarios');
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [rolEditando, setRolEditando] = useState(null);
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usuariosData, rolesData, modulosData] = await Promise.all([
        PermisosAPI.fetchUsuarios(),
        PermisosAPI.fetchRoles(),
        PermisosAPI.fetchModulos()
      ]);
      setUsuarios(usuariosData);
      setRoles(rolesData);
      setModulos(modulosData);
    } catch (err) {
      setError('Error al cargar datos: ' + (err.message || 'Error desconocido'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };

  // ==================== USUARIOS ====================

  const handleGuardarUsuario = async () => {
    if (!usuarioEditando?.id) return;

    try {
      const dataToUpdate = {
        email: usuarioEditando.email,
        is_active: usuarioEditando.is_active
      };

      if (usuarioEditando.rol?.id) {
        dataToUpdate.rol_id = usuarioEditando.rol.id;
      }

      await PermisosAPI.updateUsuario(usuarioEditando.id, dataToUpdate);
      mostrarMensaje('Usuario actualizado exitosamente');
      setUsuarioEditando(null);
      cargarDatos();
    } catch (err) {
      mostrarMensaje('Error al guardar usuario: ' + err.message, 'error');
    }
  };

  const handleToggleUsuarioActivo = async (usuario) => {
    try {
      await PermisosAPI.toggleUsuarioActive(usuario.id);
      mostrarMensaje(`Usuario ${usuario.is_active ? 'desactivado' : 'activado'} exitosamente`);
      cargarDatos();
    } catch (err) {
      mostrarMensaje('Error al cambiar estado: ' + err.message, 'error');
    }
  };

  // ==================== ROLES Y PERMISOS ====================

  const handleEditarPermisos = (rol) => {
    setRolEditando(rol);
    setModulosSeleccionados(rol.modulos_permitidos || []);
    setVistaActual('editar-permisos');
  };

  const handleGuardarPermisos = async () => {
    if (!rolEditando) return;

    try {
      await PermisosAPI.updateRol(rolEditando.id, {
        nombre: rolEditando.nombre,
        descripcion: rolEditando.descripcion,
        activo: rolEditando.activo
      });
      
      mostrarMensaje('Permisos actualizados exitosamente');
      setRolEditando(null);
      setVistaActual('permisos');
      cargarDatos();
    } catch (err) {
      mostrarMensaje('Error al guardar permisos: ' + err.message, 'error');
    }
  };

  const toggleModulo = (moduloId) => {
    if (modulosSeleccionados.includes(moduloId)) {
      setModulosSeleccionados(modulosSeleccionados.filter(m => m !== moduloId));
    } else {
      setModulosSeleccionados([...modulosSeleccionados, moduloId]);
    }
  };

  // ==================== UTILIDADES ====================

  const getRolLabel = (rol) => {
    if (!rol) return 'Sin rol';
    return rol.nombre || rol;
  };

  const getNombreCompleto = (usuario) => {
    if (usuario.persona) {
      return usuario.persona.nombre_completo;
    }
    return usuario.username;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={cargarDatos} className="ml-4 text-sm underline">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {mensaje && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          mensaje.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {mensaje.texto}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-700 border-b pb-2">
          Gestión de Usuarios y Permisos del Sistema
        </h1>
        
        <div className="flex gap-2">
          <button
            onClick={() => setVistaActual('usuarios')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              vistaActual === 'usuarios'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Usuarios
          </button>
          <button
            onClick={() => setVistaActual('permisos')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              vistaActual === 'permisos'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Permisos por Rol
          </button>
        </div>
      </div>

      {/* Vista de Gestión de Usuarios */}
      {vistaActual === 'usuarios' && (
        <>
          {usuarioEditando && (
            <section className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Editar Usuario: {getNombreCompleto(usuarioEditando)}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="email"
                  placeholder="Correo Electrónico"
                  value={usuarioEditando.email || ''}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, email: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <select
                  value={usuarioEditando.rol?.id || ''}
                  onChange={(e) => {
                    const rolSeleccionado = roles.find(r => r.id === parseInt(e.target.value));
                    setUsuarioEditando({ ...usuarioEditando, rol: rolSeleccionado });
                  }}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Seleccionar Rol</option>
                  {roles.filter(r => r.activo).map(rol => (
                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleGuardarUsuario}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setUsuarioEditando(null)}
                    className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Listado de Usuarios del Sistema
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol Asignado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuarios.map(usuario => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getNombreCompleto(usuario)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {usuario.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          usuario.rol?.tipo_rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                          usuario.rol?.tipo_rol === 'docente' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {getRolLabel(usuario.rol)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          usuario.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {usuario.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                        <button
                          onClick={() => setUsuarioEditando(usuario)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleUsuarioActivo(usuario)}
                          className={`font-medium ${
                            usuario.is_active
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {usuario.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Vista de Permisos por Rol */}
      {vistaActual === 'permisos' && (
        <section className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Configuración de Permisos por Rol
            </h2>
            <p className="text-sm text-gray-600">
              Define qué módulos del sistema puede acceder cada rol y con qué nivel de permisos.
            </p>
          </div>

          <div className="space-y-4">
            {roles.map(rol => (
              <div key={rol.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {rol.nombre}
                      {!rol.activo && (
                        <span className="ml-2 text-xs text-red-500">(Inactivo)</span>
                      )}
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Descripción: </span>
                        <span className="text-sm text-gray-700">{rol.descripcion || 'Sin descripción'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Tipo: </span>
                        <span className="text-sm text-indigo-600 font-semibold">{rol.tipo_rol}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Módulos Permitidos: </span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {rol.modulos_permitidos && rol.modulos_permitidos.length > 0 ? (
                            rol.modulos_permitidos.map(moduloId => {
                              const modulo = modulos.find(m => m.id === moduloId);
                              return (
                                <span key={moduloId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {modulo?.nombre || moduloId}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-sm text-gray-500 italic">Sin módulos asignados</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Permisos: </span>
                        <span className="text-sm text-gray-700">
                          {rol.permisos?.length || 0} permisos configurados
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditarPermisos(rol)}
                    className="ml-4 px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Configurar Permisos
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vista de Edición de Permisos */}
      {vistaActual === 'editar-permisos' && rolEditando && (
        <section className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700">
              Configurar Permisos para: {rolEditando.nombre}
            </h2>
            <button
              onClick={() => {
                setVistaActual('permisos');
                setRolEditando(null);
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Volver
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Módulos del Sistema Permitidos
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modulos.map(modulo => (
                  <div key={modulo.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modulosSeleccionados.includes(modulo.id)}
                        onChange={() => toggleModulo(modulo.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                      />
                      <div className="ml-3 flex-1">
                        <span className="text-sm font-semibold text-gray-900">{modulo.nombre}</span>
                        <p className="text-xs text-gray-500 mt-1">Grupo: {modulo.grupo}</p>
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 font-medium mb-1">Submódulos incluidos:</p>
                          <div className="flex flex-wrap gap-1">
                            {modulo.submodulos.slice(0, 3).map((sub, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {sub}
                              </span>
                            ))}
                            {modulo.submodulos.length > 3 && (
                              <span className="text-xs text-gray-500 italic">
                                +{modulo.submodulos.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Permisos específicos configurados
              </h3>
              <p className="text-sm text-gray-600">
                {rolEditando.permisos?.length || 0} permisos específicos definidos en la base de datos
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setVistaActual('permisos');
                  setRolEditando(null);
                }}
                className="px-6 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarPermisos}
                className="px-6 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
