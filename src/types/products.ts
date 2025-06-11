import { Brand } from "./admin";
import { Catalog } from "./catalogs";
import { Category } from "./categories";

export interface ProductImage {
    id: number;
    url: string;
    alt_text?: string;
    is_main: boolean;
    sort_order: number;
}

export interface ProductListItem {
    id: number;
    name: string;
    slug: string;
    description?: string;
    price: number;
    discount_price?: number;
    stock_quantity: number;
    in_stock?: boolean;
    is_active: boolean;
    is_featured: boolean;
    brand?: Brand;
    catalog?: Catalog;
    categories?: Category[];
    main_image?: string;
    created_at: string;
    updated_at: string;
}

export interface ProductDetail extends ProductListItem {
    content?: string;
    meta_title?: string;
    meta_description?: string;
    weight?: number;
    dimensions?: string;
    categories: Category[];
    product_images: ProductImage[];
    tags: string[];
}

export interface ProductCreate {
    name: string;
    slug?: string;
    description?: string;
    content?: string;
    price: number;
    discount_price?: number;
    stock_quantity: number;
    in_stock?: boolean;
    is_active?: boolean;
    is_featured?: boolean;
    brand_id?: number;
    catalog_id?: number;
    category_ids?: number[];
    meta_title?: string;
    meta_description?: string;
    weight?: number;
    dimensions?: string;
    tags?: string[];
}

export type ProductUpdate = Partial<ProductCreate>;

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

export interface ProductsStats {
    total_products: number;
    active_products: number;
    inactive_products: number;
    products_with_brand: number;
    products_with_catalog: number;
    products_in_stock: number;
    products_out_of_stock: number;
    last_updated: string;
    requested_by: string;
    user_role: string;
}

export interface ProductsCountParams {
    search?: string;
    brand_id?: number;
    catalog_id?: number;
    category_id?: number;
    price_from?: number;
    price_to?: number;
    in_stock?: boolean;
    is_active?: boolean;
}

export interface BulkEditData {
    price: string;
    discount_price: string;
    is_active: string;
    in_stock: string;
    category_ids: number[];
    brand_id: string;
}

export type BulkEditField = keyof BulkEditData;

export interface BatchUpdateRequest {
    product_ids: number[];
    update_data: Partial<ProductUpdate>;
}

export interface BatchUpdateResponse {
    success_count: number;
    failed_count: number;
    updated_products: number[];
    failed_products: Array<{ product_id: number; error: string }>;
}

export interface ProductsCountParams {
    search?: string;
    brand_id?: number;
    catalog_id?: number;
    category_id?: number;
    is_active?: boolean;
    in_stock?: boolean;
    price_from?: number;
    price_to?: number;
}

export interface ProductEditData {
    name?: string;
    description?: string;
    price?: number;
    discount_price?: number;
    brand_id?: number;
    is_active?: boolean;
    in_stock?: boolean;
    category_ids?: number[];
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



export type PriceScope = 'all' | 'brand' | 'category' | 'catalog';
export type PriceType = 'both' | 'main' | 'sale';
export type ChangeType = 'percent' | 'fixed';
export type Direction = 'increase' | 'decrease';

export interface PriceUpdateData {
    scope: PriceScope;
    scopeId?: number;
    priceType: PriceType;
    changeType: ChangeType;
    changeValue: number;
    direction: Direction;
    onlyActive?: boolean;
    onlyInStock?: boolean;
    priceRange?: {
        from?: number;
        to?: number;
    };
}

export interface BulkPriceUpdateResponse {
    success_count: number;
    failed_count: number;
    updated_products: number[];
    failed_products: Array<{ product_id: number; error: string }>;
    total_price_change: number;
}

export interface ProductEditModalProps {
    product: ProductListItem;
    brands: Brand[];
    categories: Category[];
    loading: boolean;
    onSave: (data: ProductUpdate) => void;
    onClose: () => void;
}