// src/components/products/ProductsFilters.tsx

'use client';

import { useState } from 'react';
import { Search, Filter, XCircle } from 'lucide-react';
import { ProductFilters, ReferenceData } from '@/types/products';
import { FilterTag } from '@/app/helpers/products';

interface ProductsFiltersProps {
    searchInput: string;
    filters: ProductFilters;
    totalItems: number;
    referenceData: ReferenceData;
    onSearchChange: (value: string) => void;
    onClearSearch: () => void;
    onFilterChange: (filters: ProductFilters) => void;
}

export default function ProductsFiltersPanel({
    searchInput,
    filters,
    totalItems,
    referenceData,
    onSearchChange,
    onClearSearch,
    onFilterChange,
}: ProductsFiltersProps) {
    const [showFilters, setShowFilters] = useState(true);
    const { brands, categories, catalogs, loadingBrands, loadingCategories, loadingCatalogs } = referenceData;

    const resetFilters = () => {
        onFilterChange({
            brand_id: undefined,
            catalog_id: undefined,
            category_id: undefined,
            is_active: true,
            in_stock: undefined,
            price_from: undefined,
            price_to: undefined,
        });
        onClearSearch();
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            {/* Search bar */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Поиск по названию, описанию, SKU, бренду..."
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchInput && (
                        <button onClick={onClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <XCircle className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                    <Filter className="h-4 w-4" /> Фильтры
                </button>
            </div>

            {/* Expanded filters */}
            {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Catalog */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Каталог</label>
                            <select
                                value={filters.catalog_id || ''}
                                disabled={loadingCatalogs}
                                onChange={e => onFilterChange({ ...filters, catalog_id: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="">Все каталоги</option>
                                {catalogs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        {/* Brand */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Бренд</label>
                            <select
                                value={filters.brand_id || ''}
                                disabled={loadingBrands}
                                onChange={e => onFilterChange({ ...filters, brand_id: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="">Все бренды</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        {/* Category */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Категория</label>
                            <select
                                value={filters.category_id || ''}
                                disabled={loadingCategories}
                                onChange={e => onFilterChange({ ...filters, category_id: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="">Все категории</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        {/* Status */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Статус</label>
                            <select
                                value={filters.is_active === undefined ? '' : String(filters.is_active)}
                                onChange={e => onFilterChange({ ...filters, is_active: e.target.value === '' ? undefined : e.target.value === 'true' })}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="">Все</option>
                                <option value="true">Активные</option>
                                <option value="false">Неактивные</option>
                            </select>
                        </div>
                        {/* In stock */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Наличие</label>
                            <select
                                value={filters.in_stock === undefined ? '' : String(filters.in_stock)}
                                onChange={e => onFilterChange({ ...filters, in_stock: e.target.value === '' ? undefined : e.target.value === 'true' })}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="">Все</option>
                                <option value="true">В наличии</option>
                                <option value="false">Нет в наличии</option>
                            </select>
                        </div>
                        {/* Price from */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Цена от</label>
                            <input
                                type="number"
                                value={filters.price_from || ''}
                                placeholder="0"
                                onChange={e => onFilterChange({ ...filters, price_from: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                        {/* Price to */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Цена до</label>
                            <input
                                type="number"
                                value={filters.price_to || ''}
                                placeholder="∞"
                                onChange={e => onFilterChange({ ...filters, price_to: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    {/* Active filter tags */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {filters.catalog_id && (
                            <FilterTag
                                label={`Каталог: ${catalogs.find(c => c.id === filters.catalog_id)?.name}`}
                                onRemove={() => onFilterChange({ ...filters, catalog_id: undefined })}
                            />
                        )}
                        {filters.brand_id && (
                            <FilterTag
                                label={`Бренд: ${brands.find(b => b.id === filters.brand_id)?.name}`}
                                onRemove={() => onFilterChange({ ...filters, brand_id: undefined })}
                            />
                        )}
                        {filters.category_id && (
                            <FilterTag
                                label={`Категория: ${categories.find(c => c.id === filters.category_id)?.name}`}
                                onRemove={() => onFilterChange({ ...filters, category_id: undefined })}
                            />
                        )}
                        {filters.is_active !== undefined && (
                            <FilterTag
                                label={filters.is_active ? 'Активные' : 'Неактивные'}
                                onRemove={() => onFilterChange({ ...filters, is_active: undefined })}
                            />
                        )}
                        {filters.in_stock !== undefined && (
                            <FilterTag
                                label={filters.in_stock ? 'В наличии' : 'Нет в наличии'}
                                onRemove={() => onFilterChange({ ...filters, in_stock: undefined })}
                            />
                        )}
                        {(filters.price_from || filters.price_to) && (
                            <FilterTag
                                label={`Цена: ${filters.price_from || 0} — ${filters.price_to || '∞'}`}
                                onRemove={() => onFilterChange({ ...filters, price_from: undefined, price_to: undefined })}
                            />
                        )}

                        <div className="ml-auto flex items-center gap-3">
                            <button onClick={resetFilters} className="text-xs text-gray-500 hover:text-gray-700">
                                Сбросить фильтры
                            </button>
                            <span className="text-xs text-gray-500">
                                Найдено: <span className="font-medium">{totalItems}</span>
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}