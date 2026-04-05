import { useState, useEffect, useMemo } from "react";
import PopUp from "../../../components/ui/PopUp";
import Paginador from "../../../components/ui/Paginador";
import RenderSubirArchivo from "./RenderSubirArchivo";
import RenderNuevaCarpeta from "./RenderNuevaCarpeta";
import RenderEditarPermisos from "./RenderEditarPermisos";
import { useRepositorios } from './useRepositorios';
import { BtnDescargar } from "../../../components/ui/ActionButtons";

const MODELO_REPOSITORIO = "documentosrepositorio";

export default function Repositorios() {
  const {
    repositorios,
    documentos,
    loading,
    uploading,
    cargarRepositorios,
    cargarDocumentos,
    subirArchivo,
    nuevoRepositorio,
    editarRepositorio,
    cargarRoles,
    roles
  } = useRepositorios();

  const [repoSeleccionado, setRepoSeleccionado] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accion, setAccion] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarRepositorios();
    cargarRoles();
  }, [cargarRepositorios]);

  const handleAbrirRepo = (repo) => {
    setRepoSeleccionado(repo);
    setBusqueda("");
    cargarDocumentos(MODELO_REPOSITORIO, repo.id);
  };

  const handleSubir = (repo) => {
    setRepoSeleccionado(repo);
    setAccion("SUBIR");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAccion("");
  };

  const reposFiltrados = useMemo(() =>
    repositorios.filter(r => r.nombre.toLowerCase().includes(busqueda.toLowerCase())),
    [repositorios, busqueda]
  );

  const documentosFiltrados = useMemo(() =>
    documentos.filter(doc => doc.nombre.toLowerCase().includes(busqueda.toLowerCase())),
    [documentos, busqueda]
  );

  if (loading && repositorios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-500 font-bold uppercase text-[10px] tracking-widest">Sincronizando con Cloudinary...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <PopUp isModalOpen={isModalOpen} closeModal={closeModal}>
        {accion === "SUBIR" && (
          <RenderSubirArchivo
            repositorio={repoSeleccionado}
            subirArchivo={(file, desc) => subirArchivo(MODELO_REPOSITORIO, repoSeleccionado.id, file, desc)}
            uploading={uploading}
            onSuccess={closeModal}
          />
        )}
        {accion === "NUEVA_CARPETA" && (
          <RenderNuevaCarpeta
            nuevoRepositorio={nuevoRepositorio}
            onSuccess={closeModal}
          />
        )}
        {accion === "EDITAR" && (
          <RenderEditarPermisos
            repositorio={repoSeleccionado}
            editarRepositorio={editarRepositorio}
            onSuccess={closeModal}
            roles={roles}
          />
        )}
      </PopUp>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            {repoSeleccionado ? repoSeleccionado.nombre : "Repositorios y Carpetas"}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {repoSeleccionado
              ? `Permisos: ${repoSeleccionado.rol_acceso}`
              : "Gestión centralizada de documentos y activos multimedia."}
          </p>
        </div>
        <div className="flex gap-3">
          {!repoSeleccionado ? (
            <button
              onClick={() => {
                setAccion("NUEVA_CARPETA");
                setIsModalOpen(true);
              }}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-1"
            >
              NUEVA CARPETA
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSubir(repoSeleccionado)}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all transform hover:-translate-y-1"
              >
                SUBIR ARCHIVO AQUÍ
              </button>

              <button
                onClick={() => setRepoSeleccionado(null)}
                className="px-4 py-2 border border-gray-200 text-gray-500 font-black rounded-xl hover:bg-white transition-all text-[10px] uppercase tracking-widest"
              >
                ← Volver
              </button>
            </>
          )
          }

        </div>
      </div>

      <div className="relative max-w-md">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          className="w-full rounded-2xl border-none bg-white px-12 py-3 text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all"
          placeholder={repoSeleccionado ? "Buscar en esta carpeta..." : "Buscar repositorios..."}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {!repoSeleccionado ? (
        <div className="grid gap-6 md:grid-cols-3">
          {reposFiltrados.map((c) => (
            <div key={c.id} className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between mb-6">
                <div className="text-3xl bg-indigo-50 p-3 rounded-2xl group-hover:scale-110 transition-transform">📂</div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {new Date(c.fecha_creacion).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-xl font-black text-gray-800 tracking-tight">{c.nombre}</h3>
              <p className="text-xs text-gray-400 mt-1 truncate">{c.descripcion || "Sin descripción"}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200 uppercase">
                  {c.rol_acceso}
                </span>
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-4">
                <button
                  onClick={() => handleAbrirRepo(c)}
                  className="text-xs font-black text-indigo-600 hover:tracking-widest transition-all uppercase"

                >
                  Abrir Carpeta
                </button>
                <div className="flex gap-4 items-center">
                  <button onClick={() => handleSubir(c)} title="Subir archivo" className="text-xl hover:scale-110 transition-transform">📤</button>
                  <button
                    title="Configurar Permisos"
                    className="text-xl hover:scale-110 transition-transform"
                    onClick={() => {
                      setAccion("EDITAR");
                      setRepoSeleccionado(c);
                      setIsModalOpen(true);
                    }}
                  >⚙️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <Paginador items={documentosFiltrados} itemsPorPagina={8}>
            {(itemsPaginados) => (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-8 py-5 text-left">Documento</th>
                      <th className="px-8 py-5 text-left">Versión</th>
                      <th className="px-8 py-5 text-left">Subido por</th>
                      <th className="px-8 py-5 text-left">Fecha</th>
                      <th className="px-8 py-5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {itemsPaginados.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-8 py-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                          Esta carpeta está vacía
                        </td>
                      </tr>
                    ) : (
                      itemsPaginados.map((doc) => (
                        <tr key={doc.id} className="hover:bg-indigo-50/20 transition-colors">
                          <td className="px-8 py-5">
                            <div className="text-sm font-bold text-gray-800">{doc.nombre}</div>
                            <div className="text-[10px] text-gray-400 font-black uppercase">
                              {doc.tamaño_legible} • {doc.extension}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase ring-1 ring-indigo-100">
                              v{doc.version}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm font-bold text-gray-600">
                            {doc.nombre_cargado_por || "Sistema"}
                          </td>
                          <td className="px-8 py-5 text-xs text-gray-500 font-bold uppercase">
                            {new Date(doc.fecha_carga).toLocaleDateString()}
                          </td>
                          <td className="px-8 py-5 text-right">

                            <BtnDescargar
                              onClick={() => {
                                const url = doc.url_descarga;
                                
                                const link = document.createElement('a');
                                link.href = url;

                                link.target = "_blank";
                                link.rel = "noopener noreferrer";

                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              title="Descargar Documento"
                            />
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
      )}
    </div>
  );
}