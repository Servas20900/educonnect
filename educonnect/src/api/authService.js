import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:8000/',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const registrarUsuario = async (userData) => {
    try {
        const response = await api.post('api/v1/auth/register/', userData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const loginUsuario = async (credentials) => {
    try {
        const response = await api.post('api/auth/login/', credentials);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error en el inicio de sesión');
    }
};

export const getSessionStatus = async () => {
    try {
        const response = await api.get('api/auth/session/');
        return response.data;
    } catch (error) {
        return { isAuthenticated: false };
    }
};