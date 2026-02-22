import { useState, useEffect } from 'react';
import { fetchComites, fetchMiembrosConRoles, asignarRol } from '../../api/comitesService';

const ROLES_DISPONIBLES = [
  { value: 'Presidente', label: 'Presidente', unique: true },
  { value: 'Secretario', label: 'Secretario', unique: true },
  { value: 'Vocal', label: 'Vocal', unique: false },
  { value: 'Tesorero', label: 'Tesorero', unique: true },
  { value: 'Miembro', label: 'Miembro', unique: false }
];

export default function RolesComite() {
  const [comites, setComites] = useState([]);
  const [selectedComite, setSelectedComite] = useState('');
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRoles, setSelectedRoles] = useState({});

  // Cargar comités disponibles al montar el componente
  useEffect(() => {
    loadComites();
  }, []);

  // Cargar miembros cuando se selecciona un comité
  useEffect(() => {
    if (selectedComite) {
      loadMiembros();
    }
  }, [selectedComite]);

  const loadComites = async () => {
    try {
      setLoading(true);
      const data = await fetchComites({ estado: 'activo' });
      setComites(data.results || data);
      
      // Seleccionar automáticamente el primer comité si hay uno
      if ((data.results || data).length > 0) {
        setSelectedComite((data.results || data)[0].id);
      }
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadMiembros = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchMiembrosConRoles(selectedComite);
      setMiembros(data);
      
      // Inicializar roles seleccionados con los actuales
      const rolesMap = {};
      data.forEach(m => {
        rolesMap[m.id] = m.cargo || 'Miembro';
      });
      setSelectedRoles(rolesMap);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRolChange = (miembroId, nuevoRol) => {
    setSelectedRoles(prev => ({
      ...prev,
      [miembroId]: nuevoRol
    }));
  };

  const handleAsignarRol = async (miembroId) => {
    const nuevoRol = selectedRoles[miembroId];
    
    try {
      setSaving(miembroId);
      setError('');
      setSuccess('');
      
      const result = await asignarRol(selectedComite, miembroId, nuevoRol);
      
      setSuccess(result.message || `Rol ${nuevoRol} asignado exitosamente`);
      
      // Recargar miembros para actualizar la vista
      await loadMiembros();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setSaving(null);
    }
  };

  const parseError = (err) => {
    if (typeof err === 'string') return err;
    if (err.detail) return err.detail;
    if (err.error) return err.error;
    if (err.non_field_errors) return err.non_field_errors[0];
    if (err.cargo) return err.cargo[0];
    return 'Ocurrió un error. Por favor intenta de nuevo.';
  };

  const getRolBadgeClass = (cargo) => {
    const cargoLower = cargo?.toLowerCase() || '';
    if (cargoLower === 'presidente') return 'bg-purple-100 text-purple-700';
    if (cargoLower === 'secretario') return 'bg-blue-100 text-blue-700';
    if (cargoLower === 'tesorero') return 'bg-green-100 text-green-700';
    if (cargoLower === 'vocal') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Roles del Comité</h2>
          <p className="text-sm text-gray-500">Asigna responsabilidades dentro del comité.</p>
        </div>
      </div>

      {/* Selector de Comité */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Comité
        </label>
        <select
          value={selectedComite}
          onChange={(e) => setSelectedComite(e.target.value)}
          className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
          disabled={loading}
        >
          <option value="">Seleccione un comité...</option>
          {comites.map((comite) => (
            <option key={comite.id} value={comite.id}>
              {comite.nombre} - {comite.tipo_comite}
            </option>
          ))}
        </select>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Tabla de miembros */}
      {selectedComite && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Cargando miembros...
            </div>
          ) : miembros.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay miembros activos en este comité.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-3">Miembro</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rol Actual</th>
                    <th className="px-4 py-3">Nuevo Rol</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {miembros.map((miembro) => (
                    <tr key={miembro.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {miembro.persona_info?.nombre_completo || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {miembro.persona_info?.email_institucional || miembro.persona_info?.email_personal || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRolBadgeClass(miembro.cargo)}`}>
                          {miembro.cargo || 'Sin rol'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={selectedRoles[miembro.id] || miembro.cargo || 'Miembro'}
                          onChange={(e) => handleRolChange(miembro.id, e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1.5 border"
                          disabled={saving === miembro.id}
                        >
                          {ROLES_DISPONIBLES.map((rol) => (
                            <option key={rol.value} value={rol.value}>
                              {rol.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleAsignarRol(miembro.id)}
                          disabled={
                            saving === miembro.id || 
                            selectedRoles[miembro.id] === miembro.cargo
                          }
                          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {saving === miembro.id ? 'Guardando...' : 'Asignar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Información sobre roles */}
      {selectedComite && miembros.length > 0 && (
        <div className="rounded-lg bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Información sobre roles
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Solo puede haber un <strong>Presidente</strong> activo por comité</li>
            <li>Solo puede haber un <strong>Secretario</strong> activo por comité</li>
            <li>Solo puede haber un <strong>Tesorero</strong> activo por comité</li>
            <li>Puede haber múltiples <strong>Vocales</strong> y <strong>Miembros</strong></li>
          </ul>
        </div>
      )}
    </div>
  );
}
