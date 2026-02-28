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
    ChevronRight,
    DollarSign,
} from 'lucide-react';
import { BulkEditData, BulkEditField, ProductListItem, ProductsStats, ProductUpdate } from '@/types/products';
import { handleApiError } from '@/lib/utils/errors';
import { productsApi } from '@/lib/api/products';
import { Brand } from '@/types/admin';
import { Category } from '@/types/categories';
import { Catalog } from '@/types/catalogs';
import { brandsApi } from '@/lib/api/brands';
import { categoriesApi } from '@/lib/api/categories';
import { catalogsApi } from '@/lib/api/catalogs';
import { useToast } from '@/lib/contexts/ToastContext';
import { debounce } from 'lodash';
import ProductEditModal from '@/components/ProductEditModal';
import PriceBulkEditModal from '@/components/PriceBulkEditModal';
import { PriceUpdateData } from '@/types/products';
import { getImageUrl } from '@/lib/utils/image';


export default function ProductsPage() {
    const { isSuperuser } = useAuth();
    const { showToast } = useToast();
    const abortControllerRef = useRef<AbortController | null>(null);

    // Data
    const [products, setProducts] = useState<ProductListItem[]>([]);
    const [stats, setStats] = useState<ProductsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refresh counter (replaces the search toggle hack)
    const [refreshKey, setRefreshKey] = useState(0);

    // Pagination & filters
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

    // Selection
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // Bulk edit
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [bulkEditData, setBulkEditData] = useState<BulkEditData>({
        price: '', discount_price: '', is_active: '', in_stock: '',
        category_ids: [] as number[], brand_id: '',
    });
    const [bulkEditLoading, setBulkEditLoading] = useState(false);

    // Reference data
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [catalogs, setCatalogs] = useState<Catalog[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);

    // Single edit
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(null);
    const [editLoading, setEditLoading] = useState(false);

    // Price bulk edit
    const [showPriceBulkEdit, setShowPriceBulkEdit] = useState(false);
    const [priceBulkEditLoading, setPriceBulkEditLoading] = useState(false);


    // === Helpers ===

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(price);

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return '—';
        }
    };

    const forceRefresh = useCallback(() => {
        setRefreshKey(k => k + 1);
        setCurrentPage(1);
    }, []);

    const memoizedFilters = useMemo(() => ({ ...filters }), [
        filters.brand_id, filters.catalog_id, filters.category_id,
        filters.is_active, filters.in_stock, filters.price_from, filters.price_to,
    ]);

    const debouncedSearch = useMemo(
        () => debounce((term: string) => { setSearch(term); setCurrentPage(1); }, 500),
        []
    );


    // === Load reference data ===

    const loadBrands = useCallback(async () => {
        try { setLoadingBrands(true); setBrands(await brandsApi.getBrands()); }
        catch { /* ignore */ }
        finally { setLoadingBrands(false); }
    }, []);

    const loadCategories = useCallback(async () => {
        try { setLoadingCategories(true); setCategories(await categoriesApi.getCategories()); }
        catch { /* ignore */ }
        finally { setLoadingCategories(false); }
    }, []);

    const loadCatalogs = useCallback(async () => {
        try { setLoadingCatalogs(true); setCatalogs(await catalogsApi.getAll()); }
        catch { /* ignore */ }
        finally { setLoadingCatalogs(false); }
    }, []);

    const loadStats = useCallback(async () => {
        try { setStats(await productsApi.getStats()); } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        Promise.all([loadBrands(), loadCategories(), loadCatalogs()]);
    }, [loadBrands, loadCategories, loadCatalogs]);

    useEffect(() => { loadStats(); }, [loadStats]);


    // === Load products ===

    useEffect(() => {
        const loadData = async () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
            abortControllerRef.current = new AbortController();

            setLoading(true);
            setError(null);
            setSelectedProducts([]);
            setSelectAll(false);

            try {
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
                    productsApi.getCount({ search, ...memoizedFilters }),
                ]);

                setProducts(productsData);
                setTotalItems(countData.count);
            } catch (error: unknown) {
                setProducts([]);
                setTotalItems(0);
                const msg = error && typeof error === 'object' && 'detail' in error
                    ? String((error as { detail: unknown }).detail) : String(error);
                setError(msg.includes('CORS') || msg.includes('Network Error')
                    ? 'Ошибка подключения к серверу'
                    : 'Ошибка при загрузке продуктов');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [search, currentPage, itemsPerPage, memoizedFilters, sortBy, sortOrder, refreshKey]);

    useEffect(() => {
        const ctrl = abortControllerRef.current;
        return () => { debouncedSearch.cancel(); ctrl?.abort(); };
    }, [debouncedSearch]);


    // === Handlers ===

    const handleSearchInput = useCallback((value: string) => {
        setSearchInput(value);
        debouncedSearch(value);
    }, [debouncedSearch]);

    const clearSearch = useCallback(() => {
        setSearchInput('');
        setSearch('');
        setCurrentPage(1);
        debouncedSearch.cancel();
        abortControllerRef.current?.abort();
    }, [debouncedSearch]);

    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setCurrentPage(1);
    };

    const handleSelectProduct = (id: number) => {
        setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        if (selectAll) setSelectedProducts([]);
        else setSelectedProducts(products.map(p => p.id));
        setSelectAll(!selectAll);
    };

    useEffect(() => {
        if (products.length > 0) setSelectAll(selectedProducts.length === products.length);
    }, [selectedProducts, products]);

    const handleToggleStatus = async (product: ProductListItem) => {
        try {
            await productsApi.toggleProductStatus(product.id);
            forceRefresh();
            await loadStats();
            showToast('success', `Статус "${product.name}" изменен`);
        } catch {
            showToast('error', 'Ошибка при изменении статуса');
        }
    };

    const handleDelete = async (product: ProductListItem) => {
        if (!isSuperuser) { showToast('error', 'Только суперадмин может удалять продукты'); return; }
        if (!confirm(`Удалить "${product.name}"? Это действие необратимо!`)) return;
        try {
            await productsApi.deleteProduct(product.id);
            forceRefresh();
            await loadStats();
            showToast('success', `"${product.name}" удален`);
        } catch {
            showToast('error', 'Ошибка при удалении');
        }
    };

    const handleBatchDelete = async () => {
        if (!isSuperuser) { showToast('error', 'Только суперадмин может удалять'); return; }
        if (selectedProducts.length === 0) return;
        if (!confirm(`Удалить ${selectedProducts.length} выбранных продуктов? Это необратимо!`)) return;
        try {
            const result = await productsApi.batchDelete(selectedProducts);
            setSelectedProducts([]);
            setSelectAll(false);
            forceRefresh();
            await loadStats();
            showToast('success', `Удалено ${result.deleted} продуктов`);
        } catch {
            showToast('error', 'Ошибка при удалении');
        }
    };

    const handleDeleteAll = async () => {
        if (!isSuperuser) { showToast('error', 'Только суперадмин может удалять'); return; }
        const input = prompt('Для удаления ВСЕХ продуктов введите "УДАЛИТЬ ВСЕ"');
        if (input !== 'УДАЛИТЬ ВСЕ') return;
        try {
            const result = await productsApi.deleteAll();
            setSelectedProducts([]);
            setSelectAll(false);
            forceRefresh();
            await loadStats();
            showToast('success', `Удалено ${result.deleted} продуктов`);
        } catch {
            showToast('error', 'Ошибка при удалении');
        }
    };

    // Single product edit
    const handleEditProduct = (product: ProductListItem) => {
        setEditingProduct(product);
        setShowEditModal(true);
    };

    const handleCloseEdit = () => { setShowEditModal(false); setEditingProduct(null); };

    const handleSaveProduct = async (data: ProductUpdate) => {
        if (!editingProduct) return;
        setEditLoading(true);
        try {
            await productsApi.updateProduct(editingProduct.id, data);
            forceRefresh();
            await loadStats();
            handleCloseEdit();
            showToast('success', `"${editingProduct.name}" обновлен`);
        } catch (error: unknown) {
            showToast('error', handleApiError(error, 'Ошибка при сохранении'));
        } finally {
            setEditLoading(false);
        }
    };

    // Price bulk edit
    const handlePriceBulkEditSave = async (data: PriceUpdateData) => {
        setPriceBulkEditLoading(true);
        try {
            const response = await productsApi.bulkUpdatePrices(data);
            setShowPriceBulkEdit(false);
            forceRefresh();
            await loadStats();
            if (response.failed_count === 0) {
                showToast('success', `Обновлено ${response.success_count} товаров`);
            } else {
                showToast('warning', `Обновлено ${response.success_count} из ${response.success_count + response.failed_count}`);
            }
        } catch (error: unknown) {
            showToast('error', handleApiError(error, 'Ошибка при изменении цен'));
        } finally {
            setPriceBulkEditLoading(false);
        }
    };

    // Bulk edit
    const getCommonCategories = useCallback(() => {
        if (selectedProducts.length === 0) return [];
        const selected = products.filter(p => selectedProducts.includes(p.id));
        if (selected.length === 0) return [];
        if (selected.length === 1) return selected[0].categories?.map(c => c.id) || [];
        const first = selected[0].categories?.map(c => c.id) || [];
        return first.filter(cid => selected.every(p => p.categories?.some(c => c.id === cid)));
    }, [selectedProducts, products]);

    const handleOpenBulkEdit = () => {
        setBulkEditData({
            price: '', discount_price: '', is_active: '', in_stock: '',
            category_ids: getCommonCategories(), brand_id: '',
        });
        setShowBulkEditModal(true);
    };

    const handleCloseBulkEdit = () => {
        setShowBulkEditModal(false);
        setBulkEditData({ price: '', discount_price: '', is_active: '', in_stock: '', category_ids: [], brand_id: '' });
    };

    const handleBulkEditChange = (field: BulkEditField, value: string | number[]) => {
        setBulkEditData(prev => ({ ...prev, [field]: value }));
    };

    const handleCategoryToggle = (categoryId: number) => {
        setBulkEditData(prev => ({
            ...prev,
            category_ids: prev.category_ids.includes(categoryId)
                ? prev.category_ids.filter(id => id !== categoryId)
                : [...prev.category_ids, categoryId],
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

            const resp = await productsApi.batchUpdateProducts({
                product_ids: selectedProducts, update_data: updateData,
            });

            forceRefresh();
            await loadStats();
            handleCloseBulkEdit();
            setSelectedProducts([]);
            setSelectAll(false);

            if (resp.failed_count > 0) {
                showToast('warning', `Обновлено ${resp.success_count} из ${selectedProducts.length}`);
            } else {
                showToast('success', `Обновлено ${resp.success_count} продуктов`);
            }
        } catch (error: unknown) {
            showToast('error', handleApiError(error, 'Ошибка массового редактирования'));
        } finally {
            setBulkEditLoading(false);
        }
    };


    // === Pagination ===

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);


    // === Render ===

    return (
        <div className="space-y-5">
            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <span className="text-red-800 text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
                        <XCircle className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Edit modal */}
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
                    <p className="text-sm text-gray-500">Управление каталогом продуктов</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={forceRefresh}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                        <RefreshCw className="h-4 w-4" /> Обновить
                    </button>
                    <button onClick={() => setShowPriceBulkEdit(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                        <DollarSign className="h-4 w-4" /> Изменить цены
                    </button>
                    <button onClick={() => alert('Модалка создания будет добавлена позже')}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        <Plus className="h-4 w-4" /> Добавить
                    </button>
                    {isSuperuser && (
                        <button onClick={handleDeleteAll}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                            <Trash2 className="h-4 w-4" /> Удалить всё
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Всего', value: stats.total_products, icon: Package, color: 'blue' },
                        { label: 'Активных', value: stats.active_products, icon: CheckCircle, color: 'green' },
                        { label: 'В наличии', value: stats.products_in_stock, icon: Package, color: 'yellow' },
                        { label: 'Неактивных', value: stats.inactive_products, icon: XCircle, color: 'red' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                            <div className={`w-9 h-9 bg-${color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`h-5 w-5 text-${color}-600`} />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">{label}</div>
                                <div className="text-xl font-bold text-gray-900">{value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Search & Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={e => handleSearchInput(e.target.value)}
                            placeholder="Поиск по названию, описанию, SKU, бренду..."
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {searchInput && (
                            <button onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <XCircle className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                        <Filter className="h-4 w-4" /> Фильтры
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Catalog */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Каталог</label>
                                <select value={filters.catalog_id || ''} disabled={loadingCatalogs}
                                    onChange={e => handleFilterChange({ ...filters, catalog_id: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                    <option value="">Все каталоги</option>
                                    {catalogs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            {/* Brand */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Бренд</label>
                                <select value={filters.brand_id || ''} disabled={loadingBrands}
                                    onChange={e => handleFilterChange({ ...filters, brand_id: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                    <option value="">Все бренды</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            {/* Category */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Категория</label>
                                <select value={filters.category_id || ''} disabled={loadingCategories}
                                    onChange={e => handleFilterChange({ ...filters, category_id: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                    <option value="">Все категории</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            {/* Status */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Статус</label>
                                <select value={filters.is_active === undefined ? '' : String(filters.is_active)}
                                    onChange={e => handleFilterChange({ ...filters, is_active: e.target.value === '' ? undefined : e.target.value === 'true' })}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                    <option value="">Все</option>
                                    <option value="true">Активные</option>
                                    <option value="false">Неактивные</option>
                                </select>
                            </div>
                            {/* In stock */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Наличие</label>
                                <select value={filters.in_stock === undefined ? '' : String(filters.in_stock)}
                                    onChange={e => handleFilterChange({ ...filters, in_stock: e.target.value === '' ? undefined : e.target.value === 'true' })}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                    <option value="">Все</option>
                                    <option value="true">В наличии</option>
                                    <option value="false">Нет в наличии</option>
                                </select>
                            </div>
                            {/* Price from */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Цена от</label>
                                <input type="number" value={filters.price_from || ''} placeholder="0"
                                    onChange={e => handleFilterChange({ ...filters, price_from: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            {/* Price to */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Цена до</label>
                                <input type="number" value={filters.price_to || ''} placeholder="∞"
                                    onChange={e => handleFilterChange({ ...filters, price_to: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                        </div>

                        {/* Active filter tags & controls */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {filters.catalog_id && (
                                <FilterTag label={`Каталог: ${catalogs.find(c => c.id === filters.catalog_id)?.name}`}
                                    onRemove={() => handleFilterChange({ ...filters, catalog_id: undefined })} />
                            )}
                            {filters.brand_id && (
                                <FilterTag label={`Бренд: ${brands.find(b => b.id === filters.brand_id)?.name}`}
                                    onRemove={() => handleFilterChange({ ...filters, brand_id: undefined })} />
                            )}
                            {filters.category_id && (
                                <FilterTag label={`Категория: ${categories.find(c => c.id === filters.category_id)?.name}`}
                                    onRemove={() => handleFilterChange({ ...filters, category_id: undefined })} />
                            )}
                            {filters.is_active !== undefined && (
                                <FilterTag label={filters.is_active ? 'Активные' : 'Неактивные'}
                                    onRemove={() => handleFilterChange({ ...filters, is_active: undefined })} />
                            )}
                            {filters.in_stock !== undefined && (
                                <FilterTag label={filters.in_stock ? 'В наличии' : 'Нет в наличии'}
                                    onRemove={() => handleFilterChange({ ...filters, in_stock: undefined })} />
                            )}
                            {(filters.price_from || filters.price_to) && (
                                <FilterTag label={`Цена: ${filters.price_from || 0} — ${filters.price_to || '∞'}`}
                                    onRemove={() => handleFilterChange({ ...filters, price_from: undefined, price_to: undefined })} />
                            )}

                            <div className="ml-auto flex items-center gap-3">
                                <button onClick={() => {
                                    setFilters({ brand_id: undefined, catalog_id: undefined, category_id: undefined, is_active: true, in_stock: undefined, price_from: undefined, price_to: undefined });
                                    clearSearch();
                                }} className="text-xs text-gray-500 hover:text-gray-700">
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

            {/* Products Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-gray-400" />
                        <span className="text-sm text-gray-500">Загрузка...</span>
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Продукты не найдены</p>
                    </div>
                ) : (
                    <>
                        {/* Selection bar */}
                        {selectedProducts.length > 0 && (
                            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
                                <span className="text-sm text-blue-800 font-medium">
                                    Выбрано: {selectedProducts.length}
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={handleOpenBulkEdit}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                                        Редактировать
                                    </button>
                                    {isSuperuser && (
                                        <button onClick={handleBatchDelete}
                                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                                            Удалить выбранные
                                        </button>
                                    )}
                                    <button onClick={() => setSelectedProducts([])}
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
                                            <input type="checkbox" checked={selectAll} onChange={handleSelectAll}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                                        </th>
                                        <th className="px-3 py-2.5 text-left">
                                            <SortButton label="Товар" field="name" current={sortBy} order={sortOrder} onSort={handleSort} />
                                        </th>
                                        <th className="px-3 py-2.5 text-right w-32">
                                            <SortButton label="Цена" field="price" current={sortBy} order={sortOrder} onSort={handleSort} />
                                        </th>
                                        <th className="px-3 py-2.5 text-left w-28">Бренд</th>
                                        <th className="px-3 py-2.5 text-left w-36">Категории</th>
                                        <th className="px-3 py-2.5 text-center w-20">Статус</th>
                                        <th className="px-3 py-2.5 text-left w-24">
                                            <SortButton label="Дата" field="created_at" current={sortBy} order={sortOrder} onSort={handleSort} />
                                        </th>
                                        <th className="px-3 py-2.5 text-right w-24">Действия</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {products.map(product => (
                                        <tr key={product.id}
                                            className={`hover:bg-gray-50 ${selectedProducts.includes(product.id) ? 'bg-blue-50/50' : ''}`}>
                                            {/* Checkbox */}
                                            <td className="px-3 py-2.5">
                                                <input type="checkbox" checked={selectedProducts.includes(product.id)}
                                                    onChange={() => handleSelectProduct(product.id)}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                                            </td>
                                            {/* Name + image */}
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
                                            {/* Price */}
                                            <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                                <div className="text-gray-900">{formatPrice(product.price)}</div>
                                                {product.discount_price && (
                                                    <div className="text-xs text-red-600">{formatPrice(product.discount_price)}</div>
                                                )}
                                            </td>
                                            {/* Brand */}
                                            <td className="px-3 py-2.5 text-gray-600 truncate max-w-[120px]">
                                                {product.brand?.name || '—'}
                                            </td>
                                            {/* Categories */}
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
                                            {/* Status */}
                                            <td className="px-3 py-2.5 text-center">
                                                <span className={`inline-block w-2 h-2 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-red-400'}`}
                                                    title={product.is_active ? 'Активен' : 'Неактивен'} />
                                            </td>
                                            {/* Date */}
                                            <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                                                {formatDate(product.created_at)}
                                            </td>
                                            {/* Actions */}
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <ActionBtn icon={Eye} onClick={() => alert(`Просмотр: ${product.name}`)} color="text-gray-400 hover:text-blue-600" title="Просмотр" />
                                                    <ActionBtn icon={Edit} onClick={() => handleEditProduct(product)} color="text-gray-400 hover:text-indigo-600" title="Редактировать" />
                                                    <ActionBtn
                                                        icon={product.is_active ? XCircle : CheckCircle}
                                                        onClick={() => handleToggleStatus(product)}
                                                        color={product.is_active ? 'text-gray-400 hover:text-yellow-600' : 'text-gray-400 hover:text-green-600'}
                                                        title={product.is_active ? 'Деактивировать' : 'Активировать'} />
                                                    {isSuperuser && (
                                                        <ActionBtn icon={Trash2} onClick={() => handleDelete(product)} color="text-gray-400 hover:text-red-600" title="Удалить" />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
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
                                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = Math.max(1, currentPage - 2) + i;
                                    if (page > totalPages) return null;
                                    return (
                                        <button key={page} onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 rounded text-sm ${page === currentPage
                                                ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                                            {page}
                                        </button>
                                    );
                                })}
                                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Price Bulk Edit Modal */}
            {showPriceBulkEdit && (
                <PriceBulkEditModal
                    isOpen={showPriceBulkEdit}
                    onClose={() => setShowPriceBulkEdit(false)}
                    onSave={handlePriceBulkEditSave}
                    brands={brands}
                    categories={categories}
                    catalogs={catalogs}
                    loading={priceBulkEditLoading}
                />
            )}

            {/* Bulk Edit Modal */}
            {showBulkEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-semibold">Массовое редактирование ({selectedProducts.length})</h2>
                            <button onClick={handleCloseBulkEdit} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <p className="text-xs text-gray-500">Заполните только поля, которые хотите изменить. Пустые поля останутся без изменений.</p>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Цена (₽)</label>
                                    <input type="number" value={bulkEditData.price} placeholder="Не изменять"
                                        onChange={e => handleBulkEditChange('price', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Цена со скидкой (₽)</label>
                                    <input type="number" value={bulkEditData.discount_price} placeholder="Не изменять"
                                        onChange={e => handleBulkEditChange('discount_price', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Статус</label>
                                    <select value={bulkEditData.is_active}
                                        onChange={e => handleBulkEditChange('is_active', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                        <option value="">Не изменять</option>
                                        <option value="true">Активен</option>
                                        <option value="false">Неактивен</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Наличие</label>
                                    <select value={bulkEditData.in_stock}
                                        onChange={e => handleBulkEditChange('in_stock', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                        <option value="">Не изменять</option>
                                        <option value="true">В наличии</option>
                                        <option value="false">Нет в наличии</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Бренд</label>
                                <select value={bulkEditData.brand_id} disabled={loadingBrands}
                                    onChange={e => handleBulkEditChange('brand_id', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                    <option value="">Не изменять</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Категории</label>
                                <div className="border border-gray-300 rounded-lg p-2 max-h-36 overflow-y-auto">
                                    {categories.map(cat => (
                                        <label key={cat.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                            <input type="checkbox" checked={bulkEditData.category_ids.includes(cat.id)}
                                                onChange={() => handleCategoryToggle(cat.id)}
                                                className="h-3.5 w-3.5 text-blue-600 border-gray-300 rounded" />
                                            <span className="text-sm text-gray-700">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {bulkEditData.category_ids.length > 0 && (
                                    <div className="mt-1 text-xs text-blue-600">Выбрано: {bulkEditData.category_ids.length}</div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-5 border-t">
                            <button onClick={handleCloseBulkEdit} disabled={bulkEditLoading}
                                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                                Отмена
                            </button>
                            <button onClick={handleBulkEditSave} disabled={bulkEditLoading}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                                {bulkEditLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                                {bulkEditLoading ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


// === Small helper components ===

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
            {label}
            <button onClick={onRemove} className="hover:text-gray-900"><XCircle className="h-3 w-3" /></button>
        </span>
    );
}

function SortButton({ label, field, current, order, onSort }: {
    label: string; field: string; current: string; order: string; onSort: (f: string) => void;
}) {
    return (
        <button onClick={() => onSort(field)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700">
            {label}
            {current === field && <span className="text-blue-600">{order === 'asc' ? '↑' : '↓'}</span>}
        </button>
    );
}

function ActionBtn({ icon: Icon, onClick, color, title }: {
    icon: React.ComponentType<{ className?: string }>; onClick: () => void; color: string; title: string;
}) {
    return (
        <button onClick={onClick} className={`p-1 rounded ${color}`} title={title}>
            <Icon className="h-4 w-4" />
        </button>
    );
}