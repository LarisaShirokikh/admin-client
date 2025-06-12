// src/lib/auth.ts (улучшенный)
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
            console.log('Checking authentication status...');

            const hasToken = apiClient.isAuthenticated();
            const currentUser = apiClient.getCurrentUser();

            console.log('Has token:', hasToken);
            console.log('Current user:', currentUser);

            if (hasToken && currentUser) {
                console.log('Token and user found, validating...');

                try {
                    // Проверяем валидность токена
                    const isValid = await apiClient.checkTokenValidity();
                    console.log('Token validation result:', isValid);

                    setIsAuthenticated(isValid);
                    setUser(isValid ? currentUser : null);

                    if (!isValid) {
                        console.log('Token invalid, clearing user data');
                    }
                } catch (error) {
                    console.error('Token validation error:', error);
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } else {
                console.log('No token or user found');
                setIsAuthenticated(false);
                setUser(null);
            }

            setIsChecking(false);
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string) => {
        console.log('Attempting login for user:', username);

        try {
            const response = await apiClient.login({ username, password });
            console.log('Login successful:', response.user);

            setIsAuthenticated(true);
            setUser(response.user);
            return { success: true, user: response.user };
        } catch (error: ApiError | unknown) {
            console.error('Login failed:', error);

            setIsAuthenticated(false);
            setUser(null);
            return {
                success: false,
                error: (error as ApiError)?.detail || 'Ошибка авторизации'
            };
        }
    };

    const logout = async () => {
        console.log('Logging out user...');

        try {
            await apiClient.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsAuthenticated(false);
            setUser(null);
            console.log('User logged out successfully');
            window.location.href = 'admin/login';
        }
    };

    // Функция для принудительного обновления состояния авторизации
    const refreshAuthState = async () => {
        console.log('Refreshing auth state...');

        const hasToken = apiClient.isAuthenticated();
        const currentUser = apiClient.getCurrentUser();

        if (hasToken && currentUser) {
            try {
                const isValid = await apiClient.checkTokenValidity();
                setIsAuthenticated(isValid);
                setUser(isValid ? currentUser : null);
                return isValid;
            } catch {
                setIsAuthenticated(false);
                setUser(null);
                return false;
            }
        } else {
            setIsAuthenticated(false);
            setUser(null);
            return false;
        }
    };

    return {
        isAuthenticated,
        user,
        login,
        logout,
        refreshAuthState,
        isChecking,
        isAdmin: user?.is_active || false,
        isSuperuser: user?.is_superuser || false,
    };
};