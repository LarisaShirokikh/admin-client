'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { videoApi, videoUtils } from '@/lib/api/video';
import { useToast } from '@/lib/contexts/ToastContext';
import {
    Upload,
    Star,
    Eye,
    EyeOff,
    Edit3,
    Trash2,
    Video as VideoIcon,
    X,
    Check,
    AlertCircle,
} from 'lucide-react';
import { VideoResponse, VideoUpdateData, VideoUploadData } from '@/types/video';
import VideoViewer from '@/components/video/VideoViewer';

// TypeScript interfaces
interface VideoStats {
    total_videos: number;
    active_videos: number;
    featured_videos: number;
    upload_limits: {
        user_uploads_this_hour: number;
        user_limit: number;
    };
}

interface UploadProgress {
    file: File;
    preview?: string;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    error?: string;
    videoResponse?: VideoResponse;
}

interface EditingVideo {
    video: VideoResponse;
    title: string;
    description: string;
    is_featured: boolean;
}

interface UploadForm {
    title: string;
    description: string;
    product_title: string;
    is_featured: boolean;
}

// Функция для правильного формирования URL видео
// const getVideoUrl = (video: VideoResponse): string => {
//     if (!video.url) return '';

//     if (video.url.startsWith('http')) {
//         return video.url;
//     }

//     const backendHost = window.location.hostname;
//     return `http://${backendHost}:8000/admin-api${video.url}`;
// };

export default function VideoUploadPage() {
    const { isSuperuser } = useAuth();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    // Состояния
    const [videos, setVideos] = useState<VideoResponse[]>([]);
    const [uploads, setUploads] = useState<UploadProgress[]>([]);
    const [loading, setLoading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [editingVideo, setEditingVideo] = useState<EditingVideo | null>(null);
    const [stats, setStats] = useState<VideoStats | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [viewingVideo, setViewingVideo] = useState<VideoResponse | null>(null);
    const [hoveredVideo, setHoveredVideo] = useState<number | null>(null);

    // Форма загрузки
    const [uploadForm, setUploadForm] = useState<UploadForm>({
        title: '',
        description: '',
        product_title: '',
        is_featured: false
    });

    // Загрузка данных
    const loadVideos = useCallback(async () => {
        try {
            setLoading(true);
            const data = await videoApi.getVideos({ limit: 100 });
            setVideos(data);
        } catch (error) {
            console.error('Error loading videos:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadStats = useCallback(async () => {
        try {
            const data = await videoApi.getVideoStats();
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }, []);

    useEffect(() => {
        loadVideos();
        loadStats();
    }, [loadVideos, loadStats]);

    // Drag & Drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }, []);

    const handleFiles = useCallback(async (files: File[]) => {
        const validFiles = files.filter(file => {
            if (!videoUtils.isValidVideoFile(file)) {
                showToast('warning', `Файл ${file.name} имеет неподдерживаемый формат`);
                return false;
            }
            if (file.size > 100 * 1024 * 1024) {
                showToast('warning', `Файл ${file.name} слишком большой (максимум 100MB)`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        if (validFiles.length === 1) {
            const file = validFiles[0];
            setUploadForm({
                title: file.name.replace(/\.[^/.]+$/, ''),
                description: '',
                product_title: '',
                is_featured: false
            });

            try {
                const preview = await videoUtils.createVideoPreview(file);
                setUploads([{
                    file,
                    preview,
                    progress: 0,
                    status: 'uploading'
                }]);
                setShowUploadModal(true);
            } catch (error) {
                console.error('Error creating preview:', error);
                showToast('error', 'Ошибка создания превью');
            }
        } else {
            validFiles.forEach(file => uploadFile(file));
        }
    }, [showToast]);

    // Загрузка файла
    const uploadFile = async (file: File, formData?: UploadForm) => {
        const uploadData: VideoUploadData = {
            file,
            title: formData?.title || file.name.replace(/\.[^/.]+$/, ''),
            description: formData?.description || '',
            product_title: formData?.product_title || '',
            is_featured: formData?.is_featured || false
        };

        const uploadProgress: UploadProgress = {
            file,
            progress: 0,
            status: 'uploading'
        };

        setUploads(prev => [...prev, uploadProgress]);

        try {
            const response = await videoApi.uploadVideo(uploadData, (progress) => {
                setUploads(prev => prev.map(upload =>
                    upload.file === file ? { ...upload, progress } : upload
                ));
            });

            setUploads(prev => prev.map(upload =>
                upload.file === file
                    ? { ...upload, status: 'success', progress: 100, videoResponse: response }
                    : upload
            ));

            showToast('success', `Видео "${response.title}" загружено успешно`);
            await loadVideos();
            await loadStats();

        } catch (error) {
            console.error('Error uploading video:', error);
            setUploads(prev => prev.map(upload =>
                upload.file === file
                    ? { ...upload, status: 'error', error: 'Ошибка загрузки' }
                    : upload
            ));
            showToast('error', "Ошибка загрузки");
        }
    };

    const handleModalUpload = async () => {
        if (uploads.length === 0) return;
        const upload = uploads[0];
        await uploadFile(upload.file, uploadForm);
        setShowUploadModal(false);
        setUploads([]);
    };

    // Управление видео
    const toggleVideoStatus = async (video: VideoResponse) => {
        try {
            const updatedVideo = await videoApi.toggleVideoStatus(video.id);
            setVideos(prev => prev.map(v => v.id === video.id ? updatedVideo : v));
            showToast('success', `Видео ${updatedVideo.is_active ? 'активировано' : 'деактивировано'}`);
        } catch (error) {
            console.error('Error toggling video status:', error);
            showToast('error', 'Ошибка изменения статуса');
        }
    };

    const toggleFeatured = async (video: VideoResponse) => {
        try {
            const updatedVideo = await videoApi.toggleFeaturedStatus(video.id);
            setVideos(prev => prev.map(v => v.id === video.id ? updatedVideo : v));
            showToast('success', `Видео ${updatedVideo.is_featured ? 'добавлено в избранное' : 'убрано из избранного'}`);
        } catch (error) {
            console.error('Error toggling featured status:', error);
            showToast('error', 'Ошибка изменения статуса избранного');
        }
    };

    const deleteVideo = async (video: VideoResponse) => {
        if (!isSuperuser) {
            showToast('error', 'Недостаточно прав для удаления');
            return;
        }

        if (!confirm(`Удалить видео "${video.title}"?`)) return;

        try {
            await videoApi.deleteVideo(video.id);
            setVideos(prev => prev.filter(v => v.id !== video.id));
            showToast('success', 'Видео удалено');
            await loadStats();
        } catch (error) {
            console.error('Error deleting video:', error);
            showToast('error', 'Ошибка удаления видео');
        }
    };

    const startEditing = (video: VideoResponse) => {
        setEditingVideo({
            video,
            title: video.title,
            description: video.description || '',
            is_featured: video.is_featured
        });
    };

    const saveEditing = async () => {
        if (!editingVideo) return;

        try {
            const updateData: VideoUpdateData = {
                title: editingVideo.title,
                description: editingVideo.description,
                is_featured: editingVideo.is_featured
            };

            const updatedVideo = await videoApi.updateVideo(editingVideo.video.id, updateData);
            setVideos(prev => prev.map(v => v.id === updatedVideo.id ? updatedVideo : v));
            setEditingVideo(null);
            showToast('success', 'Видео обновлено');
        } catch (error) {
            console.error('Error updating video:', error);
            showToast('error', 'Ошибка обновления видео');
        }
    };

    const openVideoViewer = (video: VideoResponse) => {
        setViewingVideo(video);
    };

    const closeVideoViewer = () => {
        setViewingVideo(null);
    };

    const changeViewingVideo = (newVideo: VideoResponse) => {
        setViewingVideo(newVideo);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Простой Header */}
            <div className="bg-white border-b border-gray-800 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-gray-700 text-xl font-bold flex items-center gap-2">
                            <VideoIcon className="h-6 w-6" />
                            Video Stories
                        </h1>
                        {stats && (
                            <div className="text-gray-400 text-sm">
                                {stats.total_videos} видео • {stats.active_videos} активных
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Простая зона загрузки */}
                <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 mb-8 ${dragOver
                        ? 'border-blue-400 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-100'
                        }`}
                >
                    <Upload className={`h-16 w-16 mx-auto mb-4 transition-colors ${dragOver ? 'text-blue-400' : 'text-gray-500'
                        }`} />
                    <h3 className="text-gray-700 text-lg font-medium mb-2">
                        Загрузить видео
                    </h3>
                    <p className="text-gray-400">
                        Перетащите файлы сюда или нажмите для выбора
                    </p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="video/*"
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            handleFiles(files);
                            e.target.value = '';
                        }}
                        className="hidden"
                    />
                </div>

                {/* Прогресс загрузки */}
                {uploads.length > 0 && (
                    <div className="bg-white rounded-xl p-4 mb-8">
                        <h3 className="text-gray-700 font-medium mb-4">Загрузка</h3>
                        <div className="space-y-3">
                            {uploads.map((upload, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                                    {upload.preview && (
                                        <img
                                            src={upload.preview}
                                            alt="Preview"
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <div className="text-gray-700 text-sm font-medium truncate">
                                            {upload.file.name}
                                        </div>
                                        {upload.status === 'uploading' && (
                                            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${upload.progress}%` }}
                                                />
                                            </div>
                                        )}
                                        {upload.status === 'error' && (
                                            <div className="text-red-400 text-sm mt-1">
                                                {upload.error}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0">
                                        {upload.status === 'uploading' && (
                                            <div className="text-blue-400 text-sm font-medium">
                                                {upload.progress}%
                                            </div>
                                        )}
                                        {upload.status === 'success' && (
                                            <Check className="h-5 w-5 text-green-400" />
                                        )}
                                        {upload.status === 'error' && (
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Сетка видео в стиле Instagram */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {videos.map((video) => (
                        <div
                            key={video.id}
                            className="group relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden cursor-pointer"
                            onMouseEnter={() => setHoveredVideo(video.id)}
                            onMouseLeave={() => setHoveredVideo(null)}
                            onClick={() => openVideoViewer(video)}
                        >
                            {/* Видео */}
                            <video
                                className="w-full h-full object-cover"
                                src={videoUtils.getVideoUrl(video)}
                                poster={video.thumbnail_url}
                                autoPlay
                                loop
                                muted
                                playsInline
                                onError={(e) => {
                                    console.error('Video error:', e);
                                    e.currentTarget.style.display = 'none';
                                }}
                            />

                            {/* Оверлей при наведении */}
                            {hoveredVideo === video.id && (
                                <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                                    <div className="w-full">
                                        <h3 className="text-gray-700 text-sm font-medium truncate mb-1">
                                            {video.title}
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-xs text-gray-300">
                                                {video.is_featured && <Star className="h-3 w-3 text-yellow-400" />}
                                                {!video.is_active && <span className="text-red-400">Неактивно</span>}
                                            </div>

                                            {/* Кнопки управления */}
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleVideoStatus(video);
                                                    }}
                                                    className="p-1 rounded bg-black/50 text-white hover:bg-black/70"
                                                    title={video.is_active ? 'Деактивировать' : 'Активировать'}
                                                >
                                                    {video.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFeatured(video);
                                                    }}
                                                    className="p-1 rounded bg-black/50 text-gray-700 hover:bg-black/70"
                                                    title={video.is_featured ? 'Убрать из избранного' : 'Добавить в избранное'}
                                                >
                                                    <Star className={`h-3 w-3 ${video.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEditing(video);
                                                    }}
                                                    className="p-1 rounded bg-black/50 text-gray-700 hover:bg-black/70"
                                                    title="Редактировать"
                                                >
                                                    <Edit3 className="h-3 w-3" />
                                                </button>

                                                {isSuperuser && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteVideo(video);
                                                        }}
                                                        className="p-1 rounded bg-black/50 text-red-400 hover:bg-black/70"
                                                        title="Удалить"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Статусы */}
                            <div className="absolute top-2 left-2 flex gap-1">
                                {video.is_featured && (
                                    <div className="bg-yellow-500 rounded-full p-1">
                                        <Star className="h-2 w-2 text-white fill-white" />
                                    </div>
                                )}
                                {!video.is_active && (
                                    <div className="bg-red-500 rounded-full p-1">
                                        <EyeOff className="h-2 w-2 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Пустое состояние */}
                {videos.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <VideoIcon className="h-20 w-20 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-white text-xl font-medium mb-2">
                            Пока нет видео
                        </h3>
                        <p className="text-gray-400">
                            Загрузите первое видео, перетащив файл в область выше
                        </p>
                    </div>
                )}
            </div>

            {/* Модальное окно загрузки */}
            {showUploadModal && uploads.length > 0 && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white text-lg font-medium">Загрузка видео</h3>
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploads([]);
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {uploads[0].preview && (
                                <div className="mb-4">
                                    <img
                                        src={uploads[0].preview}
                                        alt="Preview"
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Название *
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadForm.title}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Введите название видео"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Описание
                                    </label>
                                    <textarea
                                        value={uploadForm.description}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Опишите содержание видео"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_featured"
                                        checked={uploadForm.is_featured}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                                        className="h-4 w-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="is_featured" className="ml-2 text-sm text-gray-300">
                                        Добавить в избранное
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={handleModalUpload}
                                        disabled={!uploadForm.title.trim()}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Загрузить
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowUploadModal(false);
                                            setUploads([]);
                                        }}
                                        className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно редактирования */}
            {editingVideo && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white text-lg font-medium">Редактировать видео</h3>
                                <button
                                    onClick={() => setEditingVideo(null)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Название *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingVideo.title}
                                        onChange={(e) => setEditingVideo(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Описание
                                    </label>
                                    <textarea
                                        value={editingVideo.description}
                                        onChange={(e) => setEditingVideo(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="edit_is_featured"
                                        checked={editingVideo.is_featured}
                                        onChange={(e) => setEditingVideo(prev => prev ? ({ ...prev, is_featured: e.target.checked }) : null)}
                                        className="h-4 w-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="edit_is_featured" className="ml-2 text-sm text-gray-300">
                                        Избранное видео
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={saveEditing}
                                        disabled={!editingVideo.title.trim()}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Сохранить
                                    </button>
                                    <button
                                        onClick={() => setEditingVideo(null)}
                                        className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Полноэкранный просмотрщик видео */}
            {viewingVideo && (
                <VideoViewer
                    video={viewingVideo}
                    videos={videos}
                    onClose={closeVideoViewer}
                    onVideoChange={changeViewingVideo}
                    onToggleFeatured={toggleFeatured}
                    onToggleStatus={toggleVideoStatus}
                />
            )}
        </div>
    );
}