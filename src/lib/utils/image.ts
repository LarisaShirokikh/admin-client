const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function getImageUrl(url: string | null | undefined): string {
    if (!url) return '/placeholder.png';
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
}