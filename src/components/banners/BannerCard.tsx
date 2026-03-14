'use client';

import { Banner } from '@/types/banners';
import { Pencil, Eye, EyeOff, Trash2, RotateCcw, Clock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
}

function formatExpiry(iso: string): string {
    return new Date(iso).toLocaleDateString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

interface BannerCardProps {
    banner: Banner;
    onEdit: (b: Banner) => void;
    onToggle: (b: Banner) => void;
    onDelete: (b: Banner) => void;
    onRestore?: (b: Banner) => void;
}

export default function BannerCard({ banner, onEdit, onToggle, onDelete, onRestore }: BannerCardProps) {
    const isArchived = banner.is_archived;

    return (
        <div className={`bg-white border rounded-xl overflow-hidden ${isArchived ? 'border-gray-300 opacity-70' :
            banner.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'
            }`}>
            <div className="relative h-40 bg-gray-100">
                <img
                    src={getImageUrl(banner.image_url)}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover"
                />

                {/* Status badge */}
                <span className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded-md ${isArchived ? 'bg-gray-700 text-white' :
                    banner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {isArchived ? '📦 Archived' : banner.is_active ? 'Active' : 'Hidden'}
                </span>

                <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-mono bg-black/50 text-white rounded-md">
                    #{banner.sort_order}
                </span>

                {/* Archived overlay */}
                {isArchived && (
                    <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center">
                        <span className="text-white text-sm font-medium bg-gray-900/60 px-3 py-1 rounded-lg">
                            Expired
                        </span>
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {banner.title || 'No title'}
                    </p>
                    {banner.subtitle && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{banner.subtitle}</p>
                    )}
                    {banner.href && (
                        <p className="text-xs text-blue-500 truncate mt-0.5">{banner.href}</p>
                    )}
                    {banner.badge && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                            {banner.badge}
                        </span>
                    )}

                    {/* Expiry info */}
                    {banner.expires_at && !isArchived && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-orange-600">
                            <Clock className="w-3 h-3" />
                            Until {formatExpiry(banner.expires_at)}
                        </div>
                    )}
                    {isArchived && banner.expires_at && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            Expired {formatExpiry(banner.expires_at)}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    {isArchived ? (
                        <>
                            <button
                                onClick={() => onRestore?.(banner)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Restore
                            </button>
                            <button
                                onClick={() => onDelete(banner)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-md ml-auto"
                            >
                                <Trash2 className="w-3 h-3" />
                                Delete forever
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => onEdit(banner)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                            >
                                <Pencil className="w-3 h-3" />
                                Edit
                            </button>
                            <button
                                onClick={() => onToggle(banner)}
                                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md ${banner.is_active
                                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                                    : 'text-green-700 bg-green-50 hover:bg-green-100'
                                    }`}
                            >
                                {banner.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                {banner.is_active ? 'Hide' : 'Show'}
                            </button>
                            <button
                                onClick={() => onDelete(banner)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-md ml-auto"
                            >
                                <Trash2 className="w-3 h-3" />
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}