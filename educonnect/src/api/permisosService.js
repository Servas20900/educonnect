import { api } from './authService';

// ==================== USUARIOS ====================

export const fetchUsuarios = async () => {
    try {
        const response = await api.get('api/v1/permisos/usuarios/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const fetchUsuarioById = async (id) => {
    try {
        const response = await api.get(`api/v1/permisos/usuarios/${id}/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const updateUsuario = async (id, data) => {
    try {
        const response = await api.patch(`api/v1/permisos/usuarios/${id}/`, data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al actualizar usuario');
    }
};

export const toggleUsuarioActive = async (id) => {
    try {
        const response = await api.post(`api/v1/permisos/usuarios/${id}/toggle_active/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al cambiar estado');
    }
};

export const assignRoleToUser = async (userId, rolId) => {
    try {
        const response = await api.post(`api/v1/permisos/usuarios/${userId}/assign_role/`, {
            rol_id: rolId
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al asignar rol');
    }
};

// ==================== ROLES ====================

export const fetchRoles = async (activosOnly = false) => {
    try {
        const url = activosOnly ? 'api/v1/permisos/roles/?activos_only=true' : 'api/v1/permisos/roles/';
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const fetchRolById = async (id) => {
    try {
        const response = await api.get(`api/v1/permisos/roles/${id}/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const createRol = async (data) => {
    try {
        const response = await api.post('api/v1/permisos/roles/', data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al crear rol');
    }
};

export const updateRol = async (id, data) => {
    try {
        const response = await api.patch(`api/v1/permisos/roles/${id}/`, data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al actualizar rol');
    }
};

export const toggleRolActive = async (id) => {
    try {
        const response = await api.post(`api/v1/permisos/roles/${id}/toggle_active/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al cambiar estado');
    }
};

export const updateRolePermissions = async (rolId, permisosIds) => {
    try {
        const response = await api.post(`api/v1/permisos/roles/${rolId}/update_permissions/`, {
            permisos_ids: permisosIds
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al actualizar permisos');
    }
};

// ==================== PERMISOS ====================

export const fetchPermisos = async () => {
    try {
        const response = await api.get('api/v1/permisos/permisos/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const fetchPermisosByModule = async () => {
    try {
        const response = await api.get('api/v1/permisos/permisos/by_module/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

// ==================== MÓDULOS ====================

export const fetchModulos = async () => {
    try {
        const response = await api.get('api/v1/permisos/modulos/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const fetchModulosPorRol = async () => {
    try {
        const response = await api.get('api/v1/permisos/modulos/por_rol/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};
