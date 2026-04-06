import { api } from './authService';

const BASE = 'api/v1/exportaciones/Exportaciones/';

export const fetchAdminExportaciones = async () => {
    try {
        const response = await api.get(BASE);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al cargar exportaciones');
    }
};

export const exportarDocentes = async (formato = 'XLSX') => {
    try {
        const response = await api.post(`${BASE}exportar_docentes/`, { formato });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al exportar docentes');
    }
};

export const exportarEstudiantes = async (formato = 'XLSX') => {
    try {
        const response = await api.post(`${BASE}exportar_estudiantes/`, { formato });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al exportar estudiantes');
    }
};

export const descargarExportacionAdmin = async (id) => {
    try {
        const response = await api.get(`${BASE}${id}/archivo/`, { responseType: 'blob' });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al descargar exportación');
    }
};

export const fetchRetencionPoliticas = async () => {
    try {
        const response = await api.get(`${BASE}retencion_politicas/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al cargar políticas de retención');
    }
};

export const updateRetencionPoliticas = async (retencion_politicas) => {
    try {
        const response = await api.put(`${BASE}retencion_politicas/`, { retencion_politicas });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al actualizar políticas de retención');
    }
};
