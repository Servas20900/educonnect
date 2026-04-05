import { useEffect, useMemo, useState } from "react";
import { useOficiosPlantillas } from "./useOficiosPlantillas";
import FormularioPlantilla from "./FormularioPlantilla";

export default function OficiosPlantillas() {
  const {
    cargarPlantillas,
    plantillasExistentes,
    loading,
    error,
    uploading,
    errorUploading,
    crearPlantilla,
    actualizarPlantilla,
    eliminarPlantilla,
  } = useOficiosPlantillas();

  const [form, setForm] = useState(false);
  const [object, setObject] = useState({});
  const [mensaje, setMensaje] = useState("");

  const [filtros, setFiltros] = useState({
    nombre: "",
    categoria: "",
    estado: "",
  });

  useEffect(() => {
    cargarPlantillas();
  }, [cargarPlantillas]);

  const handleModalForm = () => {
    setForm((v) => !v);
    setObject({});
  };

  const handleEdit = (p) => {
    setObject(p);
    setForm(true);
  };

  const handleToggleEstado = async (p) => {
    try {
      await eliminarPlantilla(p.id); // tu destroy hace toggle
      setMensaje("Estado actualizado ✅");
    } catch (e) {
      setMensaje("Error actualizando estado ❌");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const plantillasFiltradas = useMemo(() => {
    return (plantillasExistentes || []).filter((p) => {
      const nombreOk =
        !filtros.nombre ||
        (p.nombre || "").toLowerCase().includes(filtros.nombre.toLowerCase());

      const categoriaOk =
        !filtros.categoria || p.categoria === filtros.categoria;
      const estadoOk = !filtros.estado || p.estado === filtros.estado;

      return nombreOk && categoriaOk && estadoOk;
    });
  }, [plantillasExistentes, filtros]);

  const badge = (estado) => {
    if (estado === "Publicado") return "bg-emerald-100 text-emerald-700";
    if (estado === "Inactivo") return "bg-slate-100 text-slate-600";
    return "bg-amber-100 text-amber-700";
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Oficios y Plantillas
          </h2>
          <p className="text-sm text-gray-500">
            Catálogo de formatos oficiales.
          </p>
        </div>

        <button
          className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all transform hover:-translate-y-1 active:scale-95"
          onClick={handleModalForm}
        >
          <span className="text-xl mr-2">+</span> Nueva plantilla
        </button>
      </div>

      {mensaje && (
        <div className="p-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-700">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error?.detail || error?.message || "Error al cargar plantillas"}
        </div>
      )}

      {form && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <FormularioPlantilla
            uploading={uploading}
            errorUploading={errorUploading}
            crearPlantilla={crearPlantilla}
            actualizarPlantilla={actualizarPlantilla}
            handleClose={handleModalForm}
            object={object}
            setInformation={setMensaje}
          />
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          name="nombre"
          value={filtros.nombre}
          onChange={handleChange}
          className="flex-1 min-w-[250px] px-4 py-2.5 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500"
        />

        <select
          name="categoria"
          value={filtros.categoria}
          onChange={handleChange}
          className="py-2.5 px-4 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas las categorías</option>
          <option value="General">General</option>
          <option value="Comunicados">Comunicados</option>
          <option value="Comité">Comité</option>
        </select>

        <select
          name="estado"
          value={filtros.estado}
          onChange={handleChange}
          className="py-2.5 px-4 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="Publicado">Publicado</option>
          <option value="Borrador">Borrador</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {plantillasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="bg-indigo-50 p-6 rounded-full mb-4">
              <span className="text-5xl">📂</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              No hay resultados
            </h2>
            <p className="text-gray-400 mt-2 text-center max-w-xs">
              Ajustá filtros o crea una nueva plantilla.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                    Nombre
                  </th>
                  <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                    Categoría
                  </th>
                  <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                    Actualización
                  </th>
                  <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                    Estado
                  </th>
                  <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {plantillasFiltradas.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-indigo-50/40 transition-colors"
                  >
                    <td className="px-8 py-5 font-bold text-gray-800">
                      {p.nombre}
                    </td>
                    <td className="px-8 py-5 text-gray-600 font-medium">
                      {p.categoria}
                    </td>
                    <td className="px-8 py-5 text-gray-500 font-medium">
                      {p.ultima_actualizacion}
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`px-3 py-1 inline-flex text-[11px] font-black rounded-full ${badge(p.estado)}`}
                      >
                        {p.estado?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-3">
                        {p.archivo_adjunto ? (
                          <a
                            href={p.archivo_adjunto}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-200 transition-all shadow-sm text-xs font-bold"
                          >
                            VER
                          </a>
                        ) : (
                          <span className="px-4 py-2 text-xs text-gray-400">
                            Sin archivo
                          </span>
                        )}

                        <button
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm text-xs font-bold"
                          onClick={() => handleEdit(p)}
                        >
                          EDITAR
                        </button>

                        <button
                          className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm text-xs font-bold"
                          onClick={() => handleToggleEstado(p)}
                        >
                          {p.estado === "Inactivo" ? "ACTIVAR" : "DESACTIVAR"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}