import { fetchCirculares, createCirculares, updateCirculares, deleteCirculares } from "../../../../api/circulares";
import { useState, useCallback } from 'react';

export function useCirculares() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [circularesExistentes, setData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [errorUploading, setErrorUploading] = useState(null);

    const cargarCirculares = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const receivedData = await fetchCirculares();
            setData(Array.isArray(receivedData) ? receivedData : []);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const crearCircular = async (data,archivoSeleccionado) => {
        setUploading(true);
        setErrorUploading(null);
        try {
            const sendingData = await createCirculares(data,archivoSeleccionado);
            await cargarCirculares();
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            return { success: false, error: err };
        } finally {
            setUploading(false);
        }
    }

    const actualizarCircular = async (data, archivoSeleccionado,id) => {
        setUploading(true);
        setError(null);
        try {
            const sendingData = await updateCirculares(data,archivoSeleccionado, id);
            await cargarCirculares();
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            return { success: false, error: err };
        } finally {
            setUploading(false);
        }
    }
    const eliminarCircular = async (id) => {
        setUploading(true);
        setError(null);
        try {
            const sendingData = await deleteCirculares(id);
            await cargarCirculares();
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            return { success: false, error: err };
        } finally {
            setUploading(false);
        }
    }

    return {
        cargarCirculares,
        circularesExistentes,
        loading,
        error,
        uploading,
        errorUploading,
        crearCircular,
        actualizarCircular,
        eliminarCircular
    };
}