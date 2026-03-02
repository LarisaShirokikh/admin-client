// src/components/products/ProductMediaSection.tsx
//
// Единая галерея: фото и видео в одном гриде.
// Звёздочка на любом элементе — он становится главным на карточке товара.
// Изображения управляются через родительский стейт (сохраняются при сабмите формы).
// Видео управляются через API (сохраняются сразу).

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Image as ImageIcon,
    Video as VideoIcon,
    Upload,
    Link as LinkIcon,
    Trash2,
    Star,
    StarOff,
    RefreshCw,
    Play,
    Eye,
    X,
} from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { videoApi, videoUtils } from '@/lib/api/video';
import { getImageUrl } from '@/lib/utils/image';
import { ImageUploadData } from '@/types/products';
import { VideoResponse } from '@/types/video';

// ── Types ──

export type MainMedia =
    | { type: 'image'; index: number }
    | { type: 'video'; videoId: number }
    | null;

interface ProductMediaSectionProps {
    productId: number;
    productName: string;
    // Image state (managed by parent modal)
    images: ImageUploadData[];
    onImagesChange: (images: ImageUploadData[]) => void;
    imagesLoading: boolean;
    imagesError: string | null;
    onReloadImages: () => void;
    // Main media callback — parent tracks what's the hero
    mainMedia: MainMedia;
    onMainMediaChange: (m: MainMedia) => void;
}

export default function ProductMediaSection({
    productId,
    productName,
    images,
    onImagesChange,
    imagesLoading,
    imagesError,
    onReloadImages,
    mainMedia,
    onMainMediaChange,
}: ProductMediaSectionProps) {
    // ── Videos (self-managed via API) ──
    const [videos, setVideos] = useState<VideoResponse[]>([]);
    const [videosLoading, setVideosLoading] = useState(true);
    const [videosError, setVideosError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // ── Image add ──
    const [imageUrl, setImageUrl] = useState('');
    const [imageUploading, setImageUploading] = useState(false);

    // ── Refs ──
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    // ── Preview ──
    const [previewSrc, setPreviewSrc] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'image' | 'video'>('image');

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
    const getVideoSrc = (v: VideoResponse) => v.url.startsWith('http') ? v.url : `${backendUrl}${v.url}`;
    const getThumbSrc = (v: VideoResponse) =>
        v.thumbnail_url ? (v.thumbnail_url.startsWith('http') ? v.thumbnail_url : `${backendUrl}${v.thumbnail_url}`) : null;

    // ── Load videos ──

    const loadVideos = useCallback(async () => {
        setVideosLoading(true);
        setVideosError(null);
        try {
            setVideos(await videoApi.getVideos({ product_id: productId }));
        } catch {
            setVideosError('Не удалось загрузить видео');
        } finally {
            setVideosLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        if (productId) loadVideos();
    }, [productId, loadVideos]);

    // ── Determine initial mainMedia from data ──

    useEffect(() => {
        if (mainMedia !== null) return; // already set by parent
        // Check if any video is featured
        const featuredVideo = videos.find(v => v.is_featured);
        if (featuredVideo) {
            onMainMediaChange({ type: 'video', videoId: featuredVideo.id });
            return;
        }
        // Check main image
        const mainImgIdx = images.findIndex(i => i.is_main && !i.toDelete);
        if (mainImgIdx >= 0) {
            onMainMediaChange({ type: 'image', index: mainImgIdx });
        }
    }, [videos, images, mainMedia, onMainMediaChange]);

    // ── Set main ──

    const handleSetMain = async (type: 'image' | 'video', id: number) => {
        if (type === 'image') {
            // Set this image as main, unset others
            onImagesChange(images.map((img, i) => ({
                ...img,
                is_main: i === id && !img.toDelete,
            })));
            // Unfeatured all videos
            for (const v of videos) {
                if (v.is_featured) {
                    try { await videoApi.toggleFeaturedStatus(v.id); } catch { /* ignore */ }
                }
            }
            await loadVideos();
            onMainMediaChange({ type: 'image', index: id });
        } else {
            // Set this video as featured
            try {
                await videoApi.toggleFeaturedStatus(id);
                // Unfeatured other videos if needed (toggle may handle this)
                await loadVideos();
            } catch {
                setVideosError('Ошибка');
                return;
            }
            // Unset all image is_main
            onImagesChange(images.map(img => ({ ...img, is_main: false })));
            onMainMediaChange({ type: 'video', videoId: id });
        }
    };

    const isMainItem = (type: 'image' | 'video', id: number): boolean => {
        if (!mainMedia) return false;
        if (type === 'image') return mainMedia.type === 'image' && mainMedia.index === id;
        return mainMedia.type === 'video' && mainMedia.videoId === id;
    };

    // ── Image handlers ──

    const handleAddImageByUrl = async () => {
        if (!imageUrl.trim()) return;
        try {
            const ok = await productsApi.validateImageUrl(imageUrl.trim());
            if (!ok) { alert('Не удалось загрузить изображение по ссылке'); return; }
        } catch { /* proceed */ }
        const activeCount = images.filter(i => !i.toDelete).length;
        const isFirst = activeCount === 0 && videos.length === 0;
        onImagesChange([...images, {
            url: imageUrl.trim(),
            is_main: isFirst,
            isNew: true,
        }]);
        if (isFirst) onMainMediaChange({ type: 'image', index: images.length });
        setImageUrl('');
    };

    const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        setImageUploading(true);
        const activeCount = images.filter(i => !i.toDelete).length;
        const noMedia = activeCount === 0 && videos.length === 0;
        const newImages: ImageUploadData[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) continue;
            newImages.push({
                url: URL.createObjectURL(file),
                is_main: noMedia && i === 0,
                file,
                isNew: true,
            });
        }
        if (newImages.length > 0) {
            onImagesChange([...images, ...newImages]);
            if (noMedia) onMainMediaChange({ type: 'image', index: images.length });
        }
        setImageUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleDeleteImage = (index: number) => {
        const updated = [...images];
        const img = updated[index];
        if (img.id && !img.isNew) {
            updated[index] = { ...img, toDelete: true };
        } else {
            if (img.file && img.url.startsWith('blob:')) URL.revokeObjectURL(img.url);
            updated.splice(index, 1);
        }
        // If deleted was main, pick next available
        if (isMainItem('image', index)) {
            const nextImg = updated.findIndex(i => !i.toDelete);
            if (nextImg >= 0) {
                updated[nextImg].is_main = true;
                onMainMediaChange({ type: 'image', index: nextImg });
            } else if (videos.length > 0) {
                const feat = videos.find(v => v.is_featured) || videos[0];
                onMainMediaChange({ type: 'video', videoId: feat.id });
            } else {
                onMainMediaChange(null);
            }
        }
        onImagesChange(updated);
    };

    // ── Video handlers ──

    const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!videoUtils.isValidVideoFile(file)) {
            setVideosError('Формат не поддерживается. MP4, MOV, AVI, MKV, WebM.');
            return;
        }
        if (file.size > 100 * 1024 * 1024) {
            setVideosError(`Слишком большой (${videoUtils.formatFileSize(file.size)}). Макс. 100MB.`);
            return;
        }
        handleVideoUpload(file);
    };

    const handleVideoUpload = async (file: File) => {
        setUploading(true);
        setUploadProgress(0);
        setVideosError(null);
        try {
            const title = file.name.replace(/\.[^.]+$/, '');
            const noMedia = images.filter(i => !i.toDelete).length === 0 && videos.length === 0;
            const uploaded = await videoApi.uploadVideo(
                { file, title, product_title: productName, is_featured: noMedia },
                (p) => setUploadProgress(p),
            );
            if (!uploaded.product_id || uploaded.product_id !== productId) {
                await videoApi.updateVideo(uploaded.id, { product_id: productId });
            }
            if (videoInputRef.current) videoInputRef.current.value = '';
            await loadVideos();
            if (noMedia) onMainMediaChange({ type: 'video', videoId: uploaded.id });
        } catch {
            setVideosError('Ошибка загрузки видео');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDeleteVideo = async (video: VideoResponse) => {
        if (!confirm(`Удалить видео "${video.title}"?`)) return;
        try {
            await videoApi.deleteVideo(video.id);
            if (isMainItem('video', video.id)) {
                // Pick next main
                const remaining = videos.filter(v => v.id !== video.id);
                if (remaining.length > 0) {
                    onMainMediaChange({ type: 'video', videoId: remaining[0].id });
                } else {
                    const mainImg = images.findIndex(i => !i.toDelete);
                    onMainMediaChange(mainImg >= 0 ? { type: 'image', index: mainImg } : null);
                }
            }
            await loadVideos();
        } catch {
            setVideosError('Ошибка удаления');
        }
    };

    // ── Unified file handler (auto-detect image vs video) ──

    const handleUnifiedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type.startsWith('image/')) {
            // Route to image upload
            const fakeEvent = { target: { files: e.target.files } } as React.ChangeEvent<HTMLInputElement>;
            handleImageFileUpload(fakeEvent);
        } else if (file.type.startsWith('video/')) {
            const fakeEvent = { target: { files: e.target.files } } as React.ChangeEvent<HTMLInputElement>;
            handleVideoFileSelect(fakeEvent);
        } else {
            setVideosError('Неподдерживаемый формат файла');
        }
    };

    const unifiedInputRef = useRef<HTMLInputElement>(null);

    // ── Render ──

    const activeImages = images.filter(i => !i.toDelete);
    const totalMedia = activeImages.length + videos.length;
    const loading = imagesLoading || videosLoading;
    const error = imagesError || videosError;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Медиа товара
                    {totalMedia > 0 && (
                        <span className="ml-2 text-xs text-gray-400 font-normal">
                            {activeImages.length} фото · {videos.length} видео
                        </span>
                    )}
                </label>
                <div className="flex items-center gap-2">
                    {error && (
                        <button type="button" onClick={() => { setVideosError(null); onReloadImages(); }}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" /> Обновить
                        </button>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <span className="text-xs text-red-700">{error}</span>
                    <button type="button" onClick={() => setVideosError(null)} className="text-red-400 hover:text-red-600">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Upload area */}
            {!loading && (
                <div className="space-y-3">
                    {/* Unified upload + URL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Upload file (auto-detect) */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Загрузить файл</label>
                            <input ref={unifiedInputRef} type="file"
                                accept="image/*,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                                onChange={handleUnifiedUpload} className="hidden" />
                            <button type="button"
                                onClick={() => unifiedInputRef.current?.click()}
                                disabled={imageUploading || uploading}
                                className="w-full flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50">
                                {(imageUploading || uploading) ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4 text-gray-500" />
                                )}
                                <span className="text-sm text-gray-600">
                                    {uploading ? `Видео ${uploadProgress}%` : imageUploading ? 'Загрузка...' : 'Фото или видео'}
                                </span>
                            </button>
                            {uploading && (
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }} />
                                </div>
                            )}
                        </div>

                        {/* Image by URL */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Фото по ссылке</label>
                            <div className="flex gap-2">
                                <input type="url" value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                                <button type="button" onClick={handleAddImageByUrl}
                                    disabled={!imageUrl.trim()}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    <LinkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">
                        Фото: JPG, PNG, WebP до 10MB · Видео: MP4, MOV, AVI, MKV, WebM до 100MB
                    </p>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">Загрузка медиа...</span>
                </div>
            )}

            {/* ═══ Unified grid ═══ */}
            {!loading && (images.length > 0 || videos.length > 0) && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {/* ── Images ── */}
                    {images.map((image, index) => {
                        const isMain = isMainItem('image', index);
                        return (
                            <div key={`img-${image.id || 'new'}-${index}`}
                                className={`relative group border-2 rounded-lg overflow-hidden ${image.toDelete ? 'border-red-300 opacity-40'
                                    : isMain ? 'border-yellow-400 ring-2 ring-yellow-200'
                                        : 'border-gray-200'
                                    }`}>
                                <div className="aspect-square relative bg-gray-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={image.file ? image.url : getImageUrl(image.url)}
                                        alt="" className="w-full h-full object-cover" loading="lazy" />

                                    {/* Type badge */}
                                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5">
                                        <ImageIcon className="h-2.5 w-2.5" /> фото
                                    </div>

                                    {/* Main badge */}
                                    {isMain && !image.toDelete && (
                                        <div className="absolute top-1 left-1 bg-yellow-400 text-white text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                            <Star className="h-2.5 w-2.5" /> Главное
                                        </div>
                                    )}

                                    {image.isNew && !image.toDelete && (
                                        <div className="absolute top-1 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                                            Новое
                                        </div>
                                    )}

                                    {image.toDelete && (
                                        <div className="absolute inset-0 bg-red-500/75 flex items-center justify-center">
                                            <span className="text-white text-xs font-medium">К удалению</span>
                                        </div>
                                    )}

                                    {/* Hover actions */}
                                    {!image.toDelete && (
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center pointer-events-none">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 pointer-events-auto">
                                                <button type="button"
                                                    onClick={() => { setPreviewSrc(image.file ? image.url : getImageUrl(image.url)); setPreviewType('image'); }}
                                                    className="p-1.5 bg-white text-gray-700 rounded hover:bg-gray-100" title="Просмотр">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </button>
                                                <button type="button"
                                                    onClick={() => handleSetMain('image', index)}
                                                    className={`p-1.5 rounded ${isMain ? 'bg-yellow-400 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                                    title={isMain ? 'Главное' : 'Сделать главным'}>
                                                    {isMain ? <Star className="h-3.5 w-3.5" /> : <StarOff className="h-3.5 w-3.5" />}
                                                </button>
                                                <button type="button"
                                                    onClick={() => handleDeleteImage(index)}
                                                    className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600" title="Удалить">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* ── Videos ── */}
                    {videos.map((video) => {
                        const isMain = isMainItem('video', video.id);
                        const thumb = getThumbSrc(video);
                        return (
                            <div key={`vid-${video.id}`}
                                className={`relative group border-2 rounded-lg overflow-hidden ${isMain ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-gray-200'
                                    }`}>
                                <div className="aspect-square relative bg-black">
                                    {thumb ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={thumb} alt={video.title}
                                            className="w-full h-full object-cover" />
                                    ) : (
                                        <video src={getVideoSrc(video)}
                                            className="w-full h-full object-cover" muted preload="metadata" />
                                    )}

                                    {/* Type badge */}
                                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5">
                                        <VideoIcon className="h-2.5 w-2.5" /> видео
                                        {video.duration != null && (
                                            <span className="ml-0.5">{videoUtils.formatDuration(video.duration)}</span>
                                        )}
                                    </div>

                                    {/* Main badge */}
                                    {isMain && (
                                        <div className="absolute top-1 left-1 bg-yellow-400 text-white text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                            <Star className="h-2.5 w-2.5" /> Главное
                                        </div>
                                    )}

                                    {/* Play icon always visible */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                        <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Play className="h-4 w-4 text-gray-800 ml-0.5" />
                                        </div>
                                    </div>

                                    {/* Hover actions */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center pointer-events-none">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 pointer-events-auto">
                                            <button type="button"
                                                onClick={() => { setPreviewSrc(getVideoSrc(video)); setPreviewType('video'); }}
                                                className="p-1.5 bg-white text-gray-700 rounded hover:bg-gray-100" title="Просмотр">
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>
                                            <button type="button"
                                                onClick={() => handleSetMain('video', video.id)}
                                                className={`p-1.5 rounded ${isMain ? 'bg-yellow-400 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                                title={isMain ? 'Главное' : 'Сделать главным'}>
                                                {isMain ? <Star className="h-3.5 w-3.5" /> : <StarOff className="h-3.5 w-3.5" />}
                                            </button>
                                            <button type="button"
                                                onClick={() => handleDeleteVideo(video)}
                                                className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600" title="Удалить">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty */}
            {!loading && images.length === 0 && videos.length === 0 && (
                <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                        <VideoIcon className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">Нет медиа</p>
                    <p className="text-xs text-gray-400 mt-1">Загрузите фото или видео</p>
                </div>
            )}

            {/* Preview modal */}
            {previewSrc && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70]"
                    onClick={() => setPreviewSrc(null)}>
                    <div className="relative max-w-4xl w-full max-h-[90vh] m-4"
                        onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => setPreviewSrc(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300">
                            <X className="h-6 w-6" />
                        </button>
                        {previewType === 'image' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={previewSrc} alt="Предпросмотр"
                                className="max-w-full max-h-[85vh] object-contain rounded-lg mx-auto" />
                        ) : (
                            <video src={previewSrc} className="w-full rounded-lg" controls autoPlay />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}