import api, { AUTH_TOKEN_KEY } from './api';
import type {
    AuthUser,
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
} from '../types';

export const authService = {
    getStoredToken: (): string | null => localStorage.getItem(AUTH_TOKEN_KEY),

    saveToken: (token: string): void => {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    },

    clearToken: (): void => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    },

    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/login', credentials);
        return response.data;
    },

    getCurrentUser: async (): Promise<AuthUser> => {
        const response = await api.get<AuthUser>('/auth/me');
        return response.data;
    },

    changeOwnPassword: async (payload: ChangePasswordRequest): Promise<AuthUser> => {
        const response = await api.put<AuthUser>('/auth/cambiar-password', payload);
        return response.data;
    },
};
