export interface Banner {
    id: number;
    image_url: string;
    title: string | null;
    subtitle: string | null;
    href: string | null;
    badge: string | null;
    text_color: string;
    show_button: boolean;       // ← новое
    expires_at?: string | null; // ← новое
    is_archived: boolean;
    sort_order: number;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export interface BannerReorderItem {
    id: number;
    sort_order: number;
}