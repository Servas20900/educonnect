import { api } from './authService';

const API_BASE = 'api/v1/ComunicacionesComunicado/';

export const fetchComunicados = async () => {
    try {
        const response = await api.get(API_BASE);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const createComunicado = async (data) => {
    try {
        const response = await api.post(API_BASE, data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al crear comunicado');
    }
};

export const updateComunicado = async (id, data) => {
    try {
        const response = await api.patch(`${API_BASE}${id}/`, data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al actualizar comunicado');
    }
};

export const setComunicadoVisible = async (id, visible) => {
    try {
        const response = await api.patch(`${API_BASE}${id}/`, { visible });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al cambiar visibilidad del comunicado');
    }
};

export const hideComunicado = async (id) => {
    try {
        const response = await api.delete(`${API_BASE}${id}/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al ocultar comunicado');
    }
};
