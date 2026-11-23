import axios from 'axios';

export const AUTH_TOKEN_KEY = 'apu_gen_token';
export const AUTH_UNAUTHORIZED_EVENT = 'apu-auth-unauthorized';

const resolveApiBaseUrl = (): string => {
    const raw = import.meta.env.VITE_API_URL?.trim();
    if (!raw) {
        return 'http://localhost:8080/api';
    }
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const clean = withProtocol.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const api = axios.create({
    baseURL: resolveApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Adjunta automáticamente el token JWT en cada petición saliente
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercepta respuestas 401 (sesión vencida o inválida) para forzar cierre de sesión
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const requestUrl: string = error.config?.url || '';

        if (status === 401 && !requestUrl.includes('/auth/login')) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
        }

        if (error.response && error.response.data) {
            console.error('Error del backend:', error.response.data.message);
        }
        return Promise.reject(error);
    }
);

export default api;