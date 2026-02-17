import { api } from './authService';

export const fetchRepositorios = async () => {
    try {
        const response = await api.get('api/v1/documentos/repositorios/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al cargar carpetas');
    }
};

export const fetchItemsByObject = async (modelName, objectId) => {
    try {
        const response = await api.get(`api/v1/documentos/items/${modelName.toLowerCase()}/${objectId}/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al cargar documentos');
    }
};

export const uploadDocumentoGenerico = async (modelName, objectId, archivo, descripcion = "") => {
    try {
        const formData = new FormData();
        formData.append('file', archivo); 
        formData.append('descripcion', descripcion);

        const response = await api.post(
            `api/v1/documentos/upload/${modelName.toLowerCase()}/${objectId}/`, 
            formData
        );
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error en la subida');
    }
};

export const createRepositorio = async (repoData) => {
    try {
        const response = await api.post('api/v1/documentos/repositorios/', repoData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al crear el repositorio');
    }
};

export const updateRepositorio = async (id, data) => {
    try {
        const response = await api.patch(`api/v1/documentos/repositorios/${id}/`, data);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al actualizar');
    }
};