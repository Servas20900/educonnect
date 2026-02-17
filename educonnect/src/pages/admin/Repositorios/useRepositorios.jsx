import { useState, useCallback } from 'react';
import {
    fetchRepositorios,
    fetchItemsByObject,
    uploadDocumentoGenerico,
    createRepositorio,
    updateRepositorio
} from '../../../api/repositorios';

import { fetchRoles } from '../../../api/permisosService';
export function useRepositorios() {
    const [repositorios, setRepositorios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const cargarRepositorios = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchRepositorios();
            setRepositorios(data);
        } catch (err) {
            setError(err.message || 'Error al cargar carpetas');
        } finally {
            setLoading(false);
        }
    }, []);

    const cargarDocumentos = async (modelName, objectId) => {
        setLoading(true);
        try {
            const data = await fetchItemsByObject(modelName, objectId);
            setDocumentos(data);
        } catch (err) {
            setError(err.message || 'Error al cargar documentos');
        } finally {
            setLoading(false);
        }
    };

    const nuevoRepositorio = async (repoData) => {
        try {
            const response = await createRepositorio(repoData);
            await cargarRepositorios();
            return { success: true, data: response };
        } catch (err) {
            return { success: false, error: err };
        }
    };

    const subirArchivo = async (modelName, objectId, archivo, descripcion) => {
        setUploading(true);
        try {
            const nuevoDoc = await uploadDocumentoGenerico(modelName, objectId, archivo, descripcion);
            setDocumentos(prev => [nuevoDoc, ...prev]);
            return { success: true };
        } catch (err) {
            console.error("Error en hook:", err);
            return { success: false, error: err };
        } finally {
            setUploading(false);
        }
    };
    const editarRepositorio = async (id, data) => {
        try {
            await updateRepositorio(id, data);
            await cargarRepositorios(); 
            return { success: true };
        } catch (err) {
            return { success: false, error: err };
        }
    };

    const cargarRoles = async ()=>{
        try {
            const roles =await fetchRoles();
            setRoles(roles)
            return { success: true };
        } catch (error) {
            return { success: false, error: error };
        }
    }
    return {
        repositorios,
        documentos,
        loading,
        uploading,
        error,
        cargarRepositorios,
        cargarDocumentos,
        subirArchivo,
        nuevoRepositorio,
        editarRepositorio,
        cargarRoles,
        roles
    };
}