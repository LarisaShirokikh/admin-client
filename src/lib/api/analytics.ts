// src/lib/api/analytics.ts
import { apiClient } from '../api';

export const analyticsApi = {
    async getSummary(days = 7) {
        const response = await apiClient.client.get('/api/v1/analyticsmgmt/summary', { params: { days } });
        return response.data;
    },

    async getTopProducts(days = 7, limit = 20) {
        const response = await apiClient.client.get('/api/v1/analyticsmgmt/top-products', { params: { days, limit } });
        return response.data;
    },

    async getRankings(limit = 20) {
        const response = await apiClient.client.get('/api/v1/analyticsmgmt/rankings', { params: { limit } });
        return response.data;
    },
};
