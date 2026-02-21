import {api} from "./authService"

export const fetchAsignatura = async () => {
    try {
        const response = await api.get('/api/v1/asignatura/asignaturas/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};