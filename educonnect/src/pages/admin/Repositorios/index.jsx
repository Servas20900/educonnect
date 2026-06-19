import { useEffect, useMemo, useState } from 'react';
import useAuth from '../../../hooks/useAuth';
import { useRepositorios } from './useRepositorios';
import {
  PageHeader,
  ActiveArchiveToggle,
  SearchFilter,
  DataTable,
  FormModal,
  ConfirmModal,
  FileUpload,
  BtnVer,
  BtnEditar,
  BtnDescargar,
  BtnArchivar,
  BtnRestaurar,
  Toast,
} from '../../../components/ui';
import useToast from '../../../hooks/useToast';
import { downloadDocumentoRepositorioArchivo } from '../../../api/repositorios';

const defaultRepoForm = {
  nombre: '',
  descripcion: '',
  cloudinary_path: 'educonnect/documentos/',
};

const defaultUploadForm = {
  file: null,
  descripcion: '',
};

const defaultDocumentoForm = {
  nombre: '',
  descripcion: '',
};

const formatError = (error) => {
  if (!error) return 'Ocurrió un error inesperado';

  if (typeof error?.error === 'string' && error.error.trim()) {
    return error.error;
  }

  if (typeof error?.detail === 'string' && error.detail.trim()) {
    return error.detail;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object') {
    const firstEntry = Object.entries(error)[0];
    if (firstEntry) {
      const [field, value] = firstEntry;
      if (Array.isArray(value) && value.length > 0) {
        return `${field}: ${value[0]}`;
      }
      if (typeof value === 'string') {
        return `${field}: ${value}`;
      }
    }
  }

  return 'No se pudo completar la operación';
};

const normalizarRol = (rol) => (rol || '').toString().trim().toLowerCase();

export default function RepositoriosDocumentales() {
  const { role } = useAuth();
  const isAdmin = normalizarRol(role) === 'administrador';

  const {
    repositorios,
    documentos,
    loadingRepositorios,
    loadingDocumentos,
    saving,
    cargarRepositorios,
    cargarDocumentosRepositorio,
    crearRepositorio,
    actualizarRepositorioPermisos,
    archivarRepositorio,
    restaurarRepositorio,
    subirDocumento,
    actualizarDocumento,
    archivarDocumento,
    desarchivarDocumento,
  } = useRepositorios();

  const [repositorioActivo, setRepositorioActivo] = useState(null);
  const [search, setSearch] = useState('');

  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [repoEditModalOpen, setRepoEditModalOpen] = useState(false);
  const [documentoModalOpen, setDocumentoModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmArchivarRepoOpen, setConfirmArchivarRepoOpen] = useState(false);
  const [mostrandoReposArchivados, setMostrandoReposArchivados] = useState(false);
  const [mostrandoArchivados, setMostrandoArchivados] = useState(false);

  const [repoForm, setRepoForm] = useState(defaultRepoForm);
  const [uploadForm, setUploadForm] = useState(defaultUploadForm);
  const [documentoForm, setDocumentoForm] = useState(defaultDocumentoForm);

  const [documentoEnEdicion, setDocumentoEnEdicion] = useState(null);
  const [repositorioEnEdicion, setRepositorioEnEdicion] = useState(null);

  const { toast, showSuccess, showError, clearToast } = useToast();

  useEffect(() => {
    cargarRepositorios({ includeArchivados: mostrandoReposArchivados });
  }, [mostrandoReposArchivados]);

  const repositoriosFiltrados = useMemo(() => {
    const texto = search.toLowerCase();
    return repositorios.filter((repo) =>
      repo.nombre?.toLowerCase().includes(texto) ||
      repo.descripcion?.toLowerCase().includes(texto) ||
      repo.rol_acceso?.toLowerCase().includes(texto)
    );
  }, [repositorios, search]);

  const documentosFiltrados = useMemo(() => {
    const texto = search.toLowerCase();
    return documentos.filter((doc) =>
      doc.nombre?.toLowerCase().includes(texto) ||
      doc.descripcion?.toLowerCase().includes(texto) ||
      doc.nombre_cargado_por?.toLowerCase().includes(texto)
    );
  }, [documentos, search]);

  const abrirRepositorio = async (repo) => {
    try {
      setRepositorioActivo(repo);
      setSearch('');
      setMostrandoArchivados(false);
      await cargarDocumentosRepositorio(repo.id, { archivadosOnly: false });
    } catch (error) {
      showError(formatError(error));
    }
  };

  const volverARepositorios = () => {
    setRepositorioActivo(null);
    setSearch('');
    setMostrandoArchivados(false);
  };

  const alternarVistaArchivados = async () => {
    if (!repositorioActivo) return;

    const siguienteVistaArchivados = !mostrandoArchivados;
    try {
      setMostrandoArchivados(siguienteVistaArchivados);
      await cargarDocumentosRepositorio(repositorioActivo.id, {
        archivadosOnly: siguienteVistaArchivados,
      });
    } catch (error) {
      setMostrandoArchivados(!siguienteVistaArchivados);
      showError(formatError(error));
    }
  };

  const abrirModalNuevoRepositorio = () => {
    setRepoForm(defaultRepoForm);
    setRepoModalOpen(true);
  };

  const submitNuevoRepositorio = async (event) => {
    event.preventDefault();
    try {
      await crearRepositorio(repoForm);
      setRepoModalOpen(false);
      showSuccess('Repositorio creado correctamente');
    } catch (error) {
      showError(formatError(error));
    }
  };

  const abrirModalEditarRepositorio = (repo) => {
    setRepositorioEnEdicion(repo);
    setRepoForm({
      nombre: repo?.nombre || '',
      descripcion: repo?.descripcion || '',
      cloudinary_path: repo?.cloudinary_path || 'educonnect/documentos/',
    });
    setRepoEditModalOpen(true);
  };

  const submitEditarRepositorio = async (event) => {
    event.preventDefault();
    if (!repositorioEnEdicion?.id) return;

    try {
      await actualizarRepositorioPermisos(repositorioEnEdicion.id, repoForm);
      setRepoEditModalOpen(false);
      setRepositorioEnEdicion(null);
      showSuccess('Repositorio actualizado correctamente');
    } catch (error) {
      showError(formatError(error));
    }
  };

  const abrirConfirmArchivarRepositorio = (repo) => {
    setRepositorioEnEdicion(repo);
    setConfirmArchivarRepoOpen(true);
  };

  const confirmarArchivarRepositorio = async () => {
    if (!repositorioEnEdicion?.id) return;
    try {
      await archivarRepositorio(repositorioEnEdicion.id);
      setConfirmArchivarRepoOpen(false);
      setRepositorioEnEdicion(null);
      showSuccess('Repositorio archivado correctamente');
    } catch (error) {
      showError(formatError(error));
    }
  };

  const handleRestaurarRepositorio = async (repo) => {
    try {
      await restaurarRepositorio(repo.id);
      showSuccess('Repositorio restaurado correctamente');
    } catch (error) {
      showError(formatError(error));
    }
  };

  const alternarVistaReposArchivados = async () => {
    const siguiente = !mostrandoReposArchivados;
    setMostrandoReposArchivados(siguiente);
  };

  const abrirModalSubir = () => {
    setUploadForm(defaultUploadForm);
    setUploadModalOpen(true);
  };

  const submitSubida = async (event) => {
    event.preventDefault();
    if (!uploadForm.file) {
      showError('Debes seleccionar un archivo');
      return;
    }

    try {
      await subirDocumento(repositorioActivo.id, uploadForm.file, uploadForm.descripcion);
      setUploadModalOpen(false);
      showSuccess('Documento cargado correctamente');
    } catch (error) {
      showError(formatError(error));
    }
  };

  const abrirModalEditarDocumento = (doc) => {
    setDocumentoEnEdicion(doc);
    setDocumentoForm({
      nombre: doc?.nombre || '',
      descripcion: doc?.descripcion || '',
    });
    setDocumentoModalOpen(true);
  };

  const submitEditarDocumento = async (event) => {
    event.preventDefault();
    try {
      await actualizarDocumento(repositorioActivo.id, documentoEnEdicion.id, documentoForm);
      setDocumentoModalOpen(false);
      showSuccess('Documento actualizado correctamente');
    } catch (error) {
      showError(formatError(error));
    }
  };

  const abrirConfirmArchivo = (doc) => {
    setDocumentoEnEdicion(doc);
    setConfirmDeleteOpen(true);
  };

  const confirmarCambiarEstadoDocumento = async () => {
    try {
      if (mostrandoArchivados) {
        await desarchivarDocumento(repositorioActivo.id, documentoEnEdicion.id, { archivadosOnly: true });
        showSuccess('Documento desarchivado correctamente');
      } else {
        await archivarDocumento(repositorioActivo.id, documentoEnEdicion.id, { archivadosOnly: false });
        showSuccess('Documento archivado correctamente');
      }
      setConfirmDeleteOpen(false);
    } catch (error) {
      showError(formatError(error));
    }
  };

  const descargarDocumento = async (doc) => {
    try {
      const response = await downloadDocumentoRepositorioArchivo(repositorioActivo?.id, doc.id);
      const blob = response.data;

      if (!blob || blob.size === 0) {
        throw new Error('El archivo descargado está vacío');
      }

      const contentDisposition = response.headers?.['content-disposition'] || '';
      const encodedFileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      const plainFileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const encodedFileName = encodedFileNameMatch?.[1]
        ? decodeURIComponent(encodedFileNameMatch[1])
        : null;
      const plainFileName = plainFileNameMatch?.[1] || null;

      const extension = String(doc?.extension || '').replace('.', '').trim();
      const baseName = String(doc?.nombre || 'documento').trim();
      const fallbackName = extension && !baseName.toLowerCase().endsWith(`.${extension.toLowerCase()}`)
        ? `${baseName}.${extension}`
        : baseName;

      const fileName = encodedFileName || plainFileName || fallbackName || 'documento';

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 2000);
    } catch (error) {
      showError(error?.message || 'No se pudo descargar el documento');
    }
  };

  const columnasRepositorios = [
    {
      key: 'nombre',
      label: 'Repositorio',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.nombre}</p>
          <p className="text-xs text-slate-500">{row.descripcion || 'Sin descripción'}</p>
        </div>
      ),
    },
    {
      key: 'rol_acceso',
      label: 'Tipo',
      render: () => <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">Plantillas docentes</span>,
    },
    {
      key: 'conteo_documentos',
      label: 'Documentos',
      render: (row) => <span className="text-slate-600">{row.conteo_documentos || 0}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-2">
          <BtnVer onClick={() => abrirRepositorio(row)} />
          {isAdmin ? (
            <>
              {!mostrandoReposArchivados && (
                <BtnEditar onClick={() => abrirModalEditarRepositorio(row)} />
              )}
              {mostrandoReposArchivados ? (
                <BtnRestaurar onClick={() => handleRestaurarRepositorio(row)} />
              ) : (
                <BtnArchivar onClick={() => abrirConfirmArchivarRepositorio(row)} />
              )}
            </>
          ) : null}
        </div>
      ),
    },
  ];

  const columnasDocumentos = [
    {
      key: 'nombre',
      label: 'Documento',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.nombre}</p>
          <p className="text-xs text-slate-500">{row.descripcion || 'Sin descripción'}</p>
        </div>
      ),
    },
    {
      key: 'meta',
      label: 'Metadatos',
      render: (row) => (
        <div className="text-xs text-slate-600">
          <p>{row.tamaño_legible || '-'} • {row.extension || '-'}</p>
          <p>{row.nombre_cargado_por || 'Sistema'}</p>
        </div>
      ),
    },
    {
      key: 'fecha_carga',
      label: 'Fecha',
      render: (row) => (
        <span className="text-slate-600">
          {row.fecha_carga ? new Date(row.fecha_carga).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-2">
          <BtnDescargar onClick={() => descargarDocumento(row)} />
          {isAdmin ? (
            <>
              {!mostrandoArchivados ? (
                <BtnEditar onClick={() => abrirModalEditarDocumento(row)} />
              ) : null}
              {mostrandoArchivados ? (
                <BtnRestaurar onClick={() => abrirConfirmArchivo(row)} />
              ) : (
                <BtnArchivar onClick={() => abrirConfirmArchivo(row)} />
              )}
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={repositorioActivo ? repositorioActivo.nombre : 'Documentos Institucionales'}
        subtitle={
          repositorioActivo
            ? 'Plantillas y formatos normalizados para descarga docente'
            : 'Carpetas de plantillas institucionales para docentes'
        }
        action={
          repositorioActivo
            ? {
                label: 'Volver a repositorios',
                onClick: volverARepositorios,
                icon: '\u2190',
              }
            : isAdmin
              ? {
                  label: 'Nuevo repositorio',
                  onClick: abrirModalNuevoRepositorio,
                  icon: '+',
                }
              : undefined
        }
      />

      <SearchFilter
        value={search}
        onChange={setSearch}
        placeholder={repositorioActivo ? 'Buscar documentos...' : 'Buscar repositorios...'}
      />

      {repositorioActivo ? (
        <>
          {isAdmin ? (
            <div className="flex justify-end gap-2">
              <ActiveArchiveToggle
                viewMode={mostrandoArchivados ? 'archivados' : 'activos'}
                onChange={(mode) => {
                  const shouldShowArchived = mode === 'archivados';
                  if (shouldShowArchived !== mostrandoArchivados) {
                    alternarVistaArchivados();
                  }
                }}
                activeLabel="Activos"
                archivedLabel="Archivados"
              />
              {!mostrandoArchivados ? (
                <button
                  onClick={abrirModalSubir}
                  className="rounded-md bg-[#0b2545] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#185fa5]"
                >
                  Subir documento
                </button>
              ) : null}
            </div>
          ) : null}

          <DataTable
            columns={columnasDocumentos}
            data={documentosFiltrados}
            loading={loadingDocumentos}
            emptyMessage={mostrandoArchivados ? 'No hay documentos archivados en este repositorio' : 'No hay documentos en este repositorio'}
          />
        </>
      ) : (
        <>
          {isAdmin ? (
            <ActiveArchiveToggle
              viewMode={mostrandoReposArchivados ? 'archivados' : 'activos'}
              onChange={(mode) => setMostrandoReposArchivados(mode === 'archivados')}
              activeLabel="Repositorios Activos"
              archivedLabel="Repositorios Archivados"
              activeCount={repositorios.length}
              archivedCount={0}
            />
          ) : null}
          <DataTable
            columns={columnasRepositorios}
            data={repositoriosFiltrados}
            loading={loadingRepositorios}
            emptyMessage={mostrandoReposArchivados ? 'No hay repositorios archivados' : 'No hay repositorios creados'}
            emptyAction={isAdmin && !mostrandoReposArchivados ? { label: 'Crear repositorio', onClick: abrirModalNuevoRepositorio } : undefined}
          />
        </>
      )}

      <FormModal
        open={repoModalOpen}
        onClose={() => setRepoModalOpen(false)}
        onSubmit={submitNuevoRepositorio}
        title="Nuevo repositorio"
        submitLabel={saving ? 'Guardando...' : 'Crear repositorio'}
        loading={saving}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
              value={repoForm.nombre}
              onChange={(event) => setRepoForm((prev) => ({ ...prev, nombre: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
              rows={3}
              value={repoForm.descripcion}
              onChange={(event) => setRepoForm((prev) => ({ ...prev, descripcion: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ruta de almacenamiento</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
              value={repoForm.cloudinary_path}
              onChange={(event) => setRepoForm((prev) => ({ ...prev, cloudinary_path: event.target.value }))}
              required
            />
          </div>
        </div>
      </FormModal>

      <FormModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSubmit={submitSubida}
        title={repositorioActivo ? `Subir archivo a ${repositorioActivo.nombre}` : 'Subir archivo'}
        submitLabel={saving ? 'Subiendo...' : 'Subir archivo'}
        loading={saving}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <FileUpload
            onFile={(file) => setUploadForm((prev) => ({ ...prev, file }))}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            currentFile={uploadForm.file?.name}
            disabled={saving}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
              rows={3}
              value={uploadForm.descripcion}
              onChange={(event) => setUploadForm((prev) => ({ ...prev, descripcion: event.target.value }))}
            />
          </div>
        </div>
      </FormModal>

      <FormModal
        open={repoEditModalOpen}
        onClose={() => {
          setRepoEditModalOpen(false);
          setRepositorioEnEdicion(null);
        }}
        onSubmit={submitEditarRepositorio}
        title="Editar repositorio"
        submitLabel={saving ? 'Guardando...' : 'Guardar cambios'}
        loading={saving}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
              value={repoForm.nombre}
              onChange={(event) => setRepoForm((prev) => ({ ...prev, nombre: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
              rows={3}
              value={repoForm.descripcion}
              onChange={(event) => setRepoForm((prev) => ({ ...prev, descripcion: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ruta de almacenamiento</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
              value={repoForm.cloudinary_path}
              onChange={(event) => setRepoForm((prev) => ({ ...prev, cloudinary_path: event.target.value }))}
              required
            />
          </div>
        </div>
      </FormModal>

      <FormModal
        open={documentoModalOpen}
        onClose={() => setDocumentoModalOpen(false)}
        onSubmit={submitEditarDocumento}
        title="Editar documento"
        submitLabel={saving ? 'Guardando...' : 'Guardar cambios'}
        loading={saving}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
              value={documentoForm.nombre}
              onChange={(event) => setDocumentoForm((prev) => ({ ...prev, nombre: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#e6f1fb]"
              rows={3}
              value={documentoForm.descripcion}
              onChange={(event) => setDocumentoForm((prev) => ({ ...prev, descripcion: event.target.value }))}
            />
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirmDeleteOpen}
        title={mostrandoArchivados ? 'Desarchivar documento' : 'Archivar documento'}
        message={mostrandoArchivados ? 'El documento volverá a la vista de documentos activos.' : 'El documento se moverá a la vista de archivados.'}
        confirmLabel={mostrandoArchivados ? 'Desarchivar' : 'Archivar'}
        onConfirm={confirmarCambiarEstadoDocumento}
        onCancel={() => setConfirmDeleteOpen(false)}
        loading={saving}
        variant={mostrandoArchivados ? 'info' : 'warning'}
      />

      <ConfirmModal
        open={confirmArchivarRepoOpen}
        title="Archivar carpeta"
        message="La carpeta se archivará. Solo se puede archivar si no tiene documentos activos adentro."
        confirmLabel="Archivar"
        onConfirm={confirmarArchivarRepositorio}
        onCancel={() => {
          setConfirmArchivarRepoOpen(false);
          setRepositorioEnEdicion(null);
        }}
        loading={saving}
        variant="warning"
      />

      <Toast message={toast?.message} variant={toast?.variant} onClose={clearToast} />
    </div>
  );
}
