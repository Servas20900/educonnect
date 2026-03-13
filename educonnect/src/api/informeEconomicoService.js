import { api } from './authService';


const handleApiError = (error, fallback) => {
    const message = error.response?.data?.archivo?.[0] || 
                    error.response?.data?.detail || 
                    fallback;
    const err = new Error(message);
    err.details = error.response?.data;
    throw err;
};

export const subirInformeEconomico = async (datos) => {
    try {
        const formData = new FormData();
        formData.append('titulo', datos.titulo);
        formData.append('periodo', datos.periodo);
        formData.append('archivo', datos.archivo); 
        if (datos.reemplazarId) {
            formData.append('reemplazar_id', datos.reemplazarId);
        }

        const response = await api.post('api/v1/informes-economicos/informes-economicos/', formData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Error al subir el informe');
    }
};


export const obtenerInformesEconomicos = async () => {
    try {
        const response = await api.get('api/v1/informes-economicos/informes-economicos/');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Error al obtener la lista de informes');
    }
};

export const descargarArchivoBlob = async (url, nombreArchivo) => {
    try {
        const response = await api.get(url, {
            responseType: 'blob', 
        });
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const downloadUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', nombreArchivo); 
        document.body.appendChild(link);
        link.click();
        
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error("Error al descargar el archivo:", error);
        throw new Error("No se pudo iniciar la descarga del archivo.");
    }
};