import { useEffect, useMemo, useState } from 'react';
import { fetchEstudiantes } from '../../api/estudiantesService';

export default function RegistroEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [grupo, setGrupo] = useState('');

  const loadEstudiantes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchEstudiantes();
      const list = Array.isArray(data) ? data : data.results || [];
      setEstudiantes(list);
    } catch (err) {
      setError('No se pudieron cargar los estudiantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstudiantes();
  }, []);

  const gruposDisponibles = useMemo(() => {
    const map = new Map();
    estudiantes.forEach((item) => {
      (item.grupos || []).forEach((g) => {
        if (!g?.id) return;
        if (!map.has(g.id)) {
          map.set(g.id, { id: g.id, label: g.label || g.codigo_grupo || g.nombre || `Grupo ${g.id}` });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [estudiantes]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return estudiantes.filter((item) => {
      if (grupo && !(item.grupos || []).some((g) => String(g.id) === String(grupo))) {
        return false;
      }

      if (!term) return true;

      const persona = item.persona_info || {};
      const nombre = `${persona.nombre || ''} ${persona.primer_apellido || ''} ${persona.segundo_apellido || ''}`.toLowerCase();
      const codigo = (item.codigo_estudiante || '').toLowerCase();
      const identificacion = (persona.identificacion || '').toLowerCase();
      return nombre.includes(term) || codigo.includes(term) || identificacion.includes(term);
    });
  }, [estudiantes, search, grupo]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Registro de Estudiantes</h2>
          <p className="text-sm text-gray-500">Listado de estudiantes registrados en el sistema.</p>
        </div>
        <button
          onClick={loadEstudiantes}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Recargar
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/3"
            placeholder="Buscar estudiante"
          />

          <select
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/3"
          >
            <option value="">Todos los grupos</option>
            {gruposDisponibles.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Codigo</th>
                <th className="px-3 py-2">Grupo(s)</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-sm text-gray-500">
                    Cargando estudiantes...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-sm text-gray-500">
                    No hay estudiantes registrados.
                  </td>
                </tr>
              )}
              {!loading && filtered.map((e) => {
                const persona = e.persona_info || {};
                const nombre = `${persona.nombre || ''} ${persona.primer_apellido || ''} ${persona.segundo_apellido || ''}`.trim();
                const grupos = (e.grupos || []).map((g) => g.label || g.codigo_grupo || g.nombre).filter(Boolean);
                return (
                  <tr key={e.usuario_id || e.persona_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{nombre || 'N/A'}</td>
                    <td className="px-3 py-2 text-gray-700">{e.codigo_estudiante || 'N/A'}</td>
                    <td className="px-3 py-2 text-gray-700">{grupos.length ? grupos.join(', ') : 'Sin grupo'}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${e.estado_estudiante === 'activo' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {e.estado_estudiante || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {persona.email_institucional || persona.email_personal || 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
