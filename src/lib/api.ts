// src/lib/api.ts (исправленный)
import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import {
    AdminLoginRequest,
    AdminLoginResponse,
    ApiError
} from '@/types/admin';

class ApiClient {
    public client: AxiosInstance; // Делаем публичным для использования в других API
    private refreshPromise: Promise<string | null> | null = null; // Исправленная типизация

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

                    try {
                        const newToken = await this.refreshToken();
                        if (newToken) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return this.client(originalRequest);
                        }
                    } catch (refreshError) {
                        this.logout();
                        window.location.href = '/login';
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(this.handleError(error));
            }
        );
    }

    private async refreshToken(): Promise<string | null> {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this.doRefreshToken();

        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.refreshPromise = null;
        }
    }

    private async doRefreshToken(): Promise<string | null> {
        const refreshToken = Cookies.get('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token');
        }

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/auth/refresh`,
                { refresh_token: refreshToken }
            );

            const { access_token, refresh_token: newRefreshToken } = response.data;

            // Сохраняем новые токены
            Cookies.set('access_token', access_token, { expires: 1 / 24 }); // 1 час
            Cookies.set('refresh_token', newRefreshToken, { expires: 1 }); // 1 день

            return access_token;
        } catch {
            console.error('Token refresh failed');
            return null;
        }
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

        // Сохраняем токены в cookies
        Cookies.set('access_token', access_token, { expires: 1 / 24 }); // 1 час
        Cookies.set('refresh_token', refresh_token, { expires: 1 }); // 1 день
        Cookies.set('user', JSON.stringify(user), { expires: 1 });

        return response.data;
    }

    async logout(): Promise<void> {
        try {
            await this.client.post('/api/v1/admin/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Очищаем токены
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
            Cookies.remove('user');
        }
    }

    // Проверка авторизации
    isAuthenticated(): boolean {
        return !!Cookies.get('access_token');
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
        } catch {
            return false;
        }
    }
}

export const apiClient = new ApiClient();