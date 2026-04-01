import { api } from "./authService";

const prepareFormData = (data, archivoSeleccionado) => {
    const formData = new FormData();

    formData.append("titulo", data.titulo);
    formData.append("contenido", data.contenido || data.titulo);
    formData.append("detalle", data.detalle || "");
    formData.append("tipo_comunicado", data.tipo_comunicado || "");
    formData.append("visible", data.visible);
    formData.append("destinatarios", JSON.stringify(data.destinatarios || ["docentes"]));
    formData.append("fecha_vigencia_inicio", data.fecha_vigencia_inicio);
    formData.append("categoria", data.categoria);
    formData.append("estado", data.estado);

    if (data.fecha_vigencia_fin) {
        formData.append("fecha_vigencia_fin", data.fecha_vigencia_fin);
    }

    if (archivoSeleccionado) {
        formData.append("archivo_adjunto", archivoSeleccionado);
    }

    return formData;
};

export const fetchCirculares = async () => {
    try {
        const response = await api.get('api/v1/ComunicacionesCircular/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const createCirculares = async (data, archivoSeleccionado) => {
    try {
        const formData = prepareFormData(data, archivoSeleccionado);
        const response = await api.post('api/v1/ComunicacionesCircular/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
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

export const updateCirculares = async (data, id, archivoSeleccionado) => {
    try {
        const formData = prepareFormData(data, archivoSeleccionado);
        const response = await api.patch(`api/v1/ComunicacionesCircular/${id}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
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

export const deleteCirculares = async (id) => {
    try {
        const response = await api.delete(`api/v1/ComunicacionesCircular/${id}/`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const downloadCircularArchivo = async (id) => {
    try {
        const response = await api.get(`api/v1/ComunicacionesCircular/${id}/descargar/`, {
            responseType: 'blob'
        });
        return response;
    } catch (error) {
        const normalizedError = new Error('No se pudo descargar el archivo');
        normalizedError.details = error.response?.data || null;
        throw normalizedError;
    }
};