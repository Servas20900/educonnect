import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DataTable, PageHeader } from "../../components/ui";
import {
  fetchGruposDocente,
  fetchEstudiantesPorGrupo,
} from "../../api/registroEstudiantesService";

const DOCENTE_GRUPO_STORAGE_KEY = "docente_estudiantes_hub_grupo_id";

function GrupoSelector({ grupoId, grupos, onChange }) {
  return (
    <select
      value={grupoId}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-64"
    >
      <option value="">Seleccionar grupo/clase</option>
      {grupos.map((g) => (
        <option key={g.id} value={g.id}>
          {g.label || `${g.nombre} (${g.codigo_grupo || g.id})`}
        </option>
      ))}
    </select>
  );
}

export default function RegistroEstudiantes() {
  const [searchParams] = useSearchParams();
  const queryGrupoId = searchParams.get("grupo");

  const [grupoId, setGrupoId] = useState("");
  const [grupos, setGrupos] = useState([]);

  const [estudiantesGrupo, setEstudiantesGrupo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadGrupos = async () => {
    try {
      const data = await fetchGruposDocente();
      const list = Array.isArray(data) ? data : data.results || [];
      setGrupos(list);
      const persisted = localStorage.getItem(DOCENTE_GRUPO_STORAGE_KEY);
      if (queryGrupoId && list.some((g) => String(g.id) === String(queryGrupoId))) {
        setGrupoId(String(queryGrupoId));
      } else if (persisted && list.some((g) => String(g.id) === String(persisted))) {
        setGrupoId(String(persisted));
      } else if (list.length > 0) {
        setGrupoId(String(list[0].id));
      }
    } catch {
      setError("No se pudieron cargar los grupos del docente.");
    }
  };

  const loadEstudiantes = async () => {
    if (!grupoId) { setEstudiantesGrupo([]); return; }
    setLoading(true);
    setError("");
    try {
      const data = await fetchEstudiantesPorGrupo(grupoId);
      setEstudiantesGrupo(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError("No se pudieron cargar los estudiantes del grupo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGrupos(); }, []);

  useEffect(() => {
    if (grupoId) localStorage.setItem(DOCENTE_GRUPO_STORAGE_KEY, grupoId);
    loadEstudiantes();
  }, [grupoId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return estudiantesGrupo;
    const term = search.trim().toLowerCase();
    return estudiantesGrupo.filter((e) =>
      [e.nombre, e.codigo_estudiante, e.identificacion, e.email]
        .some((v) => (v || "").toLowerCase().includes(term))
    );
  }, [estudiantesGrupo, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lista de Estudiantes"
        subtitle="Consulta los estudiantes de tu grupo."
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <GrupoSelector grupoId={grupoId} grupos={grupos} onChange={setGrupoId} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:w-1/3"
          placeholder="Buscar estudiante..."
        />
        <DataTable
          loading={loading}
          data={filtered}
          emptyMessage={grupoId ? "No hay estudiantes en esta clase." : "Selecciona una clase."}
          columns={[
            { key: "nombre", label: "Nombre", render: (e) => <span className="font-medium text-gray-900">{e.nombre || "N/A"}</span> },
            { key: "codigo", label: "Código", render: (e) => <span className="text-gray-700">{e.codigo_estudiante || "N/A"}</span> },
            { key: "identificacion", label: "Identificación", render: (e) => <span className="text-gray-700">{e.identificacion || "N/A"}</span> },
            {
              key: "estado", label: "Estado",
              render: (e) => (
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${e.estado === "activo" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                  {e.estado || "N/A"}
                </span>
              ),
            },
            { key: "email", label: "Email", render: (e) => <span className="text-gray-700">{e.email || "N/A"}</span> },
          ]}
        />
      </div>
    </div>
  );
}
