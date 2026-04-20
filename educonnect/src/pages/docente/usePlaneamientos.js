import { useCallback, useRef, useState } from "react";
import { api } from "../../api/authService";

const BASE = "api/v1/planeamientos/Planeamientos/";
const toArray = (data) => (Array.isArray(data) ? data : data?.results || []);

const inferFilename = (titulo, archivoUrl) => {
  const fallbackTitle = titulo || 'planeamiento';
  if (!archivoUrl) return `${fallbackTitle}.pdf`;

  const lastSegment = archivoUrl.split('/').pop() || '';
  if (lastSegment.includes('.')) return lastSegment;
  return `${fallbackTitle}.pdf`;
};

const triggerBlobDownload = (blob, fileName) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 2000);
};

const validateDownloadResponse = (response) => {
  const rawBlob = response?.data;
  const contentType = String(response?.headers?.['content-type'] || '').toLowerCase();

  if (!rawBlob || rawBlob.size === 0) {
    throw new Error('El archivo descargado está vacío');
  }

  if (contentType.includes('application/json') || contentType.includes('text/html')) {
    throw new Error('El servidor devolvió una respuesta no válida para descarga');
  }

  return rawBlob.type
    ? rawBlob
    : new Blob([rawBlob], { type: contentType || 'application/octet-stream' });
};

export function usePlaneamientos() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [errorUploading, setErrorUploading] = useState(null);
  const missingFileIdsRef = useRef(new Set());

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

  const descargarArchivo = async (id, titulo = "planeamiento", archivoUrl = "") => {
    if (missingFileIdsRef.current.has(id)) {
      return {
        success: false,
        error: new Error('Este planeamiento no tiene un archivo disponible.'),
      };
    }

    try {
      const response = await api.get(`${BASE}${id}/archivo/`, {
        responseType: 'blob',
      });
      const blob = validateDownloadResponse(response);
      triggerBlobDownload(blob, inferFilename(titulo, archivoUrl));

      return { success: true };
    } catch (e) {
      const statusCode = e?.response?.status;
      if (statusCode === 404) {
        missingFileIdsRef.current.add(id);
      }
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
