import { api } from './authService';

export const getReuniones = async () => {
    try {
        const response = await api.get('api/v1/reuniones/reuniones/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al obtener reuniones');
    }
};

export const crearReunion = async (reunionData) => {
    try {
        const response = await api.post('api/v1/reuniones/reuniones/', reunionData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al crear la reunión');
    }
};

export const actualizarReunion = async (id, updateData) => {
    try {
        const response = await api.patch(`api/v1/reuniones/reuniones//${id}/`, updateData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al actualizar la reunión');
    }
};

export const crearActa = async (actaData) => {
    try {
        const response = await api.post('api/v1/reuniones/actas/', actaData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al crear el acta');
    }
};

export const compartirActaArchivo = async (actaId, archivo) => {
    try {
        const formData = new FormData();
        formData.append('file', archivo);

        const response = await api.post(
            `api/v1/comites/actas/${actaId}/compartir/`, 
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' }
            }
        );
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al subir el archivo del acta');
    }
};
