import { useState, useCallback } from 'react';
import { fetchUsuarios } from '../../../api/permisosService'; 
import { 
    getReuniones, 
    crearReunion, 
    actualizarReunion, 
    crearActa, 
    compartirActaArchivo 
} from '../../../api/reuniones';

export function useComites() {
    const [reuniones, setReuniones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [personas, setPersonas] = useState([]);
    const [actasPrevias, setActasPrevias] = useState([]);

    const handleError = (err, defaultMsg) => {
        const message = err.response?.data?.detail || err.message || defaultMsg;
        setError(message);
        return { success: false, error: message };
    };

    const cargarCatalogosReunion = useCallback(async () => {
        setLoading(true);
        try {
            const dataPersonas = await fetchUsuarios(""); 
            setPersonas(dataPersonas);
            
            setError(null);
        } catch (err) {
            setError("Error al cargar los catálogos del comité.");
        } finally {
            setLoading(false);
        }
    }, []);

    const cargarReuniones = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getReuniones();
            setReuniones(data);
            setError(null);
        } catch (err) {
            handleError(err, "No se pudieron cargar las reuniones.");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleNuevaReunion = async (data) => {
        setLoading(true);
        try {
            const nueva = await crearReunion(data);
            setReuniones(prev => [nueva, ...prev]);
            return { success: true, data: nueva };
        } catch (err) {
            return handleError(err, "Error al agendar la reunión.");
        } finally {
            setLoading(false);
        }
    };

    const handleEditarReunion = async (id, data) => {
        setLoading(true);
        try {
            const actualizada = await actualizarReunion(id, data);
            setReuniones(prev => prev.map(r => r.id === id ? actualizada : r));
            return { success: true };
        } catch (err) {
            return handleError(err, "Error al actualizar la reunión.");
        } finally {
            setLoading(false);
        }
    };

    const handleCompartirActa = async (actaData, archivo) => {
        setLoading(true);
        try {
            const acta = await crearActa(actaData);
            if (archivo) {
                await compartirActaArchivo(acta.id, archivo);
            }
            return { success: true };
        } catch (err) {
            return handleError(err, "Error al procesar el acta.");
        } finally {
            setLoading(false);
        }
    };

    return {
        reuniones,
        loading,
        error,
        personas,
        actasPrevias,
        cargarReuniones,
        handleNuevaReunion,
        handleEditarReunion,
        handleCompartirActa,
        cargarCatalogosReunion
    };
}