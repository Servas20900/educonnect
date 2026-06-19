import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { crearReunion, getReuniones, actualizarReunion } from '../../api/reuniones';
import {
  ConfirmModal,
  ActiveArchiveToggle,
  DataTable,
  FormModal,
  PageHeader,
  SearchFilter,
  StatusBadge,
  BtnVer,
  BtnEditar,
  BtnArchivar,
  BtnRestaurar,
  Toast,
} from '../../components/ui';
import useToast from '../../hooks/useToast';

const initialForm = {
  fecha: '',
  hora_inicio: '08:00',
  hora_fin: '',
  tema: '',
  lugar: '',
  asistentes: '',
};


const todayStr = () => new Date().toISOString().split('T')[0];
const isWeekend = (dateStr) => { if (!dateStr) return false; const d = new Date(dateStr + 'T12:00:00'); return d.getDay() === 0 || d.getDay() === 6; };

const parseError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (typeof error?.detail === 'string') return error.detail;
  if (typeof error?.message === 'string') return error.message;
  const first = Object.entries(error || {})[0];
  if (first) {
    const [field, value] = first;
    if (Array.isArray(value) && value.length > 0) return `${field}: ${value[0]}`;
    if (typeof value === 'string') return `${field}: ${value}`;
  }
  return fallback;
};

const estadoNorm = (value) => String(value || '').toLowerCase();
const isArchivada = (estado) => estadoNorm(estado).includes('archiv');

const ReunionesForm = forwardRef(function ReunionesForm(
  { reunion, onSubmit, loading },
  ref
) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const raw = reunion?.asistentes;
    let asistentes = '';
    if (Array.isArray(raw) && raw.length > 0) {
      asistentes = raw.map((a) => typeof a === 'object' ? (a.nombre || a.name || '') : String(a)).filter(Boolean).join(', ');
    } else if (typeof raw === 'string') {
      asistentes = raw;
    }
    setForm({
      fecha: reunion?.fecha || '',
      hora_inicio: reunion?.hora_inicio || '08:00',
      hora_fin: reunion?.hora_fin || '',
      tema: reunion?.tema || '',
      lugar: reunion?.lugar || '',
      asistentes,
    });
  }, [reunion]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async () => {
    if (!form.fecha) throw new Error('La fecha es obligatoria.');
    if (form.fecha < todayStr()) throw new Error('No se puede agendar en una fecha pasada.');
    if (isWeekend(form.fecha)) throw new Error('No se puede agendar en sábado o domingo.');

    const asistentes = String(form.asistentes || '')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .map((nombre) => ({ nombre }));

    await onSubmit({ ...form, asistentes });
  };

  useImperativeHandle(ref, () => ({ submit }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Fecha</span>
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            min={todayStr()}
            className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${isWeekend(form.fecha) ? 'border-red-400 focus:border-red-400' : 'border-slate-300 focus:border-[#185fa5]'}`}
            disabled={loading}
          />
          {isWeekend(form.fecha) && (
            <p className="text-xs text-red-500">No se permiten sábados ni domingos.</p>
          )}
        </div>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Hora inicio</span>
          <input
            type="time"
            name="hora_inicio"
            value={form.hora_inicio}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
            disabled={loading}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Hora fin (opcional)</span>
          <input
            type="time"
            name="hora_fin"
            value={form.hora_fin}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
            disabled={loading}
          />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Tema</span>
        <textarea
          name="tema"
          value={form.tema}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
          disabled={loading}
        />
      </label>

      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Lugar</span>
        <input
          name="lugar"
          value={form.lugar}
          onChange={handleChange}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
          disabled={loading}
        />
      </label>

      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Asistentes</span>
        <input
          name="asistentes"
          value={form.asistentes}
          onChange={handleChange}
          placeholder="Ej: Juan Pérez, María López, Carlos Mora"
          disabled={loading}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
        />
        <p className="text-xs text-slate-400">Separados por coma</p>
      </label>
    </div>
  );
});

export default function AgendarReunion() {
  const formRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const comiteId = searchParams.get('comite_id') || '';
  const comiteNombre = searchParams.get('comite_nombre') || '';

  const [reuniones, setReuniones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchValue, setSearchValue] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('activas');

  const [modalOpen, setModalOpen] = useState(false);
  const [currentReunion, setCurrentReunion] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ open: false, reunion: null, action: null });
  const [detailModal, setDetailModal] = useState({ open: false, reunion: null });

  const { toast, showSuccess, showError, clearToast } = useToast();

  const loadReuniones = async () => {
    setLoading(true);
    try {
      const params = comiteId ? { comite_id: comiteId } : {};
      const data = await getReuniones(params);
      setReuniones(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      showError(parseError(error, 'No se pudieron cargar las reuniones.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReuniones();
  }, []);

  const openCreate = () => {
    setCurrentReunion(null);
    setModalOpen(true);
  };

  const openEdit = (reunion) => {
    setCurrentReunion(reunion);
    setModalOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setModalOpen(false);
    setCurrentReunion(null);
  };

  const handleSubmitReunion = async (form) => {
    if (!form.fecha || !form.hora_inicio || !form.tema || !form.lugar) {
      showError('Completa fecha, hora inicio, tema y lugar.');
      return;
    }

    setSaving(true);
    try {
      if (currentReunion?.id) {
        await actualizarReunion(currentReunion.id, form);
        showSuccess('Reunión actualizada correctamente.');
      } else {
        await crearReunion({ ...form, estado: 'Programada', ...(comiteId ? { comite: comiteId } : {}) });
        showSuccess('Reunión creada correctamente.');
      }

      setModalOpen(false);
      setCurrentReunion(null);
      await loadReuniones();
    } catch (error) {
      showError(parseError(error, 'No se pudo guardar la reunión.'));
    } finally {
      setSaving(false);
    }
  };

  const handleModalSubmit = async (event) => {
    event.preventDefault();
    try {
      if (formRef.current?.submit) {
        await formRef.current.submit();
      }
    } catch (error) {
      showError(parseError(error, 'No se pudo validar el formulario.'));
    }
  };

  const openConfirm = (reunion, action) => {
    setConfirmModal({ open: true, reunion, action });
  };

  const handleConfirm = async () => {
    const { reunion, action } = confirmModal;
    if (!reunion) return;

    setSaving(true);
    try {
      if (action === 'archive') {
        await actualizarReunion(reunion.id, { estado: 'Archivada' });
        showSuccess('Reunión archivada correctamente.');
      }
      if (action === 'unarchive') {
        await actualizarReunion(reunion.id, { estado: 'Programada' });
        showSuccess('Reunión desarchivada correctamente.');
      }
      await loadReuniones();
    } catch (error) {
      showError(parseError(error, 'No se pudo completar la acción sobre la reunión.'));
    } finally {
      setSaving(false);
      setConfirmModal({ open: false, reunion: null, action: null });
    }
  };

  const filtered = reuniones
    .filter((reunion) => (estadoFiltro === 'archivadas' ? isArchivada(reunion.estado) : !isArchivada(reunion.estado)))
    .filter((reunion) => {
      const q = searchValue.toLowerCase();
      return (
        String(reunion.tema || '').toLowerCase().includes(q) ||
        String(reunion.lugar || '').toLowerCase().includes(q)
      );
    });

  const columns = [
    {
      key: 'tema',
      label: 'Tema',
      render: (row) => <span className="font-medium text-slate-900">{row.tema}</span>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row) => <StatusBadge status={row.estado || 'Programada'} size="sm" />,
    },
    {
      key: 'fecha',
      label: 'Fecha y hora',
      render: (row) => (
        <span className="text-slate-600">
          {row.fecha} · {row.hora_inicio}
        </span>
      ),
    },
    {
      key: 'lugar',
      label: 'Lugar',
      render: (row) => <span className="text-slate-600">{row.lugar || 'N/A'}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <BtnVer onClick={() => setDetailModal({ open: true, reunion: row })} />
          <BtnEditar onClick={() => openEdit(row)} />
          {isArchivada(row.estado) ? (
            <BtnRestaurar onClick={() => openConfirm(row, 'unarchive')} />
          ) : (
            <BtnArchivar onClick={() => openConfirm(row, 'archive')} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {comiteNombre && (
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#e6f1fb] px-3 py-1 text-xs font-semibold text-[#185fa5]">
            {comiteNombre}
          </span>
        </div>
      )}

      <PageHeader
        title="Reuniones"
        subtitle={comiteNombre ? `Reuniones del comité: ${comiteNombre}` : 'Agendar, listar y consultar reuniones del comité'}
        action={{
          label: 'Nueva Reunión',
          onClick: openCreate,
          icon: '+',
        }}
      />

      <ActiveArchiveToggle
        viewMode={estadoFiltro === 'archivadas' ? 'archivados' : 'activos'}
        onChange={(mode) => setEstadoFiltro(mode === 'archivados' ? 'archivadas' : 'activas')}
        activeLabel="Reuniones Activas"
        archivedLabel="Reuniones Archivadas"
        activeCount={reuniones.filter((reunion) => !isArchivada(reunion.estado)).length}
        archivedCount={reuniones.filter((reunion) => isArchivada(reunion.estado)).length}
      />

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por tema o lugar"
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage={estadoFiltro === 'archivadas' ? 'No hay reuniones archivadas' : 'No hay reuniones registradas'}
        emptyAction={estadoFiltro === 'activas' ? { label: 'Crear nueva reunión', onClick: openCreate } : undefined}
      />

      <FormModal
        open={modalOpen}
        onClose={closeForm}
        onSubmit={handleModalSubmit}
        title={currentReunion ? 'Editar Reunión' : 'Nueva Reunión'}
        submitLabel={saving ? 'Procesando...' : currentReunion ? 'Actualizar Reunión' : 'Crear Reunión'}
        loading={saving}
        maxWidth="md"
      >
        <ReunionesForm
          ref={formRef}
          reunion={currentReunion}
          onSubmit={handleSubmitReunion}
          loading={saving}
        />
      </FormModal>

      <FormModal
        open={detailModal.open}
        onClose={() => setDetailModal({ open: false, reunion: null })}
        onSubmit={(event) => { event.preventDefault(); setDetailModal({ open: false, reunion: null }); }}
        title="Detalle de Reunión"
        submitLabel="Cerrar"
        hideCancel
        loading={false}
        maxWidth="md"
      >
        {detailModal.reunion && (
          <div className="space-y-4 text-sm text-slate-700">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Tema</p>
              <p className="font-medium text-slate-900">{detailModal.reunion.tema}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Fecha</p>
                <p>{detailModal.reunion.fecha}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Hora inicio</p>
                <p>{detailModal.reunion.hora_inicio}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Hora fin</p>
                <p>{detailModal.reunion.hora_fin || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Lugar</p>
                <p>{detailModal.reunion.lugar || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Integrantes / Asistentes</p>
              {(() => {
                const lista = Array.isArray(detailModal.reunion.asistentes) ? detailModal.reunion.asistentes : [];
                if (lista.length === 0) return <p className="text-slate-400 text-xs">Sin asistentes registrados.</p>;
                return (
                  <ul className="space-y-1">
                    {lista.map((a, i) => (
                      <li key={i} className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                        <span className="font-medium text-slate-900">{typeof a === 'object' ? (a.nombre || '—') : String(a)}</span>
                        {typeof a === 'object' && a.cargo && (
                          <span className="text-xs text-slate-500">· {a.cargo}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.action === 'archive' ? 'Archivar Reunión' : 'Desarchivar Reunión'}
        message={
          confirmModal.action === 'archive'
            ? 'Esta reunión se moverá al listado de archivadas.'
            : 'La reunión volverá al listado principal.'
        }
        variant={confirmModal.action === 'archive' ? 'warning' : 'info'}
        confirmLabel={confirmModal.action === 'archive' ? 'Archivar' : 'Desarchivar'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal({ open: false, reunion: null, action: null })}
        loading={saving}
      />

      <Toast message={toast?.message} variant={toast?.variant} onClose={clearToast} />
    </div>
  );
}
