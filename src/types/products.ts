import { Brand } from "./admin";
import { Catalog } from "./catalogs";
import { Category } from "./categories";

// ========== ОСНОВНЫЕ ИНТЕРФЕЙСЫ ДЛЯ ИЗОБРАЖЕНИЙ ==========

export interface ProductImage {
    id: number;
    url: string;
    is_main: boolean;
    alt_text?: string;
    sort_order?: number;
    created_at: string;
    updated_at: string;
}

export interface NewProductImage {
    url?: string;
    file?: File;
    is_main: boolean;
    alt_text?: string;
}

export interface ImageUpdateData {
    new_images?: NewProductImage[];
    delete_image_ids?: number[];
    main_image_id?: number | null;
}

// ========== БАЗОВЫЕ ИНТЕРФЕЙСЫ ТОВАРА ==========

export interface ProductBase {
    id: number;
    name: string;
    slug: string;
    description?: string;
    price: number;
    discount_price?: number;
    sku?: string;
    is_active: boolean;
    in_stock: boolean;
    stock_quantity?: number;
    brand?: Brand;
    categories?: Category[];
    created_at: string;
    updated_at: string;
}

export interface ProductListItem extends ProductBase {
    main_image?: string;
    images?: ProductImage[];
}

export interface ProductDetail extends ProductBase {
    images: ProductImage[];
    specifications?: Record<string, string | number | boolean>;
    meta_title?: string;
    meta_description?: string;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
    materials?: string[];
    colors?: string[];
}

// ========== ИНТЕРФЕЙСЫ ДЛЯ СОЗДАНИЯ И ОБНОВЛЕНИЯ ==========

export interface ProductCreate {
    name: string;
    slug?: string;
    description?: string;
    price: number;
    discount_price?: number;
    sku?: string;
    is_active?: boolean;
    in_stock?: boolean;
    stock_quantity?: number;
    brand_id?: number;
    category_ids?: number[];
    images?: NewProductImage[];
    specifications?: Record<string, string | number | boolean>;
    meta_title?: string;
    meta_description?: string;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
}

export interface ProductUpdate {
    name?: string;
    slug?: string;
    description?: string;
    price?: number;
    discount_price?: number;
    sku?: string;
    is_active?: boolean;
    in_stock?: boolean;
    stock_quantity?: number;
    brand_id?: number;
    category_ids?: number[];
    images?: ImageUpdateData;
    specifications?: Record<string, string | number | boolean>;
    meta_title?: string;
    meta_description?: string;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
}

// ========== ИНТЕРФЕЙСЫ ДЛЯ МОДАЛЬНОГО ОКНА ==========

export interface ProductEditModalProps {
    product: ProductListItem | ProductDetail;
    brands: Brand[];
    categories: Category[];
    loading: boolean;
    onSave: (data: ProductUpdate) => void;
    onClose: () => void;
}

// ========== ИНТЕРФЕЙСЫ ДЛЯ ФИЛЬТРАЦИИ И ПОИСКА ==========

export interface ProductFilter {
    page: number;
    per_page: number;
    search?: string;
    brand_id?: number;
    category_id?: number;
    catalog_id?: number;
    min_price?: number;
    max_price?: number;
    is_active?: boolean;
    in_stock?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface ProductsListParams {
    skip?: number;
    limit?: number;
    search?: string;
    brand_id?: number;
    catalog_id?: number;
    category_id?: number;
    price_from?: number;
    price_to?: number;
    in_stock?: boolean;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

// ========== ИНТЕРФЕЙСЫ ДЛЯ СТАТИСТИКИ ==========

export interface ProductsStats {
    total_products: number;
    active_products: number;
    inactive_products: number;
    products_in_stock: number;
    products_out_of_stock: number;
    products_with_brand: number;
    products_without_brand: number;
    products_with_catalog: number;
    products_without_catalog: number;
    last_updated: string;
    requested_by: string;
    user_role: string;
}

// ========== ИНТЕРФЕЙСЫ ДЛЯ МАССОВОГО РЕДАКТИРОВАНИЯ ==========

export type BulkEditField = 'price' | 'discount_price' | 'is_active' | 'in_stock' | 'category_ids' | 'brand_id';

export interface BulkEditData {
    price: string;
    discount_price: string;
    is_active: string;
    in_stock: string;
    category_ids: number[];
    brand_id: string;
}

export interface BatchUpdateRequest {
    product_ids: number[];
    update_data: ProductUpdate;
}

export interface BatchUpdateResponse {
    success_count: number;
    failed_count: number;
    updated_products: number[];
    failed_products: Array<{
        product_id: number;
        error: string;
    }>;
}

// ========== ИНТЕРФЕЙСЫ ДЛЯ МАССОВОГО ИЗМЕНЕНИЯ ЦЕН ==========

export type PriceScope = 'all' | 'brand' | 'category' | 'catalog';
export type PriceType = 'both' | 'main' | 'discount';
export type ChangeType = 'percent' | 'fixed';
export type Direction = 'increase' | 'decrease';

export interface PriceUpdateData {
    scope: string;
    scope_id?: number;
    price_type: string;
    change_type: string;
    change_value: number;
    direction: string;
    only_active?: boolean;
    only_in_stock?: boolean;
    price_range?: { [key: string]: number | undefined };
}

export interface BulkPriceUpdateResponse {
    success_count: number;
    failed_count: number;
    updated_products: number[];
    failed_products: Array<{ product_id: number; error: string }>;
    total_price_change: number;
}

export interface ProductCountRequest {
    scope: string;
    scope_id?: number;
    only_active?: boolean;
    only_in_stock?: boolean;
    price_range?: { [key: string]: number | undefined };
}

export interface PriceBulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: PriceUpdateData) => void;
    brands: Brand[];
    categories: Category[];
    catalogs: Catalog[];
    loading: boolean;
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ИНТЕРФЕЙСЫ ==========

export interface ProductResponse {
    id: number;
    name: string;
    is_active: boolean;
    message?: string;
}

export interface FileUploadResponse {
    success: boolean;
    url?: string;
    error?: string;
}

export interface ImageUploadResponse {
    id: number;
    url: string;
    is_main: boolean;
    alt_text?: string;
    message: string;
}

// ========== ИНТЕРФЕЙСЫ ДЛЯ РАБОТЫ С ИЗОБРАЖЕНИЯМИ В КОМПОНЕНТЕ ==========

export interface ImageUploadData {
    id?: number;
    url: string;
    is_main: boolean;
    file?: File;
    isNew?: boolean;
    toDelete?: boolean;
}