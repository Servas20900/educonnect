import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:8000/',
    withCredentials: true,
});

const parseApiError = (error, fallbackMessage) => {
    const payload = error?.response?.data;

    if (!payload) {
        return {
            message: fallbackMessage,
            details: null
        };
    }

    if (typeof payload === 'string') {
        return {
            message: payload,
            details: null
        };
    }

    if (payload.detail) {
        const detailText = String(payload.detail || '').toLowerCase();
        if (detailText.includes('no active account found') || detailText.includes('credentials')) {
            return {
                message: 'Usuario o contraseña incorrectos',
                details: payload
            };
        }

        return {
            message: payload.detail,
            details: payload
        };
    }

    if (payload.mensaje) {
        return {
            message: payload.mensaje,
            details: payload
        };
    }

    const translatedPayload = { ...payload };

    if (translatedPayload.username && Array.isArray(translatedPayload.username)) {
        translatedPayload.username = translatedPayload.username.map((message) => {
            const text = String(message || '').toLowerCase();
            if (text.includes('already exists')) return 'Este usuario ya existe';
            return message;
        });
    }

    if (translatedPayload.email && Array.isArray(translatedPayload.email)) {
        translatedPayload.email = translatedPayload.email.map((message) => {
            const text = String(message || '').toLowerCase();
            if (text.includes('already exists')) return 'Este correo ya está registrado';
            return message;
        });
    }

    const fieldErrors = Object.entries(translatedPayload)
        .map(([field, value]) => {
            const text = Array.isArray(value) ? value.join(', ') : String(value);
            return `${field}: ${text}`;
        });

    if (fieldErrors.length > 0) {
        return {
            message: fieldErrors.join(' | '),
            details: translatedPayload
        };
    }

    return {
        message: fallbackMessage,
        details: payload
    };
};

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
        const status = error?.response?.status;
        const requestUrl = error?.config?.url || '';
        const isAuthAttempt = requestUrl.includes('api/auth/login/') || requestUrl.includes('api/v1/auth/register/');

        if (status === 401 && !isAuthAttempt) {
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
        const parsed = parseApiError(error, 'Error de conexión al registrar usuario');
        const normalizedError = new Error(parsed.message);
        normalizedError.details = parsed.details;
        throw normalizedError;
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
        const parsed = parseApiError(error, 'Error en el inicio de sesión');
        const normalizedError = new Error(parsed.message);
        normalizedError.details = parsed.details;
        throw normalizedError;
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