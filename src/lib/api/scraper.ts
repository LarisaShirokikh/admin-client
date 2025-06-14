// lib/api/scraper.ts

import {
    ActiveTasksResponse,
    ScraperResponse,
    ScraperStatus,
    SyncTasksResponse,
    CleanupTasksResponse,
    ReadinessResponse
} from "@/types/scraper";
import { apiClient } from "../api";


export interface CancelTasksResponse {
    message: string;
    cancelled_tasks: number;
    cancelled_by: string;
    timestamp: string;
}

// Scraper types mapping
export const SCRAPER_ENDPOINTS = {
    labirint: '/api/v1/scraper/scrape-labirint',
    bunker: '/api/v1/scraper/scrape-bunker',
    intecron: '/api/v1/scraper/scrape-intecron',
    'as-doors': '/api/v1/scraper/scrape-as-doors'
} as const;

export type ScraperType = keyof typeof SCRAPER_ENDPOINTS;

// API Methods
export const scraperApi = {
    // Запустить скрайпер Лабиринт
    async startLabirintScraper(urls: string[]): Promise<ScraperResponse> {
        const response = await apiClient.client.post(SCRAPER_ENDPOINTS.labirint, {
            catalog_urls: urls
        });
        return response.data;
    },

    // Запустить скрайпер Bunker Doors
    async startBunkerScraper(urls: string[]): Promise<ScraperResponse> {
        const response = await apiClient.client.post(SCRAPER_ENDPOINTS.bunker, {
            catalog_urls: urls
        });
        return response.data;
    },

    // Запустить скрайпер Интекрон
    async startIntecronScraper(urls: string[]): Promise<ScraperResponse> {
        const response = await apiClient.client.post(SCRAPER_ENDPOINTS.intecron, {
            catalog_urls: urls
        });
        return response.data;
    },

    // Запустить скрайпер AS-Doors
    async startAsDoorsScraper(urls: string[]): Promise<ScraperResponse> {
        const response = await apiClient.client.post(SCRAPER_ENDPOINTS['as-doors'], {
            catalog_urls: urls
        });
        return response.data;
    },

    // Универсальный метод запуска скрайпера
    async startScraper(type: ScraperType, urls: string[]): Promise<ScraperResponse> {
        const endpoint = SCRAPER_ENDPOINTS[type];
        if (!endpoint) {
            throw new Error(`Unknown scraper type: ${type}`);
        }

        const response = await apiClient.client.post(endpoint, {
            catalog_urls: urls
        });
        return response.data;
    },

    // Получить статус задачи
    async getScraperStatus(taskId: string): Promise<ScraperStatus> {
        const response = await apiClient.client.get(`/api/v1/scraper/scraper-status/${taskId}`);
        return response.data;
    },

    // Получить активные задачи (только для суперадмина)
    async getActiveTasks(): Promise<ActiveTasksResponse> {
        const response = await apiClient.client.get('/api/v1/scraper/active-tasks');
        return response.data;
    },

    // Отменить все задачи (только для суперадмина)
    async cancelAllTasks(): Promise<CancelTasksResponse> {
        const response = await apiClient.client.post('/api/v1/scraper/cancel-all-tasks');
        return response.data;
    },

    // НОВЫЕ МЕТОДЫ для синхронизации

    // Синхронизировать счетчики задач
    async syncTasks(): Promise<SyncTasksResponse> {
        const response = await apiClient.client.post('/api/v1/scraper/sync-tasks');
        return response.data;
    },

    // Очистить мои задачи
    async cleanupMyTasks(): Promise<CleanupTasksResponse> {
        const response = await apiClient.client.post('/api/v1/scraper/cleanup-my-tasks');
        return response.data;
    },

    // Проверить готовность системы
    async checkReadiness(): Promise<ReadinessResponse> {
        const response = await apiClient.client.get('/api/v1/scraper/check-readiness');
        return response.data;
    }
};

// Utility functions for working with scrapers
export const scraperUtils = {
    // Нормализация URL для разных типов скрайперов
    normalizeUrls(type: ScraperType, urls: string[]): string[] {
        const baseUrls = {
            labirint: 'https://labirintdoors.ru',
            bunker: 'https://bunkerdoors.ru',
            intecron: 'https://intecron-msk.ru',
            'as-doors': 'https://as-doors.ru'
        };

        const baseUrl = baseUrls[type];

        return urls.map(url => {
            url = url.trim();
            if (!url) return url;

            // Если URL уже полный, возвращаем как есть
            if (url.startsWith('http')) {
                return url;
            }

            // Добавляем слеш в начале если нужно
            if (!url.startsWith('/')) {
                // Специальная обработка для разных типов
                if (type === 'intecron' && !url.includes('/')) {
                    url = `/catalog/intekron/${url}/`;
                } else if (type === 'labirint' && !url.includes('/')) {
                    url = `/katalog/${url}`;
                } else if (type === 'bunker' && !url.includes('/')) {
                    url = `/prod/${url}`;
                } else if (type === 'as-doors' && !url.includes('/')) {
                    url = `/onstock/${url}`;
                } else {
                    url = `/${url}`;
                }
            }

            return `${baseUrl}${url}`;
        });
    },

    // ИСПРАВЛЕННАЯ валидация URL для конкретного типа скрайпера
    validateUrls(type: ScraperType, urls: string[]): { valid: string[], invalid: string[] } {
        const valid: string[] = [];
        const invalid: string[] = [];

        // ИСПРАВЛЕННЫЕ паттерны валидации URL
        const patterns = {
            // Лабиринт: /katalog/ или /kategoria/
            labirint: /^https:\/\/labirintdoors\.ru\/(katalog|kategoria)\/.*/,
            // Bunker: /prod/ или /catalog/
            bunker: /^https:\/\/bunkerdoors\.ru\/(prod|catalog)\/.*/,
            // Интекрон: /catalog/
            intecron: /^https:\/\/intecron-msk\.ru\/catalog\/.*/,
            // AS-Doors: /onstock/ или /catalog/
            'as-doors': /^https:\/\/as-doors\.ru\/(onstock|catalog)\/.*/
        };

        const pattern = patterns[type];

        urls.forEach(url => {
            const trimmedUrl = url.trim();
            if (trimmedUrl && pattern.test(trimmedUrl)) {
                valid.push(url);
            } else if (trimmedUrl) {
                invalid.push(url);
            }
        });

        return { valid, invalid };
    },

    getExampleUrls(type: ScraperType): string[] {
        const examples = {
            labirint: [
                'https://labirintdoors.ru/katalog/royal',
                'https://labirintdoors.ru/katalog/classic',
                'https://labirintdoors.ru/katalog/loft'
            ],
            bunker: [
                'https://bunkerdoors.ru/prod/bunker-hit/bn-02',
                'https://bunkerdoors.ru/prod/bunker-premium/',
                'https://bunkerdoors.ru/catalog/metallicheskie/'
            ],
            intecron: [
                'https://intecron-msk.ru/catalog/intekron/sparta_white/',
                'https://intecron-msk.ru/catalog/intekron/sparta_black/',
                'https://intecron-msk.ru/catalog/intekron/'
            ],
            'as-doors': [
                'https://as-doors.ru/onstock/',
                'https://as-doors.ru/catalog/metallicheskie-dveri/',
                'https://as-doors.ru/catalog/vxodnye-dveri/'
            ]
        };

        return examples[type] || [];
    },

    getPlaceholder(type: ScraperType): string {
        const placeholders = {
            labirint: 'https://labirintdoors.ru/katalog/...',
            bunker: 'https://bunkerdoors.ru/prod/...',
            intecron: 'https://intecron-msk.ru/catalog/intekron/...',
            'as-doors': 'https://as-doors.ru/onstock/...'
        };

        return placeholders[type] || '';
    },

    // Получить описание скрайпера
    getDescription(type: ScraperType): string {
        const descriptions = {
            labirint: 'Парсинг каталогов дверей Лабиринт Дорс',
            bunker: 'Парсинг каталогов дверей Bunkerdoors.ru',
            intecron: 'Парсинг каталогов дверей Intecron-msk.ru',
            'as-doors': 'Парсинг каталогов дверей AS-doors.ru'
        };

        return descriptions[type] || '';
    },

    // Получить цвет для UI
    getColor(type: ScraperType): string {
        const colors = {
            labirint: 'bg-blue-500',
            bunker: 'bg-green-500',
            intecron: 'bg-purple-500',
            'as-doors': 'bg-orange-500'
        };

        return colors[type] || 'bg-gray-500';
    }
};