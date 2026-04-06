import axios from 'axios';

const normalizeApiBaseUrl = (rawValue) => {
    const fallback = 'http://localhost:8000/';
    const value = String(rawValue || '').trim();

    if (!value) return fallback;

    let normalized = value;

    if (normalized.startsWith(':')) {
        normalized = `http://localhost${normalized}`;
    } else if (normalized.startsWith('/')) {
        normalized = `${window.location.origin}${normalized}`;
    } else if (!/^https?:\/\//i.test(normalized)) {
        normalized = `http://${normalized}`;
    }

    if (!normalized.endsWith('/')) {
        normalized = `${normalized}/`;
    }

    return normalized;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/');

export const api = axios.create({
    baseURL: API_BASE_URL,
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
    async (error) => {
        const status = error?.response?.status;
        const originalRequest = error?.config;
        const requestUrl = originalRequest?.url || '';
        const isAuthAttempt =
            requestUrl.includes('api/auth/login/') ||
            requestUrl.includes('api/v1/auth/register/') ||
            requestUrl.includes('api/auth/refresh/') ||
            requestUrl.includes('api/auth/session/');

        if (status === 401 && !isAuthAttempt && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                await api.post('api/auth/refresh/');
                return api(originalRequest);
            } catch (refreshError) {
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        if (status === 401 && !window.location.pathname.includes('/login')) {
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
        const parsed = parseApiError(error, 'Error de conexión al registrar usuario');
        const normalizedError = new Error(parsed.message);
        normalizedError.details = parsed.details;
        throw normalizedError;
    }
};

export const loginUsuario = async (credentials) => {
    try {
        const response = await api.post('api/auth/login/', credentials);
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
        return { isAuthenticated: false, roles: [] };
    }
};

export const logoutUsuario = async () => {
    try {
        await api.post('api/auth/logout/');
        return true;
    } catch (error) {
        return true;
    }
};