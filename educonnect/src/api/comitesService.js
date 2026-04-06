import { api } from './authService';

// ==================== COMITES ====================

export const fetchComites = async (params = {}) => {
    try {
        const query = new URLSearchParams(params).toString();
        const url = query ? `api/v1/comites/comites/?${query}` : 'api/v1/comites/comites/';
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const fetchDocentesDisponibles = async (params = {}) => {
    try {
        const query = new URLSearchParams(params).toString();
        const url = query
            ? `api/v1/comites/personas-disponibles/docentes/?${query}`
            : 'api/v1/comites/personas-disponibles/docentes/';
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al obtener docentes');
    }
};

export const createComite = async (data) => {
    try {
        const response = await api.post('api/v1/comites/comites/', data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al crear comité');
    }
};

export const updateComite = async (id, data) => {
    try {
        const response = await api.patch(`api/v1/comites/comites/${id}/`, data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al actualizar comité');
    }
};

export const deleteComite = async (id) => {
    try {
        const response = await api.delete(`api/v1/comites/comites/${id}/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al eliminar comité');
    }
};

export const archiveComite = async (id) => {
    try {
        const response = await api.patch(`api/v1/comites/comites/${id}/archivar/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al archivar comité');
    }
};

export const unarchiveComite = async (id) => {
    try {
        const response = await api.patch(`api/v1/comites/comites/${id}/desarchivar/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al desarchivar comité');
    }
};

// ==================== MIEMBROS ====================

export const addMiembro = async (comiteId, data) => {
    try {
        const response = await api.post(`api/v1/comites/comites/${comiteId}/agregar_miembro/`, data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al agregar miembro');
    }
};

export const updateMiembro = async (comiteId, data) => {
    try {
        const response = await api.patch(`api/v1/comites/comites/${comiteId}/actualizar_miembro/`, data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al actualizar miembro');
    }
};

export const removeMiembro = async (comiteId, miembroId) => {
    try {
        const response = await api.delete(`api/v1/comites/comites/${comiteId}/remover_miembro/`, {
            data: { miembro_id: miembroId }
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al remover miembro');
    }
};

export const fetchMiembrosConRoles = async (comiteId) => {
    try {
        const response = await api.get(`api/v1/comites/comites/${comiteId}/miembros_con_roles/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al obtener miembros');
    }
};

// ==================== PERSONAS DISPONIBLES ====================

export const fetchPersonasDisponibles = async (params = {}) => {
    return fetchDocentesDisponibles(params);
};

// ==================== ACTAS ====================

export const fetchActas = async (params = {}) => {
    try {
        const query = new URLSearchParams(params).toString();
        const url = query ? `api/v1/comites/actas/?${query}` : 'api/v1/comites/actas/';
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al obtener actas');
    }
};

export const createActa = async (data) => {
    try {
        const response = await api.post('api/v1/comites/actas/', data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al crear acta');
    }
};

export const updateActa = async (id, data) => {
    try {
        const response = await api.patch(`api/v1/comites/actas/${id}/`, data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al actualizar acta');
    }
};

export const archiveActa = async (id) => {
    try {
        const response = await api.patch(`api/v1/comites/actas/${id}/archivar/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al archivar acta');
    }
};

export const unarchiveActa = async (id) => {
    try {
        const response = await api.patch(`api/v1/comites/actas/${id}/desarchivar/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al desarchivar acta');
    }
};

export const uploadActaArchivo = async (id, archivo) => {
    try {
        const formData = new FormData();
        formData.append('file', archivo);
        const response = await api.post(`api/v1/comites/actas/${id}/compartir/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al subir archivo de acta');
    }
};

export const downloadActaArchivo = async (actaId) => {
    try {
        if (!actaId) {
            throw new Error('La acta no tiene un archivo para descargar');
        }

        const response = await api.get(`api/v1/comites/actas/${actaId}/descargar/`, {
            responseType: 'blob',
        });
        return response;
    } catch (error) {
        const normalizedError = new Error('No se pudo descargar el archivo del acta');
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

// ==================== REPORTES ====================

export const fetchReportesComite = async (params = {}) => {
    try {
        const query = new URLSearchParams(params).toString();
        const url = query ? `api/v1/comites/reportes/?${query}` : 'api/v1/comites/reportes/';
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al obtener reportes');
    }
};

export const createReporteComite = async (data) => {
    try {
        const response = await api.post('api/v1/comites/reportes/', data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al crear reporte');
    }
};
