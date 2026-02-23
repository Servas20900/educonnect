import { useEffect, useMemo, useState } from "react";
import { useExportaciones } from "./useExportaciones";

export default function Exportaciones() {
  const { items, loading, uploading, error, cargar, crear, actualizar, eliminar, descargar } =
    useExportaciones();

  const [filtros, setFiltros] = useState({ q: "", formato: "" });
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);

  const [nombre, setNombre] = useState("");
  const [formato, setFormato] = useState("PDF");
  const [archivo, setArchivo] = useState(null);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = filtros.q.trim().toLowerCase();
    return items.filter((it) => {
      const okQ = !q || (it.nombre || "").toLowerCase().includes(q);
      const okF = !filtros.formato || it.formato === filtros.formato;
      return okQ && okF;
    });
  }, [items, filtros]);

  const abrirNuevo = () => {
    setEdit(null);
    setNombre("");
    setFormato("PDF");
    setArchivo(null);
    setModal(true);
  };

  const abrirEditar = (it) => {
    setEdit(it);
    setNombre(it.nombre || "");
    setFormato(it.formato || "PDF");
    setArchivo(null);
    setModal(true);
  };

  const cerrar = () => setModal(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const data = { nombre, formato };
    const res = edit
      ? await actualizar(edit.id, data, archivo)
      : await crear(data, archivo);

    if (res.success) cerrar();
  };

  const confirmarEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta exportación?")) return;
    await eliminar(id);
  };

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Exportación de Planillas</h2>
          <p className="text-sm text-gray-500">
            Sube archivos (PDF/CSV/XLSX) y descárgalos cuando los necesités.
          </p>
        </div>

        <button
          onClick={abrirNuevo}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
          disabled={uploading}
        >
          Nueva exportación
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {String(error?.message || "Error inesperado")}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/2"
            placeholder="Buscar"
            value={filtros.q}
            onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))}
          />
          <select
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-40"
            value={filtros.formato}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, formato: e.target.value }))
            }
          >
            <option value="">Formato</option>
            <option value="PDF">PDF</option>
            <option value="CSV">CSV</option>
            <option value="XLSX">XLSX</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Formato</th>
                <th className="px-3 py-2">Actualizado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-gray-500">
                    No hay exportaciones todavía.
                  </td>
                </tr>
              ) : (
                filtrados.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{e.nombre}</td>
                    <td className="px-3 py-2 text-gray-700">{e.formato}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {(e.actualizado || "").slice(0, 10) || "—"}
                    </td>
                    <td className="px-3 py-2 space-x-3">
                      {e.archivo ? (
                        <button
                          onClick={() => descargar(e.id, e.nombre, e.formato)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Descargar
                        </button>
                      ) : (
                        <span className="text-gray-400">Sin archivo</span>
                      )}

                      <button
                        onClick={() => abrirEditar(e)}
                        className="text-gray-700 hover:text-gray-900 font-medium"
                        disabled={uploading}
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => confirmarEliminar(e.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
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
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                {edit ? "Editar Exportación" : "Nueva Exportación"}
              </h3>
              <button onClick={cerrar} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={submit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Actas 11°B - Q1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Formato
                </label>
                <select
                  value={formato}
                  onChange={(e) => setFormato(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                >
                  <option value="PDF">PDF</option>
                  <option value="CSV">CSV</option>
                  <option value="XLSX">XLSX</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Archivo (opcional)
                </label>
                <input
                  type="file"
                  accept="application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {edit?.archivo && !archivo && (
                  <p className="text-xs text-gray-400 mt-1">
                    Ya existe un archivo cargado. Si subes otro, lo reemplaza.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrar}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || !nombre.trim()}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}