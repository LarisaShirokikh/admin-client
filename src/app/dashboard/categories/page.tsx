'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { Search, Edit, ToggleLeft, ToggleRight, Image as ImageIcon } from 'lucide-react';
import { categoriesApi } from '@/lib/api/categories';
import { Category } from '@/types/categories';
import { useToast } from '@/lib/contexts/ToastContext';
import CreateCategoryModal from '@/components/categories/CreateCategoryModal';
import EditCategoryModal from '@/components/categories/EditCategoryModal';


export default function CategoriesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const { showToast } = useToast();


    // Получение списка категорий
    const { data: categories = [], isLoading, error } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesApi.getAll(),
    });

    const handleEditCategory = (category: Category) => {
        setSelectedCategory(category);
        setIsEditModalOpen(true);
    };


    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedCategory(null);
    };

    const toggleStatusMutation = useMutation({
        mutationFn: (id: number) => categoriesApi.toggleStatus(id),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            showToast('success', response.message);
        },
        onError: (error: unknown) => {
            console.error('Error toggling category status:', error);

            let errorMessage = 'Ошибка при изменении статуса категории';

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as {
                    response?: {
                        data?: { detail?: string };
                        status?: number;
                    };
                };
                if (axiosError.response?.data?.detail) {
                    errorMessage = axiosError.response.data.detail;
                } else if (axiosError.response?.status) {
                    errorMessage = `Ошибка сервера: ${axiosError.response.status}`;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            showToast('error', errorMessage);
        }
    });

    // Фильтрация категорий по поиску
    const filteredCategories = categories.filter((category: Category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleStatus = (id: number) => {
        toggleStatusMutation.mutate(id);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <div className="text-red-600">Ошибка загрузки данных</div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Управление категориями товаров
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Поиск категорий..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Всего категорий</div>
                    <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Активные</div>
                    <div className="text-2xl font-bold text-green-600">
                        {categories.filter(c => c.is_active).length}
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Неактивные</div>
                    <div className="text-2xl font-bold text-red-600">
                        {categories.filter(c => !c.is_active).length}
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Общее количество товаров</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {categories.reduce((sum, c) => sum + c.product_count, 0)}
                    </div>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map((category) => (
                    <div key={category.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        {/* Image */}
                        <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                            {category.image_url ? (
                                <Image
                                    src={category.image_url}
                                    alt={category.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                    <ImageIcon className="h-12 w-12 mb-2" />
                                    <span className="text-sm">Нет изображения</span>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-medium text-gray-900 flex-1">
                                    {category.name}
                                </h3>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${category.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {category.is_active ? 'Активна' : 'Неактивна'}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {category.description || 'Описание не указано'}
                            </p>

                            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                                <span>Товаров: {category.product_count}</span>
                                <span>{new Date(category.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-400">
                                    slug: {category.slug}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleStatus(category.id)}
                                        className={`p-1 rounded ${category.is_active
                                            ? 'text-green-600 hover:text-green-800'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                        title={category.is_active ? 'Деактивировать' : 'Активировать'}
                                    >
                                        {category.is_active ? (
                                            <ToggleRight className="h-5 w-5" />
                                        ) : (
                                            <ToggleLeft className="h-5 w-5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleEditCategory(category)}
                                        className="p-1 text-indigo-600 hover:text-indigo-800"
                                        title="Редактировать"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCategories.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-500">
                        {searchTerm ? 'Категории не найдены' : 'Нет категорий'}
                    </div>
                    {!searchTerm && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                            Создать первую категорию
                        </button>
                    )}
                </div>
            )}
            <CreateCategoryModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <EditCategoryModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                category={selectedCategory}
            />
        </div>
    );
}