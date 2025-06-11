// Замените файл lib/api/products.ts на эту версию:

import { BatchUpdateRequest, BatchUpdateResponse, BulkPriceUpdateResponse, PriceUpdateData, ProductCreate, ProductDetail, ProductListItem, ProductsListParams, ProductsStats, ProductUpdate } from "@/types/products";
import { apiClient } from "../api";

// API Methods
export const productsApi = {
    // Получить список продуктов
    async getProducts(params: ProductsListParams = {}): Promise<ProductListItem[]> {
        // Очищаем undefined значения
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
        );

        const response = await apiClient.client.get('/api/v1/products/', { params: cleanParams });
        return response.data;
    },

    // Получить статистику продуктов
    async getStats(): Promise<ProductsStats> {
        const response = await apiClient.client.get('/api/v1/products/stats/summary');
        return response.data;
    },

    // Получить количество продуктов
    async getCount(params: Partial<ProductsListParams> = {}): Promise<{ count: number }> {
        // Фильтруем только нужные параметры для count endpoint
        const allowedParams = [
            'search', 'brand_id', 'catalog_id', 'category_id',
            'is_active', 'in_stock', 'price_from', 'price_to'
        ];

        const filteredParams = Object.fromEntries(
            Object.entries(params)
                .filter(([key, value]) => allowedParams.includes(key) && value !== undefined && value !== '')
        );

        const response = await apiClient.client.get('/api/v1/products/count', { params: filteredParams });
        return response.data;
    },

    // Получить продукт по ID
    async getProduct(id: number): Promise<ProductDetail> {
        const response = await apiClient.client.get(`/api/v1/products/${id}`);
        return response.data;
    },

    // Получить продукт по slug
    async getProductBySlug(slug: string): Promise<ProductDetail> {
        const response = await apiClient.client.get(`/api/v1/products/by-slug/${slug}`);
        return response.data;
    },

    // Создать продукт
    async createProduct(product: ProductCreate): Promise<ProductDetail> {
        const response = await apiClient.client.post('/api/v1/products/', product);
        return response.data;
    },

    // Обновить продукт
    async updateProduct(id: number, product: ProductUpdate): Promise<ProductDetail> {
        const response = await apiClient.client.put(`/api/v1/products/${id}`, product);
        return response.data;
    },

    // Частично обновить продукт
    async partialUpdateProduct(id: number, product: ProductUpdate): Promise<ProductDetail> {
        const response = await apiClient.client.patch(`/api/v1/products/${id}`, product);
        return response.data;
    },

    // Массовое обновление продуктов
    async batchUpdateProducts(data: BatchUpdateRequest): Promise<BatchUpdateResponse> {
        const response = await apiClient.client.patch('/api/v1/products/batch', data);
        return response.data;
    },

    // Переключить статус продукта
    async toggleProductStatus(id: number): Promise<ProductListItem> {
        const response = await apiClient.client.post(`/api/v1/products/${id}/toggle-status`);
        return response.data;
    },

    // Мягкое удаление продукта
    async softDeleteProduct(id: number): Promise<ProductListItem> {
        const response = await apiClient.client.delete(`/api/v1/products/${id}/soft`);
        return response.data;
    },

    // Полное удаление продукта (только для суперадмина)
    async deleteProduct(id: number): Promise<void> {
        await apiClient.client.delete(`/api/v1/products/${id}`);
    },

    // Импорт из CSV
    async importCSV(file: File): Promise<{ status: string; filename: string; message: string; initiated_by: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.client.post('/api/v1/products/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Массовое изменение цен
    async bulkUpdatePrices(data: PriceUpdateData): Promise<BulkPriceUpdateResponse> {
        const response = await apiClient.client.post('/api/v1/products/bulk-update-prices', data);
        return response.data;
    },

    // Получение количества товаров для оценки
    async getProductsCountForPriceUpdate(data: Partial<PriceUpdateData>): Promise<{ count: number }> {
        const response = await apiClient.client.post('/api/v1/products/count-for-price-update', data);
        return response.data;
    }
};