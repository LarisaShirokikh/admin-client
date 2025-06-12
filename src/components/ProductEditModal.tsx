'use client';

import { useState, useRef } from 'react';
import { XCircle, RefreshCw, Upload, Link as LinkIcon, Trash2, Star, StarOff, Eye, X } from 'lucide-react';
import {
    ProductEditModalProps,
    ProductUpdate,
    ImageUploadData,
    ImageUpdateData,
    NewProductImage
} from '@/types/products';

export default function ProductEditModal({
    product,
    brands,
    categories,
    loading,
    onSave,
    onClose
}: ProductEditModalProps) {
    const [formData, setFormData] = useState({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        discount_price: product.discount_price?.toString() || '',
        brand_id: product.brand?.id?.toString() || '',
        is_active: product.is_active ?? true,
        in_stock: product.in_stock ?? true,
        category_ids: product.categories?.map(cat => cat.id) || [] as number[]
    });

    // Типизированное состояние для работы с изображениями
    const [images, setImages] = useState<ImageUploadData[]>(
        product.images?.map(img => ({
            id: img.id,
            url: img.url,
            is_main: img.is_main || false,
            isNew: false
        })) || []
    );

    const [imageUrl, setImageUrl] = useState('');
    const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCategoryToggle = (categoryId: number) => {
        setFormData(prev => ({
            ...prev,
            category_ids: prev.category_ids.includes(categoryId)
                ? prev.category_ids.filter(id => id !== categoryId)
                : [...prev.category_ids, categoryId]
        }));
    };

    // Функции для работы с изображениями
    const handleAddImageByUrl = () => {
        if (!imageUrl.trim()) return;

        const newImage: ImageUploadData = {
            url: imageUrl.trim(),
            is_main: images.length === 0, // Первое изображение становится главным
            isNew: true
        };

        setImages(prev => [...prev, newImage]);
        setImageUrl('');
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setImageUploading(true);

        try {
            const newImages: ImageUploadData[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Проверяем тип файла
                if (!file.type.startsWith('image/')) {
                    console.warn(`Файл ${file.name} не является изображением`);
                    continue;
                }

                // Создаем URL для предпросмотра
                const previewUrl = URL.createObjectURL(file);

                const newImage: ImageUploadData = {
                    url: previewUrl,
                    is_main: images.length === 0 && i === 0, // Первое изображение становится главным
                    file: file,
                    isNew: true
                };

                newImages.push(newImage);
            }

            setImages(prev => [...prev, ...newImages]);
        } catch (error) {
            console.error('Ошибка при обработке файлов:', error);
        } finally {
            setImageUploading(false);
            // Очищаем input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteImage = (index: number) => {
        setImages(prev => {
            const newImages = [...prev];
            const imageToDelete = newImages[index];

            // Если это существующее изображение, помечаем на удаление
            if (imageToDelete.id && !imageToDelete.isNew) {
                newImages[index] = { ...imageToDelete, toDelete: true };
            } else {
                // Если это новое изображение, просто удаляем из массива
                newImages.splice(index, 1);

                // Если удаляем главное изображение, назначаем главным первое оставшееся
                if (imageToDelete.is_main && newImages.length > 0) {
                    const firstActiveImage = newImages.find(img => !img.toDelete);
                    if (firstActiveImage) {
                        firstActiveImage.is_main = true;
                    }
                }
            }

            return newImages;
        });
    };

    const handleSetMainImage = (index: number) => {
        setImages(prev => prev.map((img, i) => ({
            ...img,
            is_main: i === index && !img.toDelete
        })));
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            alert('Название товара обязательно для заполнения');
            return false;
        }

        if (!formData.price || Number(formData.price) <= 0) {
            alert('Цена должна быть больше 0');
            return false;
        }

        if (formData.discount_price && Number(formData.discount_price) >= Number(formData.price)) {
            alert('Цена со скидкой должна быть меньше обычной цены');
            return false;
        }

        return true;
    };

    const prepareImageUpdates = (): ImageUpdateData => {
        const imageUpdates: ImageUpdateData = {
            new_images: [],
            delete_image_ids: [],
            main_image_id: null
        };

        images.forEach(img => {
            if (img.toDelete && img.id) {
                imageUpdates.delete_image_ids!.push(img.id);
            } else if (img.isNew && !img.toDelete) {
                const newImage: NewProductImage = {
                    is_main: img.is_main
                };

                if (img.file) {
                    newImage.file = img.file;
                } else {
                    newImage.url = img.url;
                }

                imageUpdates.new_images!.push(newImage);
            } else if (img.is_main && img.id && !img.toDelete) {
                imageUpdates.main_image_id = img.id;
            }
        });

        return imageUpdates;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const updateData: ProductUpdate = {};

        // Проверяем изменения основных полей
        if (formData.name !== product.name) {
            updateData.name = formData.name;
        }

        if (formData.description !== product.description) {
            updateData.description = formData.description;
        }

        if (formData.price && Number(formData.price) !== product.price) {
            updateData.price = Number(formData.price);
        }

        if (formData.discount_price && Number(formData.discount_price) !== product.discount_price) {
            updateData.discount_price = Number(formData.discount_price);
        }

        if (formData.brand_id && Number(formData.brand_id) !== product.brand?.id) {
            updateData.brand_id = Number(formData.brand_id);
        }

        if (formData.is_active !== product.is_active) {
            updateData.is_active = formData.is_active;
        }

        if (formData.in_stock !== product.in_stock) {
            updateData.in_stock = formData.in_stock;
        }

        // Проверяем изменения категорий
        const currentCategoryIds = product.categories?.map(cat => cat.id) || [];
        const newCategoryIds = formData.category_ids.sort();
        const currentCategoryIdsSorted = currentCategoryIds.sort();

        if (JSON.stringify(newCategoryIds) !== JSON.stringify(currentCategoryIdsSorted)) {
            updateData.category_ids = formData.category_ids;
        }

        // Подготавливаем данные изображений
        const imageUpdates = prepareImageUpdates();

        // Добавляем данные изображений если есть изменения
        if (imageUpdates.new_images!.length > 0 ||
            imageUpdates.delete_image_ids!.length > 0 ||
            imageUpdates.main_image_id !== null) {
            updateData.images = imageUpdates;
        }

        console.log('Отправляем данные для обновления:', updateData);
        onSave(updateData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Редактирование товара
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XCircle className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Основная информация */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Название товара *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Описание
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Изображения товара */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Изображения товара
                        </label>

                        {/* Добавление изображений */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Добавление по URL */}
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-gray-600">
                                    Добавить по ссылке
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddImageByUrl}
                                        disabled={!imageUrl.trim()}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Загрузка файлов */}
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-gray-600">
                                    Загрузить с устройства
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={imageUploading}
                                        className="flex-1 flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                    >
                                        {imageUploading ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="h-4 w-4" />
                                        )}
                                        <span className="text-sm text-gray-600">
                                            {imageUploading ? 'Загрузка...' : 'Выбрать файлы'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Список изображений */}
                        {images.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-sm text-gray-600">
                                    Изображения ({images.filter(img => !img.toDelete).length})
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {images.map((image, index) => (
                                        <div
                                            key={`${image.id || 'new'}-${index}`}
                                            className={`relative group border-2 rounded-lg overflow-hidden ${image.toDelete
                                                ? 'border-red-300 opacity-50'
                                                : image.is_main
                                                    ? 'border-yellow-400'
                                                    : 'border-gray-300'
                                                }`}
                                        >
                                            <div className="aspect-square relative">
                                                <img
                                                    src={image.url}
                                                    alt={`Изображение ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        console.error('Ошибка загрузки изображения:', image.url);
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPtCd0LXRgiDQuNC30L7QsdGA0LDQttC10L3QuNGPPC90ZXh0Pjwvc3ZnPg==';
                                                    }}
                                                />

                                                {/* Оверлей с действиями */}
                                                {!image.toDelete && (
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                                            {/* Предпросмотр */}
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowImagePreview(image.url)}
                                                                className="p-1 bg-white text-gray-700 rounded hover:bg-gray-100"
                                                                title="Предпросмотр"
                                                            >
                                                                <Eye className="h-3 w-3" />
                                                            </button>

                                                            {/* Установить главным */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetMainImage(index)}
                                                                className={`p-1 rounded ${image.is_main
                                                                    ? 'bg-yellow-400 text-white'
                                                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                                title={image.is_main ? 'Главное изображение' : 'Сделать главным'}
                                                            >
                                                                {image.is_main ? <Star className="h-3 w-3" /> : <StarOff className="h-3 w-3" />}
                                                            </button>

                                                            {/* Удалить */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteImage(index)}
                                                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                                title="Удалить"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Бейдж главного изображения */}
                                                {image.is_main && !image.toDelete && (
                                                    <div className="absolute top-1 left-1 bg-yellow-400 text-white text-xs px-1 py-0.5 rounded">
                                                        Главное
                                                    </div>
                                                )}

                                                {/* Бейдж нового изображения */}
                                                {image.isNew && !image.toDelete && (
                                                    <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                                                        Новое
                                                    </div>
                                                )}

                                                {/* Бейдж удаления */}
                                                {image.toDelete && (
                                                    <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                                                        <span className="text-white text-xs font-medium">К удалению</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Цены */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Цена (₽) *
                            </label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                min="0"
                                step="0.01"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Цена со скидкой (₽)
                            </label>
                            <input
                                type="number"
                                value={formData.discount_price}
                                onChange={(e) => setFormData(prev => ({ ...prev, discount_price: e.target.value }))}
                                min="0"
                                step="0.01"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Бренд и статусы */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Бренд
                            </label>
                            <select
                                value={formData.brand_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, brand_id: e.target.value }))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Выберите бренд</option>
                                {brands.map(brand => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Статус
                            </label>
                            <select
                                value={formData.is_active.toString()}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="true">Активен</option>
                                <option value="false">Неактивен</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Наличие
                            </label>
                            <select
                                value={formData.in_stock.toString()}
                                onChange={(e) => setFormData(prev => ({ ...prev, in_stock: e.target.value === 'true' }))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="true">В наличии</option>
                                <option value="false">Нет в наличии</option>
                            </select>
                        </div>
                    </div>

                    {/* Категории */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Категории
                        </label>
                        <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                            {categories.length === 0 ? (
                                <div className="text-gray-500 text-center py-4">
                                    Категории не найдены
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {categories.map(category => (
                                        <label key={category.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                            <input
                                                type="checkbox"
                                                checked={formData.category_ids.includes(category.id)}
                                                onChange={() => handleCategoryToggle(category.id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="text-sm text-gray-700">{category.name}</span>
                                            {category.description && (
                                                <span className="text-xs text-gray-500 ml-1">- {category.description}</span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        {formData.category_ids.length > 0 && (
                            <div className="mt-2 text-sm text-blue-600">
                                Выбрано категорий: {formData.category_ids.length}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                            {loading ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Модальное окно предпросмотра изображения */}
            {showImagePreview && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
                    <div className="relative max-w-4xl max-h-4xl m-4">
                        <button
                            onClick={() => setShowImagePreview(null)}
                            className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-100 z-10"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <img
                            src={showImagePreview}
                            alt="Предпросмотр"
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}