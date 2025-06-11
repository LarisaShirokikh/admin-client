// types/settings.ts

// Профиль пользователя
export interface UserProfile {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    is_superuser: boolean;
    date_joined: string;
    last_login: string | null;
    avatar?: string;
}

// Обновление профиля пользователя
export interface UserProfileUpdate {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
}

// Запрос на смену пароля
export interface PasswordChangeRequest {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

// Системные настройки
export interface SystemSettings {
    site_name: string;
    site_description?: string;
    site_logo?: string;
    max_upload_size: number; // в MB
    max_videos_per_hour: number;
    auto_activate_uploads: boolean;
    maintenance_mode: boolean;
    allow_registration: boolean;
    email_verification_required: boolean;
    session_timeout: number; // в минутах
    max_login_attempts: number;
    backup_retention_days: number;
    log_level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

// Настройки уведомлений
export interface NotificationSettings {
    email_notifications: boolean;
    upload_notifications: boolean;
    error_notifications: boolean;
    daily_reports: boolean;
    weekly_reports: boolean;
    system_alerts: boolean;
    maintenance_notifications: boolean;
    security_alerts: boolean;
    email_digest_frequency: 'never' | 'daily' | 'weekly' | 'monthly';
}

// API ключ
export interface ApiKey {
    id: number;
    name: string;
    key: string;
    is_active: boolean;
    created_at: string;
    last_used_at: string | null;
    expires_at: string | null;
    permissions: string[];
    usage_count: number;
    rate_limit: number | null;
}

// Создание API ключа
export interface ApiKeyCreate {
    name: string;
    expires_at?: string;
    permissions?: string[];
    rate_limit?: number;
}

// Обновление API ключа
export interface ApiKeyUpdate {
    name?: string;
    is_active?: boolean;
    expires_at?: string;
    permissions?: string[];
    rate_limit?: number;
}

// Статистика базы данных
export interface DatabaseStats {
    total_products: number;
    total_videos: number;
    total_users: number;
    total_orders: number;
    database_size: string;
    storage_used: string;
    storage_available: string;
}

// Системная информация
export interface SystemInfo {
    version: string;
    environment: 'development' | 'staging' | 'production';
    uptime: string;
    server_time: string;
    timezone: string;
    python_version: string;
    django_version: string;
    database_engine: string;
    database_version: string;
    redis_version?: string;
    disk_usage: {
        total: string;
        used: string;
        free: string;
        percent: number;
    };
    memory_usage: {
        total: string;
        used: string;
        free: string;
        percent: number;
    };
    cpu_usage: number;
    load_average: number[];
    database_stats: DatabaseStats;
    active_sessions: number;
    cache_status: {
        enabled: boolean;
        hit_rate?: number;
        keys_count?: number;
    };
}

// Результат создания бэкапа
export interface BackupResult {
    status: 'success' | 'error';
    filename: string;
    size: string;
    created_at: string;
    message?: string;
}

// Результат очистки кэша
export interface ClearCacheResult {
    status: 'success' | 'error';
    cleared_keys: number;
    message?: string;
}

// Настройки электронной почты
export interface EmailSettings {
    smtp_host: string;
    smtp_port: number;
    smtp_use_tls: boolean;
    smtp_use_ssl: boolean;
    smtp_username: string;
    smtp_password?: string;
    default_from_email: string;
    admin_email: string;
    test_mode: boolean;
}

// Настройки безопасности
export interface SecuritySettings {
    password_min_length: number;
    password_require_uppercase: boolean;
    password_require_lowercase: boolean;
    password_require_digits: boolean;
    password_require_symbols: boolean;
    session_cookie_age: number;
    csrf_protection: boolean;
    secure_ssl_redirect: boolean;
    two_factor_auth_required: boolean;
    ip_whitelist: string[];
    max_failed_login_attempts: number;
    account_lockout_duration: number; // в минутах
}

// Настройки хранилища
export interface StorageSettings {
    storage_backend: 'local' | 's3' | 'gcs' | 'azure';
    aws_access_key_id?: string;
    aws_secret_access_key?: string;
    aws_storage_bucket_name?: string;
    aws_s3_region_name?: string;
    gcs_bucket_name?: string;
    gcs_credentials_file?: string;
    azure_account_name?: string;
    azure_account_key?: string;
    azure_container?: string;
    max_file_size: number; // в MB
    allowed_file_types: string[];
    image_quality: number; // 1-100
    thumbnail_sizes: number[];
}

// Настройки интеграций
export interface IntegrationSettings {
    google_analytics_id?: string;
    yandex_metrika_id?: string;
    facebook_pixel_id?: string;
    telegram_bot_token?: string;
    telegram_chat_id?: string;
    slack_webhook_url?: string;
    discord_webhook_url?: string;
    enable_api_logging: boolean;
    webhook_timeout: number;
    external_api_rate_limit: number;
}

// Группировка всех настроек
export interface AllSettings {
    system: SystemSettings;
    notifications: NotificationSettings;
    email: EmailSettings;
    security: SecuritySettings;
    storage: StorageSettings;
    integrations: IntegrationSettings;
}

// Экспорт настроек
export interface SettingsExport {
    version: string;
    exported_at: string;
    settings: AllSettings;
}

// Импорт настроек
export interface SettingsImport {
    file: File;
    overwrite_existing: boolean;
    backup_before_import: boolean;
}