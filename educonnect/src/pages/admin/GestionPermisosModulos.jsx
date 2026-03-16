import { useState, useEffect, useMemo } from 'react';
import * as PermisosAPI from '../../api/permisosService';
import CustomSelect from '../../components/ui/CustomSelect';
import { BtnDesactivar, BtnReactivar, BtnEditar } from '../../components/ui/ActionButtons';
import Toast from '../../../components/Toast';
import Paginador from '../../components/ui/Paginador';

export default function GestionPermisosModulos() {
  // 1. ESTADOS DE DATOS
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. ESTADOS DE FILTRADO (Requerimientos 1 y 2)
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');

  // 3. ESTADOS DE UI Y FORMULARIOS
  const [vistaActual, setVistaActual] = useState('usuarios');
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [rolEditando, setRolEditando] = useState(null);
  const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
  const [information, setInformation] = useState("");

  // ==================== UTILIDADES (Blindadas contra nulos) ====================
  
  const getNombreCompleto = (usuario) => {
    if (!usuario) return "Usuario no identificado";
    return usuario.persona?.nombre_completo || usuario.username || "Sin nombre";
  };

  const getRolLabel = (rol) => {
    if (!rol) return 'Sin Perfil';
    return rol.nombre || (typeof rol === 'string' ? rol : 'Perfil sin nombre');
  };

  // ==================== LÓGICA DE FILTRADO REACTIVO (Req 1, 2 y 3) ====================
  
  const usuariosFiltrados = useMemo(() => {
    if (!Array.isArray(usuarios)) return [];
    
    return usuarios.filter(usuario => {
      if (!usuario) return false;

      const nombreCompleto = getNombreCompleto(usuario).toLowerCase();
      const busqueda = filtroNombre.toLowerCase();
      
      // Req 1: Coincidencia parcial
      const coincideNombre = nombreCompleto.includes(busqueda);
      
      // Req 2: Filtro combinado con Optional Chaining preventivo
      const coincideRol = filtroRol === 'todos' || String(usuario.rol?.id) === String(filtroRol);
      
      return coincideNombre && coincideRol;
    });
  }, [usuarios, filtroNombre, filtroRol]);

  const opcionesRoles = useMemo(() => [
    { value: 'todos', label: 'Todos los Roles' },
    ...(roles || []).map(rol => ({ value: String(rol.id), label: rol.nombre }))
  ], [roles]);

  // ==================== CARGA DE DATOS ====================

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
      setUsuarios(usuariosData || []);
      setRoles(rolesData || []);
      setModulos(modulosData || []);
    } catch (err) {
      setError('Fallo de sincronización: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // ==================== MANEJADORES (USUARIOS) ====================

  const handleGuardarUsuario = async () => {
    if (!usuarioEditando?.id) return;
    try {
      const dataToUpdate = {
        email: usuarioEditando.email,
        is_active: usuarioEditando.is_active,
        rol_id: usuarioEditando.rol?.id
      };
      await PermisosAPI.updateUsuario(usuarioEditando.id, dataToUpdate);
      setInformation('Usuario actualizado exitosamente');
      setUsuarioEditando(null);
      cargarDatos();
    } catch (err) {
      setInformation('Error al guardar usuario: ' + err.message);
    }
  };

  const handleToggleUsuarioActivo = async (usuario) => {
    if (!usuario?.id) return;
    try {
      await PermisosAPI.toggleUsuarioActive(usuario.id);
      setInformation(`Usuario ${usuario.is_active ? 'desactivado' : 'activado'} exitosamente`);
      cargarDatos();
    } catch (err) {
      setInformation('Error al cambiar estado: ' + err.message);
    }
  };

  // ==================== MANEJADORES (ROLES) ====================

  const handleEditarPermisos = (rol) => {
    setRolEditando(rol);
    setModulosSeleccionados(rol.modulos_permitidos || []);
    setVistaActual('editar-permisos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGuardarPermisos = async () => {
    if (!rolEditando) return;
    try {
      await PermisosAPI.updateRol(rolEditando.id, {
        nombre: rolEditando.nombre,
        descripcion: rolEditando.descripcion,
        activo: rolEditando.activo,
        modulos_permitidos: modulosSeleccionados
      });
      setInformation('Configuración de rol actualizada');
      setRolEditando(null);
      setVistaActual('permisos');
      cargarDatos();
    } catch (err) {
      setInformation('Error al guardar permisos: ' + err.message);
    }
  };

  const toggleModulo = (moduloId) => {
    setModulosSeleccionados(prev => 
      prev.includes(moduloId) ? prev.filter(m => m !== moduloId) : [...prev, moduloId]
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="mt-4 text-gray-600 font-bold uppercase text-xs">Cargando Seguridad...</p>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Gestión de Seguridad</h1>
          <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest italic">Accesos y Perfiles de Usuario</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          <button
            onClick={() => setVistaActual('usuarios')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
              vistaActual === 'usuarios' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Usuarios
          </button>
          <button
            onClick={() => setVistaActual('permisos')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
              vistaActual === 'permisos' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Roles & Permisos
          </button>
        </div>
      </div>

      {/* SECCIÓN USUARIOS */}
      {vistaActual === 'usuarios' && (
        <>
          {/* FILTROS (Req 1 y 2) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm items-end">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-4 italic">Búsqueda Parcial</label>
              <input
                type="text"
                placeholder="Ej: María, Marvin..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-4 italic">Filtro por Rol</label>
              <select 
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                {opcionesRoles.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <button 
              onClick={() => { setFiltroNombre(''); setFiltroRol('todos'); }}
              className="py-4 text-[10px] font-black text-indigo-600 uppercase hover:bg-indigo-50 rounded-2xl transition-all"
            >
              Limpiar Filtros
            </button>
          </div>

          {/* FORMULARIO DE EDICIÓN */}
          {usuarioEditando && (
            <section className="mb-10 p-8 bg-white rounded-[2.5rem] border-2 border-indigo-100 shadow-2xl animate-in slide-in-from-top-6 duration-300">
              <h2 className="text-sm font-black text-indigo-600 uppercase mb-6 tracking-tighter italic">
                Modificando Perfil: {getNombreCompleto(usuarioEditando)}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input
                  type="email"
                  placeholder="Correo Electrónico"
                  value={usuarioEditando.email || ''}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, email: e.target.value })}
                  className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={usuarioEditando.rol?.id || ''}
                  onChange={(e) => {
                    const rol = roles.find(r => r.id === parseInt(e.target.value));
                    setUsuarioEditando({ ...usuarioEditando, rol });
                  }}
                  className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar Rol</option>
                  {roles.filter(r => r.activo).map(rol => (
                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={handleGuardarUsuario} className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl text-[10px] uppercase shadow-lg hover:-translate-y-1 transition-all">Sincronizar</button>
                  <button onClick={() => setUsuarioEditando(null)} className="flex-1 py-3 bg-gray-100 text-gray-400 font-black rounded-xl text-[10px] uppercase">Cancelar</button>
                </div>
              </div>
            </section>
          )}

          {/* TABLA CON PAGINADOR */}
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden">
            <Paginador items={usuariosFiltrados} itemsPorPagina={8}>
              {(itemsPaginados) => (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-50">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Usuario</th>
                        <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Correo</th>
                        <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Rol</th>
                        <th className="px-10 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {itemsPaginados.length > 0 ? (
                        itemsPaginados.map(usuario => (
                          <tr key={usuario?.id} className="hover:bg-indigo-50/20 transition-all duration-200">
                            <td className="px-10 py-6">
                              <div className="text-sm font-black text-gray-800 uppercase tracking-tighter">{getNombreCompleto(usuario)}</div>
                              <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md ${usuario?.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {usuario?.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-10 py-6 text-xs font-bold text-gray-500 italic">{usuario?.email}</td>
                            <td className="px-10 py-6">
                              <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg ${
                                usuario?.rol?.tipo_rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                                usuario?.rol?.tipo_rol === 'docente' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {getRolLabel(usuario?.rol)}
                              </span>
                            </td>
                            <td className="px-10 py-6">
                              <div className="flex justify-center gap-3">
                                <BtnEditar onClick={() => setUsuarioEditando(usuario)} />
                                {usuario?.is_active ? (
                                  <BtnDesactivar onClick={() => handleToggleUsuarioActivo(usuario)} />
                                ) : (
                                  <BtnReactivar onClick={() => handleToggleUsuarioActivo(usuario)} />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-10 py-24 text-center">
                            <div className="opacity-20 flex flex-col items-center">
                              <span className="text-7xl mb-4">🔎</span>
                              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Sin coincidencias encontradas</h2>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Paginador>
          </div>
        </>
      )}

      {/* VISTA ROLES */}
      {vistaActual === 'permisos' && (
        <section className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roles.map(rol => (
              <div key={rol.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group border-b-4 border-b-transparent hover:border-b-indigo-500">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{rol.nombre}</h3>
                  {!rol.activo && <span className="text-[10px] font-black text-red-500 uppercase tracking-widest underline italic">Inactivo</span>}
                </div>
                <p className="text-xs text-gray-400 font-bold mb-8 italic line-clamp-2">{rol.descripcion || 'Sin descripción de perfil.'}</p>
                <button 
                  onClick={() => handleEditarPermisos(rol)}
                  className="w-full py-4 bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white text-gray-400 font-black rounded-3xl text-[10px] uppercase transition-all tracking-widest shadow-inner"
                >
                  Configurar Accesos
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VISTA EDITAR PERMISOS */}
      {vistaActual === 'editar-permisos' && rolEditando && (
        <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-10 pb-6 border-b">
            <div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Privilegios: {rolEditando.nombre}</h2>
              <p className="text-xs text-gray-400 font-bold uppercase mt-1 italic tracking-widest">Selecciona los módulos permitidos para este perfil</p>
            </div>
            <button onClick={() => setVistaActual('permisos')} className="px-6 py-2 text-[10px] font-black uppercase text-gray-400 hover:text-indigo-600 transition-all underline">← Volver</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {modulos.map(modulo => (
              <label key={modulo.id} className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer flex items-start gap-6 hover:-translate-y-1 ${
                modulosSeleccionados.includes(modulo.id) ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100' : 'border-gray-100 bg-white'
              }`}>
                <input
                  type="checkbox"
                  checked={modulosSeleccionados.includes(modulo.id)}
                  onChange={() => toggleModulo(modulo.id)}
                  className="w-6 h-6 rounded-lg border-gray-200 text-indigo-600 focus:ring-0 mt-1"
                />
                <div className="flex-1">
                  <span className="text-sm font-black text-gray-800 uppercase block tracking-tighter mb-2">{modulo.nombre}</span>
                  <div className="flex flex-wrap gap-1">
                    {modulo.submodulos?.slice(0, 2).map((sub, idx) => (
                      <span key={idx} className="text-[8px] bg-white/80 border border-gray-100 text-gray-400 px-2 py-0.5 rounded-md font-black uppercase">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button onClick={() => setVistaActual('permisos')} className="px-10 py-5 bg-white text-gray-400 font-black rounded-3xl text-[10px] uppercase border border-gray-100 tracking-widest">Cancelar</button>
            <button onClick={handleGuardarPermisos} className="px-12 py-5 bg-indigo-600 text-white font-black rounded-3xl text-[10px] uppercase shadow-2xl shadow-indigo-100 tracking-[0.2em] hover:-translate-y-1 transition-all">Sincronizar Cambios</button>
          </div>
        </section>
      )}

      {information && <Toast information={information} setInformation={setInformation} />}
      {error && <Toast information={error} setInformation={setError} type="error" />}
    </div>
  );
}