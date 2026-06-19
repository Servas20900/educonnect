import { api } from "./authService";

export const fetchGruposDocente = async () => {
  const endpoints = [
    "api/v1/grupo/grupos/por-docente/",
    "api/v1/asistencia/grupos-docente/",
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      const status = error?.response?.status;
      if (!status || status === 400 || status === 404 || status === 405 || status >= 500) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("No se pudieron obtener los grupos del docente.");
};

export const fetchEstudiantesPorGrupo = async (grupoId) => {
  const response = await api.get(`api/v1/grupos/${grupoId}/estudiantes/`);
  return response.data;
};