'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, FolderOpen, CheckCircle, XCircle, X, Save, AlertTriangle } from 'lucide-react';
import { Catalog, CatalogUpdate } from '@/types/catalogs';
import { catalogsApi } from '@/lib/api/catalogs';

// ============ Toast System ============
type ToastType = 'success' | 'error' | 'warning' | 'confirm';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`rounded-lg shadow-lg p-4 text-sm animate-in slide-in-from-right ${toast.type === 'success' ? 'bg-green-600 text-white' :
                        toast.type === 'error' ? 'bg-red-600 text-white' :
                            toast.type === 'warning' ? 'bg-yellow-500 text-white' :
                                'bg-white text-gray-900 border border-gray-200'
                        }`}
                >
                    {toast.type === 'confirm' ? (
                        <div>
                            <div className="flex items-start gap-2 mb-3">
                                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="font-medium">{toast.message}</span>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => { toast.onCancel?.(); removeToast(toast.id); }}
                                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={() => { toast.onConfirm?.(); removeToast(toast.id); }}
                                    className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <span>{toast.message}</span>
                            <button onClick={() => removeToast(toast.id)} className="ml-3 opacity-70 hover:opacity-100">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function useToasts() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string, opts?: { onConfirm?: () => void; onCancel?: () => void }) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, message, ...opts }]);
        if (type !== 'confirm') {
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
}

// ============ Edit Modal ============
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

    const updateMutation = useMutation({
        mutationFn: (data: CatalogUpdate) => catalogsApi.update(catalog!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogs'] });
            queryClient.invalidateQueries({ queryKey: ['catalogs-stats'] });
            onClose();
            setErrors([]);
        },
        onError: () => setErrors(['Ошибка при обновлении каталога']),
    });

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
        const validation = catalogsApi.validateCatalog(formData);
        if (!validation.valid) { setErrors(validation.errors); return; }
        updateMutation.mutate(formData);
    };

    const handleInputChange = (field: keyof CatalogUpdate, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors.length > 0) setErrors([]);
    };

    if (!isOpen || !catalog) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Редактировать каталог</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    {errors.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <ul className="text-sm text-red-600">{errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>
                        </div>
                    )}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Название <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                        <textarea value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>
                    <div className="mb-6">
                        <label className="flex items-center">
                            <input type="checkbox" checked={formData.is_active} onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            <span className="ml-2 text-sm text-gray-700">Активный каталог</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Отмена</button>
                        <button type="submit" disabled={updateMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
                            {updateMutation.isPending ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                            {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============ Main Page ============
export default function CatalogsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCatalogs, setSelectedCatalogs] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const queryClient = useQueryClient();
    const { toasts, addToast, removeToast } = useToasts();

    const { data: catalogs = [], isLoading, error } = useQuery({
        queryKey: ['catalogs'],
        queryFn: () => catalogsApi.getAll(),
    });

    const { data: stats } = useQuery({
        queryKey: ['catalogs-stats'],
        queryFn: () => catalogsApi.getStats(),
    });

    const toggleStatusMutation = useMutation({
        mutationFn: (id: number) => catalogsApi.toggleStatus(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogs'] });
            queryClient.invalidateQueries({ queryKey: ['catalogs-stats'] });
        },
    });

    const filteredCatalogs = catalogs.filter((catalog: Catalog) =>
        catalog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        catalog.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ---- Selection ----
    const handleSelectAll = (checked: boolean) => {
        setSelectAll(checked);
        setSelectedCatalogs(checked ? filteredCatalogs.map((c: Catalog) => c.id) : []);
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        setSelectedCatalogs(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
    };

    useEffect(() => {
        if (filteredCatalogs.length > 0 && selectedCatalogs.length === filteredCatalogs.length) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [selectedCatalogs, filteredCatalogs]);

    // ---- Refresh helper ----
    const refreshData = () => {
        queryClient.invalidateQueries({ queryKey: ['catalogs'] });
        queryClient.invalidateQueries({ queryKey: ['catalogs-stats'] });
        setSelectedCatalogs([]);
        setSelectAll(false);
    };

    // ---- Delete single ----
    const handleDeleteOne = (catalog: Catalog) => {
        addToast('confirm', `Удалить каталог "${catalog.name}" и все его товары?`, {
            onConfirm: async () => {
                try {
                    await catalogsApi.delete(catalog.id);
                    refreshData();
                    addToast('success', `Каталог "${catalog.name}" удалён`);
                } catch {
                    addToast('error', 'Ошибка при удалении каталога');
                }
            },
        });
    };

    // ---- Delete selected ----
    const handleBatchDelete = () => {
        if (selectedCatalogs.length === 0) return;
        addToast('confirm', `Удалить ${selectedCatalogs.length} каталогов и все их товары?`, {
            onConfirm: async () => {
                try {
                    const result = await catalogsApi.batchDelete(selectedCatalogs);
                    refreshData();
                    addToast('success', `Удалено ${result.deleted} каталогов`);
                } catch {
                    addToast('error', 'Ошибка при удалении');
                }
            },
        });
    };

    // ---- Delete all ----
    const handleDeleteAll = () => {
        addToast('confirm', '⚠️ Удалить ВСЕ каталоги и ВСЕ товары? Это необратимо!', {
            onConfirm: () => {
                // Двойное подтверждение
                addToast('confirm', 'Вы уверены? Будут удалены ВСЕ каталоги и продукты без возможности восстановления.', {
                    onConfirm: async () => {
                        try {
                            const result = await catalogsApi.deleteAll();
                            refreshData();
                            addToast('success', `Удалено ${result.deleted} каталогов`);
                        } catch {
                            addToast('error', 'Ошибка при удалении');
                        }
                    },
                });
            },
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center py-8"><div className="text-red-600">Ошибка загрузки данных</div></div>;
    }

    return (
        <div>
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Каталоги</h1>
                    <p className="mt-1 text-sm text-gray-600">Управление каталогами товаров</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleDeleteAll}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                        <Trash2 className="h-4 w-4" /> Удалить всё
                    </button>
                    <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                        <Plus className="h-4 w-4" /> Добавить каталог
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" placeholder="Поиск каталогов..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
            </div>

            {/* Selection Bar */}
            {selectedCatalogs.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 flex items-center justify-between">
                    <span className="text-sm text-blue-800 font-medium">Выбрано: {selectedCatalogs.length}</span>
                    <div className="flex gap-2">
                        <button onClick={handleBatchDelete}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 flex items-center gap-1">
                            <Trash2 className="h-3 w-3" /> Удалить выбранные
                        </button>
                        <button onClick={() => { setSelectedCatalogs([]); setSelectAll(false); }}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300">
                            Отменить
                        </button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Всего каталогов</div>
                    <div className="text-2xl font-bold text-gray-900">{stats?.total_catalogs || catalogs.length}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Активные</div>
                    <div className="text-2xl font-bold text-green-600">{stats?.active_catalogs || 0}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Неактивные</div>
                    <div className="text-2xl font-bold text-red-600">{stats?.inactive_catalogs || 0}</div>
                </div>
            </div>

            {/* Catalogs Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 w-10">
                                    <input type="checkbox" checked={selectAll}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Создан</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCatalogs.map((catalog: Catalog) => (
                                <tr key={catalog.id} className={`hover:bg-gray-50 ${selectedCatalogs.includes(catalog.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="px-4 py-4">
                                        <input type="checkbox" checked={selectedCatalogs.includes(catalog.id)}
                                            onChange={(e) => handleSelectOne(catalog.id, e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <FolderOpen className="h-4 w-4 text-indigo-600" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{catalog.name}</div>
                                                <div className="text-sm text-gray-500">{catalog.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate">{catalog.description || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${catalog.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {catalog.is_active ? <><CheckCircle className="h-3 w-3 mr-1" />Активен</> : <><XCircle className="h-3 w-3 mr-1" />Неактивен</>}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(catalog.created_at).toLocaleDateString('ru-RU')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleToggleStatus(catalog.id)}
                                                className={`p-1 rounded ${catalog.is_active ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}
                                                title={catalog.is_active ? 'Деактивировать' : 'Активировать'}
                                                disabled={toggleStatusMutation.isPending}>
                                                {catalog.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                                            </button>
                                            <button onClick={() => handleEditCatalog(catalog)}
                                                className="p-1 text-indigo-600 hover:text-indigo-800" title="Редактировать">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDeleteOne(catalog)}
                                                className="p-1 text-red-500 hover:text-red-700" title="Удалить">
                                                <Trash2 className="h-4 w-4" />
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
                        <div className="text-gray-500">{searchTerm ? 'Каталоги не найдены' : 'Нет каталогов'}</div>
                    </div>
                )}
            </div>

            <EditCatalogModal catalog={editingCatalog} isOpen={isEditModalOpen} onClose={handleCloseEditModal} />
        </div>
    );

    function handleToggleStatus(id: number) { toggleStatusMutation.mutate(id); }
    function handleEditCatalog(catalog: Catalog) { setEditingCatalog(catalog); setIsEditModalOpen(true); }
    function handleCloseEditModal() { setIsEditModalOpen(false); setEditingCatalog(null); }
}