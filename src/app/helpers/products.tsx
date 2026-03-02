// src/components/products/helpers.tsx

'use client';

import { XCircle } from 'lucide-react';

export function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
            {label}
            <button onClick={onRemove} className="hover:text-gray-900">
                <XCircle className="h-3 w-3" />
            </button>
        </span>
    );
}

export function SortButton({ label, field, current, order, onSort }: {
    label: string;
    field: string;
    current: string;
    order: string;
    onSort: (f: string) => void;
}) {
    return (
        <button
            onClick={() => onSort(field)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
        >
            {label}
            {current === field && (
                <span className="text-blue-600">{order === 'asc' ? '↑' : '↓'}</span>
            )}
        </button>
    );
}

export function ActionBtn({ icon: Icon, onClick, color, title }: {
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    color: string;
    title: string;
}) {
    return (
        <button onClick={onClick} className={`p-1 rounded ${color}`} title={title}>
            <Icon className="h-4 w-4" />
        </button>
    );
}

export const formatPrice = (price: number) =>
    new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(price);

export const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '—';
    }
};