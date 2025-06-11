// lib/api/settings.ts

import {
    UserProfile,
    UserProfileUpdate,
    PasswordChangeRequest,
    SystemSettings,
    NotificationSettings,
    ApiKey,
    ApiKeyCreate,
    ApiKeyUpdate,
    SystemInfo,
    BackupResult,
    ClearCacheResult,
    EmailSettings,
    SecuritySettings,
    StorageSettings,
    IntegrationSettings,
    AllSettings,
    SettingsImport
} from "@/types/settings";
import { apiClient } from "../api";

// API Methods
export const settingsApi = {
    // === ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ===

    // Получить профиль текущего пользователя
    async getProfile(): Promise<UserProfile> {
        const response = await apiClient.client.get('/api/v1/settings/profile');
        return response.data;
    },

    // Обновить профиль пользователя
    async updateProfile(data: UserProfileUpdate): Promise<UserProfile> {
        const response = await apiClient.client.patch('/api/v1/settings/profile', data);
        return response.data;
    },

    // Сменить пароль
    async changePassword(data: PasswordChangeRequest): Promise<{ message: string }> {
        const response = await apiClient.client.post('/api/v1/settings/change-password', data);
        return response.data;
    },

    // Загрузить аватар
    async uploadAvatar(file: File): Promise<UserProfile> {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await apiClient.client.post('/api/v1/settings/upload-avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Удалить аватар
    async deleteAvatar(): Promise<UserProfile> {
        const response = await apiClient.client.delete('/api/v1/settings/avatar');
        return response.data;
    },

    // === СИСТЕМНЫЕ НАСТРОЙКИ ===

    // Получить системные настройки
    async getSystemSettings(): Promise<SystemSettings> {
        const response = await apiClient.client.get('/api/v1/settings/system');
        return response.data;
    },

    // Обновить системные настройки
    async updateSystemSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
        const response = await apiClient.client.patch('/api/v1/settings/system', data);
        return response.data;
    },

    // Сбросить системные настройки к значениям по умолчанию
    async resetSystemSettings(): Promise<SystemSettings> {
        const response = await apiClient.client.post('/api/v1/settings/system/reset');
        return response.data;
    },

    // === НАСТРОЙКИ УВЕДОМЛЕНИЙ ===

    // Получить настройки уведомлений
    async getNotificationSettings(): Promise<NotificationSettings> {
        const response = await apiClient.client.get('/api/v1/settings/notifications');
        return response.data;
    },

    // Обновить настройки уведомлений
    async updateNotificationSettings(data: Partial<NotificationSettings>): Promise<NotificationSettings> {
        const response = await apiClient.client.patch('/api/v1/settings/notifications', data);
        return response.data;
    },

    // Отправить тестовое уведомление
    async sendTestNotification(type: 'email' | 'telegram' | 'slack'): Promise<{ message: string }> {
        const response = await apiClient.client.post('/api/v1/settings/notifications/test', { type });
        return response.data;
    },

    // === API КЛЮЧИ ===

    // Получить список API ключей
    async getApiKeys(): Promise<ApiKey[]> {
        const response = await apiClient.client.get('/api/v1/settings/api-keys');
        return response.data;
    },

    // Создать новый API ключ
    async createApiKey(data: ApiKeyCreate): Promise<ApiKey> {
        const response = await apiClient.client.post('/api/v1/settings/api-keys', data);
        return response.data;
    },

    // Обновить API ключ
    async updateApiKey(id: number, data: ApiKeyUpdate): Promise<ApiKey> {
        const response = await apiClient.client.patch(`/api/v1/settings/api-keys/${id}`, data);
        return response.data;
    },

    // Удалить API ключ
    async deleteApiKey(id: number): Promise<void> {
        await apiClient.client.delete(`/api/v1/settings/api-keys/${id}`);
    },

    // Переключить статус API ключа
    async toggleApiKeyStatus(id: number): Promise<ApiKey> {
        const response = await apiClient.client.post(`/api/v1/settings/api-keys/${id}/toggle`);
        return response.data;
    },

    // Регенерировать API ключ
    async regenerateApiKey(id: number): Promise<ApiKey> {
        const response = await apiClient.client.post(`/api/v1/settings/api-keys/${id}/regenerate`);
        return response.data;
    },

    // === СИСТЕМНАЯ ИНФОРМАЦИЯ ===

    // Получить системную информацию
    async getSystemInfo(): Promise<SystemInfo> {
        const response = await apiClient.client.get('/api/v1/settings/system-info');
        return response.data;
    },

    // Обновить системную информацию (принудительное обновление кэша)
    async refreshSystemInfo(): Promise<SystemInfo> {
        const response = await apiClient.client.post('/api/v1/settings/system-info/refresh');
        return response.data;
    },

    // === РЕЗЕРВНОЕ КОПИРОВАНИЕ И ОБСЛУЖИВАНИЕ ===

    // Создать резервную копию
    async createBackup(): Promise<BackupResult> {
        const response = await apiClient.client.post('/api/v1/settings/backup');
        return response.data;
    },

    // Получить список резервных копий
    async getBackups(): Promise<BackupResult[]> {
        const response = await apiClient.client.get('/api/v1/settings/backups');
        return response.data;
    },

    // Скачать резервную копию
    async downloadBackup(filename: string): Promise<Blob> {
        const response = await apiClient.client.get(`/api/v1/settings/backups/${filename}/download`, {
            responseType: 'blob'
        });
        return response.data;
    },

    // Удалить резервную копию
    async deleteBackup(filename: string): Promise<{ message: string }> {
        const response = await apiClient.client.delete(`/api/v1/settings/backups/${filename}`);
        return response.data;
    },

    // Очистить кэш
    async clearCache(): Promise<ClearCacheResult> {
        const response = await apiClient.client.post('/api/v1/settings/clear-cache');
        return response.data;
    },

    // Очистить логи
    async clearLogs(): Promise<{ message: string }> {
        const response = await apiClient.client.post('/api/v1/settings/clear-logs');
        return response.data;
    },

    // Переиндексация поиска
    async reindexSearch(): Promise<{ message: string }> {
        const response = await apiClient.client.post('/api/v1/settings/reindex-search');
        return response.data;
    },

    // === ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ ===

    // Получить настройки электронной почты
    async getEmailSettings(): Promise<EmailSettings> {
        const response = await apiClient.client.get('/api/v1/settings/email');
        return response.data;
    },

    // Обновить настройки электронной почты
    async updateEmailSettings(data: Partial<EmailSettings>): Promise<EmailSettings> {
        const response = await apiClient.client.patch('/api/v1/settings/email', data);
        return response.data;
    },

    // Тест настроек электронной почты
    async testEmailSettings(testEmail: string): Promise<{ message: string }> {
        const response = await apiClient.client.post('/api/v1/settings/email/test', {
            test_email: testEmail
        });
        return response.data;
    },

    // Получить настройки безопасности
    async getSecuritySettings(): Promise<SecuritySettings> {
        const response = await apiClient.client.get('/api/v1/settings/security');
        return response.data;
    },

    // Обновить настройки безопасности
    async updateSecuritySettings(data: Partial<SecuritySettings>): Promise<SecuritySettings> {
        const response = await apiClient.client.patch('/api/v1/settings/security', data);
        return response.data;
    },

    // Получить настройки хранилища
    async getStorageSettings(): Promise<StorageSettings> {
        const response = await apiClient.client.get('/api/v1/settings/storage');
        return response.data;
    },

    // Обновить настройки хранилища
    async updateStorageSettings(data: Partial<StorageSettings>): Promise<StorageSettings> {
        const response = await apiClient.client.patch('/api/v1/settings/storage', data);
        return response.data;
    },

    // Тест подключения к хранилищу
    async testStorageConnection(): Promise<{ message: string }> {
        const response = await apiClient.client.post('/api/v1/settings/storage/test');
        return response.data;
    },

    // Получить настройки интеграций
    async getIntegrationSettings(): Promise<IntegrationSettings> {
        const response = await apiClient.client.get('/api/v1/settings/integrations');
        return response.data;
    },

    // Обновить настройки интеграций
    async updateIntegrationSettings(data: Partial<IntegrationSettings>): Promise<IntegrationSettings> {
        const response = await apiClient.client.patch('/api/v1/settings/integrations', data);
        return response.data;
    },

    // === ЭКСПОРТ/ИМПОРТ НАСТРОЕК ===

    // Получить все настройки
    async getAllSettings(): Promise<AllSettings> {
        const response = await apiClient.client.get('/api/v1/settings/all');
        return response.data;
    },

    // Экспорт всех настроек
    async exportSettings(): Promise<Blob> {
        const response = await apiClient.client.get('/api/v1/settings/export', {
            responseType: 'blob'
        });
        return response.data;
    },

    // Импорт настроек
    async importSettings(data: SettingsImport): Promise<{ message: string; imported_count: number }> {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('overwrite_existing', data.overwrite_existing.toString());
        formData.append('backup_before_import', data.backup_before_import.toString());

        const response = await apiClient.client.post('/api/v1/settings/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // === ЛОГИ И МОНИТОРИНГ ===

    // Получить системные логи
    async getSystemLogs(
        level?: string,
        limit?: number,
        offset?: number
    ): Promise<{
        logs: Array<{
            timestamp: string;
            level: string;
            message: string;
            module: string;
        }>;
        total: number;
    }> {
        const params = new URLSearchParams();
        if (level) params.append('level', level);
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());

        const response = await apiClient.client.get('/api/v1/settings/logs', { params });
        return response.data;
    },

    // Получить метрики производительности
    async getPerformanceMetrics(period: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
        cpu_usage: Array<{ timestamp: string; value: number }>;
        memory_usage: Array<{ timestamp: string; value: number }>;
        disk_usage: Array<{ timestamp: string; value: number }>;
        request_count: Array<{ timestamp: string; value: number }>;
        response_time: Array<{ timestamp: string; value: number }>;
        error_rate: Array<{ timestamp: string; value: number }>;
    }> {
        const response = await apiClient.client.get('/api/v1/settings/metrics', {
            params: { period }
        });
        return response.data;
    },

    // Получить статус здоровья системы
    async getHealthCheck(): Promise<{
        status: 'healthy' | 'warning' | 'critical';
        services: Array<{
            name: string;
            status: 'up' | 'down' | 'degraded';
            response_time?: number;
            last_check: string;
            message?: string;
        }>;
        uptime: string;
        version: string;
    }> {
        const response = await apiClient.client.get('/api/v1/settings/health');
        return response.data;
    }
};