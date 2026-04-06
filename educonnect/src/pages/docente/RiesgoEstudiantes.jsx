import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchGruposDocente } from '../../api/registroEstudiantesService';
import { fetchDetalleRiesgoEstudiante, fetchRiesgoPorGrupo } from '../../api/evaluacionesService';

const DOCENTE_GRUPO_STORAGE_KEY = 'docente_estudiantes_hub_grupo_id';

const criticidadStyles = {
  rojo: 'bg-red-100 text-red-800 border border-red-200',
  naranja: 'bg-orange-100 text-orange-800 border border-orange-200',
  amarillo: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
};

const criticidadLabel = {
  rojo: 'Rojo',
  naranja: 'Naranja',
  amarillo: 'Amarillo',
};

export default function RiesgoEstudiantes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryGrupoId = searchParams.get('grupo');

  const [grupoId, setGrupoId] = useState('');
  const [grupos, setGrupos] = useState([]);
  const [riesgo, setRiesgo] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/docente/estudiantes');
  };

  const loadGrupos = async () => {
    setError('');
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

  const loadRiesgo = async () => {
    if (!grupoId) {
      setRiesgo([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchRiesgoPorGrupo(grupoId);
      const list = Array.isArray(data) ? data : data.results || [];
      setRiesgo(list);
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudo cargar el riesgo académico.');
      setRiesgo([]);
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
    loadRiesgo();
  }, [grupoId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return riesgo;
    const term = search.trim().toLowerCase();

    return riesgo.filter((item) => {
      const nombre = (item?.estudiante?.nombre || '').toLowerCase();
      const codigo = (item?.estudiante?.codigo_estudiante || '').toLowerCase();
      const criticidad = (item?.criticidad || '').toLowerCase();
      return nombre.includes(term) || codigo.includes(term) || criticidad.includes(term);
    });
  }, [riesgo, search]);

  const resumen = useMemo(() => {
    const counters = { rojo: 0, naranja: 0, amarillo: 0 };
    filtered.forEach((item) => {
      if (item.criticidad === 'rojo') counters.rojo += 1;
      if (item.criticidad === 'naranja') counters.naranja += 1;
      if (item.criticidad === 'amarillo') counters.amarillo += 1;
    });
    return counters;
  }, [filtered]);

  const abrirDetalle = async (estudianteId) => {
    if (!grupoId || !estudianteId) return;
    setModalAbierto(true);
    setDetalleLoading(true);
    setDetalleError('');

    try {
      const data = await fetchDetalleRiesgoEstudiante(grupoId, estudianteId);
      setDetalle(data);
    } catch (err) {
      setDetalle(null);
      setDetalleError(err?.response?.data?.detail || 'No se pudo cargar el detalle del estudiante.');
    } finally {
      setDetalleLoading(false);
    }
  };

  const cerrarDetalle = () => {
    setModalAbierto(false);
    setDetalle(null);
    setDetalleError('');
    setDetalleLoading(false);
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
        <h2 className="text-2xl font-bold">Riesgo Académico</h2>
        <p className="text-sm text-gray-500">
          Detecta estudiantes con bajo desempeño en entregables o con entregas pendientes.
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
            placeholder="Buscar por estudiante, código o criticidad"
          />

          <button
            onClick={loadRiesgo}
            className="rounded-md border border-[#185fa5] px-4 py-2 text-sm font-medium text-[#185fa5] transition-colors hover:bg-[#e6f1fb]"
          >
            Recargar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-semibold uppercase text-red-700">Rojo</p>
            <p className="text-2xl font-bold text-red-800">{resumen.rojo}</p>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="text-xs font-semibold uppercase text-orange-700">Naranja</p>
            <p className="text-2xl font-bold text-orange-800">{resumen.naranja}</p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-xs font-semibold uppercase text-yellow-700">Amarillo</p>
            <p className="text-2xl font-bold text-yellow-800">{resumen.amarillo}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Estudiante</th>
                <th className="px-3 py-2">Criticidad</th>
                <th className="px-3 py-2 text-center">Promedio entregables</th>
                <th className="px-3 py-2 text-center">No entregadas</th>
                <th className="px-3 py-2 text-center">Entregables bajos</th>
                <th className="px-3 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">
                    Cargando estudiantes en riesgo...
                  </td>
                </tr>
              )}

              {!loading && !grupoId && (
                <tr>
                  <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">
                    Selecciona un grupo para ver la matriz de riesgo.
                  </td>
                </tr>
              )}

              {!loading && grupoId && filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">
                    No hay estudiantes clasificados en riesgo para este grupo.
                  </td>
                </tr>
              )}

              {!loading && filtered.map((item) => (
                <tr key={item.estudiante.persona_id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-900">{item.estudiante.nombre || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{item.estudiante.codigo_estudiante || 'Sin código'}</p>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${criticidadStyles[item.criticidad] || 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                      {criticidadLabel[item.criticidad] || 'N/A'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-700">{item.promedio_entregables}%</td>
                  <td className="px-3 py-2 text-center text-gray-700">{item.no_entregadas}/{item.total_evaluaciones}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{item.bajas}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => abrirDetalle(item.estudiante.persona_id)}
                      className="rounded-md bg-[#185fa5] px-3 py-1 text-xs font-medium text-white hover:bg-[#378add]"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500">
          Criterio: se clasifica por entregables no entregados y rendimiento de entregables (no por porcentaje final del curso).
        </p>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-200/40 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detalle de riesgo del estudiante</h3>
                <p className="text-sm text-gray-500">
                  Revisión de entregables, no entregas y promedio de rendimiento.
                </p>
              </div>
              <button
                onClick={cerrarDetalle}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>

            {detalleLoading && <p className="text-sm text-gray-500">Cargando detalle...</p>}

            {!detalleLoading && detalleError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{detalleError}</div>
            )}

            {!detalleLoading && !detalleError && detalle && (
              <div className="space-y-4">
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{detalle.estudiante?.nombre || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Código: {detalle.estudiante?.codigo_estudiante || 'Sin código'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <p className="text-xs font-semibold uppercase text-blue-700">Promedio entregables</p>
                    <p className="text-xl font-bold text-blue-900">{detalle.resumen?.promedio_entregables ?? 0}%</p>
                  </div>
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <p className="text-xs font-semibold uppercase text-orange-700">No entregadas</p>
                    <p className="text-xl font-bold text-orange-800">{detalle.resumen?.no_entregadas ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <p className="text-xs font-semibold uppercase text-yellow-700">Entregables bajos</p>
                    <p className="text-xl font-bold text-yellow-800">{detalle.resumen?.bajas ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase text-gray-600">Criticidad</p>
                    <span className={`inline-flex mt-1 rounded-full px-2 py-1 text-xs font-semibold ${criticidadStyles[detalle.criticidad] || 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                      {criticidadLabel[detalle.criticidad] || 'Sin riesgo'}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-80">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <th className="px-3 py-2">Entregable</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2 text-center">Nota</th>
                        <th className="px-3 py-2 text-center">Rendimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(detalle.entregables || []).map((item) => (
                        <tr key={item.evaluacion_id}>
                          <td className="px-3 py-2 font-medium text-gray-900">{item.nombre}</td>
                          <td className="px-3 py-2 text-gray-700">{item.tipo_evaluacion}</td>
                          <td className="px-3 py-2">
                            {item.estado_entrega === 'no_entregado' ? (
                              <span className="rounded-full bg-red-100 text-red-800 border border-red-200 px-2 py-1 text-xs font-semibold">No entregado</span>
                            ) : (
                              <span className="rounded-full bg-blue-100 text-blue-800 border border-blue-200 px-2 py-1 text-xs font-semibold">Entregado</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-700">
                            {item.nota == null ? '-' : `${item.nota}/${item.nota_maxima}`}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-700">
                            {item.porcentaje_logro == null ? '-' : `${item.porcentaje_logro}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}