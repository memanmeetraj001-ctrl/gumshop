/**
 * Universal Image Sanitization & Error Fallback Utility
 * Enforces HTTPS compliance, prevents mixed-content blocks in incognito/mobile,
 * and provides zero-error image rendering.
 */

const DEFAULT_PRODUCT_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' fill='none'%3E%3Crect width='400' height='400' fill='%23f8fafc'/%3E%3Cpath d='M200 130L270 170V250L200 290L130 250V170L200 130Z' stroke='%23cbd5e1' stroke-width='6' stroke-linejoin='round'/%3E%3Cpath d='M200 130V290M270 170L200 210L130 170' stroke='%23cbd5e1' stroke-width='6' stroke-linejoin='round'/%3E%3C/svg%3E";
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
