import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { crearReunion, getReuniones, actualizarReunion } from '../../api/reuniones';
import {
  ConfirmModal,
  DataTable,
  FormModal,
  PageHeader,
  SearchFilter,
  StatusBadge,
} from '../../components/ui';

const initialForm = {
  fecha: '',
  hora_inicio: '08:00',
  hora_fin: '',
  tema: '',
  lugar: '',
  asistentes: '[]',
};

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
    setForm({
      fecha: reunion?.fecha || '',
      hora_inicio: reunion?.hora_inicio || '08:00',
      hora_fin: reunion?.hora_fin || '',
      tema: reunion?.tema || '',
      lugar: reunion?.lugar || '',
      asistentes: JSON.stringify(reunion?.asistentes || [], null, 0),
    });
  }, [reunion]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async () => {
    let asistentes;
    try {
      asistentes = JSON.parse(form.asistentes || '[]');
      if (!Array.isArray(asistentes)) {
        throw new Error('asistentes debe ser un arreglo JSON.');
      }
    } catch {
      throw new Error('El campo asistentes debe ser un JSON válido (ejemplo: [] o [{"id":1}]).');
    }

    await onSubmit({
      ...form,
      asistentes,
    });
  };

  useImperativeHandle(ref, () => ({ submit }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Fecha</span>
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
            disabled={loading}
          />
        </label>

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
        <span className="font-medium text-slate-700">Asistentes (JSON)</span>
        <textarea
          name="asistentes"
          value={form.asistentes}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-[#185fa5] focus:outline-none"
          disabled={loading}
          placeholder='Ejemplo: [{"id": 1}, {"id": 2}]'
        />
      </label>
    </div>
  );
});

export default function AgendarReunion() {
  const formRef = useRef(null);

  const [reuniones, setReuniones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchValue, setSearchValue] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('activas');

  const [modalOpen, setModalOpen] = useState(false);
  const [currentReunion, setCurrentReunion] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ open: false, reunion: null, action: null });
  const [detailModal, setDetailModal] = useState({ open: false, reunion: null });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadReuniones = async () => {
    setLoading(true);
    try {
      const data = await getReuniones();
      setReuniones(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      setErrorMessage(parseError(error, 'No se pudieron cargar las reuniones.'));
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
      setErrorMessage('Completa fecha, hora inicio, tema y lugar.');
      return;
    }

    setSaving(true);
    try {
      if (currentReunion?.id) {
        await actualizarReunion(currentReunion.id, form);
        setSuccessMessage('Reunión actualizada correctamente.');
      } else {
        await crearReunion({ ...form, estado: 'Programada' });
        setSuccessMessage('Reunión creada correctamente.');
      }

      setModalOpen(false);
      setCurrentReunion(null);
      await loadReuniones();
    } catch (error) {
      setErrorMessage(parseError(error, 'No se pudo guardar la reunión.'));
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
      setErrorMessage(parseError(error, 'No se pudo validar el formulario.'));
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
        setSuccessMessage('Reunión archivada correctamente.');
      }
      if (action === 'unarchive') {
        await actualizarReunion(reunion.id, { estado: 'Programada' });
        setSuccessMessage('Reunión desarchivada correctamente.');
      }
      await loadReuniones();
    } catch (error) {
      setErrorMessage(parseError(error, 'No se pudo completar la acción sobre la reunión.'));
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
          <button
            onClick={() => setDetailModal({ open: true, reunion: row })}
            className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#081a31]"
          >
            Ver detalle
          </button>
          <button
            onClick={() => openEdit(row)}
            className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#378add]"
          >
            Editar
          </button>
          {isArchivada(row.estado) ? (
            <button
              onClick={() => openConfirm(row, 'unarchive')}
              className="rounded-md bg-[#0f6e56] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#085041]"
            >
              Desarchivar
            </button>
          ) : (
            <button
              onClick={() => openConfirm(row, 'archive')}
              className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#081a31]"
            >
              Archivar
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reuniones"
        subtitle="Agendar, listar y consultar reuniones del comité"
        action={{
          label: 'Nueva Reunión',
          onClick: openCreate,
          icon: '+',
        }}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEstadoFiltro((prev) => (prev === 'archivadas' ? 'activas' : 'archivadas'))}
          className="rounded-md border border-[#185fa5] px-4 py-2 text-sm font-medium text-[#185fa5] transition-colors hover:bg-[#e6f1fb]"
        >
          {estadoFiltro === 'archivadas' ? 'Ver reuniones activas' : 'Ver reuniones archivadas'}
        </button>
      </div>

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
        onSubmit={(event) => event.preventDefault()}
        title="Detalle de Reunión"
        submitLabel="Cerrar"
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
              <p className="text-xs uppercase tracking-wide text-slate-500">Asistentes (JSON)</p>
              <pre className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
{JSON.stringify(detailModal.reunion.asistentes || [], null, 2)}
              </pre>
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

      {successMessage && (
        <div className="fixed bottom-4 right-4 z-[1300] rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-4 left-4 z-[1300] rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
