'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/contexts/ToastContext';
import {
    Plus,
    Star,
    Eye,
    EyeOff,
    Edit3,
    Trash2,
    FileText,
    X,
    Calendar,
    User,
} from 'lucide-react';

// TypeScript interfaces
interface Post {
    id: number;
    title: string;
    content: string;
    excerpt?: string;
    image_url?: string;
    thumbnail_url?: string;
    is_active: boolean;
    is_featured: boolean;
    author: string;
    created_at: string;
    updated_at: string;
    views_count?: number;
    likes_count?: number;
}

interface PostStats {
    total_posts: number;
    active_posts: number;
    featured_posts: number;
    draft_posts: number;
}

// interface UploadProgress {
//     file: File;
//     preview?: string;
//     progress: number;
//     status: 'uploading' | 'success' | 'error';
//     error?: string;
//     postResponse?: Post;
// }

interface EditingPost {
    post: Post;
    title: string;
    content: string;
    excerpt: string;
    is_featured: boolean;
    is_active: boolean;
}

interface CreateForm {
    title: string;
    content: string;
    excerpt: string;
    is_featured: boolean;
    is_active: boolean;
    image?: File;
}

export default function PostsPage() {
    const { isSuperuser, user } = useAuth();
    const { showToast } = useToast();

    // Состояния
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPost, setEditingPost] = useState<EditingPost | null>(null);
    const [stats, setStats] = useState<PostStats | null>(null);
    const [hoveredPost, setHoveredPost] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Форма создания
    const [createForm, setCreateForm] = useState<CreateForm>({
        title: '',
        content: '',
        excerpt: '',
        is_featured: false,
        is_active: true,
        image: undefined
    });

    // Мокированные данные для демонстрации
    const mockPosts: Post[] = [
        {
            id: 1,
            title: "Новая коллекция входных дверей 2024",
            content: "Представляем новую коллекцию входных дверей с улучшенными характеристиками...",
            excerpt: "Новинки года с современным дизайном",
            image_url: "https://labirintdoors.ru/images/010/301/596/10301596/990xnoinc/labirint-karmina-03-sandal.jpg",
            thumbnail_url: "https://labirintdoors.ru/images/010/301/596/10301596/990xnoinc/labirint-karmina-03-sandal.jpg",
            is_active: true,
            is_featured: true,
            author: "Администратор",
            created_at: "2024-06-14T08:00:00Z",
            updated_at: "2024-06-14T08:00:00Z",
            views_count: 256,
            likes_count: 18
        },
        {
            id: 2,
            title: "Технологии производства металлических дверей",
            content: "Рассказываем о современных технологиях производства...",
            excerpt: "Инновации в производстве",
            image_url: "https://labirintdoors.ru/images/010/301/588/10301588/990xnoinc/labirint-karmina-24-beton.jpg",
            thumbnail_url: "https://labirintdoors.ru/images/010/301/588/10301588/990xnoinc/labirint-karmina-24-beton.jpg",
            is_active: true,
            is_featured: false,
            author: "Технический специалист",
            created_at: "2024-06-13T15:30:00Z",
            updated_at: "2024-06-13T15:30:00Z",
            views_count: 142,
            likes_count: 8
        },
        {
            id: 3,
            title: "Как выбрать входную дверь для квартиры",
            content: "Полное руководство по выбору входной двери...",
            excerpt: "Гид покупателя",
            image_url: "https://labirintdoors.ru/images/010/302/105/10302105/990xnoinc/labirint-karmina-22-white.jpg",
            thumbnail_url: "https://labirintdoors.ru/images/010/302/105/10302105/990xnoinc/labirint-karmina-22-white.jpg",
            is_active: false,
            is_featured: false,
            author: "Менеджер",
            created_at: "2024-06-12T10:15:00Z",
            updated_at: "2024-06-12T10:15:00Z",
            views_count: 89,
            likes_count: 5
        },
        {
            id: 4,
            title: "Установка и обслуживание дверей",
            content: "Профессиональные советы по установке...",
            excerpt: "Инструкция по установке",
            is_active: true,
            is_featured: true,
            author: "Мастер-установщик",
            created_at: "2024-06-11T12:00:00Z",
            updated_at: "2024-06-11T12:00:00Z",
            views_count: 178,
            likes_count: 12
        },
        {
            id: 5,
            title: "Тренды в дизайне входных дверей",
            content: "Актуальные тенденции в дизайне...",
            excerpt: "Модные решения для дома",
            image_url: "https://labirintdoors.ru/images/010/302/141/10302141/990xnoinc/labirint-karmina-18-sandal.jpg",
            thumbnail_url: "https://labirintdoors.ru/images/010/302/141/10302141/990xnoinc/labirint-karmina-18-sandal.jpg",
            is_active: true,
            is_featured: false,
            author: "Дизайнер",
            created_at: "2024-06-10T14:45:00Z",
            updated_at: "2024-06-10T14:45:00Z",
            views_count: 203,
            likes_count: 25
        },
        {
            id: 6,
            title: "Безопасность и защита дома",
            content: "Как обеспечить максимальную безопасность...",
            excerpt: "Защита вашего дома",
            is_active: true,
            is_featured: false,
            author: "Эксперт по безопасности",
            created_at: "2024-06-09T09:30:00Z",
            updated_at: "2024-06-09T09:30:00Z",
            views_count: 134,
            likes_count: 9
        }
    ];

    const mockStats: PostStats = {
        total_posts: mockPosts.length,
        active_posts: mockPosts.filter(p => p.is_active).length,
        featured_posts: mockPosts.filter(p => p.is_featured).length,
        draft_posts: mockPosts.filter(p => !p.is_active).length
    };

    // Загрузка данных
    const loadPosts = useCallback(async () => {
        try {
            setLoading(true);
            // В реальном приложении здесь будет API вызов
            await new Promise(resolve => setTimeout(resolve, 500));
            setPosts(mockPosts);
            setStats(mockStats);
        } catch (error) {
            console.error('Error loading posts:', error);
            showToast('error', 'Ошибка загрузки постов');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    // Управление постами
    const togglePostStatus = async (post: Post) => {
        try {
            // В реальном приложении здесь будет API вызов
            const updatedPost = { ...post, is_active: !post.is_active };
            setPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p));
            showToast('success', `Пост ${updatedPost.is_active ? 'активирован' : 'деактивирован'}`);
        } catch (error) {
            console.error('Error toggling post status:', error);
            showToast('error', 'Ошибка изменения статуса');
        }
    };

    const toggleFeatured = async (post: Post) => {
        try {
            const updatedPost = { ...post, is_featured: !post.is_featured };
            setPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p));
            showToast('success', `Пост ${updatedPost.is_featured ? 'добавлен в избранное' : 'убран из избранного'}`);
        } catch (error) {
            console.error('Error toggling featured status:', error);
            showToast('error', 'Ошибка изменения статуса избранного');
        }
    };

    const deletePost = async (post: Post) => {
        if (!isSuperuser) {
            showToast('error', 'Недостаточно прав для удаления');
            return;
        }

        if (!confirm(`Удалить пост "${post.title}"?`)) return;

        try {
            setPosts(prev => prev.filter(p => p.id !== post.id));
            showToast('success', 'Пост удален');
        } catch (error) {
            console.error('Error deleting post:', error);
            showToast('error', 'Ошибка удаления поста');
        }
    };

    const startEditing = (post: Post) => {
        setEditingPost({
            post,
            title: post.title,
            content: post.content,
            excerpt: post.excerpt || '',
            is_featured: post.is_featured,
            is_active: post.is_active
        });
    };

    const saveEditing = async () => {
        if (!editingPost) return;

        try {
            const updatedPost: Post = {
                ...editingPost.post,
                title: editingPost.title,
                content: editingPost.content,
                excerpt: editingPost.excerpt,
                is_featured: editingPost.is_featured,
                is_active: editingPost.is_active,
                updated_at: new Date().toISOString()
            };

            setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
            setEditingPost(null);
            showToast('success', 'Пост обновлен');
        } catch (error) {
            console.error('Error updating post:', error);
            showToast('error', 'Ошибка обновления поста');
        }
    };

    const createPost = async () => {
        if (!createForm.title.trim() || !createForm.content.trim()) {
            showToast('error', 'Заполните обязательные поля');
            return;
        }

        try {
            const newPost: Post = {
                id: Math.max(...posts.map(p => p.id)) + 1,
                title: createForm.title,
                content: createForm.content,
                excerpt: createForm.excerpt,
                is_active: createForm.is_active,
                is_featured: createForm.is_featured,
                author: user?.username || 'Пользователь',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                views_count: 0,
                likes_count: 0
            };

            setPosts(prev => [newPost, ...prev]);
            setShowCreateModal(false);
            setCreateForm({
                title: '',
                content: '',
                excerpt: '',
                is_featured: false,
                is_active: true,
                image: undefined
            });
            showToast('success', 'Пост создан');
        } catch (error) {
            console.error('Error creating post:', error);
            showToast('error', 'Ошибка создания поста');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // const truncateText = (text: string, length: number) => {
    //     return text.length > length ? text.substring(0, length) + '...' : text;
    // };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
                                <FileText className="h-6 w-6" />
                                Посты и статьи
                            </h1>
                            {stats && (
                                <div className="text-gray-500 text-sm">
                                    {stats.total_posts} постов • {stats.active_posts} активных • {stats.featured_posts} избранных
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Переключатель вида */}
                            <div className="flex border border-gray-300 rounded-lg">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1 text-sm font-medium rounded-l-lg transition-colors ${viewMode === 'grid'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Сетка
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1 text-sm font-medium rounded-r-lg transition-colors ${viewMode === 'list'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Список
                                </button>
                            </div>

                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Создать пост
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Сетка постов */}
                {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                onMouseEnter={() => setHoveredPost(post.id)}
                                onMouseLeave={() => setHoveredPost(null)}
                            >
                                {/* Изображение или заглушка */}
                                <div className="aspect-[4/3] relative bg-gray-100">
                                    {post.image_url ? (
                                        <img
                                            src={post.image_url}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FileText className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}

                                    {/* Статусы */}
                                    <div className="absolute top-2 left-2 flex gap-1">
                                        {post.is_featured && (
                                            <div className="bg-yellow-500 rounded-full p-1">
                                                <Star className="h-3 w-3 text-white fill-white" />
                                            </div>
                                        )}
                                        {!post.is_active && (
                                            <div className="bg-red-500 rounded-full p-1">
                                                <EyeOff className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Оверлей при наведении */}
                                    {hoveredPost === post.id && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        togglePostStatus(post);
                                                    }}
                                                    className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                                                    title={post.is_active ? 'Деактивировать' : 'Активировать'}
                                                >
                                                    {post.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFeatured(post);
                                                    }}
                                                    className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                                                    title={post.is_featured ? 'Убрать из избранного' : 'Добавить в избранное'}
                                                >
                                                    <Star className={`h-4 w-4 ${post.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEditing(post);
                                                    }}
                                                    className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                                                    title="Редактировать"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>

                                                {isSuperuser && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deletePost(post);
                                                        }}
                                                        className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-red-400 hover:bg-white/30"
                                                        title="Удалить"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Контент */}
                                <div className="p-3">
                                    <h3 className="text-gray-900 font-medium text-sm mb-1 line-clamp-2">
                                        {post.title}
                                    </h3>
                                    {post.excerpt && (
                                        <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                                            {post.excerpt}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {post.author}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(post.created_at)}
                                        </span>
                                    </div>
                                    {(post.views_count !== undefined || post.likes_count !== undefined) && (
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                            {post.views_count !== undefined && (
                                                <span className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    {post.views_count}
                                                </span>
                                            )}
                                            {post.likes_count !== undefined && (
                                                <span className="flex items-center gap-1">
                                                    <Star className="h-3 w-3" />
                                                    {post.likes_count}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Список постов */}
                {viewMode === 'list' && (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="flex gap-4">
                                    {/* Изображение */}
                                    {post.image_url && (
                                        <div className="flex-shrink-0">
                                            <img
                                                src={post.image_url}
                                                alt={post.title}
                                                className="w-24 h-24 object-cover rounded-lg"
                                            />
                                        </div>
                                    )}

                                    {/* Контент */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                                                {post.title}
                                            </h3>
                                            <div className="flex items-center gap-1 ml-4">
                                                {post.is_featured && (
                                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                )}
                                                {!post.is_active && (
                                                    <EyeOff className="h-4 w-4 text-red-500" />
                                                )}
                                            </div>
                                        </div>

                                        {post.excerpt && (
                                            <p className="text-gray-600 mb-3 line-clamp-2">
                                                {post.excerpt}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-4 w-4" />
                                                    {post.author}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {formatDate(post.created_at)}
                                                </span>
                                                {post.views_count !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-4 w-4" />
                                                        {post.views_count}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Кнопки управления */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => togglePostStatus(post)}
                                                    className="p-1 rounded text-gray-500 hover:text-gray-700"
                                                    title={post.is_active ? 'Деактивировать' : 'Активировать'}
                                                >
                                                    {post.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                </button>

                                                <button
                                                    onClick={() => toggleFeatured(post)}
                                                    className="p-1 rounded text-gray-500 hover:text-gray-700"
                                                    title={post.is_featured ? 'Убрать из избранного' : 'Добавить в избранное'}
                                                >
                                                    <Star className={`h-4 w-4 ${post.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                                                </button>

                                                <button
                                                    onClick={() => startEditing(post)}
                                                    className="p-1 rounded text-gray-500 hover:text-gray-700"
                                                    title="Редактировать"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>

                                                {isSuperuser && (
                                                    <button
                                                        onClick={() => deletePost(post)}
                                                        className="p-1 rounded text-red-500 hover:text-red-700"
                                                        title="Удалить"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Пустое состояние */}
                {posts.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <FileText className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-gray-900 text-xl font-medium mb-2">
                            Пока нет постов
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Создайте первый пост, чтобы начать работу
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                        >
                            <Plus className="h-5 w-5" />
                            Создать первый пост
                        </button>
                    </div>
                )}
            </div>

            {/* Модальное окно создания поста */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-gray-900 text-lg font-medium">Создать новый пост</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Заголовок *
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.title}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Введите заголовок поста"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Краткое описание
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.excerpt}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, excerpt: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Краткое описание для превью"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Содержание *
                                    </label>
                                    <textarea
                                        value={createForm.content}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                                        rows={8}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Основной текст поста"
                                    />
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="create_is_featured"
                                            checked={createForm.is_featured}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                                            className="h-4 w-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="create_is_featured" className="ml-2 text-sm text-gray-700">
                                            Избранный пост
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="create_is_active"
                                            checked={createForm.is_active}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, is_active: e.target.checked }))}
                                            className="h-4 w-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="create_is_active" className="ml-2 text-sm text-gray-700">
                                            Опубликовать
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={createPost}
                                        disabled={!createForm.title.trim() || !createForm.content.trim()}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Создать пост
                                    </button>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
            {editingPost && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-gray-900 text-lg font-medium">Редактировать пост</h3>
                                <button
                                    onClick={() => setEditingPost(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Заголовок *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingPost.title}
                                        onChange={(e) => setEditingPost(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Краткое описание
                                    </label>
                                    <input
                                        type="text"
                                        value={editingPost.excerpt}
                                        onChange={(e) => setEditingPost(prev => prev ? ({ ...prev, excerpt: e.target.value }) : null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Содержание *
                                    </label>
                                    <textarea
                                        value={editingPost.content}
                                        onChange={(e) => setEditingPost(prev => prev ? ({ ...prev, content: e.target.value }) : null)}
                                        rows={8}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="edit_is_featured"
                                            checked={editingPost.is_featured}
                                            onChange={(e) => setEditingPost(prev => prev ? ({ ...prev, is_featured: e.target.checked }) : null)}
                                            className="h-4 w-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="edit_is_featured" className="ml-2 text-sm text-gray-700">
                                            Избранный пост
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="edit_is_active"
                                            checked={editingPost.is_active}
                                            onChange={(e) => setEditingPost(prev => prev ? ({ ...prev, is_active: e.target.checked }) : null)}
                                            className="h-4 w-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="edit_is_active" className="ml-2 text-sm text-gray-700">
                                            Опубликовать
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={saveEditing}
                                        disabled={!editingPost.title.trim() || !editingPost.content.trim()}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Сохранить
                                    </button>
                                    <button
                                        onClick={() => setEditingPost(null)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}