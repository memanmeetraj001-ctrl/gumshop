/**
 * Shopify Public Endpoint & Catalog Importer (SSRF-Protected)
 */

import { safeFetch } from '../security.js';
import { normalizeProductPrice, upgradeShopifyImageUrl, isCleanCatalogProduct } from './priceNormalizer.js';

export function isCleanProduct(name, price, image) {
    return isCleanCatalogProduct(name, price, image);
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
                    
                    // Normalize price safely (preventing cents string or locale errors)
                    const rawVariantPrice = variant.price;
                    const price = normalizeProductPrice(rawVariantPrice);
                    
                    // Normalize compareAt price
                    const rawCompareAt = variant.compare_at_price;
                    const compareAt = rawCompareAt ? normalizeProductPrice(rawCompareAt) : (price > 0 ? Math.round(price * 1.35 * 100) / 100 : 0);
                    
                    // Upgrade all image URLs to full uncompressed resolution
                    const rawImages = (p.images || []).map(img => img.src).filter(Boolean);
                    const images = rawImages.map(img => upgradeShopifyImageUrl(img)).filter(Boolean);
                    const mainImage = images[0] || upgradeShopifyImageUrl(p.image?.src || '');

                    if (!isCleanCatalogProduct(title, price, mainImage)) continue;

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
                        images: images.length > 0 ? images.slice(0, 8) : [mainImage],
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
