// src/app/dashboard/products/page.tsx

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { AlertCircle, XCircle } from 'lucide-react';
import { BulkEditData, BulkEditField, ProductFilters, ProductListItem, ProductUpdate } from '@/types/products';
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
import { PriceUpdateData } from '@/types/products';

import ProductEditModal from '@/components/ProductEditModal';
import PriceBulkEditModal from '@/components/PriceBulkEditModal';
import ProductsHeader from '@/components/products/ProductsHeader';
import ProductsStatsCards from '@/components/products/ProductsStats';
import ProductsFiltersPanel from '@/components/products/ProductsFilters';
import ProductsTable from '@/components/products/ProductsTable';
import BulkEditModal from '@/components/products/BulkEditModal';


export default function ProductsPage() {
    const { isSuperuser } = useAuth();
    const { showToast } = useToast();
    const abortControllerRef = useRef<AbortController | null>(null);

    // ── State ──

    const [products, setProducts] = useState<ProductListItem[]>([]);
    const [stats, setStats] = useState<import('@/types/products').ProductsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Pagination & filters
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState<ProductFilters>({
        brand_id: undefined,
        catalog_id: undefined,
        category_id: undefined,
        is_active: true,
        in_stock: undefined,
        price_from: undefined,
        price_to: undefined,
    });
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Selection
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // Modals
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [bulkEditData, setBulkEditData] = useState<BulkEditData>({
        price: '', discount_price: '', is_active: '', in_stock: '',
        category_ids: [], brand_id: '',
    });
    const [bulkEditLoading, setBulkEditLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [showPriceBulkEdit, setShowPriceBulkEdit] = useState(false);
    const [priceBulkEditLoading, setPriceBulkEditLoading] = useState(false);

    // Reference data
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [catalogs, setCatalogs] = useState<Catalog[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);


    // ── Helpers ──

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


    // ── Load reference data ──

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


    // ── Load products ──

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


    // ── Search & filter handlers ──

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

    const handleFilterChange = (newFilters: ProductFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };


    // ── Sort handlers ──

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setCurrentPage(1);
    };


    // ── Selection handlers ──

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


    // ── Single product actions ──

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

    const handleEditProduct = (product: ProductListItem) => {
        setEditingProduct(product);
        setShowEditModal(true);
    };

    const handleSaveProduct = async (data: ProductUpdate) => {
        if (!editingProduct) return;
        setEditLoading(true);
        try {
            await productsApi.updateProduct(editingProduct.id, data);
            forceRefresh();
            await loadStats();
            setShowEditModal(false);
            setEditingProduct(null);
            showToast('success', `"${editingProduct.name}" обновлен`);
        } catch (error: unknown) {
            showToast('error', handleApiError(error, 'Ошибка при сохранении'));
        } finally {
            setEditLoading(false);
        }
    };


    // ── Batch actions ──

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


    // ── Bulk edit ──

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
            setShowBulkEditModal(false);
            setBulkEditData({ price: '', discount_price: '', is_active: '', in_stock: '', category_ids: [], brand_id: '' });
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


    // ── Price bulk edit ──

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


    // ── Render ──

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

            {/* Single edit modal */}
            {showEditModal && editingProduct && (
                <ProductEditModal
                    product={editingProduct}
                    brands={brands}
                    categories={categories}
                    loading={editLoading}
                    onSave={handleSaveProduct}
                    onClose={() => { setShowEditModal(false); setEditingProduct(null); }}
                />
            )}

            {/* Header */}
            <ProductsHeader
                isSuperuser={isSuperuser}
                onRefresh={forceRefresh}
                onPriceBulkEdit={() => setShowPriceBulkEdit(true)}
                onAdd={() => alert('Модалка создания будет добавлена позже')}
                onDeleteAll={handleDeleteAll}
            />

            {/* Stats */}
            {stats && <ProductsStatsCards stats={stats} />}

            {/* Search & Filters */}
            <ProductsFiltersPanel
                searchInput={searchInput}
                filters={filters}
                totalItems={totalItems}
                referenceData={{ brands, categories, catalogs, loadingBrands, loadingCategories, loadingCatalogs }}
                onSearchChange={handleSearchInput}
                onClearSearch={clearSearch}
                onFilterChange={handleFilterChange}
            />

            {/* Products Table */}
            <ProductsTable
                products={products}
                loading={loading}
                isSuperuser={isSuperuser}
                selectedProducts={selectedProducts}
                selectAll={selectAll}
                onSelectProduct={handleSelectProduct}
                onSelectAll={handleSelectAll}
                sortConfig={{ sortBy, sortOrder }}
                onSort={handleSort}
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onEdit={handleEditProduct}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
                onView={(p) => alert(`Просмотр: ${p.name}`)}
                onBulkEdit={handleOpenBulkEdit}
                onBatchDelete={handleBatchDelete}
                onClearSelection={() => setSelectedProducts([])}
            />

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
                <BulkEditModal
                    selectedCount={selectedProducts.length}
                    data={bulkEditData}
                    brands={brands}
                    categories={categories}
                    loadingBrands={loadingBrands}
                    loading={bulkEditLoading}
                    onChange={handleBulkEditChange}
                    onCategoryToggle={handleCategoryToggle}
                    onSave={handleBulkEditSave}
                    onClose={() => {
                        setShowBulkEditModal(false);
                        setBulkEditData({ price: '', discount_price: '', is_active: '', in_stock: '', category_ids: [], brand_id: '' });
                    }}
                />
            )}
        </div>
    );
}