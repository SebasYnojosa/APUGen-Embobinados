import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AUTH_TOKEN_KEY, AUTH_UNAUTHORIZED_EVENT } from '../services/api';
import { authService } from '../services/authService';
import type { AuthUser, LoginRequest } from '../types';

interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<AuthUser>;
    logout: () => void;
    updateUser: (updatedUser: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const verifySession = useCallback(async () => {
        const token = authService.getStoredToken();
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch {
            authService.clearToken();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void verifySession();
    }, [verifySession]);

    useEffect(() => {
        const handleUnauthorized = () => {
            authService.clearToken();
            setUser(null);
        };

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key !== AUTH_TOKEN_KEY) return;
            if (!event.newValue) {
                setUser(null);
            } else {
                setIsLoading(true);
                void verifySession();
            }
        };

        window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [verifySession]);

    const login = useCallback(async (credentials: LoginRequest): Promise<AuthUser> => {
        const response = await authService.login(credentials);
        authService.saveToken(response.token);
        setUser(response.user);
        return response.user;
    }, []);

    const logout = useCallback(() => {
        authService.clearToken();
        setUser(null);
    }, []);

    const updateUser = useCallback((updatedUser: AuthUser) => {
        setUser(updatedUser);
    }, []);

    const value: AuthContextValue = {
        user,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'ADMIN',
        isLoading,
        login,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe utilizarse dentro de un AuthProvider.');
    }
    return context;
}
