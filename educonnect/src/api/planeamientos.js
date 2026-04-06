import { api } from "./authService";

const prepareFormData = (data, archivo) => {
  const formData = new FormData();
  formData.append("titulo", data.titulo);
  formData.append("detalle", data.detalle || "");

  if (archivo) {
    formData.append("archivo", archivo);
  }

  return formData;
};

export const fetchPlaneamientos = async () => {
  const response = await api.get("api/v1/planeamientos/Planeamientos/");
  return response.data;
};

export const fetchPlaneamientosAdmin = async () => {
  const response = await api.get("api/v1/planeamientos/Planeamientos/");
  return response.data;
};

export const createPlaneamiento = async (data, archivo) => {
  const formData = prepareFormData(data, archivo);
  const response = await api.post("api/v1/planeamientos/Planeamientos/", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const enviarPlaneamiento = async (id) => {
  return await api.post(`api/v1/planeamientos/Planeamientos/${id}/enviar/`);
};

export const descargarArchivoPlaneamiento = async (id) => {
  const baseUrl = api.defaults.baseURL || "http://localhost:8000/";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${cleanBase}api/v1/planeamientos/Planeamientos/${id}/archivo/`;
};

export const deletePlaneamiento = async (id) => {
  return await api.delete(`api/v1/planeamientos/Planeamientos/${id}/`);
};