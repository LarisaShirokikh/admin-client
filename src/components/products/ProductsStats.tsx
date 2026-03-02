// src/components/products/ProductsStats.tsx

'use client';

import { Package, CheckCircle, XCircle } from 'lucide-react';
import { ProductsStats as ProductsStatsType } from '@/types/products';

interface ProductsStatsProps {
    stats: ProductsStatsType;
}

const STAT_ITEMS = [
    { key: 'total_products', label: 'Всего', icon: Package, color: 'blue' },
    { key: 'active_products', label: 'Активных', icon: CheckCircle, color: 'green' },
    { key: 'products_in_stock', label: 'В наличии', icon: Package, color: 'yellow' },
    { key: 'inactive_products', label: 'Неактивных', icon: XCircle, color: 'red' },
] as const;

export default function ProductsStatsCards({ stats }: ProductsStatsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_ITEMS.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 bg-${color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 text-${color}-600`} />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">{label}</div>
                        <div className="text-xl font-bold text-gray-900">
                            {stats[key]}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}