import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  ConfirmModal,
  FormModal,
  PageHeader,
  SearchFilter,
  StatusBadge,
} from '../../../components/ui';
import useSystemConfig from '../../../hooks/useSystemConfig';
import useInformeEconomico from './hooks/useInformeEconomico';

const INITIAL_FORM = {
  titulo: '',
  categoria: 'economico',
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

const estadoNorm = (value) => String(value || '').trim().toLowerCase();
const isArchivado = (estado) => estadoNorm(estado).includes('archiv');

const toSelectOptions = (items, fallback) => {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  return items;
};

export default function InformesEconomicos({
  moduleTitle = 'Informes Auxiliares',
  moduleSubtitle = 'Registrar, visualizar, descargar y archivar informes economicos y PAT',
  createLabel = 'Nuevo Informe',
  fixedCategoria = '',
  showCategoriaFilter = true,
  searchPlaceholder = 'Buscar por titulo, categoria o responsable',
}) {
  const { getCatalog } = useSystemConfig();
  const formRef = useRef(null);

  const {
    informes,
    loading,
    cargarInformes,
    ejecutarSubida,
    descargarInforme,
    archivarInforme,
    desarchivarInforme,
  } = useInformeEconomico();

  const categorias = useMemo(
    () =>
      toSelectOptions(
        getCatalog('auxiliares_tipos_informe', [
          { value: 'economico', label: 'Economico' },
          { value: 'pat', label: 'PAT' },
        ]),
        [
          { value: 'economico', label: 'Economico' },
          { value: 'pat', label: 'PAT' },
        ]
      ),
    [getCatalog]
  );

  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingInforme, setEditingInforme] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [archivo, setArchivo] = useState(null);

  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState('activos');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, informe: null, action: null });

  const loadInformes = async () => {
    try {
      await cargarInformes({ includeArchived: true, categoria: fixedCategoria });
    } catch (error) {
      setErrorMessage(parseError(error, 'No se pudieron cargar los informes.'));
    }
  };

  useEffect(() => {
    loadInformes();
  }, [fixedCategoria]);

  const openCreate = () => {
    setEditingInforme(null);
    setFormData({
      ...INITIAL_FORM,
      categoria: fixedCategoria || categorias[0]?.value || 'economico',
    });
    setArchivo(null);
    setFormOpen(true);
  };

  const openReplace = (informe) => {
    setEditingInforme(informe);
    setFormData({
      titulo: informe?.titulo || '',
      categoria: informe?.categoria || categorias[0]?.value || 'economico',
    });
    setArchivo(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingInforme(null);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!formData.titulo.trim()) {
      setErrorMessage('El titulo del informe es obligatorio.');
      return;
    }

    if (!archivo) {
      setErrorMessage(
        editingInforme
          ? 'Para reemplazar el informe debes seleccionar un archivo.'
          : 'Debes seleccionar un archivo para registrar el informe.'
      );
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      await ejecutarSubida({
        titulo: formData.titulo.trim(),
        categoria: fixedCategoria || formData.categoria,
        archivo,
        reemplazarId: editingInforme?.id || null,
      });

      setSuccessMessage(
        editingInforme
          ? 'Informe actualizado con una nueva version.'
          : 'Informe registrado correctamente.'
      );
      setFormOpen(false);
      setEditingInforme(null);
      await loadInformes();
    } catch (error) {
      setErrorMessage(parseError(error, 'No se pudo guardar el informe.'));
    } finally {
      setSaving(false);
    }
  };

  const openConfirm = (informe, action) => {
    setConfirmModal({ open: true, informe, action });
  };

  const handleConfirm = async () => {
    const { informe, action } = confirmModal;
    if (!informe) return;

    setSaving(true);
    setErrorMessage('');

    try {
      if (action === 'archive') {
        await archivarInforme(informe.id);
        setSuccessMessage('Informe archivado correctamente.');
      }
      if (action === 'unarchive') {
        await desarchivarInforme(informe.id);
        setSuccessMessage('Informe desarchivado correctamente.');
      }
      await loadInformes();
    } catch (error) {
      setErrorMessage(parseError(error, 'No se pudo completar la accion sobre el informe.'));
    } finally {
      setSaving(false);
      setConfirmModal({ open: false, informe: null, action: null });
    }
  };

  const handleDownload = async (informe) => {
    setDownloadingId(informe.id);
    setErrorMessage('');

    try {
      const response = await descargarInforme(informe.id);
      const rawBlob = response.data;
      const contentType = String(response.headers?.['content-type'] || '').toLowerCase();

      if (!rawBlob || rawBlob.size === 0) {
        throw new Error('El archivo descargado esta vacio.');
      }

      if (contentType.includes('application/json') || contentType.includes('text/html')) {
        throw new Error('La respuesta de descarga no es valida.');
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
      const fallbackName = `${String(informe?.titulo || 'informe').replace(/\s+/g, '_')}.pdf`;
      const fileName = encodedFileName || plainFileName || fallbackName;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);

      setSuccessMessage(`Se descargo correctamente: ${fileName}`);
    } catch (error) {
      setErrorMessage(parseError(error, 'No se pudo descargar el archivo del informe.'));
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredInformes = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return informes
      .filter((informe) => (viewMode === 'archivados' ? isArchivado(informe.estado) : !isArchivado(informe.estado)))
      .filter((informe) => {
        if (fixedCategoria) {
          return String(informe.categoria || '').toLowerCase() === String(fixedCategoria).toLowerCase();
        }
        if (!categoriaFilter) return true;
        return String(informe.categoria || '').toLowerCase() === String(categoriaFilter).toLowerCase();
      })
      .filter((informe) => {
        if (!query) return true;
        return [informe.titulo, informe.responsable_nombre, informe.categoria]
          .some((value) => String(value || '').toLowerCase().includes(query));
      });
  }, [informes, viewMode, categoriaFilter, searchValue]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={moduleTitle}
        subtitle={moduleSubtitle}
        action={{
          label: createLabel,
          onClick: openCreate,
          icon: '+',
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchFilter
          value={searchValue}
          onChange={setSearchValue}
          placeholder={searchPlaceholder}
        />
        <div className="flex items-center gap-3">
          {showCategoriaFilter && !fixedCategoria ? (
            <label className="text-sm text-slate-700">
              Categoria
              <select
                value={categoriaFilter}
                onChange={(event) => setCategoriaFilter(event.target.value)}
                className="ml-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
              >
                <option value="">Todas</option>
                {categorias.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button
            type="button"
            onClick={() => setViewMode((prev) => (prev === 'archivados' ? 'activos' : 'archivados'))}
            className="rounded-md border border-[#185fa5] px-4 py-2 text-sm font-medium text-[#185fa5] transition-colors hover:bg-[#e6f1fb]"
          >
            {viewMode === 'archivados' ? 'Ver activos' : 'Ver archivados'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Titulo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Categoria</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Responsable</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  Cargando informes...
                </td>
              </tr>
            ) : filteredInformes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  No hay informes para mostrar con los filtros actuales.
                </td>
              </tr>
            ) : (
              filteredInformes.map((informe) => {
                const expanded = expandedId === informe.id;
                const categoriaLabel = categorias.find((item) => item.value === informe.categoria)?.label || informe.categoria || 'N/A';

                return (
                  <Fragment key={informe.id}>
                    <tr className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{informe.titulo}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{categoriaLabel}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{informe.responsable_nombre || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <StatusBadge status={informe.estado || 'Activo'} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedId((prev) => (prev === informe.id ? null : informe.id))}
                            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            {expanded ? 'Ocultar' : 'Ver'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(informe)}
                            disabled={downloadingId === informe.id}
                            className="rounded-md border border-[#185fa5] px-3 py-1 text-xs font-medium text-[#185fa5] hover:bg-[#e6f1fb] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {downloadingId === informe.id ? 'Descargando...' : 'Descargar'}
                          </button>
                          {!isArchivado(informe.estado) ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openReplace(informe)}
                                className="rounded-md border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                              >
                                Actualizar
                              </button>
                              <button
                                type="button"
                                onClick={() => openConfirm(informe, 'archive')}
                                className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                              >
                                Archivar
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openConfirm(informe, 'unarchive')}
                              className="rounded-md border border-emerald-300 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                            >
                              Desarchivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-slate-50/60">
                        <td colSpan={5} className="px-4 py-4 text-sm text-slate-700">
                          <div className="grid gap-3 md:grid-cols-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha</p>
                              <p>{new Date(informe.fecha_creacion).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Version</p>
                              <p>{informe?.documento?.version || 1}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Archivo</p>
                              <p>{informe?.documento?.nombre || 'Sin archivo'}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <FormModal
        open={formOpen}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        title={editingInforme ? 'Actualizar informe' : 'Registrar informe'}
        submitLabel={saving ? 'Guardando...' : editingInforme ? 'Actualizar version' : 'Guardar informe'}
        loading={saving}
      >
        <div className="space-y-4" ref={formRef}>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Titulo</span>
            <input
              value={formData.titulo}
              onChange={(event) => setFormData((prev) => ({ ...prev, titulo: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
              placeholder="Ej: Informe de ejecucion presupuestaria"
              disabled={saving}
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Categoria</span>
            <select
              value={formData.categoria}
              onChange={(event) => setFormData((prev) => ({ ...prev, categoria: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
              disabled={saving || Boolean(fixedCategoria)}
            >
              {categorias.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Archivo (PDF o Excel)</span>
            <input
              type="file"
              accept=".pdf,.xlsx,.xls"
              onChange={(event) => setArchivo(event.target.files?.[0] || null)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              disabled={saving}
            />
          </label>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.action === 'archive' ? 'Archivar informe' : 'Desarchivar informe'}
        message={
          confirmModal.action === 'archive'
            ? 'El informe dejara de mostrarse en la vista de activos.'
            : 'El informe volvera a la vista de activos.'
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal({ open: false, informe: null, action: null })}
        loading={saving}
        confirmLabel={confirmModal.action === 'archive' ? 'Archivar' : 'Desarchivar'}
      />

      {successMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
