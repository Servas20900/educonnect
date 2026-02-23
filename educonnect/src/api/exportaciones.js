import { api } from "./authService";

const BASE = "api/v1/exportaciones/Exportaciones/";

const buildForm = (data, archivo) => {
  const fd = new FormData();
  fd.append("nombre", data.nombre);
  fd.append("formato", data.formato);
  if (archivo) fd.append("archivo", archivo);
  return fd;
};

export const fetchExportaciones = async () => {
  const res = await api.get(BASE);
  return res.data;
};

export const createExportacion = async (data, archivo) => {
  const res = await api.post(BASE, buildForm(data, archivo), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateExportacion = async (id, data, archivo) => {
  const res = await api.put(`${BASE}${id}/`, buildForm(data, archivo), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteExportacion = async (id) => {
  const res = await api.delete(`${BASE}${id}/`);
  return res.data;
};

// endpoint protegido (igual que planeamientos /archivo/)
export const downloadExportacion = async (id) => {
  const res = await api.get(`${BASE}${id}/archivo/`, { responseType: "blob" });
  return res.data;
};