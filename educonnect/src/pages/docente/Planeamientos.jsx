import { useEffect, useMemo, useState } from "react";
import { usePlaneamientos } from "./usePlaneamientos";
import { ActiveArchiveToggle, ConfirmModal, DataTable, PageHeader, BtnVer, BtnArchivar, BtnRestaurar, Toast } from '../../components/ui';
import useToast from '../../hooks/useToast';

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

export default function Planeamientos() {
  const {
    planes,
    loading,
    uploading,
    error,
    cargar,
    crear,
    enviar,
    eliminar,
    desarchivar,
    descargarArchivo,
  } = usePlaneamientos();

  const [filtros, setFiltros] = useState({ q: "", estado: "" });
  const [viewMode, setViewMode] = useState('activos');
  const [modal, setModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, accion: null });

  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [archivo, setArchivo] = useState(null);

  const { toast, showSuccess, showError, clearToast } = useToast();

  useEffect(() => {
    cargar();
  }, [cargar]);

  const activos = useMemo(
    () => planes.filter((p) => p.estado !== 'Archivado'),
    [planes]
  );

  const archivados = useMemo(
    () => planes.filter((p) => p.estado === 'Archivado'),
    [planes]
  );

  const planesEnVista = viewMode === 'archivados' ? archivados : activos;

  const planesFiltrados = useMemo(() => {
    const q = filtros.q.trim().toLowerCase();
    return planesEnVista.filter((p) => {
      const okQ = !q || (p.titulo || "").toLowerCase().includes(q);
      const okEstado = !filtros.estado || p.estado === filtros.estado;
      return okQ && okEstado;
    });
  }, [planesEnVista, filtros]);

  const abrirModal = () => {
    setTitulo("");
    setDetalle("");
    setArchivo(null);
    setModal(true);
  };

  const cerrarModal = () => setModal(false);

  const submitCrear = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !detalle.trim() || !archivo) return;
    const res = await crear({ titulo, detalle }, archivo);
    if (res.success) {
      showSuccess("Planeamiento creado correctamente.");
      cerrarModal();
    } else {
      showError("No se pudo crear el planeamiento.");
    }
  };

  const handleEnviar = async (id) => {
    const res = await enviar(id);
    if (res.success) {
      showSuccess("Planeamiento enviado a revisión.");
    } else {
      const msg =
        res?.error?.response?.data?.error?.message ||
        res?.error?.response?.data?.detail ||
        "No se pudo enviar el planeamiento.";
      showError(msg);
    }
  };

  const handleVer = async (plan) => {
    const res = await descargarArchivo(plan.id, plan.titulo, plan.archivo);
    if (!res.success) {
      const statusCode = res?.error?.response?.status;
      const msg =
        (statusCode === 404 ? 'Este planeamiento no tiene archivo disponible.' : null) ||
        res?.error?.response?.data?.detail ||
        res?.error?.message ||
        "No se pudo abrir el archivo.";
      showError(msg);
    }
  };

  const abrirConfirm = (id, accion) => setConfirmModal({ open: true, id, accion });
  const cerrarConfirm = () => setConfirmModal({ open: false, id: null, accion: null });

  const handleConfirmar = async () => {
    const { id, accion } = confirmModal;
    cerrarConfirm();
    if (accion === 'archivar') {
      const res = await eliminar(id);
      if (res.success) showSuccess("Planeamiento archivado.");
      else showError("No se pudo archivar.");
    } else if (accion === 'desarchivar') {
      const res = await desarchivar(id);
      if (res.success) {
        showSuccess("Planeamiento restaurado a Borrador.");
      } else {
        const msg =
          res?.error?.response?.data?.error?.message ||
          res?.error?.response?.data?.detail ||
          "No se pudo desarchivar.";
        showError(msg);
      }
    }
  };

  const columnsActivos = [
    {
      key: 'titulo',
      label: 'Título',
      render: (p) => (
        <div>
          <span className="font-medium text-slate-900">{p.titulo}</span>
          {p.comentario_revision && (
            <p className="mt-1 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
              Comentario: {p.comentario_revision}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (p) => estadoBadge(p.estado),
    },
    {
      key: 'creado',
      label: 'Fecha',
      render: (p) => <span className="text-slate-600">{p.creado?.slice(0, 10) || '—'}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (p) => (
        <div className="flex justify-end gap-2">
          {p.archivo ? (
            <BtnVer onClick={() => handleVer(p)} />
          ) : (
            <span className="text-xs text-slate-400">Sin archivo</span>
          )}
          {p.estado === 'Borrador' && (
            <button
              type="button"
              onClick={() => handleEnviar(p.id)}
              disabled={uploading}
              className="rounded-md bg-[#185fa5] px-3 py-1 text-xs font-medium text-white hover:bg-[#1450a3] disabled:opacity-50"
            >
              Enviar
            </button>
          )}
          <BtnArchivar onClick={() => abrirConfirm(p.id, 'archivar')} disabled={uploading} />
        </div>
      ),
    },
  ];

  const columnsArchivados = [
    {
      key: 'titulo',
      label: 'Título',
      render: (p) => <span className="font-medium text-slate-900">{p.titulo}</span>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (p) => estadoBadge(p.estado),
    },
    {
      key: 'creado',
      label: 'Fecha',
      render: (p) => <span className="text-slate-600">{p.creado?.slice(0, 10) || '—'}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (p) => (
        <div className="flex justify-end gap-2">
          {p.archivo && <BtnVer onClick={() => handleVer(p)} />}
          <BtnRestaurar onClick={() => abrirConfirm(p.id, 'desarchivar')} disabled={uploading} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planeamientos Académicos"
        subtitle="Carga tu planeamiento con título, detalle y documento adjunto."
        showBackButton={false}
        action={{ label: 'Subir plan', onClick: abrirModal }}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {String(error?.message || "Error inesperado")}
        </div>
      )}

      <ActiveArchiveToggle
        viewMode={viewMode}
        onChange={setViewMode}
        activeLabel="Activos"
        archivedLabel="Archivados"
        activeCount={activos.length}
        archivedCount={archivados.length}
      />

      <div className="flex flex-wrap gap-3">
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm md:w-1/2 focus:border-[#185fa5] focus:outline-none"
          placeholder="Buscar planeamiento"
          value={filtros.q}
          onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))}
        />
        {viewMode === 'activos' && (
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#185fa5] focus:outline-none"
            value={filtros.estado}
            onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
          >
            <option value="">Todos los estados</option>
            <option value="Borrador">Borrador</option>
            <option value="En revisión">En revisión</option>
            <option value="Aprobado">Aprobado</option>
          </select>
        )}
      </div>

      <DataTable
        loading={loading}
        data={planesFiltrados}
        pageSize={8}
        emptyMessage={viewMode === 'archivados' ? "No hay planeamientos archivados." : "No hay planeamientos todavía."}
        columns={viewMode === 'archivados' ? columnsArchivados : columnsActivos}
      />

      {/* Modal crear */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">Subir Planeamiento</h3>
              <button type="button" onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={submitCrear} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-[#185fa5] focus:outline-none"
                  placeholder="Ej: Planeamiento Q1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Detalle</label>
                <textarea
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-[#185fa5] focus:outline-none"
                  placeholder="Ej: Planeamiento de Español para primer trimestre"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Archivo (PDF/DOC/DOCX)</label>
                <input
                  type="file"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#e6f1fb] file:text-[#185fa5] hover:file:bg-[#d0e7f7]"
                />
                {!archivo && (
                  <p className="text-xs text-gray-400 mt-1">Debes adjuntar el documento para guardar el planeamiento.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || !titulo.trim() || !detalle.trim() || !archivo}
                  className="px-5 py-2.5 rounded-lg bg-[#185fa5] text-white font-semibold hover:bg-[#1450a3] disabled:opacity-50"
                >
                  {uploading ? "Subiendo..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.accion === 'desarchivar' ? 'Desarchivar planeamiento' : 'Archivar planeamiento'}
        message={
          confirmModal.accion === 'desarchivar'
            ? '¿Deseas restaurar este planeamiento? Volverá al estado Borrador y podrás enviarlo nuevamente.'
            : '¿Seguro que deseas archivar este planeamiento? Quedará guardado pero no aparecerá en la lista activa.'
        }
        confirmLabel={confirmModal.accion === 'desarchivar' ? 'Restaurar' : 'Archivar'}
        variant={confirmModal.accion === 'desarchivar' ? 'info' : 'warning'}
        onConfirm={handleConfirmar}
        onCancel={cerrarConfirm}
        loading={uploading}
      />

      <Toast message={toast?.message} variant={toast?.variant} onClose={clearToast} />
    </div>
  );
}
