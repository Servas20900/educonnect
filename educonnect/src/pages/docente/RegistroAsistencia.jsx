import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchGruposDocente,
  fetchAsistenciaDiaria,
  guardarAsistenciaDiaria,
  cerrarAsistenciaDiaria,
  fetchHistorialAsistencia,
} from "../../api/asistenciaService";
import { PageHeader } from "../../components/ui";

const getTodayISO = () => new Date().toISOString().slice(0, 10);

const isWeekendDate = (dateString) => {
  if (!dateString) return false;
  const day = new Date(`${dateString}T00:00:00`).getDay();
  return day === 0 || day === 6;
};

const isPastDate = (dateString) => {
  if (!dateString) return false;
  return dateString < getTodayISO();
};

const isInvalidAttendanceDate = (dateString) => isPastDate(dateString) || isWeekendDate(dateString);

const getNextValidDate = () => {
  const date = new Date();
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().slice(0, 10);
};

export default function RegistroAsistencia() {
  const navigate = useNavigate();
  const [grupoId, setGrupoId] = useState("");
  const [grupos, setGrupos] = useState([]);

  const [fecha, setFecha] = useState(getNextValidDate());

  const [listaEstudiantes, setListaEstudiantes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [resumen, setResumen] = useState({
    presentes: 0,
    ausentes: 0,
    tardias: 0,
    justificadas: 0,
    total: 0,
  });
  const [cerrado, setCerrado] = useState(false);

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const loadGrupos = async () => {
    try {
      const data = await fetchGruposDocente();
      const list = Array.isArray(data) ? data : [];
      setGrupos(list);

      if (list.length > 0) {
        setGrupoId(String(list[0].id));
      }
    } catch {
      setError("No se pudieron cargar los grupos del docente.");
    }
  };

  const loadAsistencia = async () => {
    if (!grupoId || !fecha) return;

    if (isInvalidAttendanceDate(fecha)) {
      setError("Solo se permite registrar asistencia para hoy o fechas futuras en días hábiles.");
      setListaEstudiantes([]);
      setResumen({ presentes: 0, ausentes: 0, tardias: 0, justificadas: 0, total: 0 });
      setCerrado(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await fetchAsistenciaDiaria(grupoId, fecha);
      setListaEstudiantes(data.estudiantes || []);
      setResumen(
        data.resumen || {
          presentes: 0,
          ausentes: 0,
          tardias: 0,
          justificadas: 0,
          total: 0,
        }
      );
      setCerrado(!!data.cerrado);
    } catch {
      setError("No se pudo cargar la asistencia diaria.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistorial = async () => {
    if (!grupoId) return;

    try {
      const data = await fetchHistorialAsistencia(grupoId);
      setHistorial(Array.isArray(data) ? data : []);
    } catch {
      // no romper vista
    }
  };

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    if (grupoId) {
      loadAsistencia();
      loadHistorial();
    }
  }, [grupoId, fecha]);

  const historialPorDia = useMemo(() => {
    const grouped = {};

    historial.forEach((item) => {
      const key = item.fecha;
      if (!grouped[key]) {
        grouped[key] = {
          fecha: key,
          presentes: 0,
          ausentes: 0,
          tardias: 0,
          justificadas: 0,
          total: 0,
        };
      }

      grouped[key].total += 1;
      if (item.estado === "presente") grouped[key].presentes += 1;
      if (item.estado === "ausente") grouped[key].ausentes += 1;
      if (item.estado === "tardia") grouped[key].tardias += 1;
      if (item.justificada) grouped[key].justificadas += 1;
    });

    return Object.values(grouped).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  }, [historial]);

  const handleFechaChange = (value) => {
    if (isPastDate(value)) {
      setError("No se permite seleccionar fechas anteriores a hoy.");
      return;
    }

    if (isWeekendDate(value)) {
      setError("No se permite registrar asistencia en sábado o domingo.");
      return;
    }

    setError("");
    setFecha(value);
  };

  const handleEstadoChange = (estudianteId, nuevoEstado) => {
    if (cerrado) return;

    setListaEstudiantes((prev) =>
      prev.map((e) =>
        e.estudiante_id === estudianteId
          ? {
              ...e,
              estado: nuevoEstado,
              justificada: nuevoEstado === "ausente" ? e.justificada : false,
              justificante: nuevoEstado === "ausente" ? e.justificante : null,
            }
          : e
      )
    );
  };

  const handleJustificadaChange = (estudianteId, value) => {
    if (cerrado) return;

    setListaEstudiantes((prev) =>
      prev.map((e) =>
        e.estudiante_id === estudianteId ? { ...e, justificada: value } : e
      )
    );
  };

  const handleObservacionChange = (estudianteId, value) => {
    if (cerrado) return;

    setListaEstudiantes((prev) =>
      prev.map((e) =>
        e.estudiante_id === estudianteId ? { ...e, observacion: value } : e
      )
    );
  };

  const handleFileChange = (estudianteId, file) => {
    if (cerrado) return;

    setListaEstudiantes((prev) =>
      prev.map((e) =>
        e.estudiante_id === estudianteId ? { ...e, archivo_temp: file } : e
      )
    );
  };

  const handleGuardar = async () => {
    if (isInvalidAttendanceDate(fecha)) {
      setError("Solo se permite registrar asistencia para hoy o fechas futuras en días hábiles.");
      return;
    }

    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      const asistencias = listaEstudiantes.map((e) => ({
        estudiante_id: e.estudiante_id,
        estado: e.estado,
        justificada: e.justificada,
        observacion: e.observacion || "",
      }));

      const archivos = {};
      listaEstudiantes.forEach((e) => {
        if (e.archivo_temp) {
          archivos[e.estudiante_id] = e.archivo_temp;
        }
      });

      const res = await guardarAsistenciaDiaria(grupoId, fecha, asistencias, archivos);
      setMensaje(res?.message || "Asistencia guardada.");
      await loadAsistencia();
      await loadHistorial();
    } catch (err) {
      const msg =
        err?.response?.data?.detail || "No se pudo guardar la asistencia.";
      setError(msg);
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrar = async () => {
    if (isInvalidAttendanceDate(fecha)) {
      setError("Solo se permite cerrar asistencia para hoy o fechas futuras en días hábiles.");
      return;
    }

    const ok = window.confirm("¿Deseas cerrar el registro diario? Luego no podrá editarse.");
    if (!ok) return;

    try {
      const res = await cerrarAsistenciaDiaria(grupoId, fecha);
      setMensaje(res?.message || "Registro diario cerrado.");
      await loadAsistencia();
      await loadHistorial();
    } catch (err) {
      const msg =
        err?.response?.data?.detail || "No se pudo cerrar el registro diario.";
      setError(msg);
    }
  };

  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/docente/estudiantes');
  };

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <PageHeader
        title="Asistencia"
        subtitle="Registra asistencia diaria por grupo en días hábiles."
      />

      <div>
        <button
          onClick={handleVolver}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Volver
        </button>
      </div>

      {mensaje && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <select
              value={grupoId}
              onChange={(e) => setGrupoId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
            >
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label || `${g.nombre} (${g.codigo_grupo || g.id})`}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={fecha}
              min={getTodayISO()}
              onChange={(e) => handleFechaChange(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />

            {cerrado && (
              <span className="rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700">
                Registro cerrado
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGuardar}
              disabled={guardando || cerrado}
              className="px-4 py-2 text-sm font-medium rounded-md text-white bg-[#185fa5] hover:bg-[#378add] disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar Asistencia"}
            </button>

            <button
              onClick={handleCerrar}
              disabled={cerrado || !grupoId}
              className="px-4 py-2 text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 disabled:opacity-50"
            >
              Finalizar Registro Diario
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500">Solo se permite seleccionar días hábiles (lunes a viernes) desde hoy en adelante.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
          <p className="text-xs text-blue-700 font-semibold uppercase">Presentes</p>
          <p className="text-2xl font-bold text-blue-900">{resumen.presentes}</p>
        </div>

        <div className="rounded-lg bg-slate-100 p-3 border border-slate-200">
          <p className="text-xs text-slate-700 font-semibold uppercase">Ausentes</p>
          <p className="text-2xl font-bold text-slate-900">{resumen.ausentes}</p>
        </div>

        <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
          <p className="text-xs text-blue-700 font-semibold uppercase">Tardías</p>
          <p className="text-2xl font-bold text-blue-900">{resumen.tardias}</p>
        </div>

        <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
          <p className="text-xs text-blue-700 font-semibold uppercase">Justificadas</p>
          <p className="text-2xl font-bold text-blue-900">{resumen.justificadas}</p>
        </div>

        <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
          <p className="text-xs text-gray-700 font-semibold uppercase">Total</p>
          <p className="text-2xl font-bold text-gray-800">{resumen.total}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estudiante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marcar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Justificar Falta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Observación
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-6 text-center text-sm text-gray-500">
                  Cargando estudiantes...
                </td>
              </tr>
            ) : (
              listaEstudiantes.map((estudiante) => (
                <tr key={estudiante.estudiante_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {estudiante.nombre}
                    <p className="text-xs text-gray-500">{estudiante.codigo_estudiante || "Sin código"}</p>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-wrap gap-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={`asistencia-${estudiante.estudiante_id}`}
                          value="presente"
                          checked={estudiante.estado === "presente"}
                          onChange={() => handleEstadoChange(estudiante.estudiante_id, "presente")}
                          className="form-radio text-[#185fa5] h-4 w-4"
                          disabled={cerrado}
                        />
                        <span className="ml-2 text-[#185fa5]">Presente</span>
                      </label>

                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={`asistencia-${estudiante.estudiante_id}`}
                          value="ausente"
                          checked={estudiante.estado === "ausente"}
                          onChange={() => handleEstadoChange(estudiante.estudiante_id, "ausente")}
                          className="form-radio text-slate-600 h-4 w-4"
                          disabled={cerrado}
                        />
                        <span className="ml-2 text-slate-700">Ausente</span>
                      </label>

                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={`asistencia-${estudiante.estudiante_id}`}
                          value="tardia"
                          checked={estudiante.estado === "tardia"}
                          onChange={() => handleEstadoChange(estudiante.estudiante_id, "tardia")}
                          className="form-radio text-[#185fa5] h-4 w-4"
                          disabled={cerrado}
                        />
                        <span className="ml-2 text-[#185fa5]">Tardía</span>
                      </label>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm space-y-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={!!estudiante.justificada}
                        disabled={estudiante.estado !== "ausente" || cerrado}
                        onChange={(e) =>
                          handleJustificadaChange(estudiante.estudiante_id, e.target.checked)
                        }
                        className="mr-2"
                      />
                      Justificada
                    </label>

                    <input
                      type="file"
                      disabled={estudiante.estado !== "ausente" || cerrado}
                      onChange={(e) =>
                        handleFileChange(estudiante.estudiante_id, e.target.files?.[0] || null)
                      }
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50"
                    />
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <input
                      type="text"
                      value={estudiante.observacion || ""}
                      onChange={(e) =>
                        handleObservacionChange(estudiante.estudiante_id, e.target.value)
                      }
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Observación opcional"
                      disabled={cerrado}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Resumen de Registros por Día</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presentes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ausentes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tardías</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Justificadas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historialPorDia.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-sm text-gray-500">No hay registros diarios aún.</td>
                </tr>
              ) : (
                historialPorDia.map((item) => (
                  <tr key={item.fecha}>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.fecha}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.presentes}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.ausentes}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.tardias}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.justificadas}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Historial de Asistencia
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Justificada
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historial.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-6 text-center text-sm text-gray-500">
                    No hay historial registrado.
                  </td>
                </tr>
              ) : (
                historial.map((item, idx) => (
                  <tr key={`${item.registro_id}-${item.estudiante_id}-${idx}`}>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.fecha}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.estado}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.justificada ? "Sí" : "No"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}