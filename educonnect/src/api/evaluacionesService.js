import { api } from './authService';

const API_BASE = 'api/v1/evaluaciones';

export async function fetchEvaluacionesPorGrupo(grupoId) {
  const response = await api.get(`${API_BASE}/grupo/${grupoId}/`);
  return response.data;
}

export async function crearEvaluacion(grupoId, data) {
  const payload = {
    ...data,
    grupo_id: grupoId,
  };
  const response = await api.post(`${API_BASE}/`, payload);
  return response.data;
}

export async function actualizarEvaluacion(evaluacionId, data) {
  const response = await api.patch(`${API_BASE}/${evaluacionId}/`, data);
  return response.data;
}

export async function eliminarEvaluacion(evaluacionId) {
  const response = await api.delete(`${API_BASE}/${evaluacionId}/`);
  return response.data;
}

export async function fetchCalificacionesPorEvaluacion(evaluacionId) {
  const response = await api.get(`${API_BASE}/${evaluacionId}/calificaciones/`);
  return response.data;
}

export async function fetchCalificacionesPorEstudiante(grupoId, estudianteId) {
  const response = await api.get(
    `${API_BASE}/grupo/${grupoId}/estudiantes/${estudianteId}/calificaciones/`
  );
  return response.data;
}

export async function guardarCalificacion(calificacionId, data) {
  const response = await api.patch(`api/v1/evaluaciones/calificaciones/${calificacionId}/`, data);
  return response.data;
}

export async function crearCalificacion(evaluacionId, estudianteId, nota) {
  const response = await api.post(`api/v1/evaluaciones/calificaciones/`, {
    evaluacion_id: evaluacionId,
    estudiante_id: estudianteId,
    nota,
  });
  return response.data;
}

export async function fetchPromediosPorGrupo(grupoId) {
  const response = await api.get(`api/v1/evaluaciones/promedios/grupo/${grupoId}/`);
  return response.data;
}

export async function fetchRiesgoPorGrupo(grupoId) {
  const response = await api.get(`${API_BASE}/riesgo/grupo/${grupoId}/`);
  return response.data;
}

export async function fetchDetalleRiesgoEstudiante(grupoId, estudianteId) {
  const response = await api.get(
    `${API_BASE}/riesgo/grupo/${grupoId}/estudiantes/${estudianteId}/`
  );
  return response.data;
}

export async function exportarPlanilla(grupoId) {
  const response = await api.get(`api/v1/exportaciones/planilla/${grupoId}/`, {
    responseType: 'blob',
  });
  return response.data;
}
