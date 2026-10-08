/**
 * Universal Image Sanitization & Error Fallback Utility
 * Enforces HTTPS compliance, prevents mixed-content blocks in incognito/mobile,
 * and provides zero-error image rendering.
 */

const DEFAULT_PRODUCT_FALLBACK = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
const DEFAULT_AVATAR_FALLBACK = 'https://api.dicebear.com/7.x/initials/svg?seed=Store';

export function getSafeImageUrl(url, fallbackType = 'product') {
    if (!url || typeof url !== 'string' || !url.trim()) {
        return fallbackType === 'avatar' ? DEFAULT_AVATAR_FALLBACK : DEFAULT_PRODUCT_FALLBACK;
    }
    const clean = url.trim();
    if (clean.startsWith('http://')) {
        return clean.replace('http://', 'https://');
    }
    return clean;
}

export function handleImageError(e, fallbackType = 'product', seed = 'Store') {
    if (!e || !e.target) return;
    e.target.onerror = null;
    if (fallbackType === 'avatar') {
        e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed || 'Store')}`;
    } else {
        e.target.src = DEFAULT_PRODUCT_FALLBACK;
    }
}
