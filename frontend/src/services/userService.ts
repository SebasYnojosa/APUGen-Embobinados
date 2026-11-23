import api from './api';
import type {
    AuthUser,
    CreateUserRequest,
    ResetPasswordRequest,
    UpdateUserRequest,
} from '../types';

export const userService = {
    getUsers: async (): Promise<AuthUser[]> => {
        const response = await api.get<AuthUser[]>('/usuarios');
        return response.data;
    },

    createUser: async (payload: CreateUserRequest): Promise<AuthUser> => {
        const response = await api.post<AuthUser>('/usuarios', payload);
        return response.data;
    },

    updateUser: async (id: string, payload: UpdateUserRequest): Promise<AuthUser> => {
        const response = await api.put<AuthUser>(`/usuarios/${encodeURIComponent(id)}`, payload);
        return response.data;
    },

    updateUserStatus: async (id: string, active: boolean): Promise<AuthUser> => {
        const response = await api.patch<AuthUser>(`/usuarios/${encodeURIComponent(id)}/estado`, {
            active,
        });
        return response.data;
    },

    resetPassword: async (id: string, payload: ResetPasswordRequest): Promise<AuthUser> => {
        const response = await api.put<AuthUser>(
            `/usuarios/${encodeURIComponent(id)}/reset-password`,
            payload
        );
        return response.data;
    },
};
