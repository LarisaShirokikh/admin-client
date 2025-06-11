import { XCircle, CheckCircle, AlertCircle, Download } from 'lucide-react';

interface BulkPriceUpdateResponse {
    success_count: number;
    failed_count: number;
    updated_products: number[];
    failed_products: Array<{ product_id: number; error: string }>;
    total_price_change: number;
}

interface PriceUpdateResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    results: BulkPriceUpdateResponse | null;
    loading: boolean;
}

export default function PriceUpdateResultsModal({
    isOpen,
    onClose,
    results,
    loading
}: PriceUpdateResultsModalProps) {
    if (!isOpen) return null;

    const downloadReport = () => {
        if (!results) return;

        const reportData = {
            timestamp: new Date().toLocaleString('ru-RU'),
            summary: {
                total_processed: results.success_count + results.failed_count,
                successful: results.success_count,
                failed: results.failed_count,
                total_price_change: results.total_price_change
            },
            successful_products: results.updated_products,
            failed_products: results.failed_products
        };

        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `price-update-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
        }).format(amount);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Результаты изменения цен
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XCircle className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Обновление цен...</p>
                        </div>
                    ) : results ? (
                        <div className="space-y-6">
                            {/* Сводка */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-green-900">
                                        {results.success_count.toLocaleString('ru-RU')}
                                    </div>
                                    <div className="text-sm text-green-700">Успешно обновлено</div>
                                </div>

                                {results.failed_count > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                        <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-red-900">
                                            {results.failed_count.toLocaleString('ru-RU')}
                                        </div>
                                        <div className="text-sm text-red-700">Ошибок</div>
                                    </div>
                                )}

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                    <div className="text-lg font-semibold text-blue-900 mb-1">
                                        Общее изменение
                                    </div>
                                    <div className={`text-xl font-bold ${results.total_price_change >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {results.total_price_change >= 0 ? '+' : ''}
                                        {formatCurrency(results.total_price_change)}
                                    </div>
                                </div>
                            </div>

                            {/* Процент успеха */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Процент успеха</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {Math.round((results.success_count / (results.success_count + results.failed_count)) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full"
                                        style={{
                                            width: `${(results.success_count / (results.success_count + results.failed_count)) * 100}%`
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Ошибки */}
                            {results.failed_count > 0 && (
                                <div className="border border-red-200 rounded-lg">
                                    <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                                        <h3 className="text-lg font-medium text-red-900">
                                            Товары с ошибками ({results.failed_count})
                                        </h3>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto">
                                        {results.failed_products.slice(0, 10).map((failure, index) => (
                                            <div key={index} className="px-4 py-2 border-b border-red-100 last:border-b-0">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        Товар ID: {failure.product_id}
                                                    </span>
                                                    <span className="text-xs text-red-600 ml-2">
                                                        {failure.error}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {results.failed_products.length > 10 && (
                                            <div className="px-4 py-2 text-sm text-gray-500 text-center">
                                                и еще {results.failed_products.length - 10} ошибок...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Статистика по успешным обновлениям */}
                            {results.success_count > 0 && (
                                <div className="border border-green-200 rounded-lg">
                                    <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                                        <h3 className="text-lg font-medium text-green-900">
                                            Успешно обновленные товары
                                        </h3>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm text-gray-600 mb-2">
                                            Обновлено товаров: <span className="font-semibold">{results.success_count.toLocaleString('ru-RU')}</span>
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Первые ID: {results.updated_products.slice(0, 10).join(', ')}
                                            {results.updated_products.length > 10 && '...'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Действия */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <button
                                    onClick={downloadReport}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Download className="h-4 w-4" />
                                    Скачать отчет
                                </button>

                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Нет данных для отображения
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}