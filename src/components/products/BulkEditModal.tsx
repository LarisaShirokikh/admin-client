// src/components/products/BulkEditModal.tsx

'use client';

import { RefreshCw, XCircle } from 'lucide-react';
import { BulkEditData, BulkEditField } from '@/types/products';
import { Brand } from '@/types/admin';
import { Category } from '@/types/categories';

interface BulkEditModalProps {
    selectedCount: number;
    data: BulkEditData;
    brands: Brand[];
    categories: Category[];
    loadingBrands: boolean;
    loading: boolean;
    onChange: (field: BulkEditField, value: string | number[]) => void;
    onCategoryToggle: (categoryId: number) => void;
    onSave: () => void;
    onClose: () => void;
}

export default function BulkEditModal({
    selectedCount,
    data,
    brands,
    categories,
    loadingBrands,
    loading,
    onChange,
    onCategoryToggle,
    onSave,
    onClose,
}: BulkEditModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-lg font-semibold">
                        Массовое редактирование ({selectedCount})
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircle className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    <p className="text-xs text-gray-500">
                        Заполните только поля, которые хотите изменить. Пустые поля останутся без изменений.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Цена (₽)</label>
                            <input type="number" value={data.price} placeholder="Не изменять"
                                onChange={e => onChange('price', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Цена со скидкой (₽)</label>
                            <input type="number" value={data.discount_price} placeholder="Не изменять"
                                onChange={e => onChange('discount_price', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Статус</label>
                            <select value={data.is_active}
                                onChange={e => onChange('is_active', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                <option value="">Не изменять</option>
                                <option value="true">Активен</option>
                                <option value="false">Неактивен</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Наличие</label>
                            <select value={data.in_stock}
                                onChange={e => onChange('in_stock', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                <option value="">Не изменять</option>
                                <option value="true">В наличии</option>
                                <option value="false">Нет в наличии</option>
                            </select>
                        </div>
                    </div>

                    {/* Brand */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Бренд</label>
                        <select value={data.brand_id} disabled={loadingBrands}
                            onChange={e => onChange('brand_id', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                            <option value="">Не изменять</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>

                    {/* Categories */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Категории</label>
                        <div className="border border-gray-300 rounded-lg p-2 max-h-36 overflow-y-auto">
                            {categories.map(cat => (
                                <label key={cat.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                    <input type="checkbox" checked={data.category_ids.includes(cat.id)}
                                        onChange={() => onCategoryToggle(cat.id)}
                                        className="h-3.5 w-3.5 text-blue-600 border-gray-300 rounded" />
                                    <span className="text-sm text-gray-700">{cat.name}</span>
                                </label>
                            ))}
                        </div>
                        {data.category_ids.length > 0 && (
                            <div className="mt-1 text-xs text-blue-600">
                                Выбрано: {data.category_ids.length}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-5 border-t">
                    <button onClick={onClose} disabled={loading}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Отмена
                    </button>
                    <button onClick={onSave} disabled={loading}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                        {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                        {loading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
}