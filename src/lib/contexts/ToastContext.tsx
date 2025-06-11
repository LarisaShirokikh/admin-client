// src/lib/contexts/ToastContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (type: Toast['type'], message: string, duration?: number) => void;
    removeToast: (id: string) => void;
    clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (type: Toast['type'], message: string, duration = 5000) => {
        const id = Date.now().toString() + Math.random().toString(36).substring(2);
        const newToast: Toast = { id, type, message, duration };

        setToasts(prev => [...prev, newToast]);

        // Автоматическое удаление
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const clearAll = () => {
        setToasts([]);
    };

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast, clearAll }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

// Компонент для отображения тостов
function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-3 w-96">
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onRemove={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

// Отдельный компонент тоста для анимаций
interface ToastItemProps {
    toast: Toast;
    onRemove: () => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const getToastStyles = () => {
        switch (toast.type) {
            case 'success':
                return {
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
                    textColor: 'text-green-800'
                };
            case 'error':
                return {
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    icon: <XCircle className="h-5 w-5 text-red-500" />,
                    textColor: 'text-red-800'
                };
            case 'warning':
                return {
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
                    textColor: 'text-yellow-800'
                };
            case 'info':
                return {
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    icon: <Info className="h-5 w-5 text-blue-500" />,
                    textColor: 'text-blue-800'
                };
            default:
                return {
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    icon: <Info className="h-5 w-5 text-gray-500" />,
                    textColor: 'text-gray-800'
                };
        }
    };

    const styles = getToastStyles();

    return (
        <div className={`w-full ${styles.bgColor} border ${styles.borderColor} shadow-lg rounded-lg pointer-events-auto transform transition-all duration-300 ease-in-out animate-in slide-in-from-right`}>
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            {styles.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-5 ${styles.textColor}`}>
                                {toast.message}
                            </p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                        <button
                            onClick={onRemove}
                            className={`inline-flex rounded-md p-1.5 ${styles.textColor} hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors`}
                            aria-label="Закрыть уведомление"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Хук для использования тостов
export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Экспорт дополнительных утилит для удобства
export const toast = {
    success: (message: string, duration?: number) => {
        return { type: 'success' as const, message, duration };
    },
    error: (message: string, duration?: number) => {
        return { type: 'error' as const, message, duration };
    },
    warning: (message: string, duration?: number) => {
        return { type: 'warning' as const, message, duration };
    },
    info: (message: string, duration?: number) => {
        return { type: 'info' as const, message, duration };
    }
};