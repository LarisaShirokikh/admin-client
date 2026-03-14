// src/lib/api/banners.ts
import { Banner, BannerReorderItem } from '@/types/banners';
import { apiClient } from '../api';



export const bannersApi = {
    // Get all banners
    async getAll(): Promise<{ items: Banner[]; total: number }> {
        const response = await apiClient.client.get('/api/v1/bannersmgmt/');
        return response.data;
    },

    // Get banner by ID
    async getById(id: number): Promise<Banner> {
        const response = await apiClient.client.get(`/api/v1/bannersmgmt/${id}`);
        return response.data;
    },

    // Create banner (multipart: image + fields)
    async create(data: {
        image: File;
        title?: string;
        subtitle?: string;
        href?: string;
        badge?: string;
        text_color?: string;
        sort_order?: number;
        is_active?: boolean;
    }): Promise<Banner> {
        const formData = new FormData();
        formData.append('image', data.image);
        if (data.title) formData.append('title', data.title);
        if (data.subtitle) formData.append('subtitle', data.subtitle);
        if (data.href) formData.append('href', data.href);
        if (data.badge) formData.append('badge', data.badge);
        if (data.text_color) formData.append('text_color', data.text_color);
        if (data.sort_order !== undefined) formData.append('sort_order', String(data.sort_order));
        if (data.is_active !== undefined) formData.append('is_active', String(data.is_active));

        const response = await apiClient.client.post('/api/v1/bannersmgmt/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Update banner (multipart: optional new image + fields)
    async update(id: number, data: {
        image?: File;
        title?: string;
        subtitle?: string;
        href?: string;
        badge?: string;
        text_color?: string;
        sort_order?: number;
        is_active?: boolean;
    }): Promise<Banner> {
        const formData = new FormData();
        if (data.image) formData.append('image', data.image);
        if (data.title !== undefined) formData.append('title', data.title || '');
        if (data.subtitle !== undefined) formData.append('subtitle', data.subtitle || '');
        if (data.href !== undefined) formData.append('href', data.href || '');
        if (data.badge !== undefined) formData.append('badge', data.badge || '');
        if (data.text_color) formData.append('text_color', data.text_color);
        if (data.sort_order !== undefined) formData.append('sort_order', String(data.sort_order));
        if (data.is_active !== undefined) formData.append('is_active', String(data.is_active));

        const response = await apiClient.client.put(`/api/v1/bannersmgmt/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Toggle active status
    async toggleStatus(id: number): Promise<Banner> {
        const response = await apiClient.client.post(`/api/v1/bannersmgmt/${id}/toggle-status`);
        return response.data;
    },

    // Reorder banners
    async reorder(items: BannerReorderItem[]): Promise<{ ok: boolean; updated: number }> {
        const response = await apiClient.client.patch('/api/v1/bannersmgmt/reorder', { items });
        return response.data;
    },

    // Delete banner
    async delete(id: number): Promise<void> {
        await apiClient.client.delete(`/api/v1/bannersmgmt/${id}`);
    },
};