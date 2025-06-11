// src/lib/api/catalogs.ts
import { Catalog, CatalogCreate, CatalogUpdate } from '@/types/catalogs';
import { apiClient } from '../api';

export const catalogsApi = {
    // Получить список всех каталогов
    async getAll(params?: {
        skip?: number;
        limit?: number;
        active_only?: boolean;
        search?: string;
    }): Promise<Catalog[]> {
        const response = await apiClient.client.get('/api/v1/catalogs/', { params });
        return response.data;
    },

    // Получить каталог по ID
    async getById(id: number): Promise<Catalog> {
        const response = await apiClient.client.get(`/api/v1/catalogs/${id}`);
        return response.data;
    },

    // Получить каталог по slug
    async getBySlug(slug: string): Promise<Catalog> {
        const response = await apiClient.client.get(`/api/v1/catalogs/slug/${slug}`);
        return response.data;
    },

    // Создать новый каталог
    async create(data: CatalogCreate): Promise<Catalog> {
        const response = await apiClient.client.post('/api/v1/catalogs/', data);
        return response.data;
    },

    // Обновить каталог
    async update(id: number, data: CatalogUpdate): Promise<Catalog> {
        const response = await apiClient.client.put(`/api/v1/catalogs/${id}`, data);
        return response.data;
    },

    // Частично обновить каталог
    async patch(id: number, data: Partial<CatalogUpdate>): Promise<Catalog> {
        const response = await apiClient.client.patch(`/api/v1/catalogs/${id}`, data);
        return response.data;
    },

    // Удалить каталог (только для суперадмина)
    async delete(id: number): Promise<void> {
        await apiClient.client.delete(`/api/v1/catalogs/${id}`);
    },

    // Переключить статус активности каталога
    async toggleStatus(id: number): Promise<Catalog> {
        const response = await apiClient.client.post(`/api/v1/catalogs/${id}/toggle-status`);
        return response.data;
    },

    // Получить статистику по каталогам
    async getStats(): Promise<{
        total_catalogs: number;
        active_catalogs: number;
        inactive_catalogs: number;
        last_updated: string;
        requested_by: string;
        user_role: string;
    }> {
        const response = await apiClient.client.get('/api/v1/catalogs/stats/summary');
        return response.data;
    },

    // Получить активные каталоги
    async getActive(params?: { skip?: number; limit?: number }): Promise<Catalog[]> {
        const response = await apiClient.client.get('/api/v1/catalogs/', {
            params: { ...params, active_only: true }
        });
        return response.data;
    },

    // Поиск каталогов
    async search(query: string, params?: { skip?: number; limit?: number }): Promise<Catalog[]> {
        const response = await apiClient.client.get('/api/v1/catalogs/', {
            params: { search: query, ...params }
        });
        return response.data;
    },

    // Получить каталоги по категории
    async getByCategory(categoryId: number, params?: { skip?: number; limit?: number }): Promise<Catalog[]> {
        const response = await apiClient.client.get('/api/v1/catalogs/', {
            params: { category_id: categoryId, ...params }
        });
        return response.data;
    },

    // Получить каталоги по бренду
    async getByBrand(brandId: number, params?: { skip?: number; limit?: number }): Promise<Catalog[]> {
        const response = await apiClient.client.get('/api/v1/catalogs/', {
            params: { brand_id: brandId, ...params }
        });
        return response.data;
    },

    // Валидация данных каталога (клиентская проверка)
    validateCatalog(data: CatalogCreate | CatalogUpdate): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if ('name' in data) {
            if (!data.name || data.name.trim().length < 2) {
                errors.push('Название должно содержать минимум 2 символа');
            }
            if (data.name && data.name.length > 100) {
                errors.push('Название не должно превышать 100 символов');
            }
        }

        if (data.description && data.description.length > 500) {
            errors.push('Описание не должно превышать 500 символов');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
};