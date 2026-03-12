import { fetchHorario } from '../../../../api/horario';
import { fetchGrupos } from '../../../../api/grupos';
import { fetchUsuarios } from '../../../../api/permisosService'; 
import { useState, useCallback } from 'react';

export default function useHorarioEstudiante() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [HorarioExistentes, setData] = useState([]);

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

    const [personas, setPersonas] = useState(false);
    const [errorPersonas, setErrorPersonas] = useState(null);
    const [loadingPersonas, setLoadingPersonas] = useState(null);
    
    const cargarCatalogosReunion = useCallback(async () => {
        setLoading(true);
        try {
            const dataPersonas = await fetchUsuarios(""); 
            setPersonas(dataPersonas);
            setErrorPersonas(null);
        } catch (err) {
            setErrorPersonas("Error al cargar los catálogos de profesores.");
        } finally {
            setLoadingPersonas(false);
        }
    }, []);

    return {
        cargarHorario,
        loading,
        error,
        HorarioExistentes,
        cargarCatalogosReunion,
        personas,
        errorPersonas,
        loadingPersonas
    }

}