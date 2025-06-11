// lib/utils/errors.ts - Строгая версия без any

export interface ValidationError {
    field: string;
    message: string;
}

export interface ApiErrorData {
    message?: string;
    errors?: ValidationError[];
    detail?: string;
    [key: string]: unknown;
}

export interface ApiErrorResponse {
    status: number;
    data?: ApiErrorData | string | null;
    statusText?: string;
}

export interface ApiError {
    response?: ApiErrorResponse;
    message?: string;
    code?: string;
    name?: string;
}

export function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as ApiError).response === 'object'
    );
}

export function getErrorMessage(error: unknown): string {
    if (isApiError(error)) {
        // Попробуем извлечь сообщение из разных мест
        const response = error.response;

        if (response?.data) {
            if (typeof response.data === 'string') {
                return response.data;
            }

            if (typeof response.data === 'object' && response.data !== null) {
                const data = response.data as ApiErrorData;

                if (data.message) return data.message;
                if (data.detail) return data.detail;

                // Если есть ошибки валидации, покажем первую
                if (data.errors && data.errors.length > 0) {
                    return `${data.errors[0].field}: ${data.errors[0].message}`;
                }
            }
        }

        return error.message || `HTTP ${response?.status}: ${response?.statusText || 'Unknown error'}`;
    }

    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'Неизвестная ошибка';
}

export function handleApiError(error: unknown, defaultMessage: string = 'Произошла ошибка'): string {
    if (isApiError(error)) {
        const status = error.response?.status;

        // Специфичные сообщения для разных статусов
        switch (status) {
            case 400:
                return getErrorMessage(error) || 'Некорректные данные запроса';
            case 401:
                return 'Необходима авторизация';
            case 403:
                return 'Недостаточно прав доступа';
            case 404:
                return 'Ресурс не найден';
            case 409:
                return 'Конфликт данных';
            case 422:
                return getErrorMessage(error) || 'Ошибка валидации данных';
            case 429:
                return 'Слишком много запросов. Попробуйте позже';
            case 500:
                return 'Ошибка сервера';
            case 502:
                return 'Сервер недоступен';
            case 503:
                return 'Сервис временно недоступен';
            default:
                return getErrorMessage(error) || defaultMessage;
        }
    }

    return getErrorMessage(error) || defaultMessage;
}

// Дополнительные утилиты для специфичных случаев
export function isValidationError(error: unknown): error is ApiError & {
    response: { data: { errors: ValidationError[] } }
} {
    return (
        isApiError(error) &&
        error.response?.status === 422 &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'errors' in error.response.data &&
        Array.isArray((error.response.data as ApiErrorData).errors)
    );
}

export function getValidationErrors(error: unknown): ValidationError[] {
    if (isValidationError(error)) {
        return (error.response.data as ApiErrorData).errors || [];
    }
    return [];
}