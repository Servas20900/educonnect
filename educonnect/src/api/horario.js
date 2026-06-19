import { api } from "./authService";
import { uploadDocumentoGenerico } from './repositorios';

export const fetchHorario = async (params = {}) => {
    try {
        const response = await api.get('/api/v1/horario/horarios/', { params });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const createHorario = async (data, archivoSeleccionado) => {
    try {
        const response = await api.post('/api/v1/horario/horarios/', data);
        return response.data;
    } catch (error) {
        const payload = error.response?.data;
        const message =
            typeof payload === 'string'
                ? payload
                : payload?.detail || JSON.stringify(payload || 'Error de conexión');
        const normalizedError = new Error(message);
        normalizedError.details = payload || null;
        throw normalizedError;
    }
};

export const updateHorario = async (data, id, archivoSeleccionado) => {
    try {
        const response = await api.patch(`/api/v1/horario/horarios/${id}/`, data);
        return response.data;
    } catch (error) {
        const payload = error.response?.data;
        const message =
            typeof payload === 'string'
                ? payload
                : payload?.detail || JSON.stringify(payload || 'Error de conexión');
        const normalizedError = new Error(message);
        normalizedError.details = payload || null;
        throw normalizedError;
    }
};

export const deleteHorario = async (id) => {
    try {
        const response = await api.delete(`/api/v1/horario/horarios/${id}/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const restaurarHorario = async (id) => {
    try {
        const response = await api.patch(`/api/v1/horario/horarios/${id}/restaurar/`);
        return response.data;
    } catch (error) {
        const payload = error.response?.data;
        const normalizedError = new Error(payload?.detail || 'Error al restaurar el horario');
        normalizedError.details = payload || null;
        throw normalizedError;
    }
};

export const uploadHorarioDocumento = async (horarioId, archivo, descripcion = 'Documento de horario') => {
    if (!horarioId || !archivo) return null;
    return uploadDocumentoGenerico('horarioshorario', horarioId, archivo, descripcion);
};

export const descargarDocumentoHorario = async (horarioId, nombre = 'horario') => {
    const response = await api.get(`/api/v1/horario/horarios/${horarioId}/documento/`, {
        responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};