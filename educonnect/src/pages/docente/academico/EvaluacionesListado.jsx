import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Calendar, ClipboardList, RefreshCw, X } from 'lucide-react';
import { ActiveArchiveToggle, ConfirmModal, DataTable, PageHeader, BtnEditar, BtnArchivar, BtnRestaurar } from '../../../components/ui';
import { fetchGruposDocente } from '../../../api/registroEstudiantesService';
import {
  fetchEvaluacionesPorGrupo,
  crearEvaluacion,
  actualizarEvaluacion,
  eliminarEvaluacion,
  activarEvaluacion,
} from '../../../api/evaluacionesService';

const DOCENTE_GRUPO_STORAGE_KEY = 'docente_academico_hub_grupo_id';

const today = () => new Date().toISOString().split('T')[0];

const isWeekend = (dateStr) => {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return dow === 0 || dow === 6;
};

const dayName = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CR', { weekday: 'long' });
};

const TIPO_CONFIG = {
  actividad: { label: 'Actividad', color: 'bg-violet-50 text-violet-700' },
  examen:    { label: 'Examen',    color: 'bg-blue-50 text-blue-700' },
  tarea:     { label: 'Tarea',     color: 'bg-amber-50 text-amber-700' },
};

const DEFAULT_FORM = {
  nombre: '',
  descripcion: '',
  tipo_evaluacion: 'examen',
  fecha_evaluacion: '',
  fecha_entrega: '',
  valor_porcentual: '',
  nota_maxima: '100',
  instrucciones: '',
};

function DateField({ label, value, onChange, min, error, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
        {label}
      </label>
      <input
        type="date"
        value={value}
        min={min || today()}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#185fa5] ${
          error
            ? 'border-red-400 bg-red-50 focus:ring-red-400'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {!error && hint && (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

export default function EvaluacionesListado() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryGrupoId = searchParams.get('grupo');

  const [grupoId, setGrupoId] = useState('');
  const [grupos, setGrupos] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('activos');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState({});

  const set = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // ── fecha_evaluacion change: clear fecha_entrega if it's now before evaluacion ──
  const handleFechaEvaluacion = (val) => {
    set('fecha_evaluacion', val);
    if (formData.fecha_entrega && formData.fecha_entrega < val) {
      set('fecha_entrega', '');
    }
  };

  const loadGrupos = async () => {
    try {
      const data = await fetchGruposDocente();
      const list = Array.isArray(data) ? data : data.results || [];
      setGrupos(list);
      const persisted = localStorage.getItem(DOCENTE_GRUPO_STORAGE_KEY);
      if (queryGrupoId && list.some((g) => String(g.id) === String(queryGrupoId))) {
        setGrupoId(String(queryGrupoId)); return;
      }
      if (persisted && list.some((g) => String(g.id) === String(persisted))) {
        setGrupoId(String(persisted)); return;
      }
      if (list.length > 0) setGrupoId(String(list[0].id));
    } catch {
      setError('No se pudieron cargar los grupos del docente.');
    }
  };

  const loadEvaluaciones = async () => {
    if (!grupoId) { setEvaluaciones([]); return; }
    setLoading(true); setError('');
    try {
      const data = await fetchEvaluacionesPorGrupo(grupoId, { incluir_archivados: true });
      setEvaluaciones(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError('No se pudieron cargar las evaluaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGrupos(); }, []);
  useEffect(() => {
    if (!queryGrupoId || !grupos.some((g) => String(g.id) === String(queryGrupoId))) return;
    setGrupoId(String(queryGrupoId));
  }, [queryGrupoId, grupos]);
  useEffect(() => { if (grupoId) localStorage.setItem(DOCENTE_GRUPO_STORAGE_KEY, grupoId); }, [grupoId]);
  useEffect(() => { loadEvaluaciones(); }, [grupoId]);

  const esActiva = (ev) => String(ev?.estado || 'activo').toLowerCase() === 'activo';

  const evaluacionesActivas = useMemo(
    () => evaluaciones.filter(esActiva),
    [evaluaciones]
  );
  const evaluacionesArchivadas = useMemo(
    () => evaluaciones.filter((e) => !esActiva(e)),
    [evaluaciones]
  );

  const filtered = useMemo(() => {
    const base = viewMode === 'archivados' ? evaluacionesArchivadas : evaluacionesActivas;
    if (!search.trim()) return base;
    const term = search.trim().toLowerCase();
    return base.filter((e) =>
      (e.nombre || '').toLowerCase().includes(term) ||
      (e.descripcion || '').toLowerCase().includes(term) ||
      (e.tipo_evaluacion || '').toLowerCase().includes(term)
    );
  }, [evaluacionesActivas, evaluacionesArchivadas, viewMode, search]);

  const abrirModal = (ev = null) => {
    setFormErrors({});
    if (ev) {
      setEditando(ev.id);
      setFormData({
        nombre: ev.nombre || '',
        descripcion: ev.descripcion || '',
        tipo_evaluacion: ev.tipo_evaluacion || 'examen',
        fecha_evaluacion: ev.fecha_evaluacion || '',
        fecha_entrega: ev.fecha_entrega || '',
        valor_porcentual: ev.valor_porcentual || '',
        nota_maxima: '100',
        instrucciones: ev.instrucciones || '',
      });
    } else {
      setEditando(null);
      setFormData(DEFAULT_FORM);
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!formData.nombre.trim()) errs.nombre = 'El nombre es requerido.';
    if (!formData.fecha_evaluacion) {
      errs.fecha_evaluacion = 'La fecha de evaluación es requerida.';
    } else if (isWeekend(formData.fecha_evaluacion)) {
      errs.fecha_evaluacion = `Los fines de semana no son válidos (${dayName(formData.fecha_evaluacion)}).`;
    }
    if (formData.fecha_entrega) {
      if (isWeekend(formData.fecha_entrega)) {
        errs.fecha_entrega = `Los fines de semana no son válidos (${dayName(formData.fecha_entrega)}).`;
      } else if (formData.fecha_evaluacion && formData.fecha_entrega < formData.fecha_evaluacion) {
        errs.fecha_entrega = 'La fecha de entrega no puede ser anterior a la fecha de evaluación.';
      }
    }
    if (!formData.valor_porcentual || Number(formData.valor_porcentual) <= 0) {
      errs.valor_porcentual = 'Ingresa un valor porcentual mayor a 0.';
    }
    return errs;
  };

  const handleGuardar = async () => {
    if (!grupoId) { setMensaje('Debes seleccionar un grupo primero.'); return; }
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setSaving(true);
    try {
      // visible_estudiantes/permite_recuperacion no tienen ningún efecto real en
      // el sistema (no hay pantalla de estudiante que los lea ni lógica de
      // recuperación en ningún lado), pero el backend los sigue exigiendo por
      // ahora, así que se mandan fijos en vez de exponerlos en el formulario.
      const payload = { ...formData, nota_maxima: '100', visible_estudiantes: true, permite_recuperacion: false };
      if (editando) {
        await actualizarEvaluacion(editando, payload);
        setMensaje('Evaluación actualizada correctamente.');
      } else {
        await crearEvaluacion(grupoId, payload);
        setMensaje('Evaluación creada correctamente.');
      }
      cerrarModal();
      await loadEvaluaciones();
    } catch (err) {
      setMensaje(err?.response?.data?.detail || 'No se pudo guardar la evaluación.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchivoConfirmado = async () => {
    const { id } = confirmModal;
    setConfirmModal({ open: false, id: null });
    try {
      if (viewMode === 'archivados') {
        await activarEvaluacion(id);
        setMensaje('Evaluación restaurada correctamente.');
      } else {
        await eliminarEvaluacion(id);
        setMensaje('Evaluación archivada correctamente.');
      }
      await loadEvaluaciones();
    } catch (err) {
      setMensaje(err?.response?.data?.detail || 'No se pudo completar la acción.');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title="Evaluaciones"
        subtitle="Gestiona evaluaciones del grupo seleccionado."
        action={{ label: 'Crear evaluación', onClick: () => abrirModal() }}
      />

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

      <ActiveArchiveToggle
        viewMode={viewMode}
        onChange={setViewMode}
        activeLabel="Activas"
        archivedLabel="Archivadas"
        activeCount={evaluacionesActivas.length}
        archivedCount={evaluacionesArchivadas.length}
      />

      {/* ── Filtros ── */}
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
            placeholder="Buscar por nombre, tipo…"
          />
        </div>

        <DataTable
          loading={loading}
          data={filtered}
          pageSize={8}
          emptyMessage={grupoId ? 'No hay evaluaciones registradas en esta clase.' : 'Selecciona una clase para ver las evaluaciones.'}
          columns={[
            {
              key: 'nombre',
              label: 'Nombre',
              render: (e) => <span className="font-medium text-gray-900">{e.nombre || 'N/A'}</span>,
            },
            {
              key: 'tipo',
              label: 'Tipo',
              render: (e) => {
                const cfg = TIPO_CONFIG[e.tipo_evaluacion] || { label: e.tipo_evaluacion, color: 'bg-gray-50 text-gray-700' };
                return (
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${cfg.color}`}>
                    {cfg.label}
                  </span>
                );
              },
            },
            {
              key: 'fecha',
              label: 'Fecha evaluación',
              render: (e) => <span className="text-gray-700">{e.fecha_evaluacion || '—'}</span>,
            },
            {
              key: 'entrega',
              label: 'Fecha entrega',
              render: (e) => <span className="text-gray-700">{e.fecha_entrega || '—'}</span>,
            },
            {
              key: 'valor',
              label: 'Valor',
              render: (e) => <span className="font-medium text-gray-700">{e.valor_porcentual ?? '—'}%</span>,
            },
            {
              key: 'acciones',
              label: 'Acciones',
              render: (e) => (
                <div className="flex justify-end gap-2">
                  <BtnEditar onClick={() => abrirModal(e)} />
                  {viewMode === 'archivados' ? (
                    <BtnRestaurar onClick={() => setConfirmModal({ open: true, id: e.id })} />
                  ) : (
                    <BtnArchivar onClick={() => setConfirmModal({ open: true, id: e.id })} />
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* ── Modal ── */}
      {modalAbierto && (
        <div
          // z-[1300]: el header (AppBar de MUI) y el sidebar (Drawer de MUI) usan
          // z-index 1100/1200 por defecto. Con z-50 este modal quedaba dibujado
          // DETRÁS de ambos. 1300 es el mismo z-index que usa el Dialog de MUI
          // (el que usan el resto de los formularios vía el componente FormModal),
          // así este modal queda por encima de todo igual que los demás.
          className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header del modal */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e6f1fb] text-[#185fa5]">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#0b2545]">
                    {editando ? 'Editar evaluación' : 'Nueva evaluación'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editando ? 'Modifica los datos de la evaluación' : 'Completa los datos para crear la evaluación'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cuerpo del modal */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

              {/* Sección: Información general */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-[#185fa5]" />
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Información general</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => set('nombre', e.target.value)}
                      placeholder="Ej. Examen parcial I, Tarea lecturas…"
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#185fa5] ${
                        formErrors.nombre ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                      }`}
                    />
                    {formErrors.nombre && (
                      <p className="mt-1 text-xs text-red-600">⚠ {formErrors.nombre}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                        Tipo de evaluación
                      </label>
                      <select
                        value={formData.tipo_evaluacion}
                        onChange={(e) => set('tipo_evaluacion', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#185fa5]"
                      >
                        {Object.entries(TIPO_CONFIG).map(([val, { label }]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                        Valor porcentual <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formData.valor_porcentual}
                          onChange={(e) => set('valor_porcentual', e.target.value)}
                          placeholder="0.00"
                          className={`w-full rounded-lg border px-3 py-2.5 pr-8 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#185fa5] ${
                            formErrors.valor_porcentual ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                          }`}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                      </div>
                      {formErrors.valor_porcentual && (
                        <p className="mt-1 text-xs text-red-600">⚠ {formErrors.valor_porcentual}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                      Descripción
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => set('descripcion', e.target.value)}
                      placeholder="Descripción breve de la evaluación…"
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#185fa5] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                      Instrucciones
                    </label>
                    <input
                      type="text"
                      value={formData.instrucciones}
                      onChange={(e) => set('instrucciones', e.target.value)}
                      placeholder="Instrucciones generales para los estudiantes…"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#185fa5]"
                    />
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Sección: Fechas */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-[#185fa5]" />
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Fechas</h3>
                </div>
                <p className="text-xs text-slate-400 mb-3">Solo se permiten días hábiles (lunes a viernes). No se aceptan fechas anteriores a hoy.</p>
                <div className="grid grid-cols-2 gap-4">
                  <DateField
                    label="Fecha de evaluación *"
                    value={formData.fecha_evaluacion}
                    onChange={handleFechaEvaluacion}
                    min={today()}
                    error={formErrors.fecha_evaluacion}
                    hint={formData.fecha_evaluacion ? `${dayName(formData.fecha_evaluacion)}` : 'Selecciona una fecha'}
                  />
                  <DateField
                    label="Fecha de entrega"
                    value={formData.fecha_entrega}
                    onChange={(val) => set('fecha_entrega', val)}
                    min={formData.fecha_evaluacion || today()}
                    error={formErrors.fecha_entrega}
                    hint={
                      formData.fecha_entrega
                        ? dayName(formData.fecha_entrega)
                        : formData.fecha_evaluacion
                        ? 'Desde la fecha de evaluación'
                        : 'Primero selecciona fecha de evaluación'
                    }
                  />
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Nota máxima informativa */}
              <div className="rounded-xl bg-[#e6f1fb] border border-[#cfe4f6] px-4 py-3 flex items-center gap-3">
                <RefreshCw className="h-4 w-4 text-[#185fa5] shrink-0" />
                <p className="text-xs text-[#185fa5]">
                  La escala de calificación es fija de <strong>0 a 100</strong> puntos para todas las evaluaciones.
                </p>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={cerrarModal}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={saving}
                className="rounded-lg bg-[#185fa5] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0b2545] transition-colors disabled:opacity-60"
              >
                {saving ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear evaluación'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmModal.open}
        title={viewMode === 'archivados' ? 'Restaurar evaluación' : 'Archivar evaluación'}
        message={
          viewMode === 'archivados'
            ? 'La evaluación volverá a estar activa y contará de nuevo en calificaciones, promedios y riesgo académico.'
            : 'La evaluación dejará de contar en calificaciones, promedios y riesgo académico. Las notas ya registradas no se pierden y se puede restaurar luego.'
        }
        confirmLabel={viewMode === 'archivados' ? 'Restaurar' : 'Archivar'}
        variant={viewMode === 'archivados' ? 'info' : 'warning'}
        onConfirm={handleToggleArchivoConfirmado}
        onCancel={() => setConfirmModal({ open: false, id: null })}
      />
    </div>
  );
}
