import { useEffect, useMemo, useState } from 'react';
import { createComunicado, fetchComunicados, hideComunicado } from '../../api/comunicadosService';

const initialForm = {
  titulo: '',
  contenido: '',
  tipo_comunicado: 'aviso',
  destinatarios: ['estudiantes'],
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

export default function Comunicados() {
  const [comunicados, setComunicados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

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

  const handleDestinatarioChange = (destinatario) => {
    setForm((prev) => {
      const alreadySelected = prev.destinatarios.includes(destinatario);
      const next = alreadySelected
        ? prev.destinatarios.filter((item) => item !== destinatario)
        : [...prev.destinatarios, destinatario];

      return {
        ...prev,
        destinatarios: next
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.destinatarios.length === 0) {
      setError('Selecciona al menos un destinatario.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await createComunicado({
        ...form,
        fecha_vigencia: form.fecha_vigencia || null
      });
      setForm(initialForm);
      await cargarComunicados();
    } catch {
      setError('No se pudo crear el comunicado. Verifica los datos.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOcultar = async (id) => {
    try {
      await hideComunicado(id);
      await cargarComunicados();
    } catch {
      setError('No se pudo ocultar el comunicado.');
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
        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleFieldChange}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Título"
            required
          />
          <select
            name="tipo_comunicado"
            value={form.tipo_comunicado}
            onChange={handleFieldChange}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="aviso">Aviso</option>
            <option value="tarea">Tarea</option>
            <option value="cambio">Cambio</option>
          </select>
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

        <div className="grid gap-3 md:grid-cols-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.destinatarios.includes('estudiantes')}
              onChange={() => handleDestinatarioChange('estudiantes')}
            />
            Estudiantes
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.destinatarios.includes('encargados')}
              onChange={() => handleDestinatarioChange('encargados')}
            />
            Encargados
          </label>
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
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Enviando...' : 'Emitir comunicado'}
        </button>
      </form>

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
                      {comunicado.visible ? (
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleOcultar(comunicado.id)}
                        >
                          Ocultar
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
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
