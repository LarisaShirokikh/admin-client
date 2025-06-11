// Категории
export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    is_active: boolean;
    product_count: number;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    created_at: string;
    updated_at: string;
}

export interface CategoryCreate {
    name: string;
    description?: string;
    is_active: boolean;
    // image будет передаваться через FormData отдельно
}

export interface CategoryUpdate {
    name?: string;
    description?: string;
    is_active?: boolean;
}

export interface CategoryDeleteResponse {
    message: string;
    products_affected: number;
    products_deleted: number;
    products_unlinked: number;
}

export interface CategoryStatusToggleResponse {
    message: string;
    category: Category;
}