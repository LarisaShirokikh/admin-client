import { useState, useEffect } from 'react';
import { XCircle, RefreshCw, TrendingUp, TrendingDown, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import {
    ChangeType,
    Direction,
    PriceBulkEditModalProps,
    PriceScope,
    PriceType,
    PriceUpdateData
} from '@/types/products';

export default function PriceBulkEditModal({
    isOpen,
    onClose,
    onSave,
    brands,
    categories,
    catalogs,
    loading
}: PriceBulkEditModalProps) {
    const [formData, setFormData] = useState<PriceUpdateData>({
        scope: 'all',
        scope_id: undefined,
        price_type: 'main',
        change_type: 'percent',
        change_value: 0,
        direction: 'increase',
        only_active: true,
        only_in_stock: false,
        price_range: {}
    });

    const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
    const [loadingEstimate, setLoadingEstimate] = useState(false);

    // Сброс формы при открытии
    useEffect(() => {
        if (isOpen) {
            setFormData({
                scope: 'all',
                scope_id: undefined,
                price_type: 'main',
                change_type: 'percent',
                change_value: 0,
                direction: 'increase',
                only_active: true,
                only_in_stock: false,
                price_range: {}
            });
            setEstimatedCount(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (formData.change_value <= 0) {
            alert('Значение изменения должно быть больше 0');
            return;
        }
        onSave(formData);
    };

    const getEstimatedCount = async () => {
        setLoadingEstimate(true);
        try {
            // Здесь будет вызов API для получения количества товаров по критериям
            // Пока симулируем задержку
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Симуляция подсчета
            let count = 1250; // Базовое количество

            if (formData.scope === 'brand' && formData.scope_id) count = Math.floor(count * 0.15);
            if (formData.scope === 'category' && formData.scope_id) count = Math.floor(count * 0.25);
            if (formData.scope === 'catalog' && formData.scope_id) count = Math.floor(count * 0.3);

            if (formData.only_active) count = Math.floor(count * 0.8);
            if (formData.only_in_stock) count = Math.floor(count * 0.7);

            if (formData.price_range?.from || formData.price_range?.to) {
                count = Math.floor(count * 0.6);
            }

            setEstimatedCount(count);
        } catch (error) {
            console.error('Ошибка получения оценки:', error);
            setEstimatedCount(0);
        } finally {
            setLoadingEstimate(false);
        }
    };

    const formatExample = () => {
        const basePrice = 1000;
        let newPrice = basePrice;

        if (formData.change_type === 'percent') {
            const multiplier = formData.direction === 'increase'
                ? (100 + formData.change_value) / 100
                : (100 - formData.change_value) / 100;
            newPrice = basePrice * multiplier;
        } else {
            newPrice = formData.direction === 'increase'
                ? basePrice + formData.change_value
                : basePrice - formData.change_value;
        }

        return {
            old: basePrice.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }),
            new: newPrice.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })
        };
    };

    const getScopeText = () => {
        switch (formData.scope) {
            case 'all':
                return 'всех товаров';
            case 'brand':
                const brand = brands.find(b => b.id === formData.scope_id);
                return brand ? `товаров бренда "${brand.name}"` : 'товаров выбранного бренда';
            case 'category':
                const category = categories.find(c => c.id === formData.scope_id);
                return category ? `товаров категории "${category.name}"` : 'товаров выбранной категории';
            case 'catalog':
                const catalog = catalogs.find(c => c.id === formData.scope_id);
                return catalog ? `товаров каталога "${catalog.name}"` : 'товаров выбранного каталога';
            default:
                return 'товаров';
        }
    };

    const handleScopeChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            scope: value as PriceScope,
            scope_id: undefined
        }));
    };

    const handlePriceTypeChange = (value: string) => {
        setFormData(prev => ({ ...prev, price_type: value as PriceType }));
    };

    const handleChangeTypeChange = (value: string) => {
        setFormData(prev => ({ ...prev, change_type: value as ChangeType }));
    };

    const handleDirectionChange = (value: string) => {
        setFormData(prev => ({ ...prev, direction: value as Direction }));
    };

    const example = formatExample();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-6 w-6 text-green-600" />
                        <h2 className="text-xl font-semibold text-gray-900">
                            Массовое изменение цен
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XCircle className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Область применения */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Область применения</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Применить к
                                </label>
                                <select
                                    value={formData.scope}
                                    onChange={(e) => handleScopeChange(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Всем товарам</option>
                                    <option value="brand">Товарам конкретного бренда</option>
                                    <option value="category">Товарам конкретной категории</option>
                                    <option value="catalog">Товарам конкретного каталога</option>
                                </select>
                            </div>

                            {formData.scope !== 'all' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {formData.scope === 'brand' && 'Выберите бренд'}
                                        {formData.scope === 'category' && 'Выберите категорию'}
                                        {formData.scope === 'catalog' && 'Выберите каталог'}
                                    </label>
                                    <select
                                        value={formData.scope_id || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            scope_id: e.target.value ? Number(e.target.value) : undefined
                                        }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Выберите...</option>
                                        {formData.scope === 'brand' && brands.map(brand => (
                                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                                        ))}
                                        {formData.scope === 'category' && categories.map(category => (
                                            <option key={category.id} value={category.id}>{category.name}</option>
                                        ))}
                                        {formData.scope === 'catalog' && catalogs.map(catalog => (
                                            <option key={catalog.id} value={catalog.id}>{catalog.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Дополнительные фильтры */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Дополнительные фильтры</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="onlyActive"
                                    checked={formData.only_active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, only_active: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="onlyActive" className="ml-2 text-sm text-gray-700">
                                    Только активные товары
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="onlyInStock"
                                    checked={formData.only_in_stock}
                                    onChange={(e) => setFormData(prev => ({ ...prev, only_in_stock: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="onlyInStock" className="ml-2 text-sm text-gray-700">
                                    Только товары в наличии
                                </label>
                            </div>
                        </div>

                        {/* Диапазон цен */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Диапазон текущих цен (опционально)
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Цена от"
                                        value={formData.price_range?.from || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            price_range: {
                                                ...prev.price_range,
                                                from: e.target.value ? Number(e.target.value) : undefined
                                            }
                                        }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Цена до"
                                        value={formData.price_range?.to || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            price_range: {
                                                ...prev.price_range,
                                                to: e.target.value ? Number(e.target.value) : undefined
                                            }
                                        }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Настройки изменения цены */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Настройки изменения цены</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Какие цены изменять
                                </label>
                                <select
                                    value={formData.price_type}
                                    onChange={(e) => handlePriceTypeChange(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="main">Только основную цену</option>
                                    <option value="discount">Только цену со скидкой</option>
                                    <option value="both">Обе цены пропорционально</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Тип изменения
                                </label>
                                <select
                                    value={formData.change_type}
                                    onChange={(e) => handleChangeTypeChange(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="percent">На процент (%)</option>
                                    <option value="fixed">На фиксированную сумму (₽)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Направление
                                </label>
                                <select
                                    value={formData.direction}
                                    onChange={(e) => handleDirectionChange(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="increase">Увеличить</option>
                                    <option value="decrease">Уменьшить</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {formData.change_type === 'percent' ? 'Процент изменения' : 'Сумма изменения (₽)'}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={formData.change_value || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Удаляем ведущие нули и конвертируем в число
                                        const numValue = value === '' ? 0 : parseFloat(value) || 0;
                                        setFormData(prev => ({ ...prev, change_value: numValue }));
                                    }}
                                    onBlur={(e) => {
                                        // При потере фокуса убираем ведущие нули окончательно
                                        const value = parseFloat(e.target.value) || 0;
                                        setFormData(prev => ({ ...prev, change_value: value }));
                                    }}
                                    min="0"
                                    step={formData.change_type === 'percent' ? '0.1' : '1'}
                                    placeholder="0"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                    {formData.change_type === 'percent' ? (
                                        <Percent className="h-5 w-5" />
                                    ) : (
                                        <span className="text-sm">₽</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Предпросмотр */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-md font-medium text-blue-900 mb-2 flex items-center gap-2">
                            {formData.direction === 'increase' ? (
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-red-600" />
                            )}
                            Предпросмотр изменений
                        </h4>
                        <div className="space-y-2 text-sm">
                            <p>
                                <span className="font-medium">Область:</span> {getScopeText()}
                            </p>
                            <p>
                                <span className="font-medium">Изменение:</span>{' '}
                                {formData.direction === 'increase' ? 'Увеличить' : 'Уменьшить'} на{' '}
                                {formData.change_value}{formData.change_type === 'percent' ? '%' : '₽'}
                            </p>
                            <p>
                                <span className="font-medium">Пример:</span>{' '}
                                {example.old} → {example.new}
                            </p>

                            {estimatedCount !== null && (
                                <p className="pt-2 border-t border-blue-300">
                                    <span className="font-medium">Затронуто товаров:</span>{' '}
                                    <span className="text-lg font-bold text-blue-900">
                                        {estimatedCount.toLocaleString('ru-RU')}
                                    </span>
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={getEstimatedCount}
                            disabled={loadingEstimate}
                            className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                            {loadingEstimate ? (
                                <>
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    Подсчет...
                                </>
                            ) : (
                                'Посчитать количество товаров'
                            )}
                        </button>
                    </div>

                    {/* Предупреждение */}
                    {estimatedCount !== null && estimatedCount > 1000 && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <h4 className="text-md font-medium text-yellow-900 mb-1">
                                        Внимание!
                                    </h4>
                                    <p className="text-sm text-yellow-800">
                                        Вы изменяете цены у большого количества товаров ({estimatedCount.toLocaleString('ru-RU')}).
                                        Это действие необратимо. Убедитесь в правильности настроек.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

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
                            onClick={handleSubmit}
                            disabled={loading || formData.change_value <= 0}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                            {loading ? 'Применение изменений...' : 'Применить изменения'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}