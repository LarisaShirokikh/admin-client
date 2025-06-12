'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Brand, BrandCreate, BrandUpdate } from '@/types/admin';
import { Plus, Search, Edit, ToggleLeft, ToggleRight, Trash2, Download } from 'lucide-react';
import BrandForm from '@/components/forms/BrandForm';
import { brandsApi } from '@/lib/api/brands';

export default function BrandsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const queryClient = useQueryClient();

    // Получение списка брендов
    const { data: brands = [], isLoading, error } = useQuery({
        queryKey: ['brands'],
        queryFn: () => brandsApi.getAll(),
    });

    // Мутация для создания бренда
    const createBrandMutation = useMutation({
        mutationFn: (data: BrandCreate) => brandsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            setShowCreateModal(false);
        },
        onError: (error) => {
            console.error('Ошибка создания бренда:', error);
        }
    });

    // Мутация для обновления бренда
    const updateBrandMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: BrandUpdate }) =>
            brandsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            setShowEditModal(false);
            setEditingBrand(null);
        },
        onError: (error) => {
            console.error('Ошибка обновления бренда:', error);
        }
    });

    // Мутация для переключения статуса
    const toggleStatusMutation = useMutation({
        mutationFn: (id: number) => brandsApi.toggleStatus(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
        },
        onError: (error) => {
            console.error('Ошибка изменения статуса:', error);
        }
    });

    // Мутация для удаления бренда
    const deleteBrandMutation = useMutation({
        mutationFn: (id: number) => brandsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
        },
        onError: (error) => {
            console.error('Ошибка удаления бренда:', error);
        }
    });

    // Мутация для экспорта
    const exportMutation = useMutation({
        mutationFn: () => brandsApi.exportToCSV(),
        onSuccess: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `brands-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        },
        onError: (error) => {
            console.error('Ошибка экспорта:', error);
        }
    });

    // Фильтрация брендов по поиску
    const filteredBrands = brands.filter((brand: Brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateSubmit = (data: BrandCreate | BrandUpdate) => {
        // В контексте создания это всегда BrandCreate
        createBrandMutation.mutate(data as BrandCreate);
    };

    const handleEditSubmit = (data: BrandCreate | BrandUpdate) => {
        if (editingBrand) {
            // В контексте редактирования это всегда BrandUpdate
            updateBrandMutation.mutate({ id: editingBrand.id, data: data as BrandUpdate });
        }
    };

    const handleEditBrand = (brand: Brand) => {
        setEditingBrand(brand);
        setShowEditModal(true);
    };

    const handleToggleStatus = (brand: Brand) => {
        if (window.confirm(
            `Вы уверены, что хотите ${brand.is_active ? 'деактивировать' : 'активировать'} бренд "${brand.name}"?`
        )) {
            toggleStatusMutation.mutate(brand.id);
        }
    };

    const handleDeleteBrand = (brand: Brand) => {
        if (window.confirm(
            `Вы уверены, что хотите удалить бренд "${brand.name}"? Это действие нельзя отменить.`
        )) {
            deleteBrandMutation.mutate(brand.id);
        }
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingBrand(null);
    };

    const handleExport = () => {
        exportMutation.mutate();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Загрузка брендов...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <div className="text-red-600 text-lg font-semibold">Ошибка загрузки данных</div>
                <p className="text-sm text-gray-500 mt-2">
                    {error instanceof Error ? error.message : 'Неизвестная ошибка'}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Бренды</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Управление брендами товаров ({brands.length} {brands.length === 1 ? 'бренд' : 'брендов'})
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        disabled={exportMutation.isPending || brands.length === 0}
                        className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        title="Экспорт в CSV"
                    >
                        <Download className="h-4 w-4" />
                        {exportMutation.isPending ? 'Экспорт...' : 'Экспорт'}
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        disabled={createBrandMutation.isPending}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                        {createBrandMutation.isPending ? 'Создание...' : 'Добавить бренд'}
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Поиск по названию, описанию или slug..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                {searchTerm && (
                    <p className="mt-2 text-sm text-gray-500">
                        Найдено: {filteredBrands.length} из {brands.length}
                    </p>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Всего брендов</div>
                    <div className="text-2xl font-bold text-gray-900">{brands.length}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Активные</div>
                    <div className="text-2xl font-bold text-green-600">
                        {brands.filter((b: Brand) => b.is_active).length}
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Неактивные</div>
                    <div className="text-2xl font-bold text-red-600">
                        {brands.filter((b: Brand) => !b.is_active).length}
                    </div>
                </div>
            </div>

            {/* Brands Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Название
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Описание
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Сайт
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Статус
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Создан
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Действия
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBrands.map((brand: Brand) => (
                                <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {brand.logo_url && (
                                                <div className="flex-shrink-0 h-8 w-8 mr-3">
                                                    <img
                                                        className="h-8 w-8 rounded object-cover border"
                                                        src={brand.logo_url}
                                                        alt={brand.name}
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {brand.name}
                                                </div>
                                                <div className="text-sm text-gray-500">{brand.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-500 max-w-xs truncate">
                                            {brand.description || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {brand.website ? (
                                            <a
                                                href={brand.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-indigo-600 hover:text-indigo-800 truncate max-w-xs block"
                                            >
                                                {brand.website}
                                            </a>
                                        ) : (
                                            <span className="text-sm text-gray-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${brand.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {brand.is_active ? 'Активен' : 'Неактивен'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(brand.created_at).toLocaleDateString('ru-RU', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(brand)}
                                                className={`p-1 rounded transition-colors ${brand.is_active
                                                    ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                title={brand.is_active ? 'Деактивировать' : 'Активировать'}
                                                disabled={toggleStatusMutation.isPending}
                                            >
                                                {brand.is_active ? (
                                                    <ToggleRight className="h-5 w-5" />
                                                ) : (
                                                    <ToggleLeft className="h-5 w-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleEditBrand(brand)}
                                                className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                                                title="Редактировать"
                                                disabled={updateBrandMutation.isPending}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBrand(brand)}
                                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                                title="Удалить"
                                                disabled={deleteBrandMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredBrands.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        {searchTerm ? (
                            <div>
                                <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium mb-2">Бренды не найдены</h3>
                                <p className="text-sm">Попробуйте изменить поисковый запрос</p>
                            </div>
                        ) : (
                            <div>
                                <Plus className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium mb-2">Нет брендов</h3>
                                <p className="text-sm mb-4">Создайте первый бренд для начала работы</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    Добавить бренд
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <BrandForm
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateSubmit}
                isLoading={createBrandMutation.isPending}
                title="Создать бренд"
                mode="create"
            />

            <BrandForm
                isOpen={showEditModal}
                onClose={handleCloseEditModal}
                onSubmit={handleEditSubmit}
                initialData={editingBrand}
                isLoading={updateBrandMutation.isPending}
                title="Редактировать бренд"
                mode="edit"
            />
        </div>
    );
}