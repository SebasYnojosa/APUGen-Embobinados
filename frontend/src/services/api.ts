import axios from 'axios';

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

// Interceptor para manejar errores globalmente en el frontend
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.data) {
            console.error('Error del backend:', error.response.data.message);
        }
        return Promise.reject(error);
    }
);

export default api;