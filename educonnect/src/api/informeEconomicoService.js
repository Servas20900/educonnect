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
        formData.append('categoria', datos.categoria || 'economico');
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


export const obtenerInformesEconomicos = async ({ includeArchived = false, categoria = '' } = {}) => {
    try {
        const params = new URLSearchParams();
        if (includeArchived) {
            params.set('include_archived', 'true');
        }
        if (categoria) {
            params.set('categoria', categoria);
        }
        const query = params.toString();
        const response = await api.get(`api/v1/informes-economicos/informes-economicos/${query ? `?${query}` : ''}`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Error al obtener la lista de informes');
    }
};

export const archivarInformeEconomico = async (id) => {
    try {
        const response = await api.patch(`api/v1/informes-economicos/informes-economicos/${id}/archivar/`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Error al archivar el informe');
    }
};

export const desarchivarInformeEconomico = async (id) => {
    try {
        const response = await api.patch(`api/v1/informes-economicos/informes-economicos/${id}/desarchivar/`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Error al desarchivar el informe');
    }
};

export const descargarInformeEconomico = async (id) => {
    try {
        const response = await api.get(`api/v1/informes-economicos/informes-economicos/${id}/descargar/`, {
            responseType: 'blob',
        });
        return response;
    } catch (error) {
        const normalizedError = new Error('No se pudo descargar el archivo del informe');
        const payload = error.response?.data;

        if (payload instanceof Blob) {
            try {
                const text = await payload.text();
                if (text) {
                    try {
                        const parsed = JSON.parse(text);
                        normalizedError.message = parsed?.error || parsed?.detail || normalizedError.message;
                        normalizedError.details = parsed;
                        throw normalizedError;
                    } catch {
                        const cleanedText = String(text).trim();
                        normalizedError.message = cleanedText || normalizedError.message;
                        normalizedError.details = { error: cleanedText || 'Respuesta inválida al descargar archivo' };
                        throw normalizedError;
                    }
                }
            } catch {
                normalizedError.details = { error: 'Respuesta inválida al descargar archivo' };
                throw normalizedError;
            }
        }

        normalizedError.details = payload || null;
        throw normalizedError;
    }
};