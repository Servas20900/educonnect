import { useEffect, useMemo, useState } from 'react';
import {
  createComunicado,
  fetchComunicados,
  hideComunicado,
  setComunicadoVisible,
  updateComunicado,
} from '../../api/comunicadosService';

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

  const handleOcultar = async (id) => {
    const ok = window.confirm('¿Seguro que deseas eliminar este comunicado? Se ocultará para los destinatarios.');
    if (!ok) return;

    setError('');
    setMensaje('');
    try {
      await hideComunicado(id);
      if (editingId === id) {
        handleCancelarEdicion();
      }
      setMensaje('Comunicado eliminado correctamente.');
      await cargarComunicados();
    } catch {
      setError('No se pudo eliminar el comunicado.');
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
      <div>
        <h2 className="text-2xl font-bold">Comunicados</h2>
        <p className="text-sm text-gray-500">Envía avisos, tareas o cambios a estudiantes y encargados.</p>
      </div>

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
          className="rounded-lg bg-[#185fa5] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#378add] disabled:opacity-60"
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

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Asunto</th>
                <th className="px-3 py-2">Destinatarios</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">Cargando comunicados...</td>
                </tr>
              ) : comunicadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">No hay comunicados para mostrar.</td>
                </tr>
              ) : (
                comunicadosFiltrados.map((comunicado) => (
                  <tr key={comunicado.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{comunicado.titulo}</td>
                    <td className="px-3 py-2 text-gray-700">{formatDestinatarios(comunicado.destinatarios)}</td>
                    <td className="px-3 py-2 text-gray-700 capitalize">{comunicado.tipo_comunicado}</td>
                    <td className="px-3 py-2 text-gray-600">{formatDate(comunicado.fecha_publicacion)}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${comunicado.visible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {comunicado.visible ? 'Visible' : 'Oculto'}
                      </span>
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      <button
                        className="text-[#185fa5] hover:text-[#0b2545]"
                        onClick={() => handleEditar(comunicado)}
                      >
                        Editar
                      </button>

                      {comunicado.visible ? (
                        <button
                          className="text-amber-700 hover:text-amber-900"
                          onClick={() => handleToggleVisible(comunicado.id, false)}
                        >
                          Despublicar
                        </button>
                      ) : (
                        <button
                          className="text-emerald-700 hover:text-emerald-900"
                          onClick={() => handleToggleVisible(comunicado.id, true)}
                        >
                          Publicar
                        </button>
                      )}

                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleOcultar(comunicado.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
