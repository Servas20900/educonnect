import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchGruposDocente,
  fetchEstudiantesCatalogo,
  fetchEstudiantesPorGrupo,
  agregarEstudianteAGrupo,
  importarEstudiantesAGrupo,
  removerEstudianteDeGrupo,
} from "../../api/registroEstudiantesService";

const DOCENTE_GRUPO_STORAGE_KEY = "docente_estudiantes_hub_grupo_id";

export default function RegistroEstudiantes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryGrupoId = searchParams.get("grupo");
  const [grupoId, setGrupoId] = useState("");
  const [grupos, setGrupos] = useState([]);

  const [catalogoEstudiantes, setCatalogoEstudiantes] = useState([]);
  const [estudiantesGrupo, setEstudiantesGrupo] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modalAgregar, setModalAgregar] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");

  const [archivoImportacion, setArchivoImportacion] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const loadCatalogo = async () => {
    try {
      const data = await fetchEstudiantesCatalogo();
      const list = Array.isArray(data) ? data : data.results || [];
      setCatalogoEstudiantes(list);
    } catch {
      setError("No se pudo cargar el catálogo de estudiantes.");
    }
  };

  const loadGrupos = async () => {
    try {
      const data = await fetchGruposDocente();
      const list = Array.isArray(data) ? data : data.results || [];
      setGrupos(list);

      const persistedGrupoId = localStorage.getItem(DOCENTE_GRUPO_STORAGE_KEY);

      if (queryGrupoId && list.some((item) => String(item.id) === String(queryGrupoId))) {
        setGrupoId(String(queryGrupoId));
        return;
      }

      if (persistedGrupoId && list.some((item) => String(item.id) === String(persistedGrupoId))) {
        setGrupoId(String(persistedGrupoId));
        return;
      }

      if (list.length > 0) {
        setGrupoId((prev) => {
          if (prev && list.some((item) => String(item.id) === String(prev))) {
            return prev;
          }
          return String(list[0].id);
        });
      } else {
        setGrupoId("");
      }
    } catch {
      setError("No se pudieron cargar los grupos del docente.");
      setGrupos([]);
      setGrupoId("");
    }
  };

  const loadEstudiantesGrupo = async () => {
    if (!grupoId) {
      setEstudiantesGrupo([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await fetchEstudiantesPorGrupo(grupoId);
      const list = Array.isArray(data) ? data : data.results || [];
      setEstudiantesGrupo(list);
    } catch {
      setError("No se pudieron cargar los estudiantes del grupo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrupos();
    loadCatalogo();
  }, []);

  useEffect(() => {
    if (!queryGrupoId) return;
    if (!grupos.some((item) => String(item.id) === String(queryGrupoId))) return;
    setGrupoId(String(queryGrupoId));
  }, [queryGrupoId, grupos]);

  useEffect(() => {
    if (!grupoId) return;
    localStorage.setItem(DOCENTE_GRUPO_STORAGE_KEY, String(grupoId));
  }, [grupoId]);

  useEffect(() => {
    loadEstudiantesGrupo();
  }, [grupoId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return estudiantesGrupo;

    const term = search.trim().toLowerCase();

    return estudiantesGrupo.filter((item) => {
      const nombre = (item.nombre || "").toLowerCase();
      const codigo = (item.codigo_estudiante || "").toLowerCase();
      const identificacion = (item.identificacion || "").toLowerCase();
      const email = (item.email || "").toLowerCase();

      return (
        nombre.includes(term) ||
        codigo.includes(term) ||
        identificacion.includes(term) ||
        email.includes(term)
      );
    });
  }, [estudiantesGrupo, search]);

  const estudiantesDisponibles = useMemo(() => {
    const yaAsignados = new Set(
      estudiantesGrupo.map((e) => String(e.persona_id))
    );

    return catalogoEstudiantes.filter((est) => {
      const personaId = String(est.persona_id || "");
      return personaId && !yaAsignados.has(personaId);
    });
  }, [catalogoEstudiantes, estudiantesGrupo]);

  const handleAgregar = async () => {
    if (!grupoId) {
      setMensaje("Debes seleccionar un grupo primero.");
      return;
    }

    if (!selectedPersonaId) {
      setMensaje("Debes seleccionar un estudiante.");
      return;
    }

    try {
      const res = await agregarEstudianteAGrupo(grupoId, selectedPersonaId);
      setMensaje(res?.message || "Estudiante registrado correctamente.");
      setSelectedPersonaId("");
      setModalAgregar(false);
      await loadEstudiantesGrupo();
    } catch (err) {
      const msg =
        err?.response?.data?.detail || "No se pudo registrar el estudiante.";
      setMensaje(msg);
    }
  };

  const handleImportar = async () => {
    if (!grupoId) {
      setMensaje("Debes seleccionar un grupo primero.");
      return;
    }

    if (!archivoImportacion) {
      setMensaje("Debes seleccionar un archivo CSV o Excel.");
      return;
    }

    try {
      const res = await importarEstudiantesAGrupo(grupoId, archivoImportacion);

      let texto = res?.message || "Importación completada.";
      if (typeof res?.agregados !== "undefined") {
        texto += ` Agregados: ${res.agregados}.`;
      }
      if (typeof res?.duplicados !== "undefined") {
        texto += ` Duplicados: ${res.duplicados}.`;
      }
      if (Array.isArray(res?.no_encontrados) && res.no_encontrados.length > 0) {
        texto += ` No encontrados: ${res.no_encontrados.join(", ")}.`;
      }

      setMensaje(texto);
      setArchivoImportacion(null);
      await loadEstudiantesGrupo();
    } catch (err) {
      const msg =
        err?.response?.data?.detail || "No se pudo importar el archivo.";
      setMensaje(msg);
    }
  };

  const handleRemover = async (matriculaId) => {
    const ok = window.confirm("¿Seguro que deseas quitar este estudiante del grupo?");
    if (!ok) return;

    try {
      const res = await removerEstudianteDeGrupo(matriculaId);
      setMensaje(res?.message || "Estudiante removido del grupo.");
      await loadEstudiantesGrupo();
    } catch (err) {
      const msg =
        err?.response?.data?.detail || "No se pudo remover el estudiante.";
      setMensaje(msg);
    }
  };

  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/docente/estudiantes");
  };

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <button
            onClick={handleVolver}
            className="mb-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Volver
          </button>
          <h2 className="text-2xl font-bold">Lista de Estudiantes</h2>
          <p className="text-sm text-gray-500">
            Gestiona los estudiantes asignados a tu grupo o clase.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadEstudiantesGrupo}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Recargar
          </button>
        </div>
      </div>

      {mensaje && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={grupoId}
            onChange={(e) => setGrupoId(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-64"
          >
            <option value="">Seleccionar grupo/clase</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label || `${g.nombre} (${g.codigo_grupo || g.id})`}
              </option>
            ))}
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/3"
            placeholder="Buscar estudiante"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setArchivoImportacion(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 md:w-auto file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#185fa5] hover:file:bg-[#e6f1fb]"
          />

          <button
            onClick={handleImportar}
            className="rounded-lg border border-[#185fa5] px-4 py-2 text-sm text-[#185fa5] transition-colors hover:bg-[#e6f1fb]"
          >
            Importar lista
          </button>
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Email</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan="4" className="px-3 py-6 text-center text-sm text-gray-500">
                    Cargando estudiantes...
                  </td>
                </tr>
              )}

              {!loading && !grupoId && (
                <tr>
                  <td colSpan="4" className="px-3 py-6 text-center text-sm text-gray-500">
                    Selecciona una clase para ver la lista de estudiantes.
                  </td>
                </tr>
              )}

              {!loading && grupoId && filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-3 py-6 text-center text-sm text-gray-500">
                    No hay estudiantes registrados en esta clase.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((e) => (
                  <tr key={e.matricula_id || e.persona_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {e.nombre || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {e.codigo_estudiante || "N/A"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          e.estado === "activo"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {e.estado || "N/A"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{e.email || "N/A"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAgregar && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                Agregar estudiante al grupo
              </h3>
              <button
                onClick={() => setModalAgregar(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Estudiante
                </label>
                <select
                  value={selectedPersonaId}
                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-white focus:ring-2 focus:ring-[#378add]"
                >
                  <option value="">Seleccionar estudiante</option>
                  {estudiantesDisponibles.map((est) => {
                    const persona = est.persona_info || {};
                    const nombre = `${persona.nombre || ""} ${persona.primer_apellido || ""} ${persona.segundo_apellido || ""}`.trim();

                    return (
                      <option key={est.persona_id} value={est.persona_id}>
                        {nombre} - {est.codigo_estudiante || "Sin código"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAgregar(false)}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleAgregar}
                  className="px-5 py-2.5 rounded-lg bg-[#185fa5] text-white font-semibold hover:bg-[#378add]"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}