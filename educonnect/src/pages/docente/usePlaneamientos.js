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

  const crear = async ({ titulo }, archivoSeleccionado) => {
    setUploading(true);
    setErrorUploading(null);
    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
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
      const res = await api.get(`${BASE}${id}/archivo/`, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = blobUrl;

      const ct = res.headers?.["content-type"] || "";
      const ext = ct.includes("pdf")
        ? "pdf"
        : ct.includes("word")
          ? "docx"
          : "bin";

      a.download = `${titulo}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

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
