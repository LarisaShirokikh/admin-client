'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Brand, BrandCreate } from '@/types/admin';
import { Plus, Search, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import BrandForm from '@/components/forms/BrandForm';
import { brandsApi } from '@/lib/api/brands';

export default function BrandsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

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
    });

    // Мутация для переключения статуса
    const toggleStatusMutation = useMutation({
        mutationFn: (id: number) => brandsApi.toggleStatus(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
        },
    });

    // Фильтрация брендов по поиску
    const filteredBrands = brands.filter((brand: Brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateBrand = (data: BrandCreate) => {
        createBrandMutation.mutate(data);
    };

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
                    <h1 className="text-2xl font-bold text-gray-900">Бренды</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Управление брендами товаров
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Добавить бренд
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Поиск брендов..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
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
                                <tr key={brand.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {brand.name}
                                        </div>
                                        <div className="text-sm text-gray-500">{brand.slug}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-500 max-w-xs truncate">
                                            {brand.description || '-'}
                                        </div>
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
                                        {new Date(brand.created_at).toLocaleDateString('ru-RU')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(brand.id)}
                                                className={`p-1 rounded ${brand.is_active
                                                    ? 'text-green-600 hover:text-green-800'
                                                    : 'text-gray-400 hover:text-gray-600'
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
                                                className="p-1 text-indigo-600 hover:text-indigo-800"
                                                title="Редактировать"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredBrands.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Бренды не найдены' : 'Нет брендов'}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <BrandForm
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateBrand}
            />
        </div>
    );
}