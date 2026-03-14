'use client';

import { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { Banner } from '@/types/banners';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return API_URL + url;
}

export interface BannerFormData {
    image?: File;
    title?: string;
    subtitle?: string;
    href?: string;
    badge?: string;
    text_color?: string;
    show_button?: boolean;
    expires_at?: string;
    clear_expires_at?: boolean;
    sort_order?: number;
}

interface BannerModalProps {
    banner: Banner | null;
    loading: boolean;
    onSave: (data: BannerFormData) => Promise<void>;
    onClose: () => void;
}

function toDatetimeLocal(iso?: string | null): string {
    if (!iso) return '';
    // Обрезаем секунды для input[type=datetime-local]
    return iso.slice(0, 16);
}

export default function BannerModal({ banner, loading, onSave, onClose }: BannerModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState(banner ? getImageUrl(banner.image_url) : '');
    const [title, setTitle] = useState(banner?.title ?? '');
    const [subtitle, setSubtitle] = useState(banner?.subtitle ?? '');
    const [href, setHref] = useState(banner?.href ?? '');
    const [badge, setBadge] = useState(banner?.badge ?? '');
    const [textColor, setTextColor] = useState(banner?.text_color ?? 'light');
    const [showButton, setShowButton] = useState(banner?.show_button ?? true);
    const [expiresAt, setExpiresAt] = useState(toDatetimeLocal(banner?.expires_at));
    const [sortOrder, setSortOrder] = useState(banner?.sort_order ?? 0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        if (!picked) return;
        setFile(picked);
        setPreview(URL.createObjectURL(picked));
    };

    const handleClearFile = () => { setFile(null); setPreview(''); };

    const handleSubmit = () => {
        if (!banner && !file) return;
        const wasExpires = toDatetimeLocal(banner?.expires_at);
        const clearExpires = !!wasExpires && !expiresAt;

        onSave({
            image: file ?? undefined,
            title: title || undefined,
            subtitle: subtitle || undefined,
            href: href || undefined,
            badge: badge || undefined,
            text_color: textColor,
            show_button: showButton,
            expires_at: expiresAt || undefined,
            clear_expires_at: clearExpires || undefined,
            sort_order: sortOrder,
        });
    };

    const isDisabled = loading || (!banner && !file);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {banner ? 'Edit banner' : 'New banner'}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <ImageField
                        preview={preview}
                        isRequired={!banner}
                        onFileChange={handleFileChange}
                        onClear={handleClearFile}
                    />

                    <TextField label="Title" value={title} onChange={setTitle} placeholder="Optional" />
                    <TextField label="Subtitle" value={subtitle} onChange={setSubtitle} placeholder="Optional" />
                    <TextField label="Link" value={href} onChange={setHref} placeholder="/catalog or https://..." />

                    <div className="grid grid-cols-2 gap-4">
                        <TextField label="Badge" value={badge} onChange={setBadge} placeholder="Sale, New..." />
                        <SelectField
                            label="Text color"
                            value={textColor}
                            onChange={setTextColor}
                            options={[
                                { value: 'light', label: 'Light' },
                                { value: 'dark', label: 'Dark' },
                            ]}
                        />
                    </div>

                    {/* Show button toggle */}
                    <div className="flex items-center justify-between py-1">
                        <label className="text-sm font-medium text-gray-700">
                            Show "Подробнее" button
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowButton(v => !v)}
                            className={`relative inline-flex w-10 h-6 rounded-full transition-colors ${showButton ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                        >
                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${showButton ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                        </button>
                    </div>

                    {/* Expires at */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Active until{' '}
                            <span className="text-gray-400 font-normal">(optional — auto-archives)</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {expiresAt && (
                            <button
                                type="button"
                                onClick={() => setExpiresAt('')}
                                className="text-xs text-gray-400 hover:text-red-500 mt-1"
                            >
                                Clear date (banner won't expire)
                            </button>
                        )}
                    </div>

                    <NumberField label="Sort order" value={sortOrder} onChange={setSortOrder} />
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isDisabled}
                        className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {banner ? 'Save' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Small form fields ──

function ImageField({ preview, isRequired, onFileChange, onClear }: {
    preview: string; isRequired: boolean;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {'Image' + (isRequired ? ' *' : '')}
            </label>
            {preview ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 mb-2">
                    <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
                    <button onClick={onClear} className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white">
                        <X className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 mb-2">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload</span>
                    <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, SVG</span>
                    <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                </label>
            )}
            {preview && (
                <label className="inline-flex items-center gap-1.5 text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                    <Upload className="w-3.5 h-3.5" />
                    Replace image
                    <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                </label>
            )}
        </div>
    );
}

function TextField({ label, value, onChange, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
    );
}

function NumberField({ label, value, onChange }: {
    label: string; value: number; onChange: (v: number) => void;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
    );
}

function SelectField({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}