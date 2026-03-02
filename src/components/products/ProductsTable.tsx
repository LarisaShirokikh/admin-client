// src/components/products/ProductsTable.tsx

'use client';

import {
    Eye, Edit, Trash2, CheckCircle, XCircle,
    ChevronLeft, ChevronRight, RefreshCw, Package,
} from 'lucide-react';
import { ProductListItem, SortConfig } from '@/types/products';
import { getImageUrl } from '@/lib/utils/image';
import { ActionBtn, formatDate, formatPrice, SortButton } from '@/app/helpers/products';

interface ProductsTableProps {
    products: ProductListItem[];
    loading: boolean;
    isSuperuser: boolean;
    // Selection
    selectedProducts: number[];
    selectAll: boolean;
    onSelectProduct: (id: number) => void;
    onSelectAll: () => void;
    // Sorting
    sortConfig: SortConfig;
    onSort: (field: string) => void;
    // Pagination
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    // Actions
    onEdit: (product: ProductListItem) => void;
    onToggleStatus: (product: ProductListItem) => void;
    onDelete: (product: ProductListItem) => void;
    onView: (product: ProductListItem) => void;
    // Selection bar actions
    onBulkEdit: () => void;
    onBatchDelete: () => void;
    onClearSelection: () => void;
}

export default function ProductsTable({
    products,
    loading,
    isSuperuser,
    selectedProducts,
    selectAll,
    onSelectProduct,
    onSelectAll,
    sortConfig,
    onSort,
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onEdit,
    onToggleStatus,
    onDelete,
    onView,
    onBulkEdit,
    onBatchDelete,
    onClearSelection,
}: ProductsTableProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-gray-400" />
                <span className="text-sm text-gray-500">Загрузка...</span>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Продукты не найдены</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Selection bar */}
            {selectedProducts.length > 0 && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
                    <span className="text-sm text-blue-800 font-medium">
                        Выбрано: {selectedProducts.length}
                    </span>
                    <div className="flex gap-2">
                        <button onClick={onBulkEdit}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                            Редактировать
                        </button>
                        {isSuperuser && (
                            <button onClick={onBatchDelete}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                                Удалить выбранные
                            </button>
                        )}
                        <button onClick={onClearSelection}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">
                            Отменить
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-3 py-2.5 text-left w-8">
                                <input type="checkbox" checked={selectAll} onChange={onSelectAll}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                            </th>
                            <th className="px-3 py-2.5 text-left">
                                <SortButton label="Товар" field="name" current={sortConfig.sortBy} order={sortConfig.sortOrder} onSort={onSort} />
                            </th>
                            <th className="px-3 py-2.5 text-right w-32">
                                <SortButton label="Цена" field="price" current={sortConfig.sortBy} order={sortConfig.sortOrder} onSort={onSort} />
                            </th>
                            <th className="px-3 py-2.5 text-left w-28">Бренд</th>
                            <th className="px-3 py-2.5 text-left w-36">Категории</th>
                            <th className="px-3 py-2.5 text-center w-20">Статус</th>
                            <th className="px-3 py-2.5 text-left w-24">
                                <SortButton label="Дата" field="created_at" current={sortConfig.sortBy} order={sortConfig.sortOrder} onSort={onSort} />
                            </th>
                            <th className="px-3 py-2.5 text-right w-24">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map(product => (
                            <ProductRow
                                key={product.id}
                                product={product}
                                isSelected={selectedProducts.includes(product.id)}
                                isSuperuser={isSuperuser}
                                onSelect={() => onSelectProduct(product.id)}
                                onEdit={() => onEdit(product)}
                                onToggleStatus={() => onToggleStatus(product)}
                                onDelete={() => onDelete(product)}
                                onView={() => onView(product)}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                    {startItem}–{endItem} из {totalItems}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, currentPage - 2) + i;
                        if (page > totalPages) return null;
                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`w-8 h-8 rounded text-sm ${page === currentPage
                                    ? 'bg-blue-600 text-white'
                                    : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {page}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}


// ── Row component ──

function ProductRow({ product, isSelected, isSuperuser, onSelect, onEdit, onToggleStatus, onDelete, onView }: {
    product: ProductListItem;
    isSelected: boolean;
    isSuperuser: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onToggleStatus: () => void;
    onDelete: () => void;
    onView: () => void;
}) {
    return (
        <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50/50' : ''}`}>
            <td className="px-3 py-2.5">
                <input type="checkbox" checked={isSelected} onChange={onSelect}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
            </td>
            <td className="px-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                    {product.main_image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getImageUrl(product.main_image)} alt="" className="h-9 w-9 rounded object-cover flex-shrink-0" />
                    )}
                    <span className="text-gray-900 truncate max-w-[280px]" title={product.name}>
                        {product.name}
                    </span>
                </div>
            </td>
            <td className="px-3 py-2.5 text-right whitespace-nowrap">
                <div className="text-gray-900">{formatPrice(product.price)}</div>
                {product.discount_price && (
                    <div className="text-xs text-red-600">{formatPrice(product.discount_price)}</div>
                )}
            </td>
            <td className="px-3 py-2.5 text-gray-600 truncate max-w-[120px]">
                {product.brand?.name || '—'}
            </td>
            <td className="px-3 py-2.5">
                <div className="flex flex-wrap gap-1">
                    {product.categories?.slice(0, 2).map(cat => (
                        <span key={cat.id}
                            className="inline-block px-1.5 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
                            {cat.name}
                        </span>
                    ))}
                    {(product.categories?.length || 0) > 2 && (
                        <span className="text-xs text-gray-400">+{product.categories!.length - 2}</span>
                    )}
                    {(!product.categories || product.categories.length === 0) && (
                        <span className="text-gray-400">—</span>
                    )}
                </div>
            </td>
            <td className="px-3 py-2.5 text-center">
                <span className={`inline-block w-2 h-2 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-red-400'}`}
                    title={product.is_active ? 'Активен' : 'Неактивен'} />
            </td>
            <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                {formatDate(product.created_at)}
            </td>
            <td className="px-3 py-2.5">
                <div className="flex items-center justify-end gap-1">
                    <ActionBtn icon={Eye} onClick={onView} color="text-gray-400 hover:text-blue-600" title="Просмотр" />
                    <ActionBtn icon={Edit} onClick={onEdit} color="text-gray-400 hover:text-indigo-600" title="Редактировать" />
                    <ActionBtn
                        icon={product.is_active ? XCircle : CheckCircle}
                        onClick={onToggleStatus}
                        color={product.is_active ? 'text-gray-400 hover:text-yellow-600' : 'text-gray-400 hover:text-green-600'}
                        title={product.is_active ? 'Деактивировать' : 'Активировать'}
                    />
                    {isSuperuser && (
                        <ActionBtn icon={Trash2} onClick={onDelete} color="text-gray-400 hover:text-red-600" title="Удалить" />
                    )}
                </div>
            </td>
        </tr>
    );
}