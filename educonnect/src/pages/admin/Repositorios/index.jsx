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
} from '../../../components/ui';
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
    eliminarRepositorio,
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
  const [confirmDeleteRepoOpen, setConfirmDeleteRepoOpen] = useState(false);
  const [mostrandoArchivados, setMostrandoArchivados] = useState(false);

  const [repoForm, setRepoForm] = useState(defaultRepoForm);
  const [uploadForm, setUploadForm] = useState(defaultUploadForm);
  const [documentoForm, setDocumentoForm] = useState(defaultDocumentoForm);

  const [documentoEnEdicion, setDocumentoEnEdicion] = useState(null);
  const [repositorioEnEdicion, setRepositorioEnEdicion] = useState(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    cargarRepositorios();
  }, []);

  const repositoriosFiltrados = useMemo(() => {
    return repositorios.filter((repo) => {
      const texto = search.toLowerCase();
      return (
        repo.nombre?.toLowerCase().includes(texto) ||
        repo.descripcion?.toLowerCase().includes(texto) ||
        repo.rol_acceso?.toLowerCase().includes(texto)
      );
    });
  }, [repositorios, search]);

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      const activo = doc?.es_version_actual !== false;
      if (!isAdmin && !activo) {
        return false;
      }
      if (isAdmin && mostrandoArchivados !== !activo) {
        return false;
      }

      const texto = search.toLowerCase();
      return (
        doc.nombre?.toLowerCase().includes(texto) ||
        doc.descripcion?.toLowerCase().includes(texto) ||
        doc.nombre_cargado_por?.toLowerCase().includes(texto)
      );
    });
  }, [documentos, search, isAdmin, mostrandoArchivados]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (error) => {
    setErrorMessage(formatError(error));
    setTimeout(() => setErrorMessage(''), 4500);
  };

  const abrirRepositorio = async (repo) => {
    try {
      setRepositorioActivo(repo);
      setSearch('');
      setMostrandoArchivados(false);
      await cargarDocumentosRepositorio(repo.id, { archivadosOnly: false });
    } catch (error) {
      showError(error);
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
      showError(error);
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
      showError(error);
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
      showError(error);
    }
  };

  const abrirConfirmEliminarRepositorio = (repo) => {
    setRepositorioEnEdicion(repo);
    setConfirmDeleteRepoOpen(true);
  };

  const confirmarEliminarRepositorio = async () => {
    if (!repositorioEnEdicion?.id) return;
    try {
      await eliminarRepositorio(repositorioEnEdicion.id);
      setConfirmDeleteRepoOpen(false);
      setRepositorioEnEdicion(null);
      showSuccess('Repositorio eliminado correctamente');
    } catch (error) {
      showError(error);
    }
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
      showError(error);
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
      showError(error);
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
      showError(error);
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
          <button
            onClick={() => abrirRepositorio(row)}
            className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#378add]"
          >
            Abrir
          </button>
          {isAdmin ? (
            <>
              <button
                onClick={() => abrirModalEditarRepositorio(row)}
                className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#081a31]"
              >
                Editar
              </button>
              <button
                onClick={() => abrirConfirmEliminarRepositorio(row)}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
              >
                Eliminar
              </button>
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
          <button
            type="button"
            onClick={() => descargarDocumento(row)}
            className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#378add]"
          >
            Descargar
          </button>
          {isAdmin ? (
            <>
              {!mostrandoArchivados ? (
                <button
                  onClick={() => abrirModalEditarDocumento(row)}
                  className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#081a31]"
                >
                  Editar
                </button>
              ) : null}
              <button
                onClick={() => abrirConfirmArchivo(row)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors ${mostrandoArchivados ? 'bg-[#0f6e56] hover:bg-[#085041]' : 'bg-[#0b2545] hover:bg-[#081a31]'}`}
              >
                {mostrandoArchivados ? 'Desarchivar' : 'Archivar'}
              </button>
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
        <DataTable
          columns={columnasRepositorios}
          data={repositoriosFiltrados}
          loading={loadingRepositorios}
          emptyMessage="No hay repositorios creados"
          emptyAction={isAdmin ? { label: 'Crear repositorio', onClick: abrirModalNuevoRepositorio } : undefined}
        />
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
        open={confirmDeleteRepoOpen}
        title="Eliminar carpeta"
        message="Solo se puede eliminar si esta carpeta no tiene documentos activos adentro."
        confirmLabel="Eliminar"
        onConfirm={confirmarEliminarRepositorio}
        onCancel={() => {
          setConfirmDeleteRepoOpen(false);
          setRepositorioEnEdicion(null);
        }}
        loading={saving}
        variant="danger"
      />

      {successMessage ? (
        <div className="fixed bottom-4 right-4 z-[1300] rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="fixed bottom-4 left-4 z-[1300] rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
