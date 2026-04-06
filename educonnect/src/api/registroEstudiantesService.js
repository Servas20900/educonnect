import { api } from "./authService";

export const fetchGruposDocente = async () => {
  const endpoints = [
    "api/v1/grupo/grupos/por-docente/",
    "api/v1/databaseModels/grupos/docente/",
    "api/v1/asistencia/grupos-docente/",
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      const status = error?.response?.status;
      if (status === 400 || status === 404 || status === 405) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("No se pudieron obtener los grupos del docente.");
};

export const fetchEstudiantesCatalogo = async () => {
  const response = await api.get("api/v1/estudiantes/");
  return response.data;
};

export const fetchEstudiantesPorGrupo = async (grupoId) => {
  const response = await api.get(`api/v1/grupos/${grupoId}/estudiantes/`);
  return response.data;
};

export const agregarEstudianteAGrupo = async (grupoId, personaId) => {
  const response = await api.post(`api/v1/grupos/${grupoId}/estudiantes/`, {
    persona_id: personaId,
  });
  return response.data;
};

export const importarEstudiantesAGrupo = async (grupoId, archivo) => {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const response = await api.post(
    `api/v1/grupos/${grupoId}/estudiantes/importar/`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
};

export const removerEstudianteDeGrupo = async (matriculaId) => {
  const response = await api.delete(`api/v1/matriculas/${matriculaId}/`);
  return response.data;
};