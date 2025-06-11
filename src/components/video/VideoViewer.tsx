// components/VideoViewer.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { VideoResponse } from '@/types/video';
import { videoUtils } from '@/lib/api/video';
import {
    X,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    SkipBack,
    SkipForward,
    Star,
    StarOff,
    Eye,
    EyeOff,
    Share2,
    Heart,
    MessageCircle,
} from 'lucide-react';

interface VideoViewerProps {
    video: VideoResponse;
    videos: VideoResponse[];
    onClose: () => void;
    onVideoChange?: (video: VideoResponse) => void;
    onToggleFeatured?: (video: VideoResponse) => void;
    onToggleStatus?: (video: VideoResponse) => void;
}

export default function VideoViewer({
    video,
    videos,
    onClose,
    onVideoChange,
    onToggleFeatured,
    onToggleStatus
}: VideoViewerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [liked, setLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const currentIndex = videos.findIndex(v => v.id === video.id);
    const canGoNext = currentIndex < videos.length - 1;
    const canGoPrevious = currentIndex > 0;

    // Автоскрытие контролов
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [isPlaying, showControls]);

    // Обработчики видео
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
        const handleDurationChange = () => setDuration(videoElement.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            if (canGoNext) {
                nextVideo();
            }
        };

        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        videoElement.addEventListener('durationchange', handleDurationChange);
        videoElement.addEventListener('ended', handleEnded);

        return () => {
            videoElement.removeEventListener('timeupdate', handleTimeUpdate);
            videoElement.removeEventListener('durationchange', handleDurationChange);
            videoElement.removeEventListener('ended', handleEnded);
        };
    }, [video, canGoNext]);

    // Управление воспроизведением
    const togglePlay = () => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        if (isPlaying) {
            videoElement.pause();
        } else {
            videoElement.play();
        }
        setIsPlaying(!isPlaying);
        setShowControls(true);
    };

    const toggleMute = () => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        videoElement.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (newVolume: number) => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        videoElement.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const handleSeek = (newTime: number) => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        videoElement.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Навигация по видео
    const nextVideo = () => {
        if (canGoNext && onVideoChange) {
            onVideoChange(videos[currentIndex + 1]);
        }
    };

    const previousVideo = () => {
        if (canGoPrevious && onVideoChange) {
            onVideoChange(videos[currentIndex - 1]);
        }
    };

    // Обработчики клавиатуры
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    handleSeek(Math.max(0, currentTime - 10));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    handleSeek(Math.min(duration, currentTime + 10));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    previousVideo();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    nextVideo();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentTime, duration, isPlaying]);

    const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            {/* Основной контейнер видео */}
            <div
                className="relative w-full h-full flex items-center justify-center"
                onMouseMove={() => setShowControls(true)}
                onClick={togglePlay}
            >
                {/* Видео */}
                <video
                    ref={videoRef}
                    src={videoUtils.getVideoUrl(video)}
                    className="max-w-full max-h-full object-contain"
                    onLoadedData={() => {
                        if (videoRef.current) {
                            setDuration(videoRef.current.duration);
                        }
                    }}
                />

                {/* Кнопка закрытия */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Навигация */}
                {canGoPrevious && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            previousVideo();
                        }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                    >
                        <SkipBack className="h-6 w-6" />
                    </button>
                )}

                {canGoNext && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            nextVideo();
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                    >
                        <SkipForward className="h-6 w-6" />
                    </button>
                )}

                {/* Центральная кнопка воспроизведения */}
                {!isPlaying && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePlay();
                        }}
                        className="absolute inset-0 flex items-center justify-center z-10"
                    >
                        <div className="p-4 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all">
                            <Play className="h-12 w-12 ml-1" />
                        </div>
                    </button>
                )}

                {/* Контролы */}
                <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                    }`}>
                    {/* Прогресс бар */}
                    <div className="mb-4">
                        <div className="flex items-center gap-3 text-white text-sm mb-2">
                            <span>{videoUtils.formatDuration(currentTime)}</span>
                            <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white transition-all duration-150"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <span>{videoUtils.formatDuration(duration)}</span>
                        </div>

                        {/* Интерактивный слайдер */}
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime}
                            onChange={(e) => handleSeek(Number(e.target.value))}
                            className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer slider"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Основные контролы */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    togglePlay();
                                }}
                                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                            >
                                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMute();
                                    }}
                                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                                >
                                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                                </button>

                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        handleVolumeChange(Number(e.target.value));
                                    }}
                                    className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Действия с видео */}
                            {onToggleFeatured && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFeatured(video);
                                    }}
                                    className={`p-2 rounded-full transition-all ${video.is_featured
                                        ? 'text-yellow-400 hover:bg-yellow-400 hover:bg-opacity-20'
                                        : 'text-white hover:bg-white hover:bg-opacity-20'
                                        }`}
                                    title={video.is_featured ? 'Убрать из избранного' : 'Добавить в избранное'}
                                >
                                    {video.is_featured ? <Star className="h-5 w-5" /> : <StarOff className="h-5 w-5" />}
                                </button>
                            )}

                            {onToggleStatus && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleStatus(video);
                                    }}
                                    className={`p-2 rounded-full transition-all ${video.is_active
                                        ? 'text-green-400 hover:bg-green-400 hover:bg-opacity-20'
                                        : 'text-red-400 hover:bg-red-400 hover:bg-opacity-20'
                                        }`}
                                    title={video.is_active ? 'Деактивировать' : 'Активировать'}
                                >
                                    {video.is_active ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                </button>
                            )}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFullscreen();
                                }}
                                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                            >
                                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Информация о видео */}
                <div className={`absolute top-4 left-4 right-16 text-white transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                    }`}>
                    <h2 className="text-xl font-bold mb-1">{video.title}</h2>
                    {video.description && (
                        <p className="text-gray-300 text-sm line-clamp-2">{video.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span>{new Date(video.created_at).toLocaleDateString('ru-RU')}</span>
                        {video.duration && <span>{videoUtils.formatDuration(video.duration)}</span>}
                        <span>{currentIndex + 1} из {videos.length}</span>
                    </div>
                </div>

                {/* Боковая панель действий (как в TikTok) */}
                <div className="absolute right-4 bottom-20 flex flex-col gap-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setLiked(!liked);
                        }}
                        className={`p-3 rounded-full transition-all ${liked
                            ? 'bg-red-500 text-white'
                            : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
                            }`}
                    >
                        <Heart className={`h-6 w-6 ${liked ? 'fill-current' : ''}`} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowComments(!showComments);
                        }}
                        className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                    >
                        <MessageCircle className="h-6 w-6" />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.share?.({
                                title: video.title,
                                text: video.description,
                                url: window.location.href
                            });
                        }}
                        className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                    >
                        <Share2 className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Стили для слайдера */}
            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    border: 2px solid #333;
                }
                
                .slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    border: 2px solid #333;
                }
            `}</style>
        </div>
    );
}