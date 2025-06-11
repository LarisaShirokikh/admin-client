'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { categoriesApi } from '@/lib/api/categories';
import { Category, CategoryUpdate } from '@/types/categories';
import { useToast } from '@/lib/contexts/ToastContext';

interface EditCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category | null;
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

export default function EditCategoryModal({ isOpen, onClose, category }: EditCategoryModalProps) {
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
    const [keepCurrentImage, setKeepCurrentImage] = useState(true);
    const [errors, setErrors] = useState<FormErrors>({});

    // Заполняем форму данными категории при открытии
    useEffect(() => {
        if (isOpen && category) {
            setFormData({
                name: category.name,
                description: category.description || '',
                is_active: category.is_active
            });
            setImagePreview(category.image_url || null);
            setKeepCurrentImage(true);
            setSelectedImage(null);
            setErrors({});
        }
    }, [isOpen, category]);

    // Мутация для обновления категории
    const updateMutation = useMutation({
        mutationFn: async ({ categoryId, categoryData, imageFile }: {
            categoryId: number;
            categoryData: CategoryUpdate;
            imageFile?: File
        }) => {
            return categoriesApi.update(categoryId, categoryData, imageFile);
        },
        onSuccess: (updatedCategory) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            showToast('success', `Категория "${updatedCategory.name}" обновлена успешно`);
            handleClose();
        },
        onError: (error: unknown) => {
            console.error('Error updating category:', error);

            let errorMessage = 'Ошибка при обновлении категории';

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

        // Валидация изображения (только если выбрано новое)
        if (selectedImage) {
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

    // Обработка выбора нового изображения
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
            setKeepCurrentImage(false);
            setErrors(prev => ({ ...prev, image: undefined }));
        } catch (error) {
            console.error('Error creating image preview:', error);
            setErrors(prev => ({ ...prev, image: 'Ошибка при загрузке изображения' }));
        }
    };

    // Возврат к текущему изображению
    const handleRestoreCurrentImage = () => {
        setSelectedImage(null);
        setImagePreview(category?.image_url || null);
        setKeepCurrentImage(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setErrors(prev => ({ ...prev, image: undefined }));
    };

    // Отправка формы
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateForm() || !category) {
            return;
        }

        // Определяем какие поля изменились
        const categoryData: CategoryUpdate = {};

        if (formData.name.trim() !== category.name) {
            categoryData.name = formData.name.trim();
        }

        if (formData.description.trim() !== (category.description || '')) {
            categoryData.description = formData.description.trim() || undefined;
        }

        if (formData.is_active !== category.is_active) {
            categoryData.is_active = formData.is_active;
        }

        // Если ничего не изменилось и нет нового изображения
        if (Object.keys(categoryData).length === 0 && !selectedImage) {
            showToast('info', 'Нет изменений для сохранения');
            return;
        }

        updateMutation.mutate({
            categoryId: category.id,
            categoryData,
            imageFile: selectedImage || undefined
        });
    };

    // Закрытие модального окна
    const handleClose = () => {
        setFormData({ name: '', description: '', is_active: true });
        setSelectedImage(null);
        setImagePreview(null);
        setKeepCurrentImage(true);
        setErrors({});
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };

    if (!isOpen || !category) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Редактировать категорию</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={updateMutation.isPending}
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
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Название категории <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            placeholder="Например: Входные двери"
                            disabled={updateMutation.isPending}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    {/* Описание */}
                    <div>
                        <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                            Описание
                        </label>
                        <textarea
                            id="edit-description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            placeholder="Краткое описание категории..."
                            disabled={updateMutation.isPending}
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                    </div>

                    {/* Изображение */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Изображение
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

                                <div className="absolute top-2 right-2 flex gap-1">
                                    {!keepCurrentImage && (
                                        <button
                                            type="button"
                                            onClick={handleRestoreCurrentImage}
                                            className="bg-blue-600 text-white rounded px-2 py-1 text-xs hover:bg-blue-700 transition-colors"
                                            disabled={updateMutation.isPending}
                                        >
                                            Вернуть
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-gray-600 text-white rounded px-2 py-1 text-xs hover:bg-gray-700 transition-colors"
                                        disabled={updateMutation.isPending}
                                    >
                                        Изменить
                                    </button>
                                </div>

                                {!keepCurrentImage && (
                                    <div className="absolute bottom-2 left-2 bg-green-600 text-white rounded px-2 py-1 text-xs">
                                        Новое изображение
                                    </div>
                                )}
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
                            disabled={updateMutation.isPending}
                        />

                        {errors.image && (
                            <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                        )}
                    </div>

                    {/* Активность */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="edit-is_active"
                            checked={formData.is_active}
                            onChange={(e) => handleInputChange('is_active', e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            disabled={updateMutation.isPending}
                        />
                        <label htmlFor="edit-is_active" className="text-sm text-gray-700">
                            Активная категория
                        </label>
                    </div>

                    {/* Кнопки */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            disabled={updateMutation.isPending}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Сохранение...
                                </>
                            ) : (
                                'Сохранить изменения'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}