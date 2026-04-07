import { api } from './authService';

const normalizeError = (error, fallbackMessage) => {
    if (error?.response?.data) {
        throw error.response.data;
    }
    throw new Error(fallbackMessage);
};

export const fetchRepositorios = async () => {
    try {
        const response = await api.get('api/v1/documentos/repositorios/');
        return response.data;
    } catch (error) {
        normalizeError(error, 'Error al cargar carpetas');
    }
};

export const fetchItemsByObject = async (modelName, objectId, options = {}) => {
    try {
        const params = {};
        if (options.archivadosOnly) {
            params.archivados_only = true;
        }
        if (options.includeArchivados) {
            params.include_archivados = true;
        }

        const response = await api.get(`api/v1/documentos/items/${modelName.toLowerCase()}/${objectId}/`, {
            params,
        });
        return response.data;
    } catch (error) {
        normalizeError(error, 'Error al cargar documentos');
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
        normalizeError(error, 'Error en la subida');
    }
};

export const createRepositorio = async (repoData) => {
    try {
        const response = await api.post('api/v1/documentos/repositorios/', repoData);
        return response.data;
    } catch (error) {
        normalizeError(error, 'Error al crear el repositorio');
    }
};

export const updateRepositorio = async (id, data) => {
    try {
        const response = await api.patch(`api/v1/documentos/repositorios/${id}/`, data);
        return response.data;
    } catch (error) {
        normalizeError(error, 'Error al actualizar');
    }
};

export const updateDocumentoRepositorio = async (repositorioId, documentoId, data) => {
    try {
        const response = await api.patch(
            `api/v1/documentos/repositorios/${repositorioId}/documentos/${documentoId}/`,
            data
        );
        return response.data;
    } catch (error) {
        normalizeError(error, 'Error al actualizar el documento');
    }
};

export const deleteDocumentoRepositorio = async (repositorioId, documentoId) => {
    try {
        const response = await api.delete(
            `api/v1/documentos/repositorios/${repositorioId}/documentos/${documentoId}/`
        );
        return response.data;
    } catch (error) {
        normalizeError(error, 'Error al eliminar el documento');
    }
};

export const downloadDocumentoRepositorioArchivo = async (repositorioId, documentoId) => {
    try {
        const response = await api.get(
            `api/v1/documentos/repositorios/${repositorioId}/documentos/${documentoId}/descargar/`,
            { responseType: 'blob' }
        );
        return response;
    } catch (error) {
        const normalizedError = new Error('No se pudo descargar el documento');
        normalizedError.details = error?.response?.data || null;
        throw normalizedError;
    }
};

export const archivarDocumentoRepositorio = async (repositorioId, documentoId) => {
    try {
        const response = await api.patch(
            `api/v1/documentos/repositorios/${repositorioId}/documentos/${documentoId}/`,
            { archivado: true }
        );
        return response.data;
    } catch (error) {
        normalizeError(error, 'Error al archivar el documento');
    }
};

export const desarchivarDocumentoRepositorio = async (repositorioId, documentoId) => {
    try {
        const response = await api.patch(
            `api/v1/documentos/repositorios/${repositorioId}/documentos/${documentoId}/`,
            { archivado: false }
        );
        return response.data;
    } catch (error) {
        normalizeError(error, 'Error al desarchivar el documento');
    }
};

export const deleteRepositorio = async (id) => {
    try {
        const response = await api.delete(`api/v1/documentos/repositorios/${id}/`);
        return response.data;
    } catch (error) {
        normalizeError(error, 'Error al eliminar el repositorio');
    }
};