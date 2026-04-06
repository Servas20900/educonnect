import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchCalificacionesPorEstudiante, guardarCalificacion, crearCalificacion } from '../../../api/evaluacionesService';

export default function CalificacionesEstudiante() {
  const navigate = useNavigate();
  const { estudianteId } = useParams();
  const [searchParams] = useSearchParams();
  const grupoId = searchParams.get('grupo');

  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [editValues, setEditValues] = useState({});

  const loadDetalle = async () => {
    if (!grupoId || !estudianteId) {
      setError('Grupo o estudiante no válido.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchCalificacionesPorEstudiante(grupoId, estudianteId);
      setDetalle(data);

      const values = {};
      (data?.evaluaciones || []).forEach((item) => {
        values[item.evaluacion_id] = item.nota ?? '';
      });
      setEditValues(values);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'No se pudieron cargar las calificaciones del estudiante.';
      setError(msg);
      setDetalle(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetalle();
  }, [grupoId, estudianteId]);

  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(`/docente/academico/calificaciones?grupo=${grupoId || ''}`);
  };

  const handleGuardarNota = async (evaluacion) => {
    const raw = editValues[evaluacion.evaluacion_id];
    const nota = parseFloat(raw);

    if (Number.isNaN(nota) || nota < 0) {
      setMensaje('La nota debe ser un número válido mayor o igual a 0.');
      return;
    }

    if (nota > Number(evaluacion.nota_maxima || 0)) {
      setMensaje(`La nota no puede ser mayor a ${evaluacion.nota_maxima}.`);
      return;
    }

    try {
      if (evaluacion.calificacion_id) {
        await guardarCalificacion(evaluacion.calificacion_id, { nota });
      } else {
        await crearCalificacion(evaluacion.evaluacion_id, estudianteId, nota);
      }
      setMensaje('Nota guardada correctamente.');
      await loadDetalle();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'No se pudo guardar la nota.';
      setMensaje(msg);
    }
  };

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <div>
        <button
          onClick={handleVolver}
          className="mb-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Volver
        </button>
        <h2 className="text-2xl font-bold">Calificaciones por Estudiante</h2>
        <p className="text-sm text-gray-500">
          {detalle?.estudiante?.nombre || 'Estudiante'}
          {detalle?.estudiante?.codigo_estudiante ? ` (${detalle.estudiante.codigo_estudiante})` : ''}
        </p>
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
        <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Porcentaje acumulado del estudiante: <span className="font-semibold">{detalle?.total_porcentaje ?? 0}%</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-3 py-2">Evaluación</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Valor %</th>
                <th className="px-3 py-2">Nota Máx.</th>
                <th className="px-3 py-2">Nota</th>
                <th className="px-3 py-2">Aporte %</th>
                <th className="px-3 py-2">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan="8" className="px-3 py-6 text-center text-sm text-gray-500">
                    Cargando calificaciones...
                  </td>
                </tr>
              )}

              {!loading && (!detalle?.evaluaciones || detalle.evaluaciones.length === 0) && (
                <tr>
                  <td colSpan="8" className="px-3 py-6 text-center text-sm text-gray-500">
                    No hay evaluaciones registradas para este grupo.
                  </td>
                </tr>
              )}

              {!loading &&
                (detalle?.evaluaciones || []).map((evaluacion) => (
                  <tr key={evaluacion.evaluacion_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{evaluacion.nombre}</td>
                    <td className="px-3 py-2 text-gray-700">{evaluacion.tipo_evaluacion}</td>
                    <td className="px-3 py-2 text-gray-700">{evaluacion.fecha_evaluacion}</td>
                    <td className="px-3 py-2 text-gray-700">{evaluacion.valor_porcentual}%</td>
                    <td className="px-3 py-2 text-gray-700">{evaluacion.nota_maxima}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={evaluacion.nota_maxima}
                        value={editValues[evaluacion.evaluacion_id] ?? ''}
                        onChange={(e) => setEditValues((prev) => ({
                          ...prev,
                          [evaluacion.evaluacion_id]: e.target.value,
                        }))}
                        className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-700 font-medium">{evaluacion.aporte_porcentual}%</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleGuardarNota(evaluacion)}
                        className="rounded-md bg-[#185fa5] px-3 py-1 text-xs font-medium text-white hover:bg-[#378add]"
                      >
                        Guardar
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
