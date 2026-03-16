import { api } from "./authService";

export const fetchEstudiantesCatalogo = async () => {
  const response = await api.get("api/v1/databaseModels/estudiantes/");
  return response.data;
};

export const fetchEstudiantesPorGrupo = async (grupoId) => {
  const response = await api.get(`api/v1/databaseModels/grupos/${grupoId}/estudiantes/`);
  return response.data;
};

export const agregarEstudianteAGrupo = async (grupoId, personaId) => {
  const response = await api.post(`api/v1/databaseModels/grupos/${grupoId}/estudiantes/`, {
    persona_id: personaId,
  });
  return response.data;
};

export const importarEstudiantesAGrupo = async (grupoId, archivo) => {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const response = await api.post(
    `api/v1/databaseModels/grupos/${grupoId}/estudiantes/importar/`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
};

export const removerEstudianteDeGrupo = async (matriculaId) => {
  const response = await api.delete(`api/v1/databaseModels/matriculas/${matriculaId}/`);
  return response.data;
};