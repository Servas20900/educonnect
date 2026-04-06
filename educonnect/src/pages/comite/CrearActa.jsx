import { Fragment, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  archiveActa,
  createActa,
  downloadActaArchivo,
  fetchActas,
  unarchiveActa,
  uploadActaArchivo,
} from '../../api/comitesService';
import {
  ConfirmModal,
  FormModal,
  PageHeader,
  SearchFilter,
  StatusBadge,
} from '../../components/ui';

const initialForm = {
  numero_acta: '',
  contenido: '',
  acuerdos: '',
  seguimientos: '',
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

const FormularioActa = forwardRef(function FormularioActa(
  { acta, onSubmit, loading },
  ref
) {
  const [form, setForm] = useState(initialForm);
  const [archivo, setArchivo] = useState(null);

  useEffect(() => {
    setForm({
      numero_acta: acta?.numero_acta || '',
      contenido: acta?.contenido || '',
      acuerdos: acta?.acuerdos || '',
      seguimientos: acta?.seguimientos || '',
    });
    setArchivo(null);
  }, [acta]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async () => {
    await onSubmit(form, archivo);
  };

  useImperativeHandle(ref, () => ({ submit }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Número de acta</span>
          <input
            name="numero_acta"
            value={form.numero_acta}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
            placeholder="Ej: ACTA-2026-001"
            disabled={loading}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Archivo adjunto (opcional)</span>
          <input
            type="file"
            onChange={(event) => setArchivo(event.target.files?.[0] || null)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={loading}
          />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Contenido</span>
        <textarea
          name="contenido"
          value={form.contenido}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
          disabled={loading}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Acuerdos</span>
          <textarea
            name="acuerdos"
            value={form.acuerdos}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
            disabled={loading}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Seguimientos</span>
          <textarea
            name="seguimientos"
            value={form.seguimientos}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
            disabled={loading}
          />
        </label>
      </div>
    </div>
  );
});

export default function CrearActa() {
  const formRef = useRef(null);

  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchValue, setSearchValue] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('activas');
  const [expandedActaId, setExpandedActaId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState({ open: false, acta: null, action: null });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadActas = async () => {
    setLoading(true);
    try {
      const data = await fetchActas();
      setActas(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      setErrorMessage(parseError(error, 'No se pudieron cargar las actas.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActas();
  }, []);

  const openCreate = () => {
    setModalOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleSubmitActa = async (form, archivo) => {
    if (!form.numero_acta || !form.contenido || !form.acuerdos || !form.seguimientos) {
      setErrorMessage('Completa número de acta, contenido, acuerdos y seguimientos.');
      return;
    }

    setSaving(true);
    try {
      const saved = await createActa({ ...form, reunion: null, estado: 'borrador' });
      setSuccessMessage('Acta creada correctamente.');

      if (archivo && saved?.id) {
        await uploadActaArchivo(saved.id, archivo);
      }

      setModalOpen(false);
      await loadActas();
    } catch (error) {
      setErrorMessage(parseError(error, 'No se pudo guardar el acta.'));
    } finally {
      setSaving(false);
    }
  };

  const handleModalSubmit = async (event) => {
    event.preventDefault();
    if (formRef.current?.submit) {
      await formRef.current.submit();
    }
  };

  const openConfirm = (acta, action) => {
    setConfirmModal({ open: true, acta, action });
  };

  const handleConfirm = async () => {
    const { acta, action } = confirmModal;
    if (!acta) return;

    setSaving(true);
    try {
      if (action === 'archive') {
        await archiveActa(acta.id);
        setSuccessMessage('Acta archivada correctamente.');
      }
      if (action === 'unarchive') {
        await unarchiveActa(acta.id);
        setSuccessMessage('Acta desarchivada correctamente.');
      }
      await loadActas();
    } catch (error) {
      setErrorMessage(parseError(error, 'No se pudo completar la acción sobre el acta.'));
    } finally {
      setSaving(false);
      setConfirmModal({ open: false, acta: null, action: null });
    }
  };

  const filteredActas = actas
    .filter((acta) => (estadoFiltro === 'archivadas' ? isArchivada(acta.estado) : !isArchivada(acta.estado)))
    .filter((acta) => {
      const q = searchValue.toLowerCase();
      return (
        String(acta.numero_acta || '').toLowerCase().includes(q) ||
        String(acta.contenido || '').toLowerCase().includes(q)
      );
    });

  const toggleExpanded = (actaId) => {
    setExpandedActaId((prev) => (prev === actaId ? null : actaId));
  };

  const handleDownloadActa = async (acta) => {
    if (!acta?.archivo_url) {
      setErrorMessage('Esta acta no tiene un archivo cargado para descargar.');
      return;
    }

    setDownloadingId(acta.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await downloadActaArchivo(acta.id);
      const rawBlob = response.data;
      const contentType = String(response.headers?.['content-type'] || '').toLowerCase();

      if (!rawBlob || rawBlob.size === 0) {
        throw new Error('El archivo descargado está vacío');
      }

      if (contentType.includes('application/json') || contentType.includes('text/html')) {
        throw new Error('El servidor devolvió una respuesta no válida para descarga');
      }

      const blob = rawBlob.type
        ? rawBlob
        : new Blob([rawBlob], { type: contentType || 'application/octet-stream' });

      const contentDisposition = response.headers?.['content-disposition'] || '';
      const encodedFileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      const plainFileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const encodedFileName = encodedFileNameMatch?.[1]
        ? decodeURIComponent(encodedFileNameMatch[1])
        : null;
      const plainFileName = plainFileNameMatch?.[1] || null;

      const storageName = acta?.archivo_nombre || String(acta.archivo_url).split('/').pop();
      const fallbackName = `${String(acta?.numero_acta || 'acta').replace(/\s+/g, '_')}.pdf`;
      const fileName = encodedFileName || plainFileName || storageName || fallbackName;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);

      setSuccessMessage(`Se descargó correctamente: ${fileName}`);
    } catch (error) {
      const message = parseError(error, 'No se pudo descargar el archivo del acta.');
      setErrorMessage(message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actas"
        subtitle="Crear, listar, descargar y archivar actas del comité"
        action={{
          label: 'Nueva Acta',
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
          {estadoFiltro === 'archivadas' ? 'Ver actas activas' : 'Ver actas archivadas'}
        </button>
      </div>

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por número o contenido"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Número</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Archivo</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              Array.from({ length: 3 }).map((_, rowIndex) => (
                <tr key={`skeleton-row-${rowIndex}`}>
                  <td className="px-4 py-3" colSpan="5">
                    <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                  </td>
                </tr>
              ))
            ) : filteredActas.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-sm text-slate-600">
                  {estadoFiltro === 'archivadas' ? 'No hay actas archivadas' : 'No hay actas registradas'}
                </td>
              </tr>
            ) : (
              filteredActas.map((row) => {
                const expanded = expandedActaId === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr className="transition-colors hover:bg-[#e6f1fb]">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.numero_acta}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <StatusBadge status={row.estado || 'borrador'} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {row.fecha_elaboracion ? String(row.fecha_elaboracion).split('T')[0] : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {row.archivo_url ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadActa(row)}
                            disabled={downloadingId === row.id}
                            className="text-[#185fa5] hover:text-[#0b2545] underline disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {downloadingId === row.id ? 'Descargando...' : (row.archivo_nombre || 'Descargar')}
                          </button>
                        ) : (
                          <span className="text-slate-400">Sin archivo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => toggleExpanded(row.id)}
                            className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#378add]"
                          >
                            {expanded ? 'Ocultar' : 'Ver'}
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
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan="5" className="bg-slate-50 px-4 py-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Contenido</p>
                              <p className="whitespace-pre-wrap text-sm text-slate-700">{row.contenido || 'Sin contenido'}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Acuerdos</p>
                              <p className="whitespace-pre-wrap text-sm text-slate-700">{row.acuerdos || 'Sin acuerdos'}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Seguimientos</p>
                              <p className="whitespace-pre-wrap text-sm text-slate-700">{row.seguimientos || 'Sin seguimientos'}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-end">
                            {row.archivo_url ? (
                              <button
                                type="button"
                                onClick={() => handleDownloadActa(row)}
                                disabled={downloadingId === row.id}
                                className="rounded-md border border-[#185fa5] px-3 py-1.5 text-xs font-medium text-[#185fa5] transition-colors hover:bg-[#e6f1fb]"
                              >
                                {downloadingId === row.id ? 'Descargando...' : 'Descargar documento cargado'}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500">No hay documento cargado para esta acta.</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <FormModal
        open={modalOpen}
        onClose={closeForm}
        onSubmit={handleModalSubmit}
        title="Nueva Acta"
        submitLabel={saving ? 'Procesando...' : 'Crear Acta'}
        loading={saving}
        maxWidth="md"
      >
        <FormularioActa ref={formRef} acta={null} onSubmit={handleSubmitActa} loading={saving} />
      </FormModal>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.action === 'archive' ? 'Archivar Acta' : 'Desarchivar Acta'}
        message={
          confirmModal.action === 'archive'
            ? 'Esta acta se moverá al listado de archivadas.'
            : 'La acta volverá al listado principal.'
        }
        variant={confirmModal.action === 'archive' ? 'warning' : 'info'}
        confirmLabel={confirmModal.action === 'archive' ? 'Archivar' : 'Desarchivar'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal({ open: false, acta: null, action: null })}
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
