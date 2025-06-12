// src/types/admin.ts
export interface AdminUser {
    id: number;
    username: string;
    email: string;
    is_active: boolean;
    is_superuser: boolean;
    created_at: string;
    last_login?: string;
    failed_login_attempts: number;
    locked_until?: string;
}

export interface AdminLoginRequest {
    username: string;
    password: string;
}

export interface AdminLoginResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: AdminUser;
}

export interface ApiError {
    detail: string;
    status_code?: number;
}

export interface BaseEntity {
    id: number;
    created_at: string;
    updated_at: string;
}

// Типы для брендов
export interface Brand extends BaseEntity {
    name: string;
    slug: string;
    description?: string;
    website?: string;
    logo_url?: string;
    is_active: boolean;
}

export interface BrandCreate {
    name: string;
    slug: string;
    description?: string;
    website?: string;
    logo_url?: string;
    is_active?: boolean;
}

export interface BrandUpdate {
    name?: string;
    slug?: string;
    description?: string;
    website?: string;
    logo_url?: string;
    is_active?: boolean;
}

// Расширяем AxiosRequestConfig для поддержки _retry
declare module 'axios' {
    interface AxiosRequestConfig {
        _retry?: boolean;
    }
}