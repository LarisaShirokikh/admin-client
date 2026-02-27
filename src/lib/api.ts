import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { AdminLoginRequest, AdminLoginResponse, ApiError } from '@/types/admin';

class ApiClient {
    public client: AxiosInstance;
    private refreshPromise: Promise<string | null> | null = null;
    private isRefreshing = false;

    constructor() {
        this.client = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL,
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        this.client.interceptors.request.use((config) => {
            const token = Cookies.get('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const original = error.config;

                if (![401, 403].includes(error.response?.status ?? 0) || !original || original._retry) {
                    return Promise.reject(this.parseError(error));
                }

                original._retry = true;

                if (this.isRefreshing) {
                    const token = await this.refreshPromise;
                    if (token) {
                        original.headers.Authorization = `Bearer ${token}`;
                        return this.client(original);
                    }
                    this.handleAuthFailure();
                    return Promise.reject(error);
                }

                const newToken = await this.refreshToken();
                if (newToken) {
                    original.headers.Authorization = `Bearer ${newToken}`;
                    return this.client(original);
                }

                this.handleAuthFailure();
                return Promise.reject(error);
            }
        );
    }

    private handleAuthFailure() {
        this.clearTokens();
        setTimeout(() => {
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }, 500);
    }

    private async refreshToken(): Promise<string | null> {
        if (this.isRefreshing && this.refreshPromise) {
            return this.refreshPromise;
        }

        this.isRefreshing = true;
        this.refreshPromise = this.doRefresh();

        try {
            return await this.refreshPromise;
        } finally {
            this.refreshPromise = null;
            this.isRefreshing = false;
        }
    }

    private async doRefresh(): Promise<string | null> {
        const refreshToken = Cookies.get('refresh_token');
        if (!refreshToken) return null;

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`,
                { refresh_token: refreshToken },
                { headers: { 'Content-Type': 'application/json' } }
            );

            const { access_token, refresh_token: newRefresh } = response.data;

            Cookies.set('access_token', access_token, { expires: 2 / 24 });
            if (newRefresh) {
                Cookies.set('refresh_token', newRefresh, { expires: 7 });
            }

            return access_token;
        } catch (error) {
            if (axios.isAxiosError(error) && [401, 422].includes(error.response?.status ?? 0)) {
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

    private parseError(error: AxiosError): ApiError {
        if (error.response?.data) {
            return error.response.data as ApiError;
        }
        return {
            detail: error.message || 'Unknown error',
            status_code: error.response?.status,
        };
    }

    async login(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
        const response = await this.client.post<AdminLoginResponse>(
            '/api/v1/auth/login',
            credentials
        );

        const { access_token, refresh_token, user } = response.data;

        Cookies.set('access_token', access_token, { expires: 2 / 24 });
        Cookies.set('refresh_token', refresh_token, { expires: 7 });
        Cookies.set('user', JSON.stringify(user), { expires: 7 });

        return response.data;
    }

    async logout(): Promise<void> {
        try {
            await this.client.post('/api/v1/auth/logout');
        } finally {
            this.clearTokens();
        }
    }

    isAuthenticated(): boolean {
        return !!(Cookies.get('access_token') || Cookies.get('refresh_token'));
    }

    getCurrentUser() {
        const cookie = Cookies.get('user');
        return cookie ? JSON.parse(cookie) : null;
    }

    async checkTokenValidity(): Promise<boolean> {
        try {
            await this.client.get('/api/v1/auth/me');
            return true;
        } catch {
            return false;
        }
    }
}

export const apiClient = new ApiClient();