import { useEffect, useMemo, useState } from "react";
import { usePlaneamientos } from "./usePlaneamientos";
import Paginador from '../../components/ui/Paginador';

export default function Planeamientos() {
  const {
    planes,
    loading,
    uploading,
    error,
    errorUploading,
    cargar,
    crear,
    eliminar,
    descargarArchivo,
  } = usePlaneamientos();

  const [filtros, setFiltros] = useState({ q: "", estado: "" });
  const [modal, setModal] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [archivo, setArchivo] = useState(null);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const planesFiltrados = useMemo(() => {
    const q = filtros.q.trim().toLowerCase();
    return planes.filter((p) => {
      const okQ = !q || (p.titulo || "").toLowerCase().includes(q);
      const okEstado = !filtros.estado || p.estado === filtros.estado;
      return okQ && okEstado;
    });
  }, [planes, filtros]);

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
    if (res.success) cerrarModal();
  };

  const confirmarEliminar = async (id) => {
    const ok = window.confirm("¿Seguro que deseas eliminar este planeamiento?");
    if (!ok) return;
    await eliminar(id);
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
      alert(msg);
      console.error(res.error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        <p className="mt-4 text-gray-600 font-medium">
          Cargando planeamientos...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Planeamientos Académicos</h2>
          <p className="text-sm text-gray-500">
            Carga tu planeamiento con titulo, detalle y documento adjunto.
          </p>
        </div>

        <button
          onClick={abrirModal}
          className="rounded-lg bg-[#185fa5] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#0c447c] disabled:opacity-50"
          disabled={uploading}
        >
          Subir plan
        </button>
      </div>
      {(error || errorUploading) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {String(
            error?.message ||
              errorUploading?.response?.data?.detail ||
              errorUploading?.message ||
              "Error inesperado",
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/2"
            placeholder="Buscar planeamiento"
            value={filtros.q}
            onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))}
          />
          <select
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-48"
            value={filtros.estado}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, estado: e.target.value }))
            }
          >
            <option value="">Todos los estados</option>
            <option value="Borrador">Borrador</option>
          </select>
        </div>

        {/* Tabla */}
        <Paginador items={planesFiltrados} itemsPorPagina={8}>
          {(itemsPaginados) => (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                    <th className="px-3 py-2">Título</th>
                    <th className="px-3 py-2">Detalle</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {itemsPaginados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-10 text-center text-slate-500"
                      >
                        No hay planeamientos todavía.
                      </td>
                    </tr>
                  ) : (
                    itemsPaginados.map((p) => (
                      <tr key={p.id} className="hover:bg-[#e6f1fb]">
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {p.titulo}
                        </td>

                        <td className="px-3 py-2 text-slate-600">{p.detalle || "-"}</td>

                        <td className="px-3 py-2 text-slate-600">
                          {p.creado || "—"}
                        </td>

                        <td className="px-3 py-2 space-x-3">
                          {p.archivo ? (
                            <button
                              onClick={() => handleVer(p)}
                              className="rounded-md bg-[#185fa5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0c447c]"
                            >
                              Ver
                            </button>
                          ) : (
                            <span className="text-slate-400">Sin archivo</span>
                          )}

                          <button
                            onClick={() => confirmarEliminar(p.id)}
                            className="rounded-md bg-[#0b2545] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#081a31]"
                            disabled={uploading}
                          >
                            Archivar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Paginador>
      </div>

      {/* Modal subir plan */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                Subir Planeamiento
              </h3>
              <button
                type="button"
                onClick={cerrarModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitCrear} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Título
                </label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Planeamiento Q1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Detalle
                </label>
                <textarea
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Planeamiento de Espanol para primer trimestre"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Archivo (PDF/DOC/DOCX)
                </label>
                <input
                  type="file"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {!archivo && (
                  <p className="text-xs text-gray-400 mt-1">
                    Debes adjuntar el documento para guardar el planeamiento.
                  </p>
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
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploading ? "Subiendo..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
