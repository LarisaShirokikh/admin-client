export interface VideoResponse {
    id: number;
    uuid: string;
    title: string;
    description?: string;
    url: string;
    thumbnail_url?: string;
    duration?: number;
    product_id?: number;
    is_active: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at?: string;
}

export interface VideoStats {
    total_videos: number;
    active_videos: number;
    inactive_videos: number;
    featured_videos: number;
    videos_with_products: number;
    videos_without_products: number;
    upload_limits: {
        user_uploads_this_hour: number;
        total_uploads_this_hour: number;
        user_limit: number;
        global_limit: number;
    };
    last_updated: string;
}

export interface VideoUploadData {
    file: File;
    title: string;
    description?: string;
    product_title?: string;
    is_featured?: boolean;
}

export interface VideoUpdateData {
    title?: string;
    description?: string;
    product_id?: number;
    is_active?: boolean;
    is_featured?: boolean;
}

export interface ProductSuggestion {
    product_id: number;
    product_name: string;
    similarity_score: number;
}

export interface SystemCheck {
    status: 'OK' | 'ERROR';
    checks: {
        media_dir_exists: boolean;
        media_dir_writable: boolean;
        temp_dir: string;
        temp_dir_writable: boolean;
        disk_space_mb: number;
        video_processor: string;
        upload_stats: {
            user_uploads_this_hour: number;
            total_uploads_this_hour: number;
            user_limit: number;
            global_limit: number;
        };
    };
    requested_by: string;
    timestamp: string;
}

// types/video.ts

export interface VideoResponse {
    id: number;
    uuid: string;
    title: string;
    description?: string;
    url: string;
    thumbnail_url?: string;
    duration?: number;
    product_id?: number;
    is_active: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at?: string;
}

export interface VideoStats {
    total_videos: number;
    active_videos: number;
    inactive_videos: number;
    featured_videos: number;
    videos_with_products: number;
    videos_without_products: number;
    upload_limits: {
        user_uploads_this_hour: number;
        total_uploads_this_hour: number;
        user_limit: number;
        global_limit: number;
    };
    last_updated: string;
    requested_by: string;
    user_role: string;
}

export interface VideoUploadData {
    file: File;
    title: string;
    description?: string;
    product_title?: string;
    is_featured?: boolean;
}

export interface VideoUpdateData {
    title?: string;
    description?: string;
    product_id?: number;
    is_active?: boolean;
    is_featured?: boolean;
}

export interface ProductSuggestion {
    product_id: number;
    product_name: string;
    similarity_score: number;
}

export interface SystemCheck {
    status: 'OK' | 'ERROR';
    checks: {
        media_dir_exists: boolean;
        media_dir_writable: boolean;
        temp_dir: string;
        temp_dir_writable: boolean;
        disk_space_mb: number;
        video_processor: string;
        upload_stats: {
            user_uploads_this_hour: number;
            total_uploads_this_hour: number;
            user_limit: number;
            global_limit: number;
        };
    };
    requested_by: string;
    timestamp: string;
    error?: string;
}

export interface UploadProgress {
    file: File;
    preview?: string;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    error?: string;
    videoResponse?: VideoResponse;
}

export interface EditingVideo {
    video: VideoResponse;
    title: string;
    description: string;
    is_featured: boolean;
}

export type VideoFilterStatus = 'all' | 'active' | 'inactive' | 'featured';

export interface VideoListParams {
    skip?: number;
    limit?: number;
    is_active?: boolean;
    is_featured?: boolean;
    product_id?: number;
}