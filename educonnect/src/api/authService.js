import axios from 'axios';

const api = axios.create({
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
        // La URL debe coincidir con: path('api/auth/login/', ObtencionTokens.as_view())
        const response = await axios.post('http://localhost:8000/api/auth/login/', credentials, {
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error en el inicio de sesión');
    }
};