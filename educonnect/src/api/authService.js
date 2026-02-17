import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:8000/',
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    } else {
        config.headers['Content-Type'] = 'application/json';
    }

    return config;
});

// Interceptor de respuestas
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Limpieza total de sesión
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            
            // Evitar redirección infinita si ya estamos en login
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
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
        
        if (response.data) {
            const { access, refresh } = response.data;
            if (access) localStorage.setItem('access_token', access);
            if (refresh) localStorage.setItem('refresh_token', refresh);
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
    const limpiarYRedirigir = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    };

    try {
        await api.post('api/auth/logout/');
        limpiarYRedirigir();
        return true;
    } catch (error) {
        limpiarYRedirigir();
        return true;
    }
};