import { useState, useCallback } from 'react';
import {
    archivarInformeEconomico,
    desarchivarInformeEconomico,
    descargarInformeEconomico,
    obtenerInformesEconomicos,
    subirInformeEconomico,
} from '../../../../api/informeEconomicoService';

export default function useInformeEconomico() {
    const [informes, setInformes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cargarInformes = useCallback(async ({ includeArchived = false, categoria = '' } = {}) => {
        setLoading(true);
        setError(null);
        try {
            const data = await obtenerInformesEconomicos({ includeArchived, categoria });
            setInformes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const ejecutarSubida = async (datos) => {
        setLoading(true);
        setError(null);
        try {
            const nuevoInforme = await subirInformeEconomico(datos);
            
            if (datos.reemplazarId) {
                setInformes(prev => 
                    prev.map(inf => inf.id === datos.reemplazarId ? nuevoInforme : inf)
                );
            } else {
                setInformes(prev => [nuevoInforme, ...prev]);
            }
            
            return nuevoInforme;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const archivarInforme = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const informeActualizado = await archivarInformeEconomico(id);
            setInformes((prev) => prev.map((item) => (item.id === id ? informeActualizado : item)));
            return informeActualizado;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const desarchivarInforme = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const informeActualizado = await desarchivarInformeEconomico(id);
            setInformes((prev) => prev.map((item) => (item.id === id ? informeActualizado : item)));
            return informeActualizado;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const descargarInforme = async (id) => {
        setLoading(true);
        setError(null);
        try {
            return await descargarInformeEconomico(id);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        informes,
        loading,
        error,
        cargarInformes,
        ejecutarSubida,
        limpiarError: () => setError(null),
        descargarInforme,
        archivarInforme,
        desarchivarInforme,
    };
}