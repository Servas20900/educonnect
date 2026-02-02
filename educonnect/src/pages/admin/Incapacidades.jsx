import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("access_token") || "";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function readBody(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return await res.json();
  return await res.text();
}

function pickDocUrl(doc) {
  const raw =
    doc?.documentoUrl ||
    doc?.documento_adjunto ||
    doc?.archivo_adjunto ||
    doc?.archivo ||
    "";

  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("/")) return `${API_BASE}${raw}`;
  return `${API_BASE}/${raw}`;
}

function Badge({ children, variant = "gray" }) {
  const styles = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${styles[variant]}`}>
      {children}
    </span>
  );
}

function Alert({ msg, type }) {
  if (!msg) return null;

  const cls =
    type === "ok"
      ? "bg-green-50 text-green-700 border-green-200"
      : type === "err"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <div className={`mb-6 p-3 rounded-lg text-sm border ${cls}`}>
      {msg}
    </div>
  );
}

export default function Incapacidades() {
  const [documentosPendientes, setDocumentosPendientes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info"); // info | ok | err

  // Form
  const [docente, setDocente] = useState("");
  const [tipo, setTipo] = useState("");
  const [fechaAusencia, setFechaAusencia] = useState(todayISO());
  const [archivo, setArchivo] = useState(null);

  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [institucionEmisora, setInstitucionEmisora] = useState("");

  // Modal rechazo
  const [rechazoOpen, setRechazoOpen] = useState(false);
  const [rechazoId, setRechazoId] = useState(null);
  const [rechazoComentario, setRechazoComentario] = useState("");

  function setAlert(text, type = "info") {
    setMsg(text);
    setMsgType(type);
  }

  async function cargarPendientes() {
    setLoading(true);
    setAlert("");

    try {
      const t = getToken();
      if (!t) throw new Error("No hay token guardado (access_token).");

      const res = await fetch(`${API_BASE}/api/v1/horario/incapacidades/pendientes/`, {
        headers: { Authorization: `Bearer ${t}` },
      });

      const body = await readBody(res);
      if (!res.ok) throw new Error(typeof body === "string" ? body : JSON.stringify(body));

      setDocumentosPendientes(Array.isArray(body) ? body : []);
    } catch (e) {
      console.error(e);
      setAlert("No se pudieron cargar los pendientes: " + (e?.message || ""), "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarPendientes();
  }, []);

  async function registrarAusencia() {
    setAlert("");

    if (!docente || !tipo || !fechaAusencia) {
      setAlert("Completa Docente, Tipo y Fecha de ausencia.", "err");
      return;
    }
    if (!numeroDocumento || !institucionEmisora) {
      setAlert("Completa Número de documento e Institución emisora.", "err");
      return;
    }

    try {
      const t = getToken();
      if (!t) throw new Error("No hay token guardado (access_token).");

      const fd = new FormData();
      fd.append("docente", docente);

      // Una sola fecha en UI:
      fd.append("fecha_inicio", fechaAusencia);
      fd.append("fecha_fin", fechaAusencia);

      // Requeridos:
      fd.append("numero_documento", numeroDocumento);
      fd.append("institucion_emisora", institucionEmisora);

      // OJO: NO enviamos fecha_registro para evitar choque (backend ya lo setea)
      fd.append("motivo", `[${tipo.toUpperCase()}] Registro desde UI`);

      if (archivo) fd.append("archivo", archivo);

      const res = await fetch(`${API_BASE}/api/v1/horario/incapacidades/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
        body: fd,
      });

      const body = await readBody(res);
      if (!res.ok) throw new Error(typeof body === "string" ? body : JSON.stringify(body));

      setAlert("✅ Ausencia registrada.", "ok");

      // Reset
      setDocente("");
      setTipo("");
      setFechaAusencia(todayISO());
      setArchivo(null);
      setNumeroDocumento("");
      setInstitucionEmisora("");

      await cargarPendientes();
    } catch (e) {
      console.error(e);
      setAlert(e?.message || "Error registrando.", "err");
    }
  }

  async function validar(id) {
    setAlert("");

    try {
      const t = getToken();
      const res = await fetch(`${API_BASE}/api/v1/horario/incapacidades/${id}/validar/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const body = await readBody(res);
      if (!res.ok) throw new Error(typeof body === "string" ? body : JSON.stringify(body));

      setAlert("✅ Documento validado.", "ok");
      await cargarPendientes();
    } catch (e) {
      console.error(e);
      setAlert(e?.message || "No se pudo validar.", "err");
    }
  }

  function abrirRechazo(id) {
    setRechazoId(id);
    setRechazoComentario("");
    setRechazoOpen(true);
  }

  async function confirmarRechazo() {
    setAlert("");

    try {
      const t = getToken();
      const res = await fetch(`${API_BASE}/api/v1/horario/incapacidades/${rechazoId}/rechazar/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comentario: rechazoComentario || "" }),
      });

      const body = await readBody(res);
      if (!res.ok) throw new Error(typeof body === "string" ? body : JSON.stringify(body));

      setRechazoOpen(false);
      setAlert("✅ Documento rechazado.", "ok");
      await cargarPendientes();
    } catch (e) {
      console.error(e);
      setAlert(e?.message || "No se pudo rechazar.", "err");
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Registro y Validación de Incapacidades</h1>
          <p className="text-sm text-gray-500 mt-1">
            Subí justificantes/incapacidades y validá los documentos pendientes.
          </p>
        </div>

        <Alert msg={msg} type={msgType} />

        {/* FORM */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Nuevo registro</h2>
              <p className="text-xs text-gray-500">
                Los campos marcados son obligatorios. La fecha se ingresa una sola vez.
              </p>
            </div>
            <Badge variant="orange">Formulario</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Docente */}
            <div>
              <label className="text-xs font-medium text-gray-600">ID Docente *</label>
              <input
                value={docente}
                onChange={(e) => setDocente(e.target.value)}
                placeholder="Ej: 1"
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              />
              <p className="text-[11px] text-gray-400 mt-1">Debe existir en PersonasDocente.</p>
            </div>

            {/* Tipo */}
            <div>
              <label className="text-xs font-medium text-gray-600">Tipo *</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              >
                <option value="">Seleccionar</option>
                <option value="incapacidad">Incapacidad</option>
                <option value="justificante">Justificante</option>
              </select>
            </div>

            {/* Fecha única */}
            <div>
              <label className="text-xs font-medium text-gray-600">Fecha de ausencia *</label>
              <input
                type="date"
                value={fechaAusencia}
                onChange={(e) => setFechaAusencia(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              />
            </div>

            {/* Número doc */}
            <div>
              <label className="text-xs font-medium text-gray-600">Número de documento *</label>
              <input
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                placeholder="Ej: INC-2026-001"
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              />
            </div>

            {/* Institución */}
            <div>
              <label className="text-xs font-medium text-gray-600">Institución emisora *</label>
              <input
                value={institucionEmisora}
                onChange={(e) => setInstitucionEmisora(e.target.value)}
                placeholder="Ej: CCSS"
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              />
            </div>

            {/* Archivo */}
            <div>
              <label className="text-xs font-medium text-gray-600">Archivo (opcional)</label>
              <input
                type="file"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                className="mt-1 w-full text-sm text-gray-500 file:mr-3 file:rounded-full file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-orange-700 hover:file:bg-orange-100"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setDocente("");
                setTipo("");
                setFechaAusencia(todayISO());
                setArchivo(null);
                setNumeroDocumento("");
                setInstitucionEmisora("");
                setAlert("", "info");
              }}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Limpiar
            </button>

            <button
              type="button"
              onClick={registrarAusencia}
              className="px-5 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 shadow-sm"
            >
              Registrar Ausencia
            </button>
          </div>
        </section>

        {/* LISTA */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Pendientes de validación</h2>
              <p className="text-xs text-gray-500">
                Mostrando hasta 200 documentos. Validá o rechazá con un comentario.
              </p>
            </div>

            <button
              onClick={cargarPendientes}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {loading ? "Cargando..." : "Refrescar"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Docente</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {documentosPendientes.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-gray-500" colSpan={4}>
                      No hay documentos pendientes.
                    </td>
                  </tr>
                ) : (
                  documentosPendientes.map((doc) => {
                    const url = pickDocUrl(doc);
                    const docenteLabel = doc?.docente || doc?.nombrePersonal || "—";
                    const motivo = doc?.motivo || doc?.tipo || "—";

                    return (
                      <tr key={doc.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">{docenteLabel}</div>
                          <div className="text-xs text-gray-400">ID: {doc.id}</div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {motivo?.includes("[VALIDADO]") ? (
                              <Badge variant="green">Validado</Badge>
                            ) : motivo?.includes("[RECHAZADO]") ? (
                              <Badge variant="red">Rechazado</Badge>
                            ) : (
                              <Badge variant="blue">Pendiente</Badge>
                            )}
                            <span className="text-gray-700">{motivo}</span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {url ? (
                            <button
                              className="text-blue-600 hover:text-blue-800 font-medium"
                              onClick={() => window.open(url, "_blank")}
                            >
                              Ver archivo
                            </button>
                          ) : (
                            <span className="text-gray-400">Sin adjunto</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => validar(doc.id)}
                              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                            >
                              Validar
                            </button>

                            <button
                              onClick={() => abrirRechazo(doc.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                            >
                              Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Tip: si te sale <span className="font-mono">Invalid pk</span>, el ID del docente no existe en{" "}
            <span className="font-mono">PersonasDocente</span>.
          </div>
        </section>

        {/* MODAL RECHAZO */}
        {rechazoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setRechazoOpen(false)}
            />

            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Rechazar documento</h3>
                  <p className="text-xs text-gray-500">Agregá un comentario (opcional).</p>
                </div>
                <button
                  onClick={() => setRechazoOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <textarea
                value={rechazoComentario}
                onChange={(e) => setRechazoComentario(e.target.value)}
                placeholder="Ej: Documento ilegible / falta sello / etc..."
                className="mt-4 w-full min-h-[100px] rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
              />

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setRechazoOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarRechazo}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                >
                  Confirmar rechazo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
