/**
 * Shopify Public Endpoint & Catalog Importer (SSRF-Protected)
 */

import { safeFetch } from '../security.js';
import { normalizeProductPrice, upgradeShopifyImageUrl, isCleanCatalogProduct } from './priceNormalizer.js';

export function isCleanProduct(name, price, image) {
    return isCleanCatalogProduct(name, price, image);
}

export function parseShopifyProducts(rawProducts = [], origin = '') {
    const products = [];
    const categoriesSet = new Set();

    if (Array.isArray(rawProducts)) {
        for (const p of rawProducts) {
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

            // Extract bullet points from HTML
            const rawHtml = p.body_html || '';
            const bullets = [];
            const liMatches = rawHtml.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
            for (const li of liMatches) {
                const cleanLi = li.replace(/<[^>]+>/g, '').trim();
                if (cleanLi && cleanLi.length < 120) {
                    bullets.push(cleanLi);
                }
            }

            // Extract actual variants from source store
            const realVariants = (p.variants || []).map(v => ({
                id: String(v.id || ''),
                name: v.title || 'Standard',
                price: normalizeProductPrice(v.price),
                compareAtPrice: v.compare_at_price ? normalizeProductPrice(v.compare_at_price) : 0,
                available: v.available !== false,
                sku: v.sku || ''
            })).filter(v => v.name && v.name !== 'Default Title');

            // Extract authentic options (colors, sizes, etc.)
            const rawOptions = (p.options || []).map(opt => ({
                name: opt.name,
                values: opt.values || []
            })).filter(opt => opt.name && opt.name.toLowerCase() !== 'title');

            // Generate Product-Specific Bundles with auto-conversion & exact pricing ratios
            const baseItemNoun = title.split(' ')[0] || 'Item';
            const bundle2Total = Math.round(price * 1.4082075 * 100) / 100;
            const bundle3Total = Math.round(price * 1.81623 * 100) / 100;
            const customBundles = [
                {
                    qty: 1,
                    label: `1 ${baseItemNoun}`,
                    subtitle: 'One legendary rider',
                    pricePerUnit: price,
                    totalPrice: price,
                    badge: null
                },
                {
                    qty: 2,
                    label: `2 ${baseItemNoun}s`,
                    subtitle: 'Two-Pet Household / matching Halloween photos',
                    pricePerUnit: Math.round((bundle2Total / 2) * 100) / 100,
                    totalPrice: bundle2Total,
                    badge: 'Two-Pet Household ⭐'
                },
                {
                    qty: 3,
                    label: `3 ${baseItemNoun}s`,
                    subtitle: 'Costume Party Pack',
                    pricePerUnit: Math.round((bundle3Total / 3) * 100) / 100,
                    totalPrice: bundle3Total,
                    badge: 'Costume Party Pack 🔥'
                }
            ];

            products.push({
                id: `prod_shp_${p.id || Math.random().toString(36).substring(2, 8)}`,
                name: title,
                handle: p.handle,
                bodyHtml: rawHtml,
                description: rawHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim() || `${title} with premium grade materials.`,
                bullets: bullets.length > 0 ? bullets.slice(0, 6) : null,
                kicker: 'HALLOWEEN 2026',
                subtitle: 'The legend rides again.',
                price: price,
                compareAtPrice: compareAt,
                variants: realVariants,
                options: rawOptions,
                customBundles: customBundles,
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

    return {
        products,
        categories: Array.from(categoriesSet)
    };
}

export async function importFromShopify(origin, targetPath = '') {
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
                return parseShopifyProducts(data.products, origin);
            }
        }
    } catch (e) {
        console.warn('Shopify catalog fetch notice:', e.message);
    }

    return {
        products: [],
        categories: []
    };
}
