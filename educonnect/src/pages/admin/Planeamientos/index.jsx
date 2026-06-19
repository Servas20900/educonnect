import { useEffect, useMemo, useState } from 'react';
import useAutoRefresh from '../../../hooks/useAutoRefresh';
import { ActiveArchiveToggle, DataTable, PageHeader, SearchFilter, BtnDescargar, Toast } from '../../../components/ui';
import useToast from '../../../hooks/useToast';
import {
  descargarArchivoPlaneamiento,
  fetchPlaneamientosAdmin,
  aprobarPlaneamiento,
  rechazarPlaneamiento,
} from '../../../api/planeamientos';

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const formatErrorMessage = (error) => {
  if (!error) return 'Ocurrio un error inesperado';
  const data = error?.response?.data;
  if (typeof data?.error?.message === 'string') return data.error.message;
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  return 'No fue posible completar la accion';
};

const triggerBrowserDownload = (url, nombre = 'planeamiento') => {
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const estadoBadge = (estado) => {
  const map = {
    'Borrador': 'bg-gray-100 text-gray-700',
    'En revisión': 'bg-yellow-100 text-yellow-800',
    'Aprobado': 'bg-green-100 text-green-800',
    'Archivado': 'bg-red-100 text-red-700',
  };
  const cls = map[estado] || 'bg-gray-100 text-gray-600';
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{estado || 'Borrador'}</span>;
};

function RevisionModal({ planeamiento, onClose, onRefresh, showError, showSuccess }) {
  const [comentario, setComentario] = useState('');
  const [accionPendiente, setAccionPendiente] = useState(null); // 'aprobar' | 'rechazar'
  const [comentarioError, setComentarioError] = useState('');
  const [descargando, setDescargando] = useState(false);

  const loading = accionPendiente !== null;
  const puedeRevisar = planeamiento.estado === 'En revisión' || planeamiento.estado === 'Borrador';

  const handleAction = async (accion) => {
    if (!comentario.trim()) {
      setComentarioError('El comentario es obligatorio.');
      return;
    }
    setAccionPendiente(accion);
    try {
      if (accion === 'aprobar') {
        await aprobarPlaneamiento(planeamiento.id, comentario.trim());
        showSuccess('Planeamiento aprobado.');
      } else {
        await rechazarPlaneamiento(planeamiento.id, comentario.trim());
        showSuccess('Planeamiento rechazado y devuelto a Borrador.');
      }
      onRefresh();
      onClose();
    } catch (err) {
      showError(formatErrorMessage(err));
    } finally {
      setAccionPendiente(null);
    }
  };

  const handleDescargar = async () => {
    if (!planeamiento.archivo || descargando) return;
    setDescargando(true);
    try {
      const url = await descargarArchivoPlaneamiento(planeamiento.id);
      triggerBrowserDownload(url, planeamiento.titulo || 'planeamiento');
    } catch (err) {
      showError(formatErrorMessage(err));
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-800">Revisión de Planeamiento</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none w-7 h-7 flex items-center justify-center rounded"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Docente */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Docente</p>
            <p className="text-sm font-medium text-slate-800">{planeamiento.docente_nombre || '-'}</p>
          </div>

          {/* Estado */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Estado actual</p>
            {estadoBadge(planeamiento.estado)}
          </div>

          {/* Título */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Título</p>
            <p className="text-sm text-slate-800">{planeamiento.titulo || '-'}</p>
          </div>

          {/* Detalle */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Detalle</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{planeamiento.detalle || '-'}</p>
          </div>

          {/* Documento adjunto */}
          {planeamiento.archivo && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Documento adjunto</p>
              <button
                type="button"
                onClick={handleDescargar}
                disabled={descargando}
                className="inline-flex items-center gap-2 rounded-lg border border-[#185fa5] px-4 py-2 text-sm font-medium text-[#185fa5] hover:bg-[#e6f1fb] disabled:opacity-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {descargando ? 'Descargando...' : 'Descargar archivo'}
              </button>
            </div>
          )}

          {/* Comentario previo */}
          {planeamiento.comentario_revision && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Comentario anterior</p>
              <p className="text-sm text-slate-700">{planeamiento.comentario_revision}</p>
              {planeamiento.revisado_por_nombre && (
                <p className="text-xs text-slate-400 mt-1">Por: {planeamiento.revisado_por_nombre}</p>
              )}
            </div>
          )}

          {/* Área de comentario */}
          {puedeRevisar && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Comentario de revisión <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comentario}
                onChange={(e) => { setComentario(e.target.value); setComentarioError(''); }}
                rows={3}
                placeholder="Escribe un comentario para el docente..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:border-[#185fa5] focus:outline-none focus:ring-1 focus:ring-[#185fa5]"
              />
              {comentarioError && (
                <p className="mt-1 text-xs text-red-500">{comentarioError}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cerrar
          </button>
          {puedeRevisar && (
            <>
              <button
                type="button"
                onClick={() => handleAction('rechazar')}
                disabled={loading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {accionPendiente === 'rechazar' ? 'Rechazando...' : 'Rechazar'}
              </button>
              <button
                type="button"
                onClick={() => handleAction('aprobar')}
                disabled={loading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {accionPendiente === 'aprobar' ? 'Aprobando...' : 'Aprobar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlaneamientosAdminList() {
  const [planeamientos, setPlaneamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState('activos');
  const [modalPlaneamiento, setModalPlaneamiento] = useState(null);
  const { toast, showError, showSuccess, clearToast } = useToast();

  const cargarPlaneamientos = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await fetchPlaneamientosAdmin();
      setPlaneamientos(toArray(result));
    } catch (error) {
      if (!silent) showError(formatErrorMessage(error));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    cargarPlaneamientos();
  }, []);
  useAutoRefresh(() => cargarPlaneamientos(true));

  const estadoNorm = (value) => String(value || '').trim().toLowerCase();
  const esInactivo = (estado) => {
    const normalized = estadoNorm(estado);
    return normalized.includes('archiv') || normalized.includes('inactiv');
  };

  const planeamientosActivos = useMemo(
    () => planeamientos.filter((item) => !esInactivo(item.estado)),
    [planeamientos]
  );

  const planeamientosInactivos = useMemo(
    () => planeamientos.filter((item) => esInactivo(item.estado)),
    [planeamientos]
  );

  const planeamientosEnVista = viewMode === 'archivados' ? planeamientosInactivos : planeamientosActivos;

  const planeamientosFiltrados = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    return planeamientosEnVista.filter((item) => {
      const titulo = (item.titulo || '').toLowerCase();
      const docente = (item.docente_nombre || '').toLowerCase();
      const detalle = (item.detalle || '').toLowerCase();
      return !q || titulo.includes(q) || docente.includes(q) || detalle.includes(q);
    });
  }, [planeamientosEnVista, searchValue]);

  const handleDescargar = async (item) => {
    if (!item?.archivo) return;
    try {
      const downloadUrl = await descargarArchivoPlaneamiento(item.id);
      triggerBrowserDownload(downloadUrl, item.titulo || 'planeamiento');
    } catch (error) {
      showError(formatErrorMessage(error));
    }
  };

  const tableColumns = [
    {
      key: 'docente_nombre',
      label: 'Docente',
      render: (row) => <span className="font-medium text-slate-900">{row.docente_nombre || 'Sin docente'}</span>,
    },
    {
      key: 'titulo',
      label: 'Título',
      render: (row) => <span className="text-slate-700">{row.titulo || '-'}</span>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row) => estadoBadge(row.estado),
    },
    {
      key: 'fecha_envio',
      label: 'Fecha envío',
      render: (row) => <span className="text-slate-600">{row.fecha_envio || '-'}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setModalPlaneamiento(row)}
            className="rounded-md border border-[#185fa5] px-3 py-1 text-xs font-medium text-[#185fa5] hover:bg-[#e6f1fb]"
          >
            Ver / Revisar
          </button>
          <BtnDescargar onClick={() => handleDescargar(row)} disabled={!row.archivo} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planeamientos"
        subtitle="Listado de docentes y planeamientos cargados"
      />

      <ActiveArchiveToggle
        viewMode={viewMode}
        onChange={setViewMode}
        activeLabel="Visibles"
        archivedLabel="Archivados"
        activeCount={planeamientosActivos.length}
        archivedCount={planeamientosInactivos.length}
      />

      <SearchFilter
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Buscar por docente, titulo o detalle..."
      />

      <DataTable
        columns={tableColumns}
        data={planeamientosFiltrados}
        loading={loading}
        emptyMessage="No hay planeamientos para mostrar"
      />

      {modalPlaneamiento && (
        <RevisionModal
          planeamiento={modalPlaneamiento}
          onClose={() => setModalPlaneamiento(null)}
          onRefresh={cargarPlaneamientos}
          showError={showError}
          showSuccess={showSuccess}
        />
      )}

      <Toast message={toast?.message} variant={toast?.variant} onClose={clearToast} />
    </div>
  );
}
