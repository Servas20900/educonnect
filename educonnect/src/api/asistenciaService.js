import { api } from "./authService";

export const fetchGruposDocente = async () => {
  const response = await api.get("api/v1/asistencia/grupos-docente/");
  return response.data;
};

export const fetchAsistenciaDiaria = async (grupoId, fecha) => {
  const response = await api.get(`api/v1/asistencia/grupo/${grupoId}/diaria/?fecha=${fecha}`);
  return response.data;
};

export const guardarAsistenciaDiaria = async (grupoId, fecha, asistencias, archivos) => {
  const formData = new FormData();
  formData.append("fecha", fecha);
  formData.append("asistencias", JSON.stringify(asistencias));

  Object.entries(archivos).forEach(([estudianteId, file]) => {
    if (file) {
      formData.append(`justificante_${estudianteId}`, file);
    }
  });

  const response = await api.post(
    `api/v1/asistencia/grupo/${grupoId}/diaria/`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
};

export const cerrarAsistenciaDiaria = async (grupoId, fecha) => {
  const response = await api.post(`api/v1/asistencia/grupo/${grupoId}/cerrar/`, {
    fecha,
  });
  return response.data;
};

export const fetchHistorialAsistencia = async (grupoId) => {
  const response = await api.get(`api/v1/asistencia/grupo/${grupoId}/historial/`);
  return response.data;
};