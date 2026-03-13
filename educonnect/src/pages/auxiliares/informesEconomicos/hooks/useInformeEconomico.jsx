import { useState, useCallback } from 'react';
import { subirInformeEconomico, obtenerInformesEconomicos,descargarArchivoBlob} from '../../../../api/informeEconomicoService';

export default function useInformeEconomico() {
    const [informes, setInformes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cargarInformes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await obtenerInformesEconomicos();
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

    const descargarInforme = async (url, nombre) => {
    setLoading(true);
    try {
        await descargarArchivoBlob(url, nombre);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
};

    return {
        informes ,
        loading,
        error,
        cargarInformes,
        ejecutarSubida,
        limpiarError: () => setError(null),
        descargarInforme
    };
}