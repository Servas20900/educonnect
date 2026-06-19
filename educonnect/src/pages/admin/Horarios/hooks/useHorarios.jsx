import { fetchHorario, createHorario, updateHorario, deleteHorario, uploadHorarioDocumento, restaurarHorario as restaurarHorarioApi } from "../../../../api/horario";
import { useState, useEffect, useRef } from 'react';
import { fetchUsuarios } from '../../../../api/permisosService';

export function useHorarios() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [horariosExistentes, setData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [errorUploading, setErrorUploading] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [loadingUsuarios, setLoadingUsuarios] = useState(false);
    const [errorUsuarios, setErrorUsuarios] = useState(null);
    const [lastQueryParams, setLastQueryParams] = useState({});
    const lastQueryParamsRef = useRef({});

    const cargarHorarios = async (params = {}, silent = false) => {
        if (!silent) { setLoading(true); setError(null); }
        lastQueryParamsRef.current = params || {};
        setLastQueryParams(params || {});
        try {
            const receivedData = await fetchHorario(params);
            setData(Array.isArray(receivedData) ? receivedData : []);
        } catch (err) {
            if (!silent) setError(err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        const id = setInterval(() => cargarHorarios(lastQueryParamsRef.current, true), 30_000);
        return () => clearInterval(id);
    }, []);

    const cargarUsuarios = async () => {
        setLoadingUsuarios(true);
        setErrorUsuarios(null);
        try {
            const receivedData = await fetchUsuarios();
            setUsuarios(Array.isArray(receivedData) ? receivedData : []);
        } catch (err) {
            setErrorUsuarios(err);
        } finally {
            setLoadingUsuarios(false);
        }
    };

    const crearHorario = async (data, archivoSeleccionado) => {
        setUploading(true);
        setErrorUploading(null);
        try {
            const sendingData = await createHorario(data, archivoSeleccionado);
            await cargarHorarios(lastQueryParams);
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            throw err;
        } finally {
            setUploading(false);
        }
    }

    const actualizarHorario = async (data, id, archivoSeleccionado) => {
        setUploading(true);
        setErrorUploading(null);
        try {
            const sendingData = await updateHorario(data, id, archivoSeleccionado);
            await cargarHorarios(lastQueryParams);
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            throw err;
        } finally {
            setUploading(false);
        }
    }

    const eliminarHorario = async (id) => {
        setUploading(true);
        setErrorUploading(null);
        try {
            const sendingData = await deleteHorario(id);
            await cargarHorarios(lastQueryParams);
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            throw err;
        } finally {
            setUploading(false);
        }
    }

    const archivarHorario = async (id) => {
        return actualizarHorario({ estado: 'Archivado' }, id, null);
    }

    const desarchivarHorario = async (id) => {
        setUploading(true);
        setErrorUploading(null);
        try {
            const sendingData = await restaurarHorarioApi(id);
            await cargarHorarios(lastQueryParams);
            return { success: true, sendingData };
        } catch (err) {
            setErrorUploading(err);
            throw err;
        } finally {
            setUploading(false);
        }
    }

    const subirDocumentoHorario = async (horarioId, archivo, descripcion = 'Documento de horario') => {
        if (!archivo || !horarioId) return null;
        return uploadHorarioDocumento(horarioId, archivo, descripcion);
    }

    return {
        cargarHorarios,
        cargarUsuarios,
        horariosExistentes,
        loading,
        error,
        uploading,
        errorUploading,
        usuarios,
        loadingUsuarios,
        errorUsuarios,
        crearHorario,
        actualizarHorario,
        eliminarHorario,
        archivarHorario,
        desarchivarHorario,
        subirDocumentoHorario,
    };
}