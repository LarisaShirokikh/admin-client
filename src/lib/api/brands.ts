// src/lib/api/brands.ts
import { apiClient } from '../api';
import { Brand, BrandCreate, BrandUpdate } from '@/types/admin';

export const brandsApi = {
    // Получить список всех брендов
    async getAll(params?: { skip?: number; limit?: number }): Promise<Brand[]> {
        const response = await apiClient.client.get('/api/v1/brands/', { params });
        return response.data;
    },

    async getBrands(): Promise<Brand[]> {
        const response = await apiClient.client.get('/api/v1/brands/');
        return response.data;
    },

    // Получить бренд по ID
    async getById(id: number): Promise<Brand> {
        const response = await apiClient.client.get(`/api/v1/brands/${id}`);
        return response.data;
    },

    // Получить бренд по slug
    async getBySlug(slug: string): Promise<Brand> {
        const response = await apiClient.client.get(`/api/v1/brands/slug/${slug}`);
        return response.data;
    },

    // Создать новый бренд
    async create(data: BrandCreate): Promise<Brand> {
        const response = await apiClient.client.post('/api/v1/brands/', data);
        return response.data;
    },

    // Обновить бренд
    async update(id: number, data: BrandUpdate): Promise<Brand> {
        const response = await apiClient.client.put(`/api/v1/brands/${id}`, data);
        return response.data;
    },

    // Частично обновить бренд
    async patch(id: number, data: Partial<BrandUpdate>): Promise<Brand> {
        const response = await apiClient.client.patch(`/api/v1/brands/${id}`, data);
        return response.data;
    },

    // Удалить бренд (только для суперадмина)
    async delete(id: number): Promise<void> {
        await apiClient.client.delete(`/api/v1/brands/${id}`);
    },

    // Переключить статус активности бренда
    async toggleStatus(id: number): Promise<Brand> {
        const response = await apiClient.client.post(`/api/v1/brands/${id}/toggle-status`);
        return response.data;
    },

    // Получить статистику по брендам
    async getStats(): Promise<{
        total_brands: number;
        active_brands: number;
        inactive_brands: number;
        last_updated: string;
        requested_by: string;
        user_role: string;
    }> {
        const response = await apiClient.client.get('/api/v1/brands/stats/summary');
        return response.data;
    },

    // Поиск брендов
    async search(query: string, params?: { skip?: number; limit?: number }): Promise<Brand[]> {
        const response = await apiClient.client.get('/api/v1/brands/search', {
            params: { q: query, ...params }
        });
        return response.data;
    },

    // Получить количество брендов
    async getCount(params?: { is_active?: boolean }): Promise<{ count: number }> {
        const response = await apiClient.client.get('/api/v1/brands/count', { params });
        return response.data;
    },

    // Импорт брендов из CSV
    async importFromCSV(file: File): Promise<{
        status: string;
        filename: string;
        message: string;
        initiated_by: string;
    }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.client.post('/api/v1/brands/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Экспорт брендов в CSV
    async exportToCSV(): Promise<Blob> {
        const response = await apiClient.client.get('/api/v1/brands/export', {
            responseType: 'blob'
        });
        return response.data;
    }
};