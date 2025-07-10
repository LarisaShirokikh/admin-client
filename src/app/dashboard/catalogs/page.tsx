'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, ToggleLeft, ToggleRight, FolderOpen, CheckCircle, XCircle, X, Save } from 'lucide-react';
import { Catalog, CatalogUpdate } from '@/types/catalogs';
import { catalogsApi } from '@/lib/api/catalogs';

// Компонент модального окна редактирования
function EditCatalogModal({
    catalog,
    isOpen,
    onClose
}: {
    catalog: Catalog | null;
    isOpen: boolean;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState<CatalogUpdate>({
        name: catalog?.name || '',
        description: catalog?.description || '',
        is_active: catalog?.is_active || false,
    });
    const [errors, setErrors] = useState<string[]>([]);
    const queryClient = useQueryClient();

    // Мутация для обновления каталога
    const updateMutation = useMutation({
        mutationFn: (data: CatalogUpdate) => catalogsApi.update(catalog!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogs'] });
            queryClient.invalidateQueries({ queryKey: ['catalogs-stats'] });
            onClose();
            setErrors([]);
        },
        onError: (error: Error) => {
            console.error('Ошибка обновления:', error);
            setErrors(['Ошибка при обновлении каталога']);
        },
    });

    // Обновляем форму при изменении каталога
    useEffect(() => {
        if (catalog) {
            setFormData({
                name: catalog.name,
                description: catalog.description || '',
                is_active: catalog.is_active,
            });
        }
    }, [catalog]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Валидация
        const validation = catalogsApi.validateCatalog(formData);
        if (!validation.valid) {
            setErrors(validation.errors);
            return;
        }

        updateMutation.mutate(formData);
    };

    const handleInputChange = (field: keyof CatalogUpdate, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Очищаем ошибки при изменении формы
        if (errors.length > 0) {
            setErrors([]);
        }
    };

    if (!isOpen || !catalog) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Редактировать каталог
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Ошибки */}
                    {errors.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <ul className="text-sm text-red-600">
                                {errors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Название */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Название <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Введите название каталога"
                            required
                        />
                    </div>

                    {/* Описание */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Описание
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            placeholder="Введите описание каталога"
                        />
                    </div>

                    {/* Статус */}
                    <div className="mb-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Активный каталог</span>
                        </label>
                    </div>

                    {/* Кнопки */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {updateMutation.isPending ? (
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CatalogsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const queryClient = useQueryClient();

    // Получение списка каталогов
    const { data: catalogs = [], isLoading, error } = useQuery({
        queryKey: ['catalogs'],
        queryFn: () => catalogsApi.getAll(),
    });

    // Получение статистики
    const { data: stats } = useQuery({
        queryKey: ['catalogs-stats'],
        queryFn: () => catalogsApi.getStats(),
    });

    // Мутация для переключения статуса
    const toggleStatusMutation = useMutation({
        mutationFn: (id: number) => catalogsApi.toggleStatus(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogs'] });
            queryClient.invalidateQueries({ queryKey: ['catalogs-stats'] });
        },
    });

    // Фильтрация каталогов по поиску
    const filteredCatalogs = catalogs.filter((catalog: Catalog) =>
        catalog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        catalog.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleStatus = (id: number) => {
        toggleStatusMutation.mutate(id);
    };

    const handleEditCatalog = (catalog: Catalog) => {
        setEditingCatalog(catalog);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingCatalog(null);
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
                    <h1 className="text-2xl font-bold text-gray-900">Каталоги</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Управление каталогами товаров
                    </p>
                </div>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    <Plus className="h-4 w-4" />
                    Добавить каталог
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Поиск каталогов..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Всего каталогов</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {stats?.total_catalogs || catalogs.length}
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Активные</div>
                    <div className="text-2xl font-bold text-green-600">
                        {stats?.active_catalogs || catalogs.filter(c => c.is_active).length}
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Неактивные</div>
                    <div className="text-2xl font-bold text-red-600">
                        {stats?.inactive_catalogs || catalogs.filter(c => !c.is_active).length}
                    </div>
                </div>
            </div>

            {/* Catalogs Table */}
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
                            {filteredCatalogs.map((catalog: Catalog) => (
                                <tr key={catalog.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8">
                                                <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                    <FolderOpen className="h-4 w-4 text-indigo-600" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {catalog.name}
                                                </div>
                                                <div className="text-sm text-gray-500">{catalog.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate">
                                            {catalog.description || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${catalog.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {catalog.is_active ? (
                                                <>
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Активен
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                    Неактивен
                                                </>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(catalog.created_at).toLocaleDateString('ru-RU')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(catalog.id)}
                                                className={`p-1 rounded ${catalog.is_active
                                                    ? 'text-green-600 hover:text-green-800'
                                                    : 'text-gray-400 hover:text-gray-600'
                                                    }`}
                                                title={catalog.is_active ? 'Деактивировать' : 'Активировать'}
                                                disabled={toggleStatusMutation.isPending}
                                            >
                                                {catalog.is_active ? (
                                                    <ToggleRight className="h-5 w-5" />
                                                ) : (
                                                    <ToggleLeft className="h-5 w-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleEditCatalog(catalog)}
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

                {filteredCatalogs.length === 0 && (
                    <div className="text-center py-12">
                        <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <div className="text-gray-500">
                            {searchTerm ? 'Каталоги не найдены' : 'Нет каталогов'}
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Info */}
            {stats && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                        <div className="text-blue-800">
                            Последнее обновление: {new Date(stats.last_updated).toLocaleString('ru-RU')}
                        </div>
                        <div className="text-blue-600">
                            Запросил: {stats.requested_by} ({stats.user_role})
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <EditCatalogModal
                catalog={editingCatalog}
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
            />
        </div>
    );
}