import { fetchHorario, createHorario, updateHorario, deleteHorario } from "../../../../api/horario";
import { useState, useCallback } from 'react';
import {fetchUsuarios} from "../../../../api/permisosService"
import {fetchGrupos} from "../../../../api/grupos"
import {fetchAsignatura} from "../../../../api/asignatura"

export function useHorarios() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [HorarioExistentes, setData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [errorUploading, setErrorUploading] = useState(null);

    const [loadingUsers,setLoadingUsers]=useState()
    const [errorUsers, setErrorUsers] = useState(null);
    const [usuarios, setUsuarios] = useState(null);

    const cargarUsuario = useCallback(async () => {
        setLoadingUsers(true);
        setErrorUsers(null);
        try {
            const receivedData = await fetchUsuarios();
            setUsuarios(Array.isArray(receivedData) ? receivedData : []);
        } catch (err) {
            setErrorUsers(err);
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    const [loadingGrupos,setLoadingGrupos]=useState()
    const [errorGrupos, setErrorGrupos] = useState(null);
    const [grupos, setGrupos] = useState(null);

    const cargarGrupos = useCallback(async () => {
        setLoadingGrupos(true);
        setErrorGrupos(null);
        try {
            const receivedData = await fetchGrupos();
            setGrupos(Array.isArray(receivedData) ? receivedData : []);
        } catch (err) {
            setErrorGrupos(err);
        } finally {
            setLoadingGrupos(false);
        }
    }, []);
    const [loadingAsignaturas,setLoadingAsignaturas]=useState()
    const [errorAsignaturas, setErrorAsignaturas] = useState(null);
    const [asignaturas, setAsignaturas] = useState(null);

    const cargarAsignaturas = useCallback(async () => {
        setLoadingAsignaturas(true);
        setErrorAsignaturas(null);
        try {
            const receivedData = await fetchAsignatura();
            setAsignaturas(Array.isArray(receivedData) ? receivedData : []);
        } catch (err) {
            setErrorAsignaturas(err);
        } finally {
            setLoadingAsignaturas(false);
        }
    }, []);

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
        eliminarHorario,
        cargarUsuario,
        loadingUsers,
        errorUsers,
        usuarios,
        cargarGrupos,
        loadingGrupos,
        errorGrupos,
        grupos,
        cargarAsignaturas,
        loadingAsignaturas,
        errorAsignaturas,
        asignaturas
    };
}