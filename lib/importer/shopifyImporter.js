/**
 * Shopify Public Endpoint & Catalog Importer (SSRF-Protected)
 */

import { safeFetch } from '../security.js';

const JUNK_PRODUCT_REGEX = /partial\s*payment|down\s*payment|advance\s*payment|deposit|booking\s*amount|cash\s*on\s*delivery|cod\s*advance|shipping\s*protection|route\s*package|package\s*protection|transit\s*insurance|navidium|tip(\s|$)|tips(\s|$)|warranty|custom\s*order|gift\s*wrap|test\s*product|draft/i;

export function isCleanProduct(name, price, image) {
    if (!name || typeof name !== 'string') return false;
    const cleanName = name.trim();
    if (cleanName.length < 2) return false;
    if (JUNK_PRODUCT_REGEX.test(cleanName)) return false;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return false;
    if (!image || typeof image !== 'string' || !image.startsWith('http')) return false;
    return true;
}

export async function importFromShopify(origin, targetPath = '') {
    const products = [];
    const categoriesSet = new Set();

    try {
        let endpoint = `${origin}/products.json?limit=50`;
        if (targetPath.includes('/collections/')) {
            endpoint = `${origin}${targetPath.replace(/\/$/, '')}/products.json?limit=50`;
        }

        let res = await safeFetch(endpoint, { timeoutMs: 7000 }).catch(() => null);

        if (!res || !res.ok) {
            res = await safeFetch(`${origin}/products.json?limit=50`, { timeoutMs: 7000 }).catch(() => null);
        }

        if (res && res.ok) {
            const data = await res.json().catch(() => ({}));
            if (Array.isArray(data.products)) {
                for (const p of data.products) {
                    const title = (p.title || '').trim();
                    const variant = p.variants?.[0] || {};
                    const price = parseFloat(variant.price || 0);
                    const compareAt = parseFloat(variant.compare_at_price || 0) || Math.round(price * 1.35 * 100) / 100;
                    const images = (p.images || []).map(img => img.src).filter(Boolean);
                    const mainImage = images[0] || '';

                    if (!isCleanProduct(title, price, mainImage)) continue;

                    const cat = (p.product_type || '').trim() || 'Featured Collection';
                    categoriesSet.add(cat);

                    products.push({
                        id: `prod_shp_${p.id || Math.random().toString(36).substring(2, 8)}`,
                        name: title,
                        handle: p.handle,
                        description: (p.body_html || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 500) || `${title} with premium grade materials.`,
                        price: price,
                        compareAtPrice: compareAt,
                        category: cat,
                        tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? p.tags.split(',').map(t => t.trim()) : []),
                        images: images.length > 0 ? images.slice(0, 6) : [mainImage],
                        image: mainImage,
                        url: `${origin}/products/${p.handle || p.id}`,
                        inStock: variant.available !== false,
                        badge: 'Verified Import',
                        sourcePlatform: 'shopify',
                        isInstantBuyGumroad: true
                    });
                }
            }
        }
    } catch (e) {
        console.warn('Shopify catalog fetch notice:', e.message);
    }

    return {
        products,
        categories: Array.from(categoriesSet)
    };
}
