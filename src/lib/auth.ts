// src/lib/auth.ts (исправленный)
import { useEffect, useState } from 'react';
import { apiClient } from './api';
import { ApiError, AdminUser } from '@/types/admin';

export const useAuth = () => {
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<AdminUser | null>(null);

    // Проверяем токен при монтировании компонента
    useEffect(() => {
        const checkAuth = async () => {
            const hasToken = apiClient.isAuthenticated();
            const currentUser = apiClient.getCurrentUser();

            if (hasToken && currentUser) {
                // Проверяем валидность токена
                const isValid = await apiClient.checkTokenValidity();
                setIsAuthenticated(isValid);
                setUser(isValid ? currentUser : null);
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }

            setIsChecking(false);
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const response = await apiClient.login({ username, password });
            setIsAuthenticated(true);
            setUser(response.user);
            return { success: true, user: response.user };
        } catch (error: ApiError | unknown) {
            setIsAuthenticated(false);
            setUser(null);
            return {
                success: false,
                error: (error as ApiError)?.detail || 'Ошибка авторизации'
            };
        }
    };

    const logout = async () => {
        try {
            await apiClient.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsAuthenticated(false);
            setUser(null);
            window.location.href = '/login';
        }
    };

    return {
        isAuthenticated,
        user,
        login,
        logout,
        isChecking,
        isAdmin: user?.is_active || false,
        isSuperuser: user?.is_superuser || false,
    };
};