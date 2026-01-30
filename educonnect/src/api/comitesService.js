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

// ==================== PERSONAS DISPONIBLES ====================

export const fetchPersonasDisponibles = async (params = {}) => {
    try {
        const query = new URLSearchParams(params).toString();
        const url = query ? `api/v1/comites/personas-disponibles/?${query}` : 'api/v1/comites/personas-disponibles/';
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al obtener personas');
    }
};
