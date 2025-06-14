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

// Типы для синхронизации задач
export interface SyncDetails {
    synced?: boolean;
    cleared?: number;
    active_scraper_tasks?: number;
    current_counters?: { [username: string]: number };
    error?: string;
}

// Информация о категориях
export interface CategoriesInfo {
    active_categories: number;
    total_categories: number;
    has_categories: boolean;
    error?: string;
}

export interface ActiveTasksResponse {
    total_active_tasks: number;
    max_global_limit: number;
    max_user_limit: number;
    tasks_by_user: { [username: string]: number };
    sync_info?: SyncDetails;  // ✅ Конкретный тип вместо any
    requested_by: string;
    timestamp: string;
}

// НОВЫЕ типы для синхронизации
export interface SyncTasksResponse {
    message: string;
    before: {
        user_tasks: number;
        total_tasks: number;
    };
    after: {
        user_tasks: number;
        total_tasks: number;
    };
    sync_details: SyncDetails; // ✅ Конкретный тип
    user: string;
    timestamp: string;
}

export interface CleanupTasksResponse {
    message: string;
    cleaned_tasks: number;
    user: string;
    timestamp: string;
}

export interface ReadinessResponse {
    ready: boolean;
    categories: CategoriesInfo; // ✅ Конкретный тип
    limits: {
        user_tasks: number;
        max_user_tasks: number;
        total_tasks: number;
        max_total_tasks: number;
        can_start_task: boolean;
    };
    sync_info: SyncDetails; // ✅ Конкретный тип
    issues: Array<{
        type: string;
        message: string;
        action: string;
    }>;
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
    taskId?: string; // API task ID
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

// Интерфейс для состояния системы на фронтенде
export interface SystemStatus {
    ready: boolean;
    user_tasks: number;
    max_user_tasks: number;
    total_tasks: number;
    max_total_tasks: number;
    can_start_task: boolean;
    issues: Array<{
        type: string;
        message: string;
        action: string;
    }>;
    last_sync?: Date;
    sync_error?: string;
}

// Базовый тип для ошибок
export interface BaseScraperError {
    code: string;
    message: string;
    timestamp?: string;
}

// Типы ошибок с конкретными деталями
export interface ScraperErrorWithDetails extends BaseScraperError {
    details?: {
        [key: string]: string | number | boolean | string[];
    };
}

// Специальные ошибки для разных случаев
export interface NoAccountsError extends BaseScraperError {
    code: 'NO_CATEGORIES';
    details: {
        active_categories: number;
        total_categories: number;
        instructions: string[];
        suggested_categories: string[];
    };
}

export interface LimitExceededError extends BaseScraperError {
    code: 'LIMIT_EXCEEDED';
    details: {
        current_tasks: number;
        max_tasks: number;
        task_type: 'user' | 'global';
    };
}

// Типы для обработки ошибок API
export interface ApiErrorResponse {
    detail?: string;
    message?: string;
    error_code?: string;
    details?: ScraperErrorWithDetails['details'];
}

export interface AxiosErrorWithResponse {
    response?: {
        data?: ApiErrorResponse;
        status?: number;
    };
    message?: string;
}

// Утилиты для проверки типов ошибок
export const isNoAccountsError = (error: unknown): error is NoAccountsError => {
    return typeof error === 'object' && error !== null && 'code' in error && (error as BaseScraperError).code === 'NO_CATEGORIES';
};

export const isLimitExceededError = (error: unknown): error is LimitExceededError => {
    return typeof error === 'object' && error !== null && 'code' in error && (error as BaseScraperError).code === 'LIMIT_EXCEEDED';
};

export const isAxiosError = (error: unknown): error is AxiosErrorWithResponse => {
    return typeof error === 'object' && error !== null && 'response' in error;
};