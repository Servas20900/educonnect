import { fetchCirculares, createCirculares, updateCirculares, deleteCirculares, archivarCircular as archivarCircularApi, restaurarCircular as restaurarCircularApi } from "../../../../api/circulares";
import { useState, useCallback, useEffect } from 'react';

export function useCirculares() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [circularesExistentes, setData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [errorUploading, setErrorUploading] = useState(null);

    const cargarCirculares = useCallback(async (silent = false) => {
        if (!silent) { setLoading(true); setError(null); }
        try {
            const receivedData = await fetchCirculares();
            setData(Array.isArray(receivedData) ? receivedData : []);
        } catch (err) {
            if (!silent) setError(err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const id = setInterval(() => cargarCirculares(true), 30_000);
        return () => clearInterval(id);
    }, [cargarCirculares]);

    const crearCircular = async (data, archivoSeleccionado) => {
        setUploading(true);
        setErrorUploading(null);
        try {
            const sendingData = await createCirculares(data, archivoSeleccionado);
            await cargarCirculares();
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            throw err;
        } finally {
            setUploading(false);
        }
    }

    const actualizarCircular = async (data, id, archivoSeleccionado) => {
        setUploading(true);
        setError(null);
        try {
            const sendingData = await updateCirculares(data, id, archivoSeleccionado);
            await cargarCirculares();
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            throw err;
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
            throw err;
        } finally {
            setUploading(false);
        }
    }

    const archivarCircular = async (id) => {
        setUploading(true);
        setError(null);
        try {
            const sendingData = await archivarCircularApi(id);
            await cargarCirculares();
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            throw err;
        } finally {
            setUploading(false);
        }
    }

    const restaurarCircular = async (id) => {
        setUploading(true);
        setError(null);
        try {
            const sendingData = await restaurarCircularApi(id);
            await cargarCirculares();
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            throw err;
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
        eliminarCircular,
        archivarCircular,
        restaurarCircular,
    };
}
