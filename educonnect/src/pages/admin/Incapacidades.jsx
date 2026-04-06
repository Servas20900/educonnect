import { useEffect, useState } from 'react';
import { Upload, Plus, Trash2, Edit2, Download, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import {
  createIncapacidad,
  fetchCatalogoDocentes,
  fetchIncapacidades,
  updateIncapacidad,
} from '../../api/incapacidades';

const defaultForm = {
  docente: '',
  tipo: 'incapacidad',
  fecha_inicio: '',
  fecha_fin: '',
  motivo: '',
  numero_documento: '',
  institucion_emisora: '',
  archivo: null,
};

const defaultFiltros = {
  tipo: '',
  docenteId: '',
  fechaDesde: '',
  fechaHasta: '',
};

const tipoLabel = {
  incapacidad: 'Incapacidad',
  justificante: 'Justificante',
  permiso: 'Permiso',
};

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function DropZone({ archivo, onArchivoChange }) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onArchivoChange(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) {
      onArchivoChange(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-300 bg-slate-50 hover:border-slate-400'
      }`}
    >
      <input
        type="file"
        onChange={handleChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <div className="px-6 py-8 text-center">
        <svg className="mx-auto h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
        </svg>
        <div className="text-sm text-slate-600">
          {archivo ? (
            <span className="font-semibold text-green-700">{archivo.name}</span>
          ) : (
            <>
              <span className="font-semibold text-blue-600">Arrastra archivo aqui</span> o haz clic para seleccionar
            </>
          )}
        </div>
        <div className="mt-1 text-xs text-slate-500">PDF, DOC, DOCX, JPG, PNG (máx 10MB)</div>
      </div>
    </div>
  );
}

export default function Incapacidades() {
  const [items, setItems] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [filtros, setFiltros] = useState(defaultFiltros);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ text: '', type: 'info' });

  const onChangeFiltro = (key, value) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  };

  const onChangeForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onDocenteChange = (docenteId) => {
    const docenteSeleccionado = docentes.find((item) => String(item.id) === String(docenteId));
    setForm((prev) => ({
      ...prev,
      docente: docenteId,
      numero_documento: docenteSeleccionado?.identificacion || '',
    }));
  };

  const cargarDocentes = async () => {
    try {
      const data = await fetchCatalogoDocentes();
      setDocentes(Array.isArray(data) ? data : []);
    } catch (error) {
      const msg = error?.detail || error?.message || 'No se pudo cargar docentes';
      setAlert({ text: msg, type: 'err' });
    }
  };

  const cargarIncapacidades = async (filtrosActivos = filtros) => {
    try {
      setLoading(true);
      const data = await fetchIncapacidades(filtrosActivos);
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      const msg = error?.detail || error?.message || 'No se pudo cargar incapacidades';
      setAlert({ text: msg, type: 'err' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDocentes();
    cargarIncapacidades(defaultFiltros);
  }, []);

  const limpiarFormulario = () => {
    setForm(defaultForm);
  };

  const registrar = async () => {
    if (!form.docente || !form.fecha_inicio || !form.fecha_fin || !form.motivo || !form.numero_documento || !form.institucion_emisora) {
      setAlert({ text: 'Completa todos los campos obligatorios del formulario', type: 'err' });
      return;
    }

    const payload = new FormData();
    payload.append('docente', form.docente);
    payload.append('tipo', form.tipo);
    payload.append('fecha_inicio', form.fecha_inicio);
    payload.append('fecha_fin', form.fecha_fin);
    payload.append('motivo', form.motivo);
    payload.append('numero_documento', form.numero_documento);
    payload.append('institucion_emisora', form.institucion_emisora);
    if (form.archivo) payload.append('archivo', form.archivo);

    try {
      setSubmitting(true);
      await createIncapacidad(payload);
      setAlert({ text: 'Incapacidad registrada', type: 'ok' });
      limpiarFormulario();
      await cargarIncapacidades();
    } catch (error) {
      const msg = error?.detail || error?.message || 'No se pudo registrar';
      setAlert({ text: typeof msg === 'string' ? msg : JSON.stringify(msg), type: 'err' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h1 className="text-2xl font-bold text-slate-800">Bitacora de Incapacidades</h1>
          <p className="text-sm text-slate-500 mt-1">Registro y seguimiento de incapacidades del personal docente y administrativo.</p>
        </header>

        {alert.text ? (
          <div className={`rounded-xl border px-4 py-3 text-sm ${alert.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {alert.text}
          </div>
        ) : null}

        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Nuevo registro</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Fecha creacion">
              <input
                type="date"
                value={new Date().toISOString().split('T')[0]}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Docente">
              <select
                value={form.docente}
                onChange={(e) => onDocenteChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Seleccionar docente</option>
                {docentes.map((docente) => (
                  <option key={docente.id} value={docente.id}>
                    {docente.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tipo">
              <select
                value={form.tipo}
                onChange={(e) => onChangeForm('tipo', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="incapacidad">Incapacidad</option>
                <option value="justificante">Justificante</option>
                <option value="permiso">Permiso</option>
              </select>
            </Field>

            <Field label="Fecha inicio">
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => onChangeForm('fecha_inicio', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Fecha fin">
              <input
                type="date"
                value={form.fecha_fin}
                onChange={(e) => onChangeForm('fecha_fin', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Numero documento">
              <input
                value={form.numero_documento}
                readOnly
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Institucion emisora">
              <input
                value={form.institucion_emisora}
                onChange={(e) => onChangeForm('institucion_emisora', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </Field>

            <div className="lg:col-span-3">
              <Field label="Motivo">
                <textarea
                  value={form.motivo}
                  onChange={(e) => onChangeForm('motivo', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </Field>
            </div>

            <div className="lg:col-span-3">
              <Field label="Archivo adjunto">
                <DropZone archivo={form.archivo} onArchivoChange={(file) => onChangeForm('archivo', file)} />
              </Field>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={limpiarFormulario}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={registrar}
              disabled={submitting}
              className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <Field label="Tipo">
              <select
                value={filtros.tipo}
                onChange={(e) => onChangeFiltro('tipo', e.target.value)}
                className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                <option value="incapacidad">Incapacidad</option>
                <option value="justificante">Justificante</option>
                <option value="permiso">Permiso</option>
              </select>
            </Field>

            <Field label="Docente">
              <select
                value={filtros.docenteId}
                onChange={(e) => onChangeFiltro('docenteId', e.target.value)}
                className="w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {docentes.map((docente) => (
                  <option key={docente.id} value={docente.id}>
                    {docente.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Creacion desde">
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => onChangeFiltro('fechaDesde', e.target.value)}
                className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Creacion hasta">
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => onChangeFiltro('fechaHasta', e.target.value)}
                className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </Field>

            <button
              type="button"
              onClick={() => cargarIncapacidades()}
              className="h-10 rounded-lg border border-slate-900 bg-slate-900 px-4 text-sm font-semibold text-white"
            >
              Filtrar
            </button>
            <button
              type="button"
              onClick={() => {
                setFiltros(defaultFiltros);
                cargarIncapacidades(defaultFiltros);
              }}
              className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
            >
              Limpiar
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha creacion</th>
                  <th className="px-4 py-3 text-left">Docente</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Rango</th>
                  <th className="px-4 py-3 text-left">Documento</th>
                </tr>
              </thead>
              <tbody>
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No hay registros para los filtros seleccionados.
                    </td>
                  </tr>
                ) : null}

                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700 font-semibold">{item.fecha_creacion}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{item.docente_nombre || 'Sin docente'}</div>
                      <div className="text-xs text-slate-500">{item.numero_documento}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{tipoLabel[item.tipo] || item.tipo}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{item.fecha_inicio} al {item.fecha_fin}</td>
                    <td className="px-4 py-3">
                      {item.documento_url ? (
                        <a href={item.documento_url} target="_blank" rel="noreferrer" className="text-blue-700 hover:text-blue-900 font-semibold">
                          Ver archivo
                        </a>
                      ) : (
                        <span className="text-slate-500">Sin adjunto</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

