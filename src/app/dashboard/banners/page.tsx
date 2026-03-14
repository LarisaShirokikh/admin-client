// src/app/dashboard/banners/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/contexts/ToastContext';
import { AlertCircle, XCircle, Plus, Loader2, Image as ImageIcon } from 'lucide-react';
import { bannersApi } from '@/lib/api/banners';
import BannerCard from '@/components/banners/BannerCard';
import BannerModal from '@/components/banners/BannerModal';
import type { BannerFormData } from '@/components/banners/BannerModal';
import { Banner } from '@/types/banners';

export default function BannersPage() {
    const { isSuperuser } = useAuth();
    const { showToast } = useToast();

    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Banner | null>(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await bannersApi.getAll();
            setBanners(data.items);
        } catch {
            setError('Failed to load banners');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditing(null); setShowModal(true); };
    const openEdit = (b: Banner) => { setEditing(b); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setEditing(null); };

    const handleSave = async (data: BannerFormData) => {
        setSaving(true);
        try {
            if (editing) {
                await bannersApi.update(editing.id, data);
                showToast('success', 'Banner updated');
            } else {
                if (!data.image) { showToast('error', 'Image is required'); setSaving(false); return; }
                await bannersApi.create({ image: data.image, ...data });
                showToast('success', 'Banner created');
            }
            closeModal();
            await load();
        } catch {
            showToast('error', editing ? 'Failed to update' : 'Failed to create');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (b: Banner) => {
        try {
            await bannersApi.toggleStatus(b.id);
            await load();
            showToast('success', b.is_active ? 'Banner hidden' : 'Banner activated');
        } catch {
            showToast('error', 'Failed to toggle status');
        }
    };

    const handleDelete = async (b: Banner) => {
        const label = b.title || '#' + b.id;
        if (!confirm('Delete banner "' + label + '"? This cannot be undone.')) return;
        try {
            await bannersApi.delete(b.id);
            await load();
            showToast('success', 'Banner deleted');
        } catch {
            showToast('error', 'Failed to delete');
        }
    };

    return (
        <div className="space-y-5" >
            <ErrorBar error={error} onDismiss={() => setError(null)}
            />
            <PageHeader count={banners.length} onCreate={openCreate} />
            {loading && <LoadingState />}
            {!loading && banners.length === 0 && <EmptyState onCreate={openCreate} />}
            {
                !loading && banners.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" >
                        {
                            banners.map((b) => (
                                <BannerCard
                                    key={b.id}
                                    banner={b}
                                    onEdit={openEdit}
                                    onToggle={handleToggle}
                                    onDelete={handleDelete}
                                />
                            ))
                        }
                    </div>
                )
            }
            {
                showModal && (
                    <BannerModal
                        banner={editing}
                        loading={saving}
                        onSave={handleSave}
                        onClose={closeModal}
                    />
                )
            }
        </div>
    );
}

function ErrorBar({ error, onDismiss }: { error: string | null; onDismiss: () => void }) {
    if (!error) return null;
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3" >
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-red-800 text-sm" > {error} </span>
            < button onClick={onDismiss} className="ml-auto text-red-600 hover:text-red-800" >
                <XCircle className="h-4 w-4" />
            </button>
        </div>
    );
}

function PageHeader({ count, onCreate }: { count: number; onCreate: () => void }) {
    return (
        <div className="flex items-center justify-between" >
            <div>
                <h1 className="text-2xl font-bold text-gray-900" > Banners </h1>
                < p className="text-sm text-gray-500 mt-1" > Promo banners on the home page. {count} total.</p>
            </div>
            < button onClick={onCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700" >
                <Plus className="w-4 h-4" />
                Add banner
            </button>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center h-48" >
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
    );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2" > No banners yet </h3>
            < p className="text-sm text-gray-500 mb-6" > Upload your first promo banner.</p>
            < button onClick={onCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700" >
                <Plus className="w-4 h-4" />
                Add banner
            </button>
        </div>
    );
}