import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchGruposDocente, fetchEstudiantesPorGrupo } from '../../../api/registroEstudiantesService';

const DOCENTE_GRUPO_STORAGE_KEY = 'docente_academico_hub_grupo_id';

export default function CalificacionesEditable() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryGrupoId = searchParams.get('grupo');

  const [grupoId, setGrupoId] = useState('');
  const [grupos, setGrupos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadGrupos = async () => {
    try {
      const data = await fetchGruposDocente();
      const list = Array.isArray(data) ? data : data.results || [];
      setGrupos(list);

      const persistedGrupoId = localStorage.getItem(DOCENTE_GRUPO_STORAGE_KEY);

      if (queryGrupoId && list.some((item) => String(item.id) === String(queryGrupoId))) {
        setGrupoId(String(queryGrupoId));
        return;
      }

      if (persistedGrupoId && list.some((item) => String(item.id) === String(persistedGrupoId))) {
        setGrupoId(String(persistedGrupoId));
        return;
      }

      if (list.length > 0) {
        setGrupoId(String(list[0].id));
      } else {
        setGrupoId('');
      }
    } catch {
      setError('No se pudieron cargar los grupos del docente.');
      setGrupos([]);
      setGrupoId('');
    }
  };

  const loadEstudiantes = async () => {
    if (!grupoId) {
      setEstudiantes([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchEstudiantesPorGrupo(grupoId);
      const list = Array.isArray(data) ? data : data.results || [];
      setEstudiantes(list);
    } catch {
      setError('No se pudieron cargar los estudiantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    if (!queryGrupoId) return;
    if (!grupos.some((item) => String(item.id) === String(queryGrupoId))) return;
    setGrupoId(String(queryGrupoId));
  }, [queryGrupoId, grupos]);

  useEffect(() => {
    if (!grupoId) return;
    localStorage.setItem(DOCENTE_GRUPO_STORAGE_KEY, String(grupoId));
  }, [grupoId]);

  useEffect(() => {
    loadEstudiantes();
  }, [grupoId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return estudiantes;

    const term = search.trim().toLowerCase();

    return estudiantes.filter((item) => {
      const nombre = (item.nombre || '').toLowerCase();
      const codigo = (item.codigo_estudiante || '').toLowerCase();
      const email = (item.email || '').toLowerCase();

      return nombre.includes(term) || codigo.includes(term) || email.includes(term);
    });
  }, [estudiantes, search]);

  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/docente/estudiantes');
  };

  const handleAbrirEstudiante = (personaId) => {
    navigate(`/docente/academico/calificaciones/estudiante/${personaId}?grupo=${grupoId}`);
  };

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <div>
        <button
          onClick={handleVolver}
          className="mb-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Volver
        </button>
        <h2 className="text-2xl font-bold">Calificaciones</h2>
        <p className="text-sm text-gray-500">
          Selecciona un estudiante para asignar sus notas por evaluación.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={grupoId}
            onChange={(e) => setGrupoId(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-64"
          >
            <option value="">Seleccionar grupo</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label || `${g.nombre} (${g.codigo_grupo || g.id})`}
              </option>
            ))}
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:flex-1"
            placeholder="Buscar estudiante"
          />
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2 text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan="4" className="px-3 py-6 text-center text-sm text-gray-500">
                    Cargando estudiantes...
                  </td>
                </tr>
              )}

              {!loading && !grupoId && (
                <tr>
                  <td colSpan="4" className="px-3 py-6 text-center text-sm text-gray-500">
                    Selecciona un grupo para ver estudiantes.
                  </td>
                </tr>
              )}

              {!loading && grupoId && filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-3 py-6 text-center text-sm text-gray-500">
                    No hay estudiantes disponibles para este grupo.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((e) => (
                  <tr key={e.persona_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{e.nombre || 'N/A'}</td>
                    <td className="px-3 py-2 text-gray-700">{e.codigo_estudiante || 'N/A'}</td>
                    <td className="px-3 py-2 text-gray-700 text-xs">{e.email || 'N/A'}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleAbrirEstudiante(e.persona_id)}
                        className="rounded-md bg-[#185fa5] px-3 py-1 text-xs font-medium text-white hover:bg-[#378add]"
                      >
                        Ver y asignar
                      </button>
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
