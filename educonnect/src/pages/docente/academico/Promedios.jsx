import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchGruposDocente, fetchEstudiantesPorGrupo } from '../../../api/registroEstudiantesService';
import { fetchPromediosPorGrupo } from '../../../api/evaluacionesService';

const DOCENTE_GRUPO_STORAGE_KEY = 'docente_academico_hub_grupo_id';

export default function Promedios() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryGrupoId = searchParams.get('grupo');

  const [grupoId, setGrupoId] = useState('');
  const [grupos, setGrupos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [promedios, setPromedios] = useState({});

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

    try {
      const data = await fetchEstudiantesPorGrupo(grupoId);
      const list = Array.isArray(data) ? data : data.results || [];
      setEstudiantes(list);
    } catch {
      setError('No se pudieron cargar los estudiantes.');
    }
  };

  const loadPromedios = async () => {
    if (!grupoId) {
      setPromedios({});
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchPromediosPorGrupo(grupoId);
      setPromedios(data || {});
    } catch {
      setError('No se pudieron cargar los promedios.');
      setPromedios({});
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
    loadPromedios();
  }, [grupoId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return estudiantes;

    const term = search.trim().toLowerCase();

    return estudiantes.filter((item) => {
      const nombre = (item.nombre || '').toLowerCase();
      const codigo = (item.codigo_estudiante || '').toLowerCase();

      return nombre.includes(term) || codigo.includes(term);
    });
  }, [estudiantes, search]);

  const getPromedioEstudiante = (personaId) => {
    return promedios[personaId] || {};
  };

  const getProntuarioColor = (promedio) => {
    if (promedio >= 90) return 'bg-blue-100 text-blue-900';
    if (promedio >= 80) return 'bg-blue-50 text-blue-800';
    if (promedio >= 70) return 'bg-slate-100 text-slate-800';
    if (promedio >= 60) return 'bg-slate-100 text-slate-700';
    return 'bg-slate-200 text-slate-800';
  };

  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/docente/estudiantes');
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
        <h2 className="text-2xl font-bold">Promedios</h2>
        <p className="text-sm text-gray-500">
          Visualiza los promedios por semestre de los estudiantes.
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
                <th className="px-3 py-2 text-center">Semestre 1</th>
                <th className="px-3 py-2 text-center">Semestre 2</th>
                <th className="px-3 py-2 text-center">Promedio Final</th>
                <th className="px-3 py-2 text-center">Estado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">
                    Cargando promedios...
                  </td>
                </tr>
              )}

              {!loading && !grupoId && (
                <tr>
                  <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">
                    Selecciona una clase para ver los promedios.
                  </td>
                </tr>
              )}

              {!loading && grupoId && filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">
                    No hay estudiantes en este grupo.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((e) => {
                  const promedioData = getPromedioEstudiante(e.persona_id);
                  const promFinal = parseFloat(promedioData.promedio_final) || 0;

                  return (
                    <tr key={e.persona_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{e.nombre || 'N/A'}</td>
                      <td className="px-3 py-2 text-gray-700">{e.codigo_estudiante || 'N/A'}</td>
                      <td className="px-3 py-2 text-center text-gray-700">
                        {promedioData.promedio_semestre_1 || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-700">
                        {promedioData.promedio_semestre_2 || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-center font-semibold">
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          promFinal > 0
                            ? getProntuarioColor(promFinal)
                            : 'bg-gray-50 text-gray-700'
                        }`}>
                          {promFinal > 0 ? promFinal.toFixed(2) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          promFinal >= 70
                            ? 'bg-blue-50 text-blue-800'
                            : promFinal >= 60
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-slate-200 text-slate-800'
                        }`}>
                          {promFinal >= 70 ? 'Aprobado' : promFinal > 0 ? 'En riesgo' : '-'}
                        </span>
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
