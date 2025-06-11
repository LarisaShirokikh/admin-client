'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { categoriesApi } from '@/lib/api/categories';
import { CategoryCreate } from '@/types/categories';
import { useToast } from '@/lib/contexts/ToastContext';

interface CreateCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FormData {
    name: string;
    description: string;
    is_active: boolean;
}

interface FormErrors {
    name?: string;
    description?: string;
    image?: string;
    general?: string;
}

export default function CreateCategoryModal({ isOpen, onClose }: CreateCategoryModalProps) {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        is_active: true
    });

    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});

    // Мутация для создания категории
    const createMutation = useMutation({
        mutationFn: async ({ categoryData, imageFile }: { categoryData: CategoryCreate; imageFile: File }) => {
            return categoriesApi.create(categoryData, imageFile);
        },
        onSuccess: (newCategory) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            showToast('success', `Категория "${newCategory.name}" создана успешно`);
            handleClose();
        },
        onError: (error: unknown) => {
            console.error('Error creating category:', error);

            let errorMessage = 'Ошибка при создании категории';

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as {
                    response?: {
                        data?: { detail?: string };
                        status?: number;
                    };
                };
                if (axiosError.response?.data?.detail) {
                    errorMessage = axiosError.response.data.detail;
                } else if (axiosError.response?.status) {
                    errorMessage = `Ошибка сервера: ${axiosError.response.status}`;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            setErrors({ general: errorMessage });
            showToast('error', errorMessage);
        }
    });

    // Валидация формы
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Валидация имени
        if (!formData.name.trim()) {
            newErrors.name = 'Название категории обязательно';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Название должно содержать минимум 2 символа';
        } else if (formData.name.trim().length > 255) {
            newErrors.name = 'Название не должно превышать 255 символов';
        }

        // Валидация описания
        if (formData.description && formData.description.length > 1000) {
            newErrors.description = 'Описание не должно превышать 1000 символов';
        }

        // Валидация изображения
        if (!selectedImage) {
            newErrors.image = 'Изображение обязательно';
        } else {
            const validation = categoriesApi.validateImage(selectedImage);
            if (!validation.valid) {
                newErrors.image = validation.error;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Обработка изменения полей формы
    const handleInputChange = (field: keyof FormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Очищаем ошибку для этого поля
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Обработка выбора изображения
    const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Валидация изображения
        const validation = categoriesApi.validateImage(file);
        if (!validation.valid) {
            setErrors(prev => ({ ...prev, image: validation.error }));
            return;
        }

        try {
            const preview = await categoriesApi.createImagePreview(file);
            setSelectedImage(file);
            setImagePreview(preview);
            setErrors(prev => ({ ...prev, image: undefined }));
        } catch (error) {
            console.error('Error creating image preview:', error);
            setErrors(prev => ({ ...prev, image: 'Ошибка при загрузке изображения' }));
        }
    };

    // Удаление выбранного изображения
    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Отправка формы
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateForm() || !selectedImage) {
            return;
        }

        const categoryData: CategoryCreate = {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            is_active: formData.is_active
        };

        createMutation.mutate({ categoryData, imageFile: selectedImage });
    };

    // Закрытие модального окна
    const handleClose = () => {
        setFormData({ name: '', description: '', is_active: true });
        setSelectedImage(null);
        setImagePreview(null);
        setErrors({});
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Создать категорию</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={createMutation.isPending}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Общая ошибка */}
                    {errors.general && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">{errors.general}</span>
                        </div>
                    )}

                    {/* Название */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Название категории <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            placeholder="Например: Входные двери"
                            disabled={createMutation.isPending}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    {/* Описание */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Описание
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            placeholder="Краткое описание категории..."
                            disabled={createMutation.isPending}
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                    </div>

                    {/* Изображение */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Изображение <span className="text-red-500">*</span>
                        </label>

                        {imagePreview ? (
                            <div className="relative">
                                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                                    disabled={createMutation.isPending}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                className={`w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${errors.image ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600 text-center">
                                    Нажмите для выбора изображения<br />
                                    <span className="text-xs text-gray-500">JPG, PNG, GIF, WebP (макс. 10MB)</span>
                                </p>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleImageSelect}
                            className="hidden"
                            disabled={createMutation.isPending}
                        />

                        {errors.image && (
                            <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                        )}
                    </div>

                    {/* Активность */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => handleInputChange('is_active', e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            disabled={createMutation.isPending}
                        />
                        <label htmlFor="is_active" className="text-sm text-gray-700">
                            Активная категория
                        </label>
                    </div>

                    {/* Кнопки */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            disabled={createMutation.isPending}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {createMutation.isPending ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Создание...
                                </>
                            ) : (
                                'Создать категорию'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}