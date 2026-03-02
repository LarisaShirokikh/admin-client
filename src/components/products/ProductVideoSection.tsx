// src/components/products/ProductVideoSection.tsx

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Video as VideoIcon,
    Upload,
    Trash2,
    Star,
    StarOff,
    RefreshCw,
    Play,
    X,
} from 'lucide-react';
import { videoApi, videoUtils } from '@/lib/api/video';
import { VideoResponse } from '@/types/video';

interface ProductVideoSectionProps {
    productId: number;
    productName: string;
}

export default function ProductVideoSection({ productId, productName }: ProductVideoSectionProps) {
    const [videos, setVideos] = useState<VideoResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Upload
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadTitle, setUploadTitle] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Preview
    const [previewVideo, setPreviewVideo] = useState<VideoResponse | null>(null);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

    const getVideoSrc = (video: VideoResponse) =>
        video.url.startsWith('http') ? video.url : `${backendUrl}${video.url}`;

    const getThumbnailSrc = (video: VideoResponse) =>
        video.thumbnail_url
            ? (video.thumbnail_url.startsWith('http') ? video.thumbnail_url : `${backendUrl}${video.thumbnail_url}`)
            : null;

    // ── Load ──

    const loadVideos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await videoApi.getVideos({ product_id: productId });
            setVideos(data);
        } catch {
            setError('Не удалось загрузить видео');
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        if (productId) loadVideos();
    }, [productId, loadVideos]);

    // ── Upload ──

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!videoUtils.isValidVideoFile(file)) {
            setError('Неподдерживаемый формат. Используйте MP4, MOV, AVI, MKV или WebM.');
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            setError(`Файл слишком большой (${videoUtils.formatFileSize(file.size)}). Макс. 100MB.`);
            return;
        }

        handleUpload(file);
    };

    const handleUpload = async (file: File) => {
        setUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const title = uploadTitle.trim() || file.name.replace(/\.[^.]+$/, '');
            const isFirst = videos.length === 0;

            const uploaded = await videoApi.uploadVideo(
                {
                    file,
                    title,
                    product_title: productName,
                    is_featured: isFirst,
                },
                (progress) => setUploadProgress(progress)
            );

            // Если автопривязка по названию не сработала — привязываем вручную
            if (!uploaded.product_id || uploaded.product_id !== productId) {
                await videoApi.updateVideo(uploaded.id, { product_id: productId });
            }

            setUploadTitle('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            await loadVideos();
        } catch {
            setError('Ошибка загрузки видео');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // ── Actions ──

    const handleDelete = async (video: VideoResponse) => {
        if (!confirm(`Удалить видео "${video.title}"?`)) return;
        try {
            await videoApi.deleteVideo(video.id);
            await loadVideos();
        } catch {
            setError('Ошибка удаления');
        }
    };

    const handleToggleFeatured = async (video: VideoResponse) => {
        try {
            await videoApi.toggleFeaturedStatus(video.id);
            await loadVideos();
        } catch {
            setError('Ошибка изменения статуса');
        }
    };

    // ── Render ──

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Видео товара
                </label>
                <button type="button" onClick={loadVideos}
                    className="text-gray-400 hover:text-gray-600">
                    <RefreshCw className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <span className="text-xs text-red-700">{error}</span>
                    <button type="button" onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-600">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="Название видео (необязательно)"
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={uploading}
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm whitespace-nowrap"
                    >
                        {uploading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        {uploading ? `${uploadProgress}%` : 'Загрузить'}
                    </button>
                </div>

                {uploading && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }} />
                    </div>
                )}

                <p className="mt-2 text-xs text-gray-400">MP4, MOV, AVI, MKV, WebM · до 100MB</p>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center p-6">
                    <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                </div>
            )}

            {/* Video grid */}
            {!loading && videos.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs text-gray-500">Видео ({videos.length})</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {videos.map((video) => {
                            const thumb = getThumbnailSrc(video);
                            return (
                                <div key={video.id}
                                    className={`relative group border-2 rounded-lg overflow-hidden ${video.is_featured ? 'border-yellow-400' : 'border-gray-200'
                                        }`}>
                                    {/* Preview area */}
                                    <div className="aspect-video relative bg-black">
                                        {thumb ? (
                                            <img src={thumb} alt={video.title}
                                                className="w-full h-full object-cover" />
                                        ) : (
                                            <video src={getVideoSrc(video)}
                                                className="w-full h-full object-cover" muted preload="metadata" />
                                        )}

                                        {/* Play */}
                                        <button type="button" onClick={() => setPreviewVideo(video)}
                                            className="absolute inset-0 flex items-center justify-center hover:bg-black/30 transition-colors">
                                            <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                        </button>

                                        {/* Featured badge */}
                                        {video.is_featured && (
                                            <div className="absolute top-1 left-1 bg-yellow-400 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                                                Главное
                                            </div>
                                        )}

                                        {/* Hover actions */}
                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => handleToggleFeatured(video)}
                                                className={`p-1 rounded shadow-sm ${video.is_featured
                                                    ? 'bg-yellow-400 text-white'
                                                    : 'bg-white/90 text-gray-700 hover:bg-white'
                                                    }`}
                                                title={video.is_featured ? 'Главное видео' : 'Сделать главным'}>
                                                {video.is_featured
                                                    ? <Star className="h-3 w-3" />
                                                    : <StarOff className="h-3 w-3" />}
                                            </button>
                                            <button type="button" onClick={() => handleDelete(video)}
                                                className="p-1 bg-red-500 text-white rounded shadow-sm hover:bg-red-600"
                                                title="Удалить">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="px-2 py-1.5">
                                        <p className="text-xs text-gray-700 truncate" title={video.title}>
                                            {video.title}
                                        </p>
                                        {video.duration != null && (
                                            <p className="text-[10px] text-gray-400">
                                                {videoUtils.formatDuration(video.duration)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty */}
            {!loading && videos.length === 0 && (
                <div className="text-center p-4 border-2 border-dashed border-gray-200 rounded-lg">
                    <VideoIcon className="h-8 w-8 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Нет видео</p>
                </div>
            )}

            {/* Preview modal */}
            {previewVideo && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70]"
                    onClick={() => setPreviewVideo(null)}>
                    <div className="relative max-w-3xl w-full max-h-[90vh] m-4"
                        onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => setPreviewVideo(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300">
                            <X className="h-6 w-6" />
                        </button>
                        <video src={getVideoSrc(previewVideo)}
                            className="w-full rounded-lg" controls autoPlay />
                        <p className="text-white text-sm mt-2">{previewVideo.title}</p>
                    </div>
                </div>
            )}
        </div>
    );
}