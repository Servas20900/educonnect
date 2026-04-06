import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/ui';
import { fetchGruposDocente } from '../../../api/registroEstudiantesService';
import { fetchEvaluacionesPorGrupo, crearEvaluacion, actualizarEvaluacion, eliminarEvaluacion } from '../../../api/evaluacionesService';

const DOCENTE_GRUPO_STORAGE_KEY = 'docente_academico_hub_grupo_id';

export default function EvaluacionesListado() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryGrupoId = searchParams.get('grupo');
  
  const [grupoId, setGrupoId] = useState('');
  const [grupos, setGrupos] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [search, setSearch] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo_evaluacion: 'examen',
    fecha_evaluacion: '',
    fecha_entrega: '',
    valor_porcentual: '',
    nota_maxima: '100',
    instrucciones: '',
    visible_estudiantes: true,
    permite_recuperacion: false,
  });

  const tiposEvaluacion = ['actividad', 'examen', 'tarea'];

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

  const loadEvaluaciones = async () => {
    if (!grupoId) {
      setEvaluaciones([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchEvaluacionesPorGrupo(grupoId);
      const list = Array.isArray(data) ? data : data.results || [];
      setEvaluaciones(list);
    } catch {
      setError('No se pudieron cargar las evaluaciones.');
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
    loadEvaluaciones();
  }, [grupoId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return evaluaciones;

    const term = search.trim().toLowerCase();

    return evaluaciones.filter((item) => {
      const nombre = (item.nombre || '').toLowerCase();
      const descripcion = (item.descripcion || '').toLowerCase();
      const tipo = (item.tipo_evaluacion || '').toLowerCase();

      return nombre.includes(term) || descripcion.includes(term) || tipo.includes(term);
    });
  }, [evaluaciones, search]);

  const abrirModal = (evaluacion = null) => {
    if (evaluacion) {
      setEditando(evaluacion.id);
      setFormData({
        nombre: evaluacion.nombre || '',
        descripcion: evaluacion.descripcion || '',
        tipo_evaluacion: evaluacion.tipo_evaluacion || 'examen',
        fecha_evaluacion: evaluacion.fecha_evaluacion || '',
        fecha_entrega: evaluacion.fecha_entrega || '',
        valor_porcentual: evaluacion.valor_porcentual || '',
        nota_maxima: evaluacion.nota_maxima || '100',
        instrucciones: evaluacion.instrucciones || '',
        visible_estudiantes: evaluacion.visible_estudiantes !== false,
        permite_recuperacion: evaluacion.permite_recuperacion === true,
      });
    } else {
      setEditando(null);
      setFormData({
        nombre: '',
        descripcion: '',
        tipo_evaluacion: 'examen',
        fecha_evaluacion: '',
        fecha_entrega: '',
        valor_porcentual: '',
        nota_maxima: '100',
        instrucciones: '',
        visible_estudiantes: true,
        permite_recuperacion: false,
      });
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setFormData({
      nombre: '',
      descripcion: '',
      tipo_evaluacion: 'examen',
      fecha_evaluacion: '',
      fecha_entrega: '',
      valor_porcentual: '',
      nota_maxima: '100',
      instrucciones: '',
      visible_estudiantes: true,
      permite_recuperacion: false,
    });
  };

  const handleGuardar = async () => {
    if (!grupoId) {
      setMensaje('Debes seleccionar un grupo primero.');
      return;
    }

    if (!formData.nombre.trim()) {
      setMensaje('El nombre de la evaluación es requerido.');
      return;
    }

    if (!formData.fecha_evaluacion) {
      setMensaje('La fecha de evaluación es requerida.');
      return;
    }

    const payload = {
      ...formData,
      nota_maxima: '100',
    };

    try {
      if (editando) {
        const res = await actualizarEvaluacion(editando, payload);
        setMensaje(res?.message || 'Evaluación actualizada correctamente.');
      } else {
        const res = await crearEvaluacion(grupoId, payload);
        setMensaje(res?.message || 'Evaluación creada correctamente.');
      }
      cerrarModal();
      await loadEvaluaciones();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'No se pudo guardar la evaluación.';
      setMensaje(msg);
    }
  };

  const handleEliminar = async (id) => {
    const ok = window.confirm('¿Seguro que deseas eliminar esta evaluación?');
    if (!ok) return;

    try {
      const res = await eliminarEvaluacion(id);
      setMensaje(res?.message || 'Evaluación eliminada correctamente.');
      await loadEvaluaciones();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'No se pudo eliminar la evaluación.';
      setMensaje(msg);
    }
  };

  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/docente/estudiantes');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluaciones"
        subtitle="Gestiona evaluaciones del grupo seleccionado"
      />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <button
            onClick={handleVolver}
            className="mb-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Volver
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Evaluaciones</h2>
          <p className="text-sm text-gray-500">
            Gestiona evaluaciones del grupo seleccionado.
          </p>
        </div>

        <button
          onClick={() => abrirModal()}
          className="rounded-lg bg-[#185fa5] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#378add]"
        >
          Crear evaluación
        </button>
      </div>

      {mensaje && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {mensaje}
        </div>
      )}

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
            <option value="">Seleccionar grupo/clase</option>
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
            placeholder="Buscar evaluación"
          />
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Valor</th>
                <th className="px-3 py-2">Nota Máx.</th>
                <th className="px-3 py-2">Visible</th>
                <th className="px-3 py-2">Recuperable</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan="8" className="px-3 py-6 text-center text-sm text-gray-500">
                    Cargando evaluaciones...
                  </td>
                </tr>
              )}

              {!loading && !grupoId && (
                <tr>
                  <td colSpan="8" className="px-3 py-6 text-center text-sm text-gray-500">
                    Selecciona una clase para ver las evaluaciones.
                  </td>
                </tr>
              )}

              {!loading && grupoId && filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-3 py-6 text-center text-sm text-gray-500">
                    No hay evaluaciones registradas en esta clase.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{e.nombre || 'N/A'}</td>
                    <td className="px-3 py-2 text-gray-700">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        {e.tipo_evaluacion || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{e.fecha_evaluacion || 'N/A'}</td>
                    <td className="px-3 py-2 text-gray-700">{e.valor_porcentual || 'N/A'}%</td>
                    <td className="px-3 py-2 text-gray-700">{e.nota_maxima || 'N/A'}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          e.visible_estudiantes
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {e.visible_estudiantes ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          e.permite_recuperacion
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {e.permite_recuperacion ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        onClick={() => abrirModal(e)}
                        className="text-[#185fa5] hover:text-[#0b2545] text-xs font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(e.id)}
                        className="text-red-600 hover:text-red-900 text-xs font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-200/40 backdrop-blur-[1px]">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {editando ? 'Editar evaluación' : 'Crear evaluación'}
            </h3>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Nombre de la evaluación"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Descripción"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.tipo_evaluacion}
                    onChange={(e) => setFormData({ ...formData, tipo_evaluacion: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    {tiposEvaluacion.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Evaluación</label>
                  <input
                    type="date"
                    value={formData.fecha_evaluacion}
                    onChange={(e) => setFormData({ ...formData, fecha_evaluacion: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Entrega</label>
                  <input
                    type="date"
                    value={formData.fecha_entrega}
                    onChange={(e) => setFormData({ ...formData, fecha_entrega: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Porcentual</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor_porcentual}
                    onChange={(e) => setFormData({ ...formData, valor_porcentual: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nota Máxima</label>
                  <input
                    type="number"
                    step="0.01"
                    value="100"
                    readOnly
                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                  />
                  <p className="mt-1 text-xs text-gray-500">La escala de calificación es fija de 0 a 100.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones</label>
                  <input
                    type="text"
                    value={formData.instrucciones}
                    onChange={(e) => setFormData({ ...formData, instrucciones: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Instrucciones"
                  />
                </div>
              </div>

            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={cerrarModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                className="rounded-lg bg-[#185fa5] px-4 py-2 text-sm font-medium text-white hover:bg-[#378add]"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
