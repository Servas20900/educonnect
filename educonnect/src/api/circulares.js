import { api } from "./authService";

const normalizeDateValue = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (value instanceof Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const day = String(value.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    return value;
};

const prepareFormData = (data, archivoSeleccionado) => {
    const formData = new FormData();

    if (data.titulo !== undefined) {
        formData.append("titulo", data.titulo);
    }

    if (data.contenido !== undefined || data.titulo !== undefined) {
        formData.append("contenido", data.contenido || data.titulo || "");
    }

    if (data.detalle !== undefined) {
        formData.append("detalle", data.detalle || "");
    }

    if (data.tipo_comunicado !== undefined) {
        formData.append("tipo_comunicado", data.tipo_comunicado || "");
    }

    if (data.visible !== undefined) {
        formData.append("visible", String(Boolean(data.visible)));
    }

    if (data.destinatarios !== undefined) {
        const destinatarios = Array.isArray(data.destinatarios)
            ? data.destinatarios
            : ["docentes"];
        formData.append("destinatarios", JSON.stringify(destinatarios));
    }

    const fechaInicio = normalizeDateValue(data.fecha_vigencia_inicio);
    if (fechaInicio !== null) {
        formData.append("fecha_vigencia_inicio", fechaInicio);
    }

    if (data.categoria !== undefined) {
        formData.append("categoria", data.categoria);
    }

    if (data.estado !== undefined) {
        formData.append("estado", data.estado);
    }

    const fechaFin = normalizeDateValue(data.fecha_vigencia_fin);
    if (fechaFin !== null) {
        formData.append("fecha_vigencia_fin", fechaFin);
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