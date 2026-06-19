import { useEffect, useMemo, useState } from 'react';
import {
  createComunicado,
  fetchComunicados,
  hideComunicado,
  setComunicadoVisible,
  updateComunicado,
} from '../../api/comunicadosService';
import { ConfirmModal, DataTable, PageHeader, BtnEditar, BtnArchivar, BtnActivar, BtnDesactivar } from '../../components/ui';

const initialForm = {
  titulo: '',
  contenido: '',
  fecha_vigencia: ''
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-CR');
};

const formatDestinatarios = (destinatarios = []) => {
  if (!Array.isArray(destinatarios) || destinatarios.length === 0) return '—';
  const labels = {
    estudiantes: 'Estudiantes',
    encargados: 'Encargados'
  };
  return destinatarios.map((item) => labels[item] || item).join(', ');
};

const extractApiErrorMessage = (error) => {
  const payload = error?.response?.data || error;
  if (!payload) return 'No se pudo procesar el comunicado. Verifica los datos.';

  if (typeof payload === 'string') return payload;
  if (typeof payload.detail === 'string') return payload.detail;
  if (typeof payload.message === 'string') return payload.message;

  const firstKey = Object.keys(payload)[0];
  if (firstKey) {
    const firstValue = payload[firstKey];
    if (Array.isArray(firstValue) && firstValue.length > 0) return String(firstValue[0]);
    if (typeof firstValue === 'string') return firstValue;
  }

  return 'No se pudo procesar el comunicado. Verifica los datos.';
};

export default function Comunicados() {
  const [comunicados, setComunicados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const cargarComunicados = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchComunicados();
      setComunicados(data || []);
    } catch {
      setError('No se pudieron cargar los comunicados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarComunicados();
  }, []);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setError('');
    setMensaje('');
    try {
      const normalizedFecha = form.fecha_vigencia ? new Date(form.fecha_vigencia) : null;
      if (form.fecha_vigencia && Number.isNaN(normalizedFecha.getTime())) {
        setError('La fecha de vigencia no tiene un formato válido.');
        setSubmitting(false);
        return;
      }

      const payload = {
        ...form,
        tipo_comunicado: 'aviso',
        destinatarios: ['estudiantes', 'encargados'],
        fecha_vigencia: normalizedFecha ? normalizedFecha.toISOString() : null
      };

      if (editingId) {
        await updateComunicado(editingId, payload);
        setMensaje('Comunicado actualizado correctamente.');
      } else {
        await createComunicado(payload);
        setMensaje('Comunicado creado correctamente.');
      }

      setForm(initialForm);
      setEditingId(null);
      await cargarComunicados();
    } catch (err) {
      const detail = extractApiErrorMessage(err);
      setError(editingId
        ? `No se pudo actualizar el comunicado. ${detail}`
        : `No se pudo crear el comunicado. ${detail}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditar = (comunicado) => {
    setEditingId(comunicado.id);
    setError('');
    setMensaje('Editando comunicado seleccionado.');
    setForm({
      titulo: comunicado.titulo || '',
      contenido: comunicado.contenido || '',
      fecha_vigencia: comunicado.fecha_vigencia
        ? new Date(comunicado.fecha_vigencia).toISOString().slice(0, 16)
        : ''
    });
  };

  const handleCancelarEdicion = () => {
    setEditingId(null);
    setForm(initialForm);
    setMensaje('');
    setError('');
  };

  const handleOcultar = (id) => {
    setConfirmModal({ open: true, id });
  };

  const handleOcultarConfirmado = async () => {
    const id = confirmModal.id;
    setConfirmModal({ open: false, id: null });
    setError('');
    setMensaje('');
    try {
      await hideComunicado(id);
      if (editingId === id) handleCancelarEdicion();
      setMensaje('Comunicado archivado correctamente.');
      await cargarComunicados();
    } catch {
      setError('No se pudo archivar el comunicado.');
    }
  };

  const handleToggleVisible = async (id, visible) => {
    setError('');
    setMensaje('');
    try {
      await setComunicadoVisible(id, visible);
      setMensaje(visible ? 'Comunicado publicado.' : 'Comunicado despublicado.');
      await cargarComunicados();
    } catch {
      setError('No se pudo cambiar la visibilidad del comunicado.');
    }
  };

  const comunicadosFiltrados = useMemo(() => {
    return comunicados.filter((item) => {
      const titulo = item.titulo?.toLowerCase() || '';
      const coincideBusqueda = titulo.includes(searchTerm.toLowerCase());
      const estado = item.visible ? 'visible' : 'oculto';
      const coincideEstado = statusFilter === 'todos' ? true : estado === statusFilter;
      return coincideBusqueda && coincideEstado;
    });
  }, [comunicados, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comunicados"
        subtitle="Envía avisos, tareas o cambios a estudiantes y encargados."
        showBackButton={false}
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-700">
            {editingId ? 'Editar comunicado' : 'Nuevo comunicado'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelarEdicion}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleFieldChange}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Título"
            required
          />
          <div className="w-full rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Tipo: Aviso (fijo)
          </div>
        </div>

        <textarea
          name="contenido"
          value={form.contenido}
          onChange={handleFieldChange}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          rows={4}
          placeholder="Contenido del comunicado"
          required
        />

        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          Destinatarios automáticos: Estudiantes y Encargados
        </div>

        <input
          type="datetime-local"
          name="fecha_vigencia"
          value={form.fecha_vigencia}
          onChange={handleFieldChange}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-72"
        />

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#185fa5] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#0c447c] disabled:opacity-60"
        >
          {submitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Emitir comunicado'}
        </button>
      </form>

      {mensaje && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/3"
            placeholder="Buscar comunicado"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-40"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="visible">Visible</option>
            <option value="oculto">Oculto</option>
          </select>
        </div>

        <div className="mt-4">
          <DataTable
            loading={loading}
            data={comunicadosFiltrados}
            emptyMessage="No hay comunicados para mostrar."
            columns={[
              {
                key: 'titulo',
                label: 'Asunto',
                render: (c) => <span className="font-medium text-slate-900">{c.titulo || '—'}</span>,
              },
              {
                key: 'destinatarios',
                label: 'Destinatarios',
                render: (c) => <span className="text-slate-600">{formatDestinatarios(c.destinatarios)}</span>,
              },
              {
                key: 'tipo',
                label: 'Tipo',
                render: (c) => <span className="text-slate-600">{c.tipo_comunicado || 'aviso'}</span>,
              },
              {
                key: 'estado',
                label: 'Estado',
                render: (c) => (
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${c.visible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {c.visible ? 'Visible' : 'Oculto'}
                  </span>
                ),
              },
              {
                key: 'vigencia',
                label: 'Vigencia',
                render: (c) => <span className="text-slate-600">{formatDate(c.fecha_vigencia)}</span>,
              },
              {
                key: 'acciones',
                label: 'Acciones',
                render: (c) => (
                  <div className="flex flex-wrap justify-end gap-2">
                    <BtnEditar onClick={() => handleEditar(c)} />
                    {c.visible ? (
                      <BtnDesactivar onClick={() => handleToggleVisible(c.id, false)} />
                    ) : (
                      <BtnActivar onClick={() => handleToggleVisible(c.id, true)} />
                    )}
                    <BtnArchivar onClick={() => handleOcultar(c.id)} />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    <ConfirmModal
        open={confirmModal.open}
        title="Archivar comunicado"
        message="¿Seguro que deseas archivar este comunicado? Dejará de ser visible para los destinatarios."
        confirmLabel="Archivar"
        variant="warning"
        onConfirm={handleOcultarConfirmado}
        onCancel={() => setConfirmModal({ open: false, id: null })}
      />
    </div>
  );
}
