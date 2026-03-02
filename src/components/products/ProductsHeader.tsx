// src/components/products/ProductsHeader.tsx

'use client';

import { RefreshCw, DollarSign, Plus, Trash2 } from 'lucide-react';

interface ProductsHeaderProps {
    isSuperuser: boolean;
    onRefresh: () => void;
    onPriceBulkEdit: () => void;
    onAdd: () => void;
    onDeleteAll: () => void;
}

export default function ProductsHeader({
    isSuperuser,
    onRefresh,
    onPriceBulkEdit,
    onAdd,
    onDeleteAll,
}: ProductsHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Продукты</h1>
                <p className="text-sm text-gray-500">Управление каталогом продуктов</p>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={onRefresh}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                    <RefreshCw className="h-4 w-4" /> Обновить
                </button>
                <button
                    onClick={onPriceBulkEdit}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                    <DollarSign className="h-4 w-4" /> Изменить цены
                </button>
                <button
                    onClick={onAdd}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                    <Plus className="h-4 w-4" /> Добавить
                </button>
                {isSuperuser && (
                    <button
                        onClick={onDeleteAll}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                        <Trash2 className="h-4 w-4" /> Удалить всё
                    </button>
                )}
            </div>
        </div>
    );
}