// lib/api/video.ts

import { ProductSuggestion, SystemCheck, VideoResponse, VideoStats, VideoUpdateData, VideoUploadData } from "@/types/video";
import { apiClient } from "../api";



export const videoApi = {
    // Загрузка видео
    async uploadVideo(data: VideoUploadData, onProgress?: (progress: number) => void): Promise<VideoResponse> {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('title', data.title);

        if (data.description) {
            formData.append('description', data.description);
        }
        if (data.product_title) {
            formData.append('product_title', data.product_title);
        }
        if (data.is_featured !== undefined) {
            formData.append('is_featured', data.is_featured.toString());
        }

        const response = await apiClient.client.post('/api/v1/video/upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            },
        });

        return response.data;
    },

    // Получить список видео
    async getVideos(params?: {
        skip?: number;
        limit?: number;
        is_active?: boolean;
        is_featured?: boolean;
        product_id?: number;
    }): Promise<VideoResponse[]> {
        const response = await apiClient.client.get('/api/v1/video/', { params });
        return response.data;
    },

    // Получить видео по ID
    async getVideo(videoId: number): Promise<VideoResponse> {
        const response = await apiClient.client.get(`/api/v1/video/${videoId}`);
        return response.data;
    },

    // Получить избранные видео
    async getFeaturedVideos(limit = 10): Promise<VideoResponse[]> {
        const response = await apiClient.client.get('/api/v1/video/featured/', {
            params: { limit }
        });
        return response.data;
    },

    // Поиск видео
    async searchVideos(query: string): Promise<VideoResponse[]> {
        const response = await apiClient.client.get('/api/v1/video/search/', {
            params: { q: query }
        });
        return response.data;
    },

    // Обновить видео
    async updateVideo(videoId: number, data: VideoUpdateData): Promise<VideoResponse> {
        const response = await apiClient.client.put(`/api/v1/video/${videoId}`, data);
        return response.data;
    },

    // Удалить видео (только суперадмин)
    async deleteVideo(videoId: number): Promise<{ message: string }> {
        const response = await apiClient.client.delete(`/api/v1/video/${videoId}`);
        return response.data;
    },

    // Переключить статус активности
    async toggleVideoStatus(videoId: number): Promise<VideoResponse> {
        const response = await apiClient.client.post(`/api/v1/video/${videoId}/toggle-status`);
        return response.data;
    },

    // Переключить статус избранного
    async toggleFeaturedStatus(videoId: number): Promise<VideoResponse> {
        const response = await apiClient.client.post(`/api/v1/video/${videoId}/toggle-featured`);
        return response.data;
    },

    // Автопривязка к продукту
    async autoLinkProduct(videoId: number): Promise<VideoResponse> {
        const response = await apiClient.client.post(`/api/v1/video/${videoId}/auto-link-product`);
        return response.data;
    },

    // Предложения продуктов для видео
    async getProductSuggestions(videoId: number): Promise<{
        video_id: number;
        video_title: string;
        suggestions: ProductSuggestion[];
    }> {
        const response = await apiClient.client.get(`/api/v1/video/${videoId}/suggest-products`);
        return response.data;
    },

    // Статистика видео
    async getVideoStats(): Promise<VideoStats> {
        const response = await apiClient.client.get('/api/v1/video/stats/summary');
        return response.data;
    },

    // Проверка системы
    async getSystemCheck(): Promise<SystemCheck> {
        const response = await apiClient.client.get('/api/v1/video/system-check');
        return response.data;
    }
};

// Утилиты для работы с видео
export const videoUtils = {
    // Проверка поддерживаемых форматов
    isValidVideoFile(file: File): boolean {
        const validTypes = [
            'video/mp4',
            'video/quicktime', // .mov
            'video/x-msvideo', // .avi
            'video/x-matroska', // .mkv
            'video/webm'
        ];
        return validTypes.includes(file.type);
    },

    // Получение расширения файла
    getFileExtension(filename: string): string {
        return filename.slice(filename.lastIndexOf('.'));
    },

    // Форматирование размера файла
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Форматирование длительности
    formatDuration(seconds?: number): string {
        if (!seconds) return '--:--';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    // Создание превью из видео файла
    async createVideoPreview(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.addEventListener('loadedmetadata', () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                video.currentTime = 1; // Берем кадр с 1 секунды
            });

            video.addEventListener('seeked', () => {
                if (ctx) {
                    ctx.drawImage(video, 0, 0);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(URL.createObjectURL(blob));
                        } else {
                            reject(new Error('Failed to create preview'));
                        }
                    }, 'image/jpeg', 0.8);
                }
            });

            video.addEventListener('error', () => {
                reject(new Error('Failed to load video'));
            });

            video.src = URL.createObjectURL(file);
            video.load();
        });
    },

    // Получение URL для отображения видео
    getVideoUrl(video: VideoResponse): string {
        if (!video.url) return '';

        if (video.url.startsWith('http')) {
            return video.url;
        }

        // Используйте переменную окружения или конфиг
        const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        return `${backendBaseUrl}${video.url}`;
    }
};