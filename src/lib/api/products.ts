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
    NewProductImage,
} from '@/types/products';
import { apiClient } from '../api';

const API = '/api/v1/productsmgmt';

function cleanParams<T extends object>(params: T): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    );
}

export const productsApi = {
    // === CRUD ===

    async getProducts(params: ProductsListParams = {}): Promise<ProductListItem[]> {
        const response = await apiClient.client.get(`${API}/`, { params: cleanParams(params) });
        return response.data;
    },

    async getStats(): Promise<ProductsStats> {
        const response = await apiClient.client.get(`${API}/stats/summary`);
        return response.data;
    },

    async getCount(params: Partial<ProductsListParams> = {}): Promise<{ count: number }> {
        const allowed = [
            'search', 'brand_id', 'catalog_id', 'category_id',
            'is_active', 'in_stock', 'price_from', 'price_to',
        ];
        const filtered = Object.fromEntries(
            Object.entries(params).filter(([k, v]) => allowed.includes(k) && v !== undefined && v !== '')
        );
        const response = await apiClient.client.get(`${API}/count`, { params: filtered });
        return response.data;
    },

    async getProduct(id: number): Promise<ProductDetail> {
        const response = await apiClient.client.get(`${API}/${id}`);
        return response.data;
    },

    async getProductBySlug(slug: string): Promise<ProductDetail> {
        const response = await apiClient.client.get(`${API}/by-slug/${slug}`);
        return response.data;
    },

    async createProduct(product: ProductCreate): Promise<ProductDetail> {
        const processed = await this.processProductImages(product);
        const response = await apiClient.client.post(`${API}/`, processed);
        return response.data;
    },

    async updateProduct(id: number, product: ProductUpdate): Promise<ProductDetail> {
        const processed = await this.processProductUpdateImages(product);
        const response = await apiClient.client.put(`${API}/${id}`, processed);
        return response.data;
    },

    async partialUpdateProduct(id: number, product: ProductUpdate): Promise<ProductDetail> {
        const processed = await this.processProductUpdateImages(product);
        const response = await apiClient.client.patch(`${API}/${id}`, processed);
        return response.data;
    },

    // === Images ===

    async processProductImages(product: ProductCreate): Promise<ProductCreate> {
        if (!product.images?.length) return product;

        const processed: NewProductImage[] = [];
        for (const image of product.images) {
            if (image.file) {
                try {
                    const uploaded = await this.uploadImageFile(image.file);
                    processed.push({ url: uploaded.url, is_main: image.is_main, alt_text: image.alt_text });
                } catch { continue; }
            } else if (image.url) {
                processed.push({ url: image.url, is_main: image.is_main, alt_text: image.alt_text });
            }
        }
        return { ...product, images: processed };
    },

    async processProductUpdateImages(product: ProductUpdate): Promise<ProductUpdate> {
        if (!product.images) return product;

        const updates: ImageUpdateData = {
            new_images: [],
            delete_image_ids: product.images.delete_image_ids || [],
            main_image_id: product.images.main_image_id || null,
        };

        if (product.images.new_images?.length) {
            for (const img of product.images.new_images) {
                if (img.file) {
                    try {
                        const uploaded = await this.uploadImageFile(img.file);
                        updates.new_images!.push({ url: uploaded.url, is_main: img.is_main, alt_text: img.alt_text });
                    } catch { continue; }
                } else if (img.url) {
                    updates.new_images!.push({ url: img.url, is_main: img.is_main, alt_text: img.alt_text });
                }
            }
        }

        return { ...product, images: updates };
    },

    async uploadImageFile(file: File): Promise<{ url: string; id?: number }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.client.post(`${API}/images/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return { url: response.data.url, id: response.data.id };
    },

    async uploadImage(file: File, productId?: number): Promise<ImageUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        if (productId) formData.append('product_id', productId.toString());
        const response = await apiClient.client.post(`${API}/images/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    async addImageByUrl(url: string, productId: number, isMain = false): Promise<ImageUploadResponse> {
        const response = await apiClient.client.post(`${API}/images/add-by-url`, {
            url, product_id: productId, is_main: isMain,
        });
        return response.data;
    },

    async deleteImage(imageId: number): Promise<void> {
        await apiClient.client.delete(`${API}/images/${imageId}`);
    },

    async setMainImage(productId: number, imageId: number): Promise<ProductImage> {
        const response = await apiClient.client.post(`${API}/${productId}/images/${imageId}/set-main`);
        return response.data;
    },

    async getProductImages(productId: number): Promise<ProductImage[]> {
        const response = await apiClient.client.get(`${API}/${productId}/images`);
        return response.data;
    },

    async updateImagesOrder(productId: number, imageIds: number[]): Promise<ProductImage[]> {
        const response = await apiClient.client.post(`${API}/${productId}/images/reorder`, { image_ids: imageIds });
        return response.data;
    },

    // === Batch & Prices ===

    async batchUpdateProducts(data: BatchUpdateRequest): Promise<BatchUpdateResponse> {
        const response = await apiClient.client.patch(`${API}/batch`, data);
        return response.data;
    },

    async bulkUpdatePrices(data: PriceUpdateData): Promise<BulkPriceUpdateResponse> {
        if (!data.scope || !data.price_type || !data.change_type || !data.direction) {
            throw new Error('Missing required fields');
        }
        if (data.change_value <= 0) {
            throw new Error('Change value must be positive');
        }
        const response = await apiClient.client.post(`${API}/bulk-update-prices`, data);
        return response.data;
    },

    async getProductsCountForPriceUpdate(data: Partial<PriceUpdateData>): Promise<{ count: number }> {
        const response = await apiClient.client.post(`${API}/count-for-price-update`, data);
        return response.data;
    },

    // === Status & Delete ===

    async toggleProductStatus(id: number): Promise<ProductListItem> {
        const response = await apiClient.client.post(`${API}/${id}/toggle-status`);
        return response.data;
    },

    async softDeleteProduct(id: number): Promise<ProductListItem> {
        const response = await apiClient.client.delete(`${API}/${id}/soft`);
        return response.data;
    },

    async deleteProduct(id: number): Promise<void> {
        await apiClient.client.delete(`${API}/${id}`);
    },

    // === Import/Export ===

    async importCSV(file: File): Promise<{ status: string; filename: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.client.post(`${API}/import`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    async exportToCSV(params?: Partial<ProductFilter>): Promise<Blob> {
        const response = await apiClient.client.get(`${API}/export`, {
            params, responseType: 'blob',
        });
        return response.data;
    },

    // === Utils ===

    async validateImageUrl(url: string): Promise<boolean> {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const type = response.headers.get('content-type');
            return response.ok && !!type?.startsWith('image/');
        } catch {
            return false;
        }
    },

    createImagePreview(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) return reject(new Error('Not an image'));
            const reader = new FileReader();
            reader.onload = (e) => e.target?.result ? resolve(e.target.result as string) : reject(new Error('Preview failed'));
            reader.onerror = () => reject(new Error('Read error'));
            reader.readAsDataURL(file);
        });
    },

    async compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(
                    (blob) => blob
                        ? resolve(new File([blob], file.name, { type: file.type, lastModified: Date.now() }))
                        : reject(new Error('Compression failed')),
                    file.type,
                    quality
                );
            };

            img.onerror = () => reject(new Error('Image load failed'));
            img.src = URL.createObjectURL(file);
        });
    },
};