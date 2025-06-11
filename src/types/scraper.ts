// types/scraper.ts

// Результат выполнения скрайпера
export interface ScraperResult {
    message?: string;
    processed_items?: number;
    created_products?: number;
    updated_products?: number;
    errors?: string[];
    categories_created?: string[];
    brand_created?: string;
    execution_time?: number;
    total_urls_processed?: number;
    failed_urls?: string[];
}

export interface ScraperRequest {
    catalog_urls: string[];
}

export interface ScraperResponse {
    task_id: string;
    message: string;
    initiated_by: string;
    urls_count: number;
}

export interface ScraperStatus {
    task_id: string;
    status: string;
    progress?: number;
    result?: ScraperResult; // ✅ Конкретный тип вместо any
    error?: string;
}

export interface ActiveTasksResponse {
    total_active_tasks: number;
    max_global_limit: number;
    max_user_limit: number;
    tasks_by_user: { [username: string]: number };
    requested_by: string;
    timestamp: string;
}

export interface ScraperType {
    id: string;
    name: string;
    description: string;
    color: string;
    endpoint: string;
    placeholder: string;
    examples: string[];
}

export interface Task {
    id: string;
    type: string;
    status: 'running' | 'completed' | 'failed' | 'pending';
    urls: string[];
    startTime: Date;
    progress?: number;
    result?: ScraperResult; // ✅ Конкретный тип вместо any
    error?: string;
}

// Расширенные типы для мониторинга
export interface TaskProgress {
    current_url?: string;
    processed_urls?: number;
    total_urls?: number;
    current_products?: number;
    errors_count?: number;
    estimated_time_remaining?: number;
}

export interface TaskDetails extends Task {
    detailed_progress?: TaskProgress;
    logs?: string[];
    started_by?: string;
    created_at?: string;
    updated_at?: string;
}