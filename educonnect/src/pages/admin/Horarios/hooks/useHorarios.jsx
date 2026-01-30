import { fetchHorario, createHorario, updateHorario, deleteHorario } from "../../../../api/horario";
import { useState, useCallback } from 'react';

export function useHorarios() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [HorarioExistentes, setData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [errorUploading, setErrorUploading] = useState(null);

    const cargarHorario = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const receivedData = await fetchHorario();
            setData(Array.isArray(receivedData) ? receivedData : []);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const crearHorario = async (data) => {
        setUploading(true);
        setErrorUploading(null);
        try {
            const sendingData = await createHorario(data);
            await cargarHorario();
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            return { success: false, error: err };
        } finally {
            setUploading(false);
        }
    }

    const actualizarHorario = async (data, id) => {
        setUploading(true);
        setError(null);
        try {
            const sendingData = await updateHorario(data, id);
            await cargarHorario();
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            return { success: false, error: err };
        } finally {
            setUploading(false);
        }
    }
    const eliminarHorario = async (id) => {
        setUploading(true);
        setError(null);
        try {
            const sendingData = await deleteHorario(id);
            await cargarHorario();
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            return { success: false, error: err };
        } finally {
            setUploading(false);
        }
    }

    return {
        cargarHorario,
        HorarioExistentes,
        loading,
        error,
        uploading,
        errorUploading,
        crearHorario,
        actualizarHorario,
        eliminarHorario
    };
}