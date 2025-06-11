'use client';

import { useState } from 'react';
import { XCircle, RefreshCw } from 'lucide-react';
import { ProductEditModalProps, ProductUpdate } from '@/types/products';


export default function ProductEditModal({
    product,
    brands,
    categories,
    loading,
    onSave,
    onClose
}: ProductEditModalProps) {
    const [formData, setFormData] = useState({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        discount_price: product.discount_price?.toString() || '',
        brand_id: product.brand?.id?.toString() || '',
        is_active: product.is_active ?? true,
        in_stock: product.in_stock ?? true,
        category_ids: product.categories?.map(cat => cat.id) || [] as number[]
    });

    const handleCategoryToggle = (categoryId: number) => {
        setFormData(prev => ({
            ...prev,
            category_ids: prev.category_ids.includes(categoryId)
                ? prev.category_ids.filter(id => id !== categoryId)
                : [...prev.category_ids, categoryId]
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const updateData: ProductUpdate = {};

        // Только измененные поля
        if (formData.name !== product.name) updateData.name = formData.name;
        if (formData.description !== product.description) updateData.description = formData.description;
        if (formData.price && Number(formData.price) !== product.price) updateData.price = Number(formData.price);
        if (formData.discount_price && Number(formData.discount_price) !== product.discount_price) updateData.discount_price = Number(formData.discount_price);
        if (formData.brand_id && Number(formData.brand_id) !== product.brand?.id) updateData.brand_id = Number(formData.brand_id);
        if (formData.is_active !== product.is_active) updateData.is_active = formData.is_active;
        if (formData.in_stock !== product.in_stock) updateData.in_stock = formData.in_stock;

        // Категории - проверяем изменения
        const currentCategoryIds = product.categories?.map(cat => cat.id) || [];
        if (JSON.stringify(formData.category_ids.sort()) !== JSON.stringify(currentCategoryIds.sort())) {
            updateData.category_ids = formData.category_ids;
        }

        onSave(updateData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Редактирование товара
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XCircle className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Основная информация */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Название товара *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Описание
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Цены */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Цена (₽) *
                            </label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                min="0"
                                step="0.01"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Цена со скидкой (₽)
                            </label>
                            <input
                                type="number"
                                value={formData.discount_price}
                                onChange={(e) => setFormData(prev => ({ ...prev, discount_price: e.target.value }))}
                                min="0"
                                step="0.01"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Бренд и статусы */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Бренд
                            </label>
                            <select
                                value={formData.brand_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, brand_id: e.target.value }))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Выберите бренд</option>
                                {brands.map(brand => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Статус
                            </label>
                            <select
                                value={formData.is_active.toString()}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="true">Активен</option>
                                <option value="false">Неактивен</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Наличие
                            </label>
                            <select
                                value={formData.in_stock.toString()}
                                onChange={(e) => setFormData(prev => ({ ...prev, in_stock: e.target.value === 'true' }))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="true">В наличии</option>
                                <option value="false">Нет в наличии</option>
                            </select>
                        </div>
                    </div>

                    {/* Категории */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Категории
                        </label>
                        <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                            {categories.length === 0 ? (
                                <div className="text-gray-500 text-center py-4">
                                    Категории не найдены
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {categories.map(category => (
                                        <label key={category.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                            <input
                                                type="checkbox"
                                                checked={formData.category_ids.includes(category.id)}
                                                onChange={() => handleCategoryToggle(category.id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="text-sm text-gray-700">{category.name}</span>
                                            {category.description && (
                                                <span className="text-xs text-gray-500 ml-1">- {category.description}</span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        {formData.category_ids.length > 0 && (
                            <div className="mt-2 text-sm text-blue-600">
                                Выбрано категорий: {formData.category_ids.length}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                            {loading ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}