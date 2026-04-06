import { api } from "./authService";
import { uploadDocumentoGenerico } from './repositorios';

export const fetchHorario = async () => {
    try {
        const response = await api.get('/api/v1/horario/Horarios/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const createHorario = async (data, archivoSeleccionado) => {
    try {
        const response = await api.post('/api/v1/horario/Horarios/', data);
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
        const response = await api.put(`/api/v1/horario/Horarios/${id}/`, data);
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
        const response = await api.delete(`/api/v1/horario/Horarios/${id}/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const uploadHorarioDocumento = async (horarioId, archivo, descripcion = 'Documento de horario') => {
    if (!horarioId || !archivo) return null;
    return uploadDocumentoGenerico('horarioshorario', horarioId, archivo, descripcion);
};