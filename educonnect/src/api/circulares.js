import { api } from "./authService";

const prepareFormData = (data, archivoSeleccionado) => {
    const formData = new FormData();

    formData.append("titulo", data.titulo);
    formData.append("contenido", data.contenido);
    formData.append("tipo_comunicado", data.tipo_comunicado);
    formData.append("visible", data.visible);
    formData.append("destinatarios", JSON.stringify(data.destinatarios));
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
        console.log("Archivo a enviar:", archivoSeleccionado)
        const response = await api.post('api/v1/ComunicacionesCircular/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const updateCirculares = async (data, id, archivoSeleccionado) => {
    try {
        const formData = prepareFormData(data, archivoSeleccionado);
        const response = await api.put(`api/v1/ComunicacionesCircular/${id}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
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