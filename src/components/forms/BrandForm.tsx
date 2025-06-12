'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Brand, BrandCreate, BrandUpdate } from '@/types/admin';

// Промежуточный интерфейс для данных формы
interface BrandFormData {
    name: string;
    slug: string;
    description: string;
    website: string;
    logo_url: string;
    is_active: boolean;
}

interface BrandFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: BrandCreate | BrandUpdate) => void;
    initialData?: Brand | null;
    isLoading?: boolean;
    title?: string;
    mode: 'create' | 'edit';
}

export default function BrandForm({
    isOpen,
    onClose,
    onSubmit,
    initialData = null,
    isLoading = false,
    title,
    mode
}: BrandFormProps) {
    const [formData, setFormData] = useState<BrandFormData>({
        name: '',
        slug: '',
        description: '',
        website: '',
        logo_url: '',
        is_active: true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [logoPreview, setLogoPreview] = useState<string>('');

    // Автоматическое заполнение формы при редактировании
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                name: initialData.name || '',
                slug: initialData.slug || '',
                description: initialData.description || '',
                website: initialData.website || '',
                logo_url: initialData.logo_url || '',
                is_active: initialData.is_active ?? true
            });
            setLogoPreview(initialData.logo_url || '');
        } else if (mode === 'create') {
            // Сброс формы для создания
            setFormData({
                name: '',
                slug: '',
                description: '',
                website: '',
                logo_url: '',
                is_active: true
            });
            setLogoPreview('');
        }
        setErrors({});
    }, [mode, initialData, isOpen]);

    // Автогенерация slug из названия
    useEffect(() => {
        if (mode === 'create' && formData.name && !formData.slug) {
            const generatedSlug = formData.name
                .toLowerCase()
                .replace(/[^a-z0-9а-яё\s-]/gi, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            setFormData(prev => ({ ...prev, slug: generatedSlug }));
        }
    }, [formData.name, mode]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Название обязательно';
        } else if (formData.name.length < 2) {
            newErrors.name = 'Название должно содержать минимум 2 символа';
        }

        if (!formData.slug.trim()) {
            newErrors.slug = 'Slug обязателен';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug = 'Slug может содержать только строчные буквы, цифры и дефисы';
        }

        if (formData.website && !isValidUrl(formData.website)) {
            newErrors.website = 'Введите корректный URL сайта';
        }

        if (formData.logo_url && !isValidUrl(formData.logo_url)) {
            newErrors.logo_url = 'Введите корректный URL логотипа';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Очистка ошибки при изменении поля
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleLogoUrlChange = (value: string) => {
        handleInputChange('logo_url', value);
        setLogoPreview(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (mode === 'create') {
            // Для создания
            const createData: BrandCreate = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                description: formData.description.trim() || undefined,
                website: formData.website.trim() || undefined,
                logo_url: formData.logo_url.trim() || undefined,
                is_active: formData.is_active
            };
            onSubmit(createData);
        } else {
            // Для обновления
            const updateData: BrandUpdate = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                description: formData.description.trim() || undefined,
                website: formData.website.trim() || undefined,
                logo_url: formData.logo_url.trim() || undefined,
                is_active: formData.is_active
            };
            onSubmit(updateData);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const modalTitle = title || (mode === 'edit' ? 'Редактировать бренд' : 'Создать бренд');
    const submitButtonText = mode === 'edit' ? 'Обновить' : 'Создать';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {modalTitle}
                    </h3>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Название */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Название *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="Введите название бренда"
                            disabled={isLoading}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slug *
                        </label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase())}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.slug ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="url-friendly-name"
                            disabled={isLoading}
                        />
                        {errors.slug && (
                            <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Используется в URL. Только строчные буквы, цифры и дефисы.
                        </p>
                    </div>

                    {/* Описание */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Описание
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Краткое описание бренда"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Сайт */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Веб-сайт
                        </label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.website ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="https://example.com"
                            disabled={isLoading}
                        />
                        {errors.website && (
                            <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                        )}
                    </div>

                    {/* Логотип */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL логотипа
                        </label>
                        <input
                            type="url"
                            value={formData.logo_url}
                            onChange={(e) => handleLogoUrlChange(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.logo_url ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="https://example.com/logo.png"
                            disabled={isLoading}
                        />
                        {errors.logo_url && (
                            <p className="mt-1 text-sm text-red-600">{errors.logo_url}</p>
                        )}

                        {/* Превью логотипа */}
                        {logoPreview && (
                            <div className="mt-2">
                                <div className="text-xs text-gray-500 mb-1">Превью:</div>
                                <div className="flex items-center">
                                    <img
                                        src={logoPreview}
                                        alt="Превью логотипа"
                                        className="h-12 w-12 object-cover rounded border"
                                        onError={() => setLogoPreview('')}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Статус активности */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => handleInputChange('is_active', e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            disabled={isLoading}
                        />
                        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                            Активный бренд
                        </label>
                    </div>

                    {/* Кнопки */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {isLoading ? 'Обработка...' : submitButtonText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}