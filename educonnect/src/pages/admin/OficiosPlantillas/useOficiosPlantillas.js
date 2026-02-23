import { useState, useCallback } from "react";
import {
  fetchOficiosPlantillas,
  createOficiosPlantilla,
  updateOficiosPlantilla,
  deleteOficiosPlantilla
} from "../../../api/oficiosPlantillas";

export function useOficiosPlantillas() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plantillasExistentes, setData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errorUploading, setErrorUploading] = useState(null);

  const cargarPlantillas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const receivedData = await fetchOficiosPlantillas();
      setData(Array.isArray(receivedData) ? receivedData : receivedData.results || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const crearPlantilla = async (data, archivoSeleccionado) => {
    setUploading(true);
    setErrorUploading(null);
    try {
      const sendingData = await createOficiosPlantilla(data, archivoSeleccionado);
      await cargarPlantillas();
      return { success: true, sendingData };
    } catch (err) {
      setErrorUploading(err);
      return { success: false, error: err };
    } finally {
      setUploading(false);
    }
  };

  const actualizarPlantilla = async (data, id, archivoSeleccionado) => {
    setUploading(true);
    setErrorUploading(null);
    try {
      const sendingData = await updateOficiosPlantilla(data, id, archivoSeleccionado);
      await cargarPlantillas();
      return { success: true, sendingData };
    } catch (err) {
      setErrorUploading(err);
      return { success: false, error: err };
    } finally {
      setUploading(false);
    }
  };

  const eliminarPlantilla = async (id) => {
    setUploading(true);
    setErrorUploading(null);
    try {
      const sendingData = await deleteOficiosPlantilla(id);
      await cargarPlantillas();
      return { success: true, sendingData };
    } catch (err) {
      setErrorUploading(err);
      return { success: false, error: err };
    } finally {
      setUploading(false);
    }
  };

  return {
    cargarPlantillas,
    plantillasExistentes,
    loading,
    error,
    uploading,
    errorUploading,
    crearPlantilla,
    actualizarPlantilla,
    eliminarPlantilla
  };
}