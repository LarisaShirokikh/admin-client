// src/lib/api/categories.ts
import { Category, CategoryCreate, CategoryDeleteResponse, CategoryStatusToggleResponse, CategoryUpdate } from '@/types/categories';
import { apiClient } from '../api';


export const categoriesApi = {
    // Получить список всех категорий
    async getAll(): Promise<Category[]> {
        const response = await apiClient.client.get('/api/v1/categories/');
        return response.data;
    },

    async getCategories(): Promise<Category[]> {
        const response = await apiClient.client.get('/api/v1/categories/');
        return response.data;
    },

    // Получить категорию по ID
    async getById(id: number): Promise<Category> {
        const response = await apiClient.client.get(`/api/v1/categories/${id}`);
        return response.data;
    },

    // Создать новую категорию с изображением
    async create(data: CategoryCreate, image: File): Promise<Category> {
        const formData = new FormData();
        formData.append('name', data.name);
        if (data.description) {
            formData.append('description', data.description);
        }
        formData.append('is_active', String(data.is_active));
        formData.append('image', image);

        const response = await apiClient.client.post('/api/v1/categories/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Обновить категорию
    async update(id: number, data: CategoryUpdate, image?: File): Promise<Category> {
        const formData = new FormData();

        if (data.name !== undefined) {
            formData.append('name', data.name);
        }
        if (data.description !== undefined) {
            formData.append('description', data.description);
        }
        if (data.is_active !== undefined) {
            formData.append('is_active', String(data.is_active));
        }
        if (image) {
            formData.append('image', image);
        }

        const response = await apiClient.client.put(`/api/v1/categories/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Удалить категорию (только для суперадмина)
    async delete(id: number, deleteProducts = false): Promise<CategoryDeleteResponse> {
        const response = await apiClient.client.delete(`/api/v1/categories/${id}`, {
            params: { delete_products: deleteProducts }
        });
        return response.data;
    },

    // Переключить статус активности категории
    async toggleStatus(id: number): Promise<CategoryStatusToggleResponse> {
        const response = await apiClient.client.post(`/api/v1/categories/${id}/toggle-status`);
        return response.data;
    },

    // Получить продукты в категории
    async getProducts(id: number): Promise<{
        category: Category;
        products_count: number;
        products: Array<{
            id: number;
            name: string;
            slug: string;
            price?: number;
            is_active: boolean;
        }>; // Временный тип для продуктов
    }> {
        const response = await apiClient.client.get(`/api/v1/categories/${id}/products`);
        return response.data;
    },

    // Получить статистику по категориям
    async getStats(): Promise<{
        total_categories: number;
        active_categories: number;
        inactive_categories: number;
        categories_with_products: number;
        empty_categories: number;
        total_products_in_categories: number;
        average_products_per_category: number;
        last_updated: string;
        requested_by: string;
        user_role: string;
    }> {
        const response = await apiClient.client.get('/api/v1/categories/stats/summary');
        return response.data;
    },

    // Поиск категорий
    async search(query: string): Promise<Category[]> {
        const response = await apiClient.client.get('/api/v1/categories/search', {
            params: { q: query }
        });
        return response.data;
    },

    // Получить количество категорий
    async getCount(params?: { is_active?: boolean }): Promise<{ count: number }> {
        const response = await apiClient.client.get('/api/v1/categories/count', { params });
        return response.data;
    },

    // Валидация изображения (клиентская проверка)
    validateImage(file: File): { valid: boolean; error?: string } {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

        if (file.size > maxSize) {
            return { valid: false, error: 'Файл слишком большой (максимум 10MB)' };
        }

        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Неподдерживаемый формат. Разрешены: JPG, PNG, GIF, WebP' };
        }

        return { valid: true };
    },

    // Создание preview изображения
    createImagePreview(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
};