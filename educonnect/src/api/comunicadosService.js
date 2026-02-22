import { api } from './authService';

export const fetchComunicados = async () => {
    try {
        const response = await api.get('api/v1/ComunicacionesComunicado/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const createComunicado = async (data) => {
    try {
        const response = await api.post('api/v1/ComunicacionesComunicado/', data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al crear comunicado');
    }
};

export const hideComunicado = async (id) => {
    try {
        const response = await api.delete(`api/v1/ComunicacionesComunicado/${id}/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al ocultar comunicado');
    }
};
