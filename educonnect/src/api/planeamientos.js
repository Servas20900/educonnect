import { api } from "./authService";

const prepareFormData = (data, archivo) => {
  const formData = new FormData();
  formData.append("titulo", data.titulo);

  if (archivo) {
    formData.append("archivo", archivo);
  }

  return formData;
};

export const fetchPlaneamientos = async () => {
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
  return await api.put(`api/v1/planeamientos/Planeamientos/${id}/`, {
    accion: "enviar"
  });
};

export const deletePlaneamiento = async (id) => {
  return await api.delete(`api/v1/planeamientos/Planeamientos/${id}/`);
};