'use client';

import { useState, useRef, useEffect } from 'react';
import { XCircle, RefreshCw, Upload, Link as LinkIcon, Trash2, Star, StarOff, Eye, X, Image as ImageIcon } from 'lucide-react';
import {
    ProductEditModalProps,
    ProductUpdate,
    ImageUploadData,
    ImageUpdateData,
    NewProductImage,
    ProductImage
} from '@/types/products';
import { productsApi } from '@/lib/api/products';
import { getImageUrl } from '@/lib/utils/image';
import ProductVideoSection from './products/ProductVideoSection';
import ProductMediaSection, { MainMedia } from './products/ProductMediaSection';

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
        category_ids: product.categories?.map((cat: { id: number }) => cat.id) || [] as number[]
    });


    const [images, setImages] = useState<ImageUploadData[]>([]);
    const [imagesLoading, setImagesLoading] = useState(true);
    const [mainMedia, setMainMedia] = useState<MainMedia>(null);
    const [imagesError, setImagesError] = useState<string | null>(null);

    const [imageUrl, setImageUrl] = useState('');
    const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        const loadImages = async () => {
            setImagesLoading(true);
            setImagesError(null);

            try {

                let imagesToSet: ImageUploadData[] = [];

                if (product.images && product.images.length > 0) {
                    imagesToSet = product.images.map((img: ProductImage) => ({
                        id: img.id,
                        url: img.url,
                        is_main: img.is_main || false,
                        isNew: false,
                        alt_text: img.alt_text
                    }));
                } else if (product.id) {
                    const productImages = await productsApi.getProductImages(product.id);

                    imagesToSet = productImages.map((img: ProductImage) => ({
                        id: img.id,
                        url: img.url,
                        is_main: img.is_main || false,
                        isNew: false,
                        alt_text: img.alt_text
                    }));
                }

                setImages(imagesToSet);
                setImagesError(null);
            } catch (error) {
                console.error('Ошибка загрузки изображений:', error);
                setImagesError('Не удалось загрузить изображения');
            } finally {
                setImagesLoading(false);
            }
        };

        loadImages();
    }, [product.id, product.images]);

    const handleCategoryToggle = (categoryId: number) => {
        setFormData(prev => ({
            ...prev,
            category_ids: prev.category_ids.includes(categoryId)
                ? prev.category_ids.filter(id => id !== categoryId)
                : [...prev.category_ids, categoryId]
        }));
    };

    const handleAddImageByUrl = async () => {
        if (!imageUrl.trim()) return;

        try {
            const isValid = await productsApi.validateImageUrl(imageUrl.trim());
            if (!isValid) {
                alert('Не удалось загрузить изображение по указанной ссылке');
                return;
            }
        } catch (error) {
            console.warn('Не удалось проверить URL изображения:', error);
        }

        const newImage: ImageUploadData = {
            url: imageUrl.trim(),
            is_main: images.filter(img => !img.toDelete).length === 0,
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
            const activeImagesCount = images.filter(img => !img.toDelete).length;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (!file.type.startsWith('image/')) {
                    console.warn(`Файл ${file.name} не является изображением`);
                    continue;
                }

                const maxSize = 10 * 1024 * 1024;
                if (file.size > maxSize) {
                    console.warn(`Файл ${file.name} слишком большой (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
                    continue;
                }

                const previewUrl = URL.createObjectURL(file);

                const newImage: ImageUploadData = {
                    url: previewUrl,
                    is_main: activeImagesCount === 0 && i === 0,
                    file: file,
                    isNew: true
                };

                newImages.push(newImage);
            }

            if (newImages.length > 0) {
                setImages(prev => [...prev, ...newImages]);
            }
        } catch (error) {
            console.error('Ошибка при обработке файлов:', error);
            alert('Произошла ошибка при обработке файлов');
        } finally {
            setImageUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteImage = (index: number) => {
        console.log('Удаляем изображение с индексом:', index);
        setImages(prev => {
            const newImages = [...prev];
            const imageToDelete = newImages[index];

            if (imageToDelete.id && !imageToDelete.isNew) {
                newImages[index] = { ...imageToDelete, toDelete: true };
            } else {
                if (imageToDelete.file && imageToDelete.url.startsWith('blob:')) {
                    URL.revokeObjectURL(imageToDelete.url);
                }
                newImages.splice(index, 1);
            }

            if (imageToDelete.is_main) {
                const firstActiveImage = newImages.find(img => !img.toDelete);
                if (firstActiveImage) {
                    firstActiveImage.is_main = true;
                }
            }

            return newImages;
        });
    };


    const handleSetMainImage = (index: number) => {
        console.log('Устанавливаем главным изображение с индексом:', index);
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

        images.forEach((img: ImageUploadData) => {
            if (img.toDelete && img.id) {
                imageUpdates.delete_image_ids!.push(img.id);
            } else if (img.isNew && !img.toDelete) {
                const newImage: NewProductImage = {
                    is_main: img.is_main,
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

        const currentCategoryIds = product.categories?.map((cat: { id: number }) => cat.id) || [];
        const newCategoryIds = formData.category_ids.sort();
        const currentCategoryIdsSorted = currentCategoryIds.sort();

        if (JSON.stringify(newCategoryIds) !== JSON.stringify(currentCategoryIdsSorted)) {
            updateData.category_ids = formData.category_ids;
        }

        const imageUpdates = prepareImageUpdates();

        if (imageUpdates.new_images!.length > 0 ||
            imageUpdates.delete_image_ids!.length > 0 ||
            imageUpdates.main_image_id !== null) {
            updateData.images = imageUpdates;
        }

        onSave(updateData);
    };

    const handleReloadImages = async () => {
        if (!product.id) return;

        setImagesLoading(true);
        setImagesError(null);

        try {
            const productImages = await productsApi.getProductImages(product.id);
            const imagesToSet = productImages.map((img: ProductImage) => ({
                id: img.id,
                url: img.url,
                is_main: img.is_main || false,
                isNew: false,
                alt_text: img.alt_text
            }));
            setImages(imagesToSet);
            setImagesError(null);
        } catch (error) {
            console.error('Ошибка повторной загрузки изображений:', error);
            setImagesError('Не удалось загрузить изображения');
        } finally {
            setImagesLoading(false);
        }
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
                        <ProductMediaSection
                            productId={product.id}
                            productName={formData.name}
                            images={images}
                            onImagesChange={setImages}
                            imagesLoading={imagesLoading}
                            imagesError={imagesError}
                            onReloadImages={handleReloadImages}
                            mainMedia={mainMedia}
                            onMainMediaChange={setMainMedia}
                        />

                        {/* Состояние загрузки изображений */}
                        {imagesLoading && (
                            <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                                <div className="text-center">
                                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Загрузка изображений...</p>
                                </div>
                            </div>
                        )}

                        {/* Ошибка загрузки изображений */}
                        {imagesError && !imagesLoading && (
                            <div className="flex items-center justify-center p-6 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
                                <div className="text-center">
                                    <ImageIcon className="h-8 w-8 text-red-400 mx-auto mb-2" />
                                    <p className="text-sm text-red-600 mb-2">{imagesError}</p>
                                    <button
                                        type="button"
                                        onClick={handleReloadImages}
                                        className="text-sm text-red-700 hover:text-red-900 underline"
                                    >
                                        Попробовать снова
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Добавление изображений - показываем только если изображения загружены */}
                        {!imagesLoading && (
                            <>
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
                                            {images.map((image: ImageUploadData, index: number) => {
                                                const imageKey = `${image.id || 'new'}-${index}`;

                                                return (
                                                    <div
                                                        key={imageKey}
                                                        className={`relative group border-2 rounded-lg overflow-hidden ${image.toDelete
                                                            ? 'border-red-300 opacity-50'
                                                            : image.is_main
                                                                ? 'border-yellow-400'
                                                                : 'border-gray-300'
                                                            }`}
                                                    >
                                                        <div className="aspect-square relative bg-gray-100">
                                                            {/* Простое изображение без сложной логики состояний */}
                                                            <img
                                                                src={image.file ? image.url : getImageUrl(image.url)}
                                                                loading="lazy"
                                                                decoding="async"
                                                                className="w-full h-full object-cover"
                                                                onLoad={() => console.log(`Изображение загружено: ${image.url}`)}
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = 'data:image/svg+xml;base64,...'; // как у тебя
                                                                }}
                                                            />

                                                            {/* Тестовая кнопка для открытия изображения в новом окне */}
                                                            <button
                                                                type="button"
                                                                onClick={() => window.open(image.file ? image.url : getImageUrl(image.url), '_blank')}
                                                                className="absolute bottom-1 right-1 bg-purple-500 text-white text-xs px-1 py-0.5 rounded"
                                                                title="Открыть в новом окне"
                                                            >
                                                                🔗
                                                            </button>

                                                            {/* Оверлей с действиями */}
                                                            {!image.toDelete && (
                                                                <div
                                                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center pointer-events-none"
                                                                >
                                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 pointer-events-auto">
                                                                        {/* Предпросмотр */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowImagePreview(image.file ? image.url : getImageUrl(image.url))}
                                                                            className="p-1 bg-white text-gray-700 rounded hover:bg-gray-100"
                                                                            title="Предпросмотр"
                                                                        >
                                                                            <Eye className="h-3 w-3" />
                                                                        </button>

                                                                        {/* Сделать главным */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleSetMainImage(index)}
                                                                            className={`p-1 rounded ${image.is_main ? 'bg-yellow-400 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
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

                                                            {/* Отладочная информация */}
                                                            <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded max-w-full truncate">
                                                                ID: {image.id || 'new'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Сообщение если нет изображений */}
                                {!imagesLoading && images.length === 0 && (
                                    <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-sm text-gray-600 mb-2">У этого товара пока нет изображений</p>
                                        <p className="text-xs text-gray-500">Добавьте изображения используя формы выше</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* {product.id && (
                        <ProductVideoSection
                            productId={product.id}
                            productName={product.name}
                        />
                    )} */}

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
                                {brands.map((brand: { id: number; name: string }) => (
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
                                    {categories.map((category: { id: number; name: string; description?: string }) => (
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