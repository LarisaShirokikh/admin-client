// Каталоги
export interface Catalog {
    id: number;
    name: string;
    slug: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CatalogCreate {
    name: string;
    description?: string;
    is_active: boolean;
}

export interface CatalogUpdate {
    name?: string;
    description?: string;
    is_active?: boolean;
}

export interface CatalogStats {
    total_catalogs: number;
    active_catalogs: number;
    inactive_catalogs: number;
    last_updated: string;
    requested_by: string;
    user_role: string;
}