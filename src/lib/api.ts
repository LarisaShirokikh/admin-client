// src/lib/api.ts (исправленный)
import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import {
    AdminLoginRequest,
    AdminLoginResponse,
    ApiError
} from '@/types/admin';

class ApiClient {
    public client: AxiosInstance;
    private refreshPromise: Promise<string | null> | null = null;
    private isRefreshing = false;

    constructor() {
        this.client = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor - добавляем токен
        this.client.interceptors.request.use(
            (config) => {
                const token = Cookies.get('access_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor - обрабатываем ошибки и обновляем токены
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
                    originalRequest._retry = true;

                    // Если уже идет обновление токена, ждем его завершения
                    if (this.isRefreshing) {
                        try {
                            const newToken = await this.refreshPromise;
                            if (newToken) {
                                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                return this.client(originalRequest);
                            }
                        } catch {
                            this.handleAuthFailure();
                            return Promise.reject(error);
                        }
                    }

                    try {
                        const newToken = await this.refreshToken();
                        if (newToken) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return this.client(originalRequest);
                        } else {
                            this.handleAuthFailure();
                        }
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        this.handleAuthFailure();
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(this.handleError(error));
            }
        );
    }

    private handleAuthFailure() {
        console.log('Authentication failed, clearing tokens and redirecting to login');
        this.logout();
        // Не делаем мгновенный редирект, дадим возможность пользователю доделать действия
        setTimeout(() => {
            if (window.location.pathname !== 'admin/login') {
                window.location.href = 'admin/login';
            }
        }, 1000);
    }

    private async refreshToken(): Promise<string | null> {
        if (this.refreshPromise && this.isRefreshing) {
            return this.refreshPromise;
        }

        this.isRefreshing = true;
        this.refreshPromise = this.doRefreshToken();

        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.refreshPromise = null;
            this.isRefreshing = false;
        }
    }

    private async doRefreshToken(): Promise<string | null> {
        const refreshToken = Cookies.get('refresh_token');
        if (!refreshToken) {
            console.log('No refresh token available');
            throw new Error('No refresh token');
        }

        try {
            console.log('Attempting to refresh token...');

            // ИСПРАВЛЕНО: отправляем объект с полем refresh_token
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/auth/refresh`,
                { refresh_token: refreshToken }, // Теперь отправляем объект, а не строку
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const { access_token, refresh_token: newRefreshToken } = response.data;

            console.log('Token refreshed successfully');

            // Сохраняем новые токены с увеличенным временем жизни
            Cookies.set('access_token', access_token, { expires: 2 / 24 }); // 2 часа
            if (newRefreshToken) {
                Cookies.set('refresh_token', newRefreshToken, { expires: 7 }); // 7 дней
            }

            return access_token;
        } catch (error) {
            console.error('Token refresh failed:', error);

            // Если refresh токен тоже невалиден, очищаем все
            if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 422)) {
                console.log('Refresh token is invalid, clearing all tokens');
                this.clearTokens();
            }

            return null;
        }
    }

    private clearTokens() {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        Cookies.remove('user');
    }

    private handleError(error: AxiosError): ApiError {
        if (error.response?.data) {
            return error.response.data as ApiError;
        }

        return {
            detail: error.message || 'Произошла неизвестная ошибка',
            status_code: error.response?.status,
        };
    }

    // Авторизация
    async login(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
        const response = await this.client.post<AdminLoginResponse>(
            '/api/v1/admin/auth/login',
            credentials
        );

        const { access_token, refresh_token, user } = response.data;

        // Сохраняем токены в cookies с увеличенным временем
        Cookies.set('access_token', access_token, { expires: 2 / 24 }); // 2 часа
        Cookies.set('refresh_token', refresh_token, { expires: 7 }); // 7 дней
        Cookies.set('user', JSON.stringify(user), { expires: 7 });

        console.log('User logged in successfully');

        return response.data;
    }

    async logout(): Promise<void> {
        try {
            await this.client.post('/api/v1/admin/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Очищаем токены
            this.clearTokens();
            console.log('User logged out, tokens cleared');
        }
    }

    // Проверка авторизации
    isAuthenticated(): boolean {
        const hasAccessToken = !!Cookies.get('access_token');
        const hasRefreshToken = !!Cookies.get('refresh_token');
        return hasAccessToken || hasRefreshToken; // Достаточно любого из токенов
    }

    getCurrentUser() {
        const userCookie = Cookies.get('user');
        return userCookie ? JSON.parse(userCookie) : null;
    }

    // Проверка валидности токена
    async checkTokenValidity(): Promise<boolean> {
        try {
            await this.client.get('/api/v1/admin/auth/me');
            return true;
        } catch (error) {
            console.log('Token validation failed, but this is normal if token expired', error);
            return false;
        }
    }
}

export const apiClient = new ApiClient();