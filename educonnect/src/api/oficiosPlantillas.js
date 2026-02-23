import { api } from "./authService";

const prepareFormData = (data, archivoSeleccionado) => {
  const formData = new FormData();
  formData.append("nombre", data.nombre);
  formData.append("categoria", data.categoria);
  formData.append("estado", data.estado);

  if (archivoSeleccionado) {
    formData.append("archivo_adjunto", archivoSeleccionado);
  }

  return formData;
};

export const fetchOficiosPlantillas = async () => {
  const response = await api.get("api/v1/oficiosPlantillas/OficiosPlantilla/");
  return response.data;
};

export const createOficiosPlantilla = async (data, archivoSeleccionado) => {
  const formData = prepareFormData(data, archivoSeleccionado);
  const response = await api.post("api/v1/oficiosPlantillas/OficiosPlantilla/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateOficiosPlantilla = async (data, id, archivoSeleccionado) => {
  const formData = prepareFormData(data, archivoSeleccionado);
  const response = await api.put(`api/v1/oficiosPlantillas/OficiosPlantilla/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteOficiosPlantilla = async (id) => {
  const response = await api.delete(`api/v1/oficiosPlantillas/OficiosPlantilla/${id}/`);
  return response.data;
};