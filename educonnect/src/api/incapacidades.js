import { api } from './authService';

const normalizeError = (error, fallbackMessage) => {
    if (error?.response?.data) {
        throw error.response.data;
    }
    throw new Error(fallbackMessage);
};

export const fetchIncapacidades = async (filters = {}) => {
    try {
        const params = {};
        if (filters.docenteId) params.docente_id = filters.docenteId;
        if (filters.estado) params.estado = filters.estado;
        if (filters.tipo) params.tipo = filters.tipo;
        if (filters.fechaDesde) params.fecha_desde = filters.fechaDesde;
        if (filters.fechaHasta) params.fecha_hasta = filters.fechaHasta;

        const response = await api.get('api/v1/horario/incapacidades/', { params });
        return response.data;
    } catch (error) {
        normalizeError(error, 'No se pudo cargar incapacidades');
    }
};

export const createIncapacidad = async (payload) => {
    try {
        const response = await api.post('api/v1/horario/incapacidades/', payload);
        return response.data;
    } catch (error) {
        normalizeError(error, 'No se pudo registrar incapacidad');
    }
};

export const updateIncapacidad = async (id, payload) => {
    try {
        const response = await api.patch(`api/v1/horario/incapacidades/${id}/`, payload);
        return response.data;
    } catch (error) {
        normalizeError(error, 'No se pudo actualizar incapacidad');
    }
};

export const fetchCatalogoDocentes = async () => {
    try {
        const response = await api.get('api/v1/horario/incapacidades/catalogo_docentes/');
        return response.data;
    } catch (error) {
        normalizeError(error, 'No se pudo cargar catalogo de docentes');
    }
};
