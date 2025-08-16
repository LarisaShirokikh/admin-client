'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    Filter,
    RefreshCw,
    Package,
    AlertCircle,
    CheckCircle,
    XCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { BulkEditData, BulkEditField, ProductListItem, ProductsStats, ProductUpdate } from '@/types/products';
import { handleApiError } from '@/lib/utils/errors';
import { productsApi } from '@/lib/api/products';
import { Brand } from '@/types/admin';
import { Category } from '@/types/categories';
import { brandsApi } from '@/lib/api/brands';
import { categoriesApi } from '@/lib/api/categories';
import { useToast } from '@/lib/contexts/ToastContext';
import { debounce } from 'lodash';
import ProductEditModal from '@/components/ProductEditModal';
import { DollarSign } from 'lucide-react';
// import PriceUpdateResultsModal from '@/components/PriceUpdateResultsModal';
import { PriceUpdateData } from '@/types/products';
import PriceBulkEditModal from '@/components/PriceBulkEditModal';
import { Catalog } from '@/types/catalogs';
import { catalogsApi } from '@/lib/api/catalogs';


export default function ProductsPage() {
    const { isSuperuser } = useAuth();
    const { showToast } = useToast();

    const abortControllerRef = useRef<AbortController | null>(null);

    // State
    const [products, setProducts] = useState<ProductListItem[]>([]);
    const [stats, setStats] = useState<ProductsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination & Filters
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const [filters, setFilters] = useState({
        brand_id: undefined as number | undefined,
        catalog_id: undefined as number | undefined,
        category_id: undefined as number | undefined,
        is_active: true as boolean | undefined,
        in_stock: undefined as boolean | undefined,
        price_from: undefined as number | undefined,
        price_to: undefined as number | undefined,
    });
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showFilters, setShowFilters] = useState(true);

    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [bulkEditData, setBulkEditData] = useState<BulkEditData>({
        price: '',
        discount_price: '',
        is_active: '',
        in_stock: '',
        category_ids: [] as number[],
        brand_id: '',
    });
    const [bulkEditLoading, setBulkEditLoading] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [catalogs, setCatalogs] = useState<Catalog[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);

    // Состояние для редактирования одного товара
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(null);
    const [editLoading, setEditLoading] = useState(false);

    const [showPriceBulkEdit, setShowPriceBulkEdit] = useState(false);
    const [priceBulkEditLoading, setPriceBulkEditLoading] = useState(false);

    const memoizedFilters = useMemo(() => ({
        brand_id: filters.brand_id,
        catalog_id: filters.catalog_id,
        category_id: filters.category_id,
        is_active: filters.is_active,
        in_stock: filters.in_stock,
        price_from: filters.price_from,
        price_to: filters.price_to,
    }), [
        filters.brand_id,
        filters.catalog_id,
        filters.category_id,
        filters.is_active,
        filters.in_stock,
        filters.price_from,
        filters.price_to,
    ]);

    const debouncedSearch = useMemo(
        () => debounce((searchTerm: string) => {
            setSearch(searchTerm);
            setCurrentPage(1);
        }, 500),
        []
    );

    // Функции загрузки справочников
    const loadBrands = useCallback(async () => {
        try {
            setLoadingBrands(true);
            const brandsData = await brandsApi.getBrands();
            setBrands(brandsData);
        } catch (error) {
            console.error('Ошибка загрузки брендов:', error);
        } finally {
            setLoadingBrands(false);
        }
    }, []);

    const loadCategories = useCallback(async () => {
        try {
            setLoadingCategories(true);
            const categoriesData = await categoriesApi.getCategories();
            setCategories(categoriesData);
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        } finally {
            setLoadingCategories(false);
        }
    }, []);

    const loadCatalogs = useCallback(async () => {
        try {
            setLoadingCatalogs(true);
            const catalogsData = await catalogsApi.getAll();
            setCatalogs(catalogsData);
        } catch (error) {
            console.error('Ошибка загрузки каталогов:', error);
        } finally {
            setLoadingCatalogs(false);
        }
    }, []);

    // Загрузка всех справочников при инициализации компонента
    useEffect(() => {
        const loadAllReferenceData = async () => {
            await Promise.all([
                loadBrands(),
                loadCategories(),
                loadCatalogs()
            ]);
        };

        loadAllReferenceData();
    }, [loadBrands, loadCategories, loadCatalogs]);

    // Единый эффект для загрузки продуктов с предотвращением зацикливания
    useEffect(() => {
        const loadData = async () => {
            try {
                // Отменяем предыдущий запрос если он еще выполняется
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }

                // Создаем новый AbortController для этого запроса
                abortControllerRef.current = new AbortController();

                setLoading(true);
                setError(null);
                setSelectedProducts([]);
                setSelectAll(false);

                const params = {
                    skip: (currentPage - 1) * itemsPerPage,
                    limit: itemsPerPage,
                    search: search || undefined,
                    ...memoizedFilters,
                    sort_by: sortBy,
                    sort_order: sortOrder,
                };

                const [productsData, countData] = await Promise.all([
                    productsApi.getProducts(params),
                    productsApi.getCount({ search, ...memoizedFilters })
                ]);

                setProducts(productsData);
                setTotalItems(countData.count);
            } catch (error: unknown) {
                console.error('Load products error:', error);
                // ИСПРАВЛЕНИЕ: очищаем продукты при ошибке
                setProducts([]);
                setTotalItems(0);

                // Правильная типизация ошибки без any
                let errorMessage = String(error);
                if (error && typeof error === 'object' && 'detail' in error) {
                    errorMessage = String((error as { detail: unknown }).detail);
                }

                if (errorMessage.includes('CORS') || errorMessage.includes('Network Error')) {
                    setError('Ошибка подключения к серверу. Проверьте что бэкенд запущен и настроены CORS.');
                } else {
                    setError('Ошибка при загрузке продуктов');
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [search, currentPage, itemsPerPage, memoizedFilters, sortBy, sortOrder]);

    // Очищаем debounce при размонтировании
    useEffect(() => {
        const currentAbortController = abortControllerRef.current;
        return () => {
            debouncedSearch.cancel();
            // Отменяем активные запросы при размонтировании
            if (currentAbortController) {
                currentAbortController.abort();
            }
        };
    }, [debouncedSearch]);

    const handleOpenPriceBulkEdit = async () => {
        setShowPriceBulkEdit(true);
        // Справочники уже загружены при инициализации
    };

    const handleClosePriceBulkEdit = () => {
        setShowPriceBulkEdit(false);
    };

    const handlePriceBulkEditSave = async (data: PriceUpdateData) => {
        setPriceBulkEditLoading(true);
        try {
            console.log('🔍 Sending bulk price update:', data);
            const response = await productsApi.bulkUpdatePrices(data);

            console.log('📨 Received response:', response);
            console.log('📊 Response details:', {
                success_count: response.success_count,
                failed_count: response.failed_count,
                total_updated: response.success_count + response.failed_count,
                updated_products_length: response.updated_products?.length
            });

            handleClosePriceBulkEdit();
            forceRefresh();
            await loadStats();

            if (response.failed_count === 0) {
                showToast('success', `Успешно обновлено ${response.success_count} товаров`);
            } else {
                showToast('warning', `Обновлено ${response.success_count} из ${response.success_count + response.failed_count} товаров`);
            }

        } catch (error: unknown) {
            console.error('❌ Bulk price update error:', error);
            showToast('error', handleApiError(error, 'Ошибка при изменении цен'));
        } finally {
            setPriceBulkEditLoading(false);
        }
    };

    const handleEditProduct = async (product: ProductListItem) => {
        setEditingProduct(product);
        setShowEditModal(true);
        console.log('Редактирование товара:', product);
    };


    const handleCloseEdit = () => {
        setShowEditModal(false);
        setEditingProduct(null);
    };


    const handleSaveProduct = async (updatedData: ProductUpdate) => {
        if (!editingProduct) return;

        setEditLoading(true);
        try {
            console.log('Сохранение изменений товара:', editingProduct.id, updatedData);

            const response = await productsApi.updateProduct(editingProduct.id, updatedData);

            // Обновляем данные
            forceRefresh();
            await loadStats();

            // Закрываем модальное окно
            handleCloseEdit();

            showToast('success', `Товар "${editingProduct.name}" успешно обновлен`);
            console.log('Товар успешно обновлен:', response);

        } catch (error: unknown) {
            console.error('Ошибка при сохранении товара:', error);
            showToast('error', handleApiError(error, 'Ошибка при сохранении товара'));
        } finally {
            setEditLoading(false);
        }
    };


    const handleOpenBulkEdit = async () => {
        const commonCategoryIds = getCommonCategories();
        setBulkEditData({
            price: '',
            discount_price: '',
            is_active: '',
            in_stock: '',
            category_ids: commonCategoryIds,
            brand_id: '',
        });
        setShowBulkEditModal(true);
        console.log('Выбранные продукты:', selectedProducts);
        console.log('Общие категории:', commonCategoryIds);
        // Справочники уже загружены при инициализации
    };

    const handleCategoryToggle = (categoryId: number) => {
        setBulkEditData(prev => ({
            ...prev,
            category_ids: prev.category_ids.includes(categoryId)
                ? prev.category_ids.filter(id => id !== categoryId)
                : [...prev.category_ids, categoryId]
        }));
    };


    const handleCloseBulkEdit = () => {
        setShowBulkEditModal(false);
        setBulkEditData({
            price: '',
            discount_price: '',
            is_active: '',
            in_stock: '',
            category_ids: [],
            brand_id: '',
        });
    };

    // Обработчик изменения полей формы
    const handleBulkEditChange = (field: BulkEditField, value: string | number[]) => {
        setBulkEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleBulkEditSave = async () => {
        if (selectedProducts.length === 0) return;

        setBulkEditLoading(true);
        try {
            const updateData: Partial<ProductUpdate> = {};

            if (bulkEditData.price) updateData.price = Number(bulkEditData.price);
            if (bulkEditData.discount_price) updateData.discount_price = Number(bulkEditData.discount_price);
            if (bulkEditData.is_active !== '') updateData.is_active = bulkEditData.is_active === 'true';
            if (bulkEditData.in_stock !== '') updateData.in_stock = bulkEditData.in_stock === 'true';
            if (bulkEditData.category_ids.length > 0) updateData.category_ids = bulkEditData.category_ids;
            if (bulkEditData.brand_id) updateData.brand_id = Number(bulkEditData.brand_id);

            const batchResponse = await productsApi.batchUpdateProducts({
                product_ids: selectedProducts,
                update_data: updateData
            });

            forceRefresh();
            await loadStats();

            handleCloseBulkEdit();
            setSelectedProducts([]);
            setSelectAll(false);

            if (batchResponse.failed_count > 0) {
                showToast('warning',
                    `Обновлено ${batchResponse.success_count} из ${selectedProducts.length} продуктов. ${batchResponse.failed_count} не удалось обновить.`
                );

                console.log('Ошибки обновления:');
                batchResponse.failed_products.forEach(error => {
                    console.log(`Продукт ${error.product_id}: ${error.error}`);
                });
            } else {
                showToast('success', `Успешно обновлено ${batchResponse.success_count} продуктов`);
            }

        } catch (error: unknown) {
            console.error('Ошибка массового редактирования:', error);
            showToast('error', handleApiError(error, 'Ошибка при массовом редактировании продуктов'));
        } finally {
            setBulkEditLoading(false);
        }
    };

    const getCommonCategories = useCallback(() => {
        if (selectedProducts.length === 0) return [];

        const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));

        if (selectedProductsData.length === 0) return [];

        if (selectedProductsData.length === 1) {
            return selectedProductsData[0].categories?.map(cat => cat.id) || [];
        }


        const firstProductCategories = selectedProductsData[0].categories?.map(cat => cat.id) || [];

        return firstProductCategories.filter(categoryId =>
            selectedProductsData.every(product =>
                product.categories?.some(cat => cat.id === categoryId)
            )
        );
    }, [selectedProducts, products]);


    const forceRefresh = useCallback(() => {

        setSearch(prev => prev === '' ? ' ' : '');
        setCurrentPage(1);
    }, []);

    const handleSearchInput = useCallback((value: string) => {
        console.log('handleSearchInput called with:', value);
        setSearchInput(value);
        debouncedSearch(value);
    }, [debouncedSearch]);


    const clearSearch = useCallback(() => {
        setSearchInput('');
        setSearch('');
        setCurrentPage(1);
        debouncedSearch.cancel();

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, [debouncedSearch]);

    // Load stats
    const loadStats = useCallback(async () => {
        try {
            const statsData = await productsApi.getStats();
            setStats(statsData);
        } catch {
            console.error('Load stats error');
        }
    }, []);

    // Effects
    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setCurrentPage(1);
    };

    const handleToggleStatus = async (product: ProductListItem) => {
        try {
            await productsApi.toggleProductStatus(product.id);
            // Обновляем данные
            forceRefresh();
            await loadStats();
            showToast('success', `Статус продукта "${product.name}" изменен`);
        } catch {
            showToast('error', 'Ошибка при изменении статуса продукта');
        }
    };

    const handleDelete = async (product: ProductListItem) => {
        if (!isSuperuser) {
            showToast('error', 'Только суперадминистратор может полностью удалять продукты');
            return;
        }

        if (!confirm(`ВНИМАНИЕ! Вы действительно хотите ПОЛНОСТЬЮ УДАЛИТЬ "${product.name}"? Это действие необратимо!`)) return;

        try {
            await productsApi.deleteProduct(product.id);
            // Обновляем данные
            forceRefresh();
            await loadStats();
            showToast('success', `Продукт "${product.name}" удален`);
        } catch {
            showToast('error', 'Ошибка при удалении продукта');
        }
    };

    // Pagination calculations
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ru-RU');
    };

    const handleSelectProduct = (productId: number) => {
        setSelectedProducts(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(products.map(p => p.id));
        }
        setSelectAll(!selectAll);
    };

    useEffect(() => {
        if (products.length > 0) {
            setSelectAll(selectedProducts.length === products.length);
        }
    }, [selectedProducts, products]);

    return (
        <div className="space-y-6">
            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800">{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-red-600 hover:text-red-800"
                    >
                        <XCircle className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Модальное окно редактирования одного товара */}
            {showEditModal && editingProduct && (
                <ProductEditModal
                    product={editingProduct}
                    brands={brands}
                    categories={categories}
                    loading={editLoading}
                    onSave={handleSaveProduct}
                    onClose={handleCloseEdit}
                />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Продукты</h1>
                    <p className="text-gray-600">Управление каталогом продуктов</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={forceRefresh}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Обновить
                    </button>
                    <button
                        onClick={handleOpenPriceBulkEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <DollarSign className="h-4 w-4" />
                        Изменить цены
                    </button>
                    <button
                        onClick={() => alert('Модалка создания будет добавлена позже')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Добавить продукт
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Package className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-gray-500">Всего продуктов</div>
                                <div className="text-2xl font-bold text-gray-900">{stats.total_products}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-gray-500">Активных</div>
                                <div className="text-2xl font-bold text-gray-900">{stats.active_products}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Package className="h-5 w-5 text-yellow-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-gray-500">В наличии</div>
                                <div className="text-2xl font-bold text-gray-900">{stats.products_in_stock}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-gray-500">Неактивных</div>
                                <div className="text-2xl font-bold text-gray-900">{stats.inactive_products}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                placeholder="Поиск по названию, описанию, SKU, бренду..."
                                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {loading && search ? (
                                    <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
                                ) : searchInput ? (
                                    <button
                                        onClick={clearSearch}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Очистить поиск"
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </div>
                        {search && !loading && (
                            <div className="mt-2 text-sm text-gray-600">
                                {totalItems > 0 ? (
                                    <>
                                        Найдено <span className="font-medium">{totalItems}</span> результатов по запросу
                                        <span className="font-medium"> &quot;{search}&quot;</span>
                                    </>
                                ) : (
                                    <>
                                        Ничего не найдено по запросу
                                        <span className="font-medium"> &quot;{search}&quot;</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Filter className="h-4 w-4" />
                        Фильтры
                    </button>
                </div>

                {/* Extended Filters */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {/* Каталог */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Каталог</label>
                                <select
                                    value={filters.catalog_id || ''}
                                    onChange={(e) => handleFilterChange({
                                        ...filters,
                                        catalog_id: e.target.value ? Number(e.target.value) : undefined
                                    })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={loadingCatalogs}
                                >
                                    <option value="">Все каталоги</option>
                                    {loadingCatalogs ? (
                                        <option disabled>Загрузка...</option>
                                    ) : catalogs.length === 0 ? (
                                        <option disabled>Каталоги не найдены</option>
                                    ) : (
                                        catalogs.map(catalog => (
                                            <option key={catalog.id} value={catalog.id}>
                                                {catalog.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {loadingCatalogs && (
                                    <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                        Загрузка...
                                    </div>
                                )}
                            </div>

                            {/* Бренд */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Бренд</label>
                                <select
                                    value={filters.brand_id || ''}
                                    onChange={(e) => handleFilterChange({
                                        ...filters,
                                        brand_id: e.target.value ? Number(e.target.value) : undefined
                                    })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={loadingBrands}
                                >
                                    <option value="">Все бренды</option>
                                    {loadingBrands ? (
                                        <option disabled>Загрузка...</option>
                                    ) : brands.length === 0 ? (
                                        <option disabled>Бренды не найдены</option>
                                    ) : (
                                        brands.map(brand => (
                                            <option key={brand.id} value={brand.id}>
                                                {brand.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {loadingBrands && (
                                    <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                        Загрузка...
                                    </div>
                                )}
                            </div>

                            {/* Категория */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                                <select
                                    value={filters.category_id || ''}
                                    onChange={(e) => handleFilterChange({
                                        ...filters,
                                        category_id: e.target.value ? Number(e.target.value) : undefined
                                    })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={loadingCategories}
                                >
                                    <option value="">Все категории</option>
                                    {loadingCategories ? (
                                        <option disabled>Загрузка...</option>
                                    ) : categories.length === 0 ? (
                                        <option disabled>Категории не найдены</option>
                                    ) : (
                                        categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {loadingCategories && (
                                    <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                        Загрузка...
                                    </div>
                                )}
                            </div>

                            {/* Статус */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                                <select
                                    value={filters.is_active === undefined ? '' : filters.is_active.toString()}
                                    onChange={(e) => handleFilterChange({
                                        ...filters,
                                        is_active: e.target.value === '' ? undefined : e.target.value === 'true'
                                    })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Все</option>
                                    <option value="true">Активные</option>
                                    <option value="false">Неактивные</option>
                                </select>
                            </div>

                            {/* Наличие */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Наличие</label>
                                <select
                                    value={filters.in_stock === undefined ? '' : filters.in_stock.toString()}
                                    onChange={(e) => handleFilterChange({
                                        ...filters,
                                        in_stock: e.target.value === '' ? undefined : e.target.value === 'true'
                                    })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Все</option>
                                    <option value="true">В наличии</option>
                                    <option value="false">Нет в наличии</option>
                                </select>
                            </div>

                            {/* Цена от */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Цена от</label>
                                <input
                                    type="number"
                                    value={filters.price_from || ''}
                                    onChange={(e) => handleFilterChange({
                                        ...filters,
                                        price_from: e.target.value ? Number(e.target.value) : undefined
                                    })}
                                    placeholder="0"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Цена до */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Цена до</label>
                                <input
                                    type="number"
                                    value={filters.price_to || ''}
                                    onChange={(e) => handleFilterChange({
                                        ...filters,
                                        price_to: e.target.value ? Number(e.target.value) : undefined
                                    })}
                                    placeholder="∞"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Активные фильтры и кнопки управления */}
                        <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-between">
                            {/* Активные фильтры */}
                            <div className="flex flex-wrap gap-2">
                                {filters.catalog_id && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        Каталог: {catalogs.find(c => c.id === filters.catalog_id)?.name}
                                        <button
                                            onClick={() => handleFilterChange({ ...filters, catalog_id: undefined })}
                                            className="hover:text-blue-900"
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.brand_id && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                        Бренд: {brands.find(b => b.id === filters.brand_id)?.name}
                                        <button
                                            onClick={() => handleFilterChange({ ...filters, brand_id: undefined })}
                                            className="hover:text-green-900"
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.category_id && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                        Категория: {categories.find(c => c.id === filters.category_id)?.name}
                                        <button
                                            onClick={() => handleFilterChange({ ...filters, category_id: undefined })}
                                            className="hover:text-purple-900"
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.is_active !== undefined && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                        {filters.is_active ? 'Активные' : 'Неактивные'}
                                        <button
                                            onClick={() => handleFilterChange({ ...filters, is_active: undefined })}
                                            className="hover:text-yellow-900"
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.in_stock !== undefined && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                        {filters.in_stock ? 'В наличии' : 'Нет в наличии'}
                                        <button
                                            onClick={() => handleFilterChange({ ...filters, in_stock: undefined })}
                                            className="hover:text-orange-900"
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {(filters.price_from || filters.price_to) && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                        Цена: {filters.price_from || 0} - {filters.price_to || '∞'}
                                        <button
                                            onClick={() => handleFilterChange({
                                                ...filters,
                                                price_from: undefined,
                                                price_to: undefined
                                            })}
                                            className="hover:text-red-900"
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                            </div>

                            {/* Кнопки управления */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setFilters({
                                            brand_id: undefined,
                                            catalog_id: undefined,
                                            category_id: undefined,
                                            is_active: true,
                                            in_stock: undefined,
                                            price_from: undefined,
                                            price_to: undefined,
                                        });
                                        clearSearch();
                                    }}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                >
                                    Сбросить фильтры
                                </button>
                                <div className="text-sm text-gray-500 self-center">
                                    Найдено: <span className="font-medium">{totalItems}</span> товаров
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-600">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            Загрузка продуктов...
                        </div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Продукты не найдены</h3>
                        <p className="text-gray-600 mb-4">Попробуйте изменить фильтры или создать новый продукт</p>
                        <button
                            onClick={() => alert('Модалка создания будет добавлена позже')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Добавить продукт
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={handleSelectAll}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            <button
                                                onClick={() => handleSort('name')}
                                                className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                                            >
                                                Название
                                                {sortBy === 'name' && (
                                                    <span className="text-blue-600">
                                                        {sortOrder === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            <button
                                                onClick={() => handleSort('price')}
                                                className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                                            >
                                                Цена
                                                {sortBy === 'price' && (
                                                    <span className="text-blue-600">
                                                        {sortOrder === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Бренд
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Категории
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Статус
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            <button
                                                onClick={() => handleSort('created_at')}
                                                className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                                            >
                                                Создан
                                                {sortBy === 'created_at' && (
                                                    <span className="text-blue-600">
                                                        {sortOrder === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Действия
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.map((product) => (
                                        <tr
                                            key={product.id}
                                            className={`hover:bg-gray-50 ${selectedProducts.includes(product.id) ? 'bg-blue-50' : ''}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProducts.includes(product.id)}
                                                    onChange={() => handleSelectProduct(product.id)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {product.main_image && (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={product.main_image}
                                                            alt={product.name}
                                                            className="h-10 w-10 rounded-lg object-cover mr-3"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {product.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {formatPrice(product.price)}
                                                </div>
                                                {product.discount_price && (
                                                    <div className="text-sm text-red-600">
                                                        {formatPrice(product.discount_price)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {product.brand?.name || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-1">
                                                    {product.categories && product.categories.length > 0 ? (
                                                        product.categories.slice(0, 2).map((category) => (
                                                            <span
                                                                key={category.id}
                                                                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                                                            >
                                                                {category.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-gray-500">-</span>
                                                    )}
                                                    {product.categories && product.categories.length > 2 && (
                                                        <span className="text-xs text-gray-500">
                                                            +{product.categories.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${product.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {product.is_active ? 'Активен' : 'Неактивен'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {formatDate(product.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => alert(`Просмотр продукта: ${product.name}`)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Просмотр"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditProduct(product)}
                                                        className="text-indigo-600 hover:text-indigo-800"
                                                        title="Редактировать"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(product)}
                                                        className={`${product.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                                                        title={product.is_active ? 'Деактивировать' : 'Активировать'}
                                                    >
                                                        {product.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                    </button>
                                                    {isSuperuser && (
                                                        <button
                                                            onClick={() => handleDelete(product)}
                                                            className="text-red-600 hover:text-red-800"
                                                            title="Удалить"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {selectedProducts.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-blue-800 font-medium">
                                            Выбрано продуктов: {selectedProducts.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleOpenBulkEdit}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                        >
                                            Редактировать ({selectedProducts.length})
                                        </button>
                                        <button
                                            onClick={() => setSelectedProducts([])}
                                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                                        >
                                            Отменить выбор
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Предыдущая
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Следующая
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Показано <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> из{' '}
                                        <span className="font-medium">{totalItems}</span> результатов
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>

                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const page = Math.max(1, currentPage - 2) + i;
                                            if (page > totalPages) return null;

                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Модальное окно массового изменения цен */}
            {showPriceBulkEdit && (
                <PriceBulkEditModal
                    isOpen={showPriceBulkEdit}
                    onClose={handleClosePriceBulkEdit}
                    onSave={handlePriceBulkEditSave}
                    brands={brands}
                    categories={categories}
                    catalogs={catalogs}
                    loading={priceBulkEditLoading}
                />
            )}

            {showBulkEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Массовое редактирование ({selectedProducts.length} продуктов)
                            </h2>
                            <button
                                onClick={handleCloseBulkEdit}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            <div className="text-sm text-gray-600 mb-4">
                                Заполните только те поля, которые хотите изменить для всех выбранных продуктов.
                                Пустые поля останутся без изменений.
                            </div>

                            {/* Price fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Цена (₽)
                                    </label>
                                    <input
                                        type="number"
                                        value={bulkEditData.price}
                                        onChange={(e) => handleBulkEditChange('price', e.target.value)}
                                        placeholder="Не изменять"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Цена со скидкой (₽)
                                    </label>
                                    <input
                                        type="number"
                                        value={bulkEditData.discount_price}
                                        onChange={(e) => handleBulkEditChange('discount_price', e.target.value)}
                                        placeholder="Не изменять"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Status fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Статус активности
                                    </label>
                                    <select
                                        value={bulkEditData.is_active}
                                        onChange={(e) => handleBulkEditChange('is_active', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Не изменять</option>
                                        <option value="true">Активен</option>
                                        <option value="false">Неактивен</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Наличие на складе
                                    </label>
                                    <select
                                        value={bulkEditData.in_stock}
                                        onChange={(e) => handleBulkEditChange('in_stock', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Не изменять</option>
                                        <option value="true">В наличии</option>
                                        <option value="false">Нет в наличии</option>
                                    </select>
                                </div>
                            </div>

                            {/* Brand field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Бренд
                                </label>
                                <select
                                    value={bulkEditData.brand_id}
                                    onChange={(e) => handleBulkEditChange('brand_id', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={loadingBrands}
                                >
                                    <option value="">Не изменять</option>
                                    {loadingBrands ? (
                                        <option disabled>Загрузка брендов...</option>
                                    ) : brands.length === 0 ? (
                                        <option disabled>Бренды не найдены</option>
                                    ) : (
                                        brands.map(brand => (
                                            <option key={brand.id} value={brand.id}>
                                                {brand.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {loadingBrands && (
                                    <div className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                        Загрузка брендов...
                                    </div>
                                )}
                            </div>

                            {/* Categories field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Категории
                                </label>
                                <div className="text-sm text-gray-500 mb-2">
                                    Выберите категории для замены (существующие категории будут удалены)
                                </div>
                                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                                    {loadingCategories ? (
                                        <div className="text-gray-500 text-center py-4">
                                            <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                                            Загрузка категорий...
                                        </div>
                                    ) : categories.length === 0 ? (
                                        <div className="text-gray-500 text-center py-4">
                                            Категории не найдены
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {categories.map(category => (
                                                <label key={category.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={bulkEditData.category_ids.includes(category.id)}
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
                                {bulkEditData.category_ids.length > 0 && (
                                    <div className="mt-2 text-sm text-blue-600">
                                        Выбрано категорий: {bulkEditData.category_ids.length}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
                            <button
                                onClick={handleCloseBulkEdit}
                                disabled={bulkEditLoading}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleBulkEditSave}
                                disabled={bulkEditLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {bulkEditLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                                {bulkEditLoading ? 'Сохранение...' : 'Сохранить изменения'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}