import {api} from "./authService"

export const fetchGrupos = async () => {
    try {
        const response = await api.get('/api/v1/grupo/grupos/');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};