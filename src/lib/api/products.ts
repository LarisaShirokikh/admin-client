import {
    BatchUpdateRequest,
    BatchUpdateResponse,
    BulkPriceUpdateResponse,
    ImageUploadResponse,
    PriceUpdateData,
    ProductCreate,
    ProductDetail,
    ProductFilter,
    ProductImage,
    ProductListItem,
    ProductsListParams,
    ProductsStats,
    ProductUpdate,
    ImageUpdateData,
    NewProductImage
} from "@/types/products";
import { apiClient } from "../api";


interface PriceCountRequestPayload {
    scope?: string;
    scope_id?: number;
    price_type?: string;
    change_type?: string;
    change_value?: number;
    direction?: string;
    only_active?: boolean;
    only_in_stock?: boolean;
    price_range?: {
        from?: number;
        to?: number;
    };
}

// API Methods
export const productsApi = {
    // ========== ОСНОВНЫЕ CRUD ОПЕРАЦИИ ==========

    // Получить список продуктов
    async getProducts(params: ProductsListParams = {}): Promise<ProductListItem[]> {
        // Очищаем undefined значения
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
        );

        const response = await apiClient.client.get('/api/v1/products/', { params: cleanParams });
        return response.data;
    },

    // Получить статистику продуктов
    async getStats(): Promise<ProductsStats> {
        const response = await apiClient.client.get('/api/v1/products/stats/summary');
        return response.data;
    },

    // Получить количество продуктов
    async getCount(params: Partial<ProductsListParams> = {}): Promise<{ count: number }> {
        // Фильтруем только нужные параметры для count endpoint
        const allowedParams = [
            'search', 'brand_id', 'catalog_id', 'category_id',
            'is_active', 'in_stock', 'price_from', 'price_to'
        ];

        const filteredParams = Object.fromEntries(
            Object.entries(params)
                .filter(([key, value]) => allowedParams.includes(key) && value !== undefined && value !== '')
        );

        const response = await apiClient.client.get('/api/v1/products/count', { params: filteredParams });
        return response.data;
    },

    // Получить продукт по ID
    async getProduct(id: number): Promise<ProductDetail> {
        const response = await apiClient.client.get(`/api/v1/products/${id}`);
        return response.data;
    },

    // Получить продукт по slug
    async getProductBySlug(slug: string): Promise<ProductDetail> {
        const response = await apiClient.client.get(`/api/v1/products/by-slug/${slug}`);
        return response.data;
    },

    // Создать продукт
    async createProduct(product: ProductCreate): Promise<ProductDetail> {
        const processedProduct = await this.processProductImages(product);
        const response = await apiClient.client.post('/api/v1/products/', processedProduct);
        return response.data;
    },

    // Обновить продукт
    async updateProduct(id: number, product: ProductUpdate): Promise<ProductDetail> {
        const processedProduct = await this.processProductUpdateImages(product);
        const response = await apiClient.client.put(`/api/v1/products/${id}`, processedProduct);
        return response.data;
    },

    // Частично обновить продукт
    async partialUpdateProduct(id: number, product: ProductUpdate): Promise<ProductDetail> {
        const processedProduct = await this.processProductUpdateImages(product);
        const response = await apiClient.client.patch(`/api/v1/products/${id}`, processedProduct);
        return response.data;
    },

    // ========== ОБРАБОТКА ИЗОБРАЖЕНИЙ ==========

    // Обработка изображений для создания продукта
    async processProductImages(product: ProductCreate): Promise<ProductCreate> {
        if (!product.images || product.images.length === 0) {
            return product;
        }

        const processedImages: NewProductImage[] = [];

        for (const image of product.images) {
            if (image.file) {
                // Загружаем файл и получаем URL
                try {
                    const uploadResponse = await this.uploadImageFile(image.file);
                    processedImages.push({
                        url: uploadResponse.url,
                        is_main: image.is_main,
                        alt_text: image.alt_text
                    });
                } catch (error) {
                    console.error('Ошибка загрузки файла изображения:', error);
                    // Пропускаем изображение при ошибке
                    continue;
                }
            } else if (image.url) {
                // Добавляем изображение по URL
                processedImages.push({
                    url: image.url,
                    is_main: image.is_main,
                    alt_text: image.alt_text
                });
            }
        }

        return {
            ...product,
            images: processedImages
        };
    },

    // Обработка изображений для обновления продукта
    async processProductUpdateImages(product: ProductUpdate): Promise<ProductUpdate> {
        if (!product.images) {
            return product;
        }

        const imageUpdates = product.images;
        const processedUpdates: ImageUpdateData = {
            new_images: [],
            delete_image_ids: imageUpdates.delete_image_ids || [],
            main_image_id: imageUpdates.main_image_id || null
        };

        // Обрабатываем новые изображения
        if (imageUpdates.new_images && imageUpdates.new_images.length > 0) {
            for (const newImage of imageUpdates.new_images) {
                if (newImage.file) {
                    try {
                        // Загружаем файл и получаем URL
                        const uploadResponse = await this.uploadImageFile(newImage.file);
                        processedUpdates.new_images!.push({
                            url: uploadResponse.url,
                            is_main: newImage.is_main,
                            alt_text: newImage.alt_text
                        });
                    } catch (error) {
                        console.error('Ошибка загрузки файла изображения:', error);
                        // Пропускаем изображение при ошибке
                        continue;
                    }
                } else if (newImage.url) {
                    // Добавляем изображение по URL
                    processedUpdates.new_images!.push({
                        url: newImage.url,
                        is_main: newImage.is_main,
                        alt_text: newImage.alt_text
                    });
                }
            }
        }

        return {
            ...product,
            images: processedUpdates
        };
    },

    // ========== РАБОТА С ИЗОБРАЖЕНИЯМИ ==========

    // Загрузить изображение файлом
    async uploadImageFile(file: File): Promise<{ url: string; id?: number }> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.client.post('/api/v1/products/images/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return {
                url: response.data.url,
                id: response.data.id
            };
        } catch (error) {
            console.error('Error uploading image file:', error);
            throw new Error('Не удалось загрузить изображение');
        }
    },

    // Загрузить изображение файлом с привязкой к продукту
    async uploadImage(file: File, productId?: number): Promise<ImageUploadResponse> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (productId) {
                formData.append('product_id', productId.toString());
            }

            const response = await apiClient.client.post('/api/v1/products/images/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    },

    // Добавить изображение по URL
    async addImageByUrl(url: string, productId: number, isMain: boolean = false): Promise<ImageUploadResponse> {
        try {
            const response = await apiClient.client.post('/api/v1/products/images/add-by-url', {
                url,
                product_id: productId,
                is_main: isMain
            });
            return response.data;
        } catch (error) {
            console.error('Error adding image by URL:', error);
            throw error;
        }
    },

    // Удалить изображение
    async deleteImage(imageId: number): Promise<void> {
        try {
            await apiClient.client.delete(`/api/v1/products/images/${imageId}`);
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    },

    // Установить главное изображение
    async setMainImage(productId: number, imageId: number): Promise<ProductImage> {
        try {
            const response = await apiClient.client.post(`/api/v1/products/${productId}/images/${imageId}/set-main`);
            return response.data;
        } catch (error) {
            console.error('Error setting main image:', error);
            throw error;
        }
    },

    // Получить изображения товара
    async getProductImages(productId: number): Promise<ProductImage[]> {
        try {
            const response = await apiClient.client.get(`/api/v1/products/${productId}/images`);
            return response.data;
        } catch (error) {
            console.error('Error fetching product images:', error);
            throw error;
        }
    },

    // Обновить порядок изображений
    async updateImagesOrder(productId: number, imageIds: number[]): Promise<ProductImage[]> {
        try {
            const response = await apiClient.client.post(`/api/v1/products/${productId}/images/reorder`, {
                image_ids: imageIds
            });
            return response.data;
        } catch (error) {
            console.error('Error updating images order:', error);
            throw error;
        }
    },

    // ========== МАССОВЫЕ ОПЕРАЦИИ ==========

    // Массовое обновление продуктов
    async batchUpdateProducts(data: BatchUpdateRequest): Promise<BatchUpdateResponse> {
        const response = await apiClient.client.patch('/api/v1/products/batch', data);
        return response.data;
    },

    // Массовое изменение цен
    async bulkUpdatePrices(data: PriceUpdateData): Promise<BulkPriceUpdateResponse> {
        const snakeCaseData = {
            scope: data.scope,
            scope_id: data.scopeId,
            price_type: data.priceType,
            change_type: data.changeType,
            change_value: data.changeValue,
            direction: data.direction,
            only_active: data.onlyActive,
            only_in_stock: data.onlyInStock,
            price_range: data.priceRange ? {
                from: data.priceRange.from,
                to: data.priceRange.to
            } : undefined
        };
        const response = await apiClient.client.post('/api/v1/products/bulk-update-prices', snakeCaseData);
        return response.data;
    },

    // Получение количества товаров для оценки изменения цен
    async getProductsCountForPriceUpdate(data: Partial<PriceUpdateData>): Promise<{ count: number }> {
        // Преобразуем camelCase в snake_case
        const snakeCaseData: PriceCountRequestPayload = {};

        if (data.scope) snakeCaseData.scope = data.scope;
        if (data.scopeId !== undefined) snakeCaseData.scope_id = data.scopeId;
        if (data.priceType) snakeCaseData.price_type = data.priceType;
        if (data.changeType) snakeCaseData.change_type = data.changeType;
        if (data.changeValue !== undefined) snakeCaseData.change_value = data.changeValue;
        if (data.direction) snakeCaseData.direction = data.direction;
        if (data.onlyActive !== undefined) snakeCaseData.only_active = data.onlyActive;
        if (data.onlyInStock !== undefined) snakeCaseData.only_in_stock = data.onlyInStock;
        if (data.priceRange) {
            snakeCaseData.price_range = {
                from: data.priceRange.from,
                to: data.priceRange.to
            };
        }

        const response = await apiClient.client.post('/api/v1/products/count-for-price-update', snakeCaseData);
        return response.data;
    },

    // ========== УПРАВЛЕНИЕ СТАТУСОМ ==========

    // Переключить статус продукта
    async toggleProductStatus(id: number): Promise<ProductListItem> {
        const response = await apiClient.client.post(`/api/v1/products/${id}/toggle-status`);
        return response.data;
    },

    // Мягкое удаление продукта
    async softDeleteProduct(id: number): Promise<ProductListItem> {
        const response = await apiClient.client.delete(`/api/v1/products/${id}/soft`);
        return response.data;
    },

    // Полное удаление продукта (только для суперадмина)
    async deleteProduct(id: number): Promise<void> {
        await apiClient.client.delete(`/api/v1/products/${id}`);
    },

    // ========== ИМПОРТ/ЭКСПОРТ ==========

    // Импорт из CSV
    async importCSV(file: File): Promise<{ status: string; filename: string; message: string; initiated_by: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.client.post('/api/v1/products/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Экспорт в CSV
    async exportToCSV(params?: Partial<ProductFilter>): Promise<Blob> {
        try {
            const response = await apiClient.client.get('/api/v1/products/export', {
                params,
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting products:', error);
            throw error;
        }
    },

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

    // Валидация URL изображения
    async validateImageUrl(url: string): Promise<boolean> {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            return response.ok && contentType !== null && contentType.startsWith('image/');
        } catch {
            return false;
        }
    },

    // Получение информации о файле изображения
    getImageFileInfo(file: File): {
        name: string;
        size: number;
        type: string;
        isValidImage: boolean;
        sizeFormatted: string;
    } {
        const isValidImage = file.type.startsWith('image/');
        const sizeInMB = file.size / (1024 * 1024);
        const sizeFormatted = sizeInMB > 1
            ? `${sizeInMB.toFixed(2)} MB`
            : `${(file.size / 1024).toFixed(2)} KB`;

        return {
            name: file.name,
            size: file.size,
            type: file.type,
            isValidImage,
            sizeFormatted
        };
    },

    // Создание превью изображения из файла
    createImagePreview(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('Файл не является изображением'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    resolve(e.target.result as string);
                } else {
                    reject(new Error('Не удалось создать превью'));
                }
            };
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsDataURL(file);
        });
    },

    // Оптимизация изображения (сжатие)
    async compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Вычисляем новые размеры с сохранением пропорций
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                const newWidth = img.width * ratio;
                const newHeight = img.height * ratio;

                canvas.width = newWidth;
                canvas.height = newHeight;

                // Рисуем изображение на canvas
                ctx?.drawImage(img, 0, 0, newWidth, newHeight);

                // Конвертируем в blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Не удалось сжать изображение'));
                        }
                    },
                    file.type,
                    quality
                );
            };

            img.onerror = () => reject(new Error('Не удалось загрузить изображение для сжатия'));
            img.src = URL.createObjectURL(file);
        });
    }
};