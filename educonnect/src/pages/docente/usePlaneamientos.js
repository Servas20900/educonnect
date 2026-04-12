import { useCallback, useState } from "react";
import { api } from "../../api/authService";

const BASE = "api/v1/planeamientos/Planeamientos/";
const toArray = (data) => (Array.isArray(data) ? data : data?.results || []);

export function usePlaneamientos() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [errorUploading, setErrorUploading] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(BASE);
      setPlanes(toArray(res.data));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const crear = async ({ titulo, detalle }, archivoSeleccionado) => {
    setUploading(true);
    setErrorUploading(null);
    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("detalle", detalle || "");
      if (archivoSeleccionado) formData.append("archivo", archivoSeleccionado);

      const res = await api.post(BASE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await cargar();
      return { success: true, data: res.data };
    } catch (e) {
      setErrorUploading(e);
      return { success: false, error: e };
    } finally {
      setUploading(false);
    }
  };

  const enviar = async (id) => {
    setUploading(true);
    setErrorUploading(null);
    try {
      const res = await api.post(`${BASE}${id}/enviar/`);
      await cargar();
      return { success: true, data: res.data };
    } catch (e) {
      setErrorUploading(e);
      return { success: false, error: e };
    } finally {
      setUploading(false);
    }
  };

  const eliminar = async (id) => {
    setUploading(true);
    setErrorUploading(null);
    try {
      const res = await api.delete(`${BASE}${id}/`);
      await cargar();
      return { success: true, data: res.data };
    } catch (e) {
      setErrorUploading(e);
      return { success: false, error: e };
    } finally {
      setUploading(false);
    }
  };

  const descargarArchivo = async (id, titulo = "planeamiento") => {
    try {
      const response = await api.get(`${BASE}${id}/archivo/`, {
        responseType: 'blob',
      });
      const downloadUrl = window.URL.createObjectURL(response.data);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${titulo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 2000);

      return { success: true };
    } catch (e) {
      return { success: false, error: e };
    }
  };

  return {
    planes,
    loading,
    uploading,
    error,
    errorUploading,
    cargar,
    crear,
    enviar,
    eliminar,
    descargarArchivo,
  };
}
