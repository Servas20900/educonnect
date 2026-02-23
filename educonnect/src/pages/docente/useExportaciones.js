import { useCallback, useState } from "react";
import {
  fetchExportaciones,
  createExportacion,
  updateExportacion,
  deleteExportacion,
  downloadExportacion,
} from "../../api/exportaciones";

const toArray = (data) => (Array.isArray(data) ? data : data?.results || []);

export function useExportaciones() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExportaciones();
      setItems(toArray(data));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const crear = async (data, archivo) => {
    setUploading(true);
    setError(null);
    try {
      const created = await createExportacion(data, archivo);
      await cargar();
      return { success: true, data: created };
    } catch (e) {
      setError(e);
      return { success: false, error: e };
    } finally {
      setUploading(false);
    }
  };

  const actualizar = async (id, data, archivo) => {
    setUploading(true);
    setError(null);
    try {
      const updated = await updateExportacion(id, data, archivo);
      await cargar();
      return { success: true, data: updated };
    } catch (e) {
      setError(e);
      return { success: false, error: e };
    } finally {
      setUploading(false);
    }
  };

  const eliminar = async (id) => {
    setUploading(true);
    setError(null);
    try {
      await deleteExportacion(id);
      await cargar();
      return { success: true };
    } catch (e) {
      setError(e);
      return { success: false, error: e };
    } finally {
      setUploading(false);
    }
  };

  const descargar = async (id, nombre, formato) => {
    try {
      const blob = await downloadExportacion(id);
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${nombre}.${String(formato).toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      return { success: true };
    } catch (e) {
      return { success: false, error: e };
    }
  };

  return { items, loading, uploading, error, cargar, crear, actualizar, eliminar, descargar };
}