import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:8000/',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token JWT a todas las solicitudes
api.interceptors.request.use(
    (config) => {
        // Obtener el token del localStorage
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar respuestas con error 401 (token expirado)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expirado, limpiar localStorage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // Redirigir a login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

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
        // Guardar los tokens en localStorage
        if (response.data) {
            if (response.data.access) {
                localStorage.setItem('access_token', response.data.access);
            }
            if (response.data.refresh) {
                localStorage.setItem('refresh_token', response.data.refresh);
            }
        }
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

export const logoutUsuario = async () => {
    try {
        await api.post('api/auth/logout/');
        // Limpiar tokens del localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return true;
    } catch (error) {
        // Limpiar tokens aunque haya error
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return true;
    }
};