/**
 * Shopify Public Endpoint & Catalog Importer (SSRF-Protected)
 */

import { safeFetch } from '../security.js';
import { decodeHtmlEntities, cleanText } from '../textUtils.js';
import { normalizeProductPrice, upgradeShopifyImageUrl, isCleanCatalogProduct } from './priceNormalizer.js';
import { 
    generateContextualBundles, 
    generateBenefitBullets, 
    generateProductFaqs, 
    generateTrustBadges, 
    generateVerifiedReviews,
    extractProductNoun 
} from './productEnhancer.js';

export function isCleanProduct(name, price, image) {
    return isCleanCatalogProduct(name, price, image);
}

export function parseShopifyProducts(rawProducts = [], origin = '', options = {}) {
    const products = [];
    const categoriesSet = new Set();

    if (Array.isArray(rawProducts)) {
        for (const p of rawProducts) {
            const title = (p.title || '').trim();
            const variant = p.variants?.[0] || {};
            
            // Normalize price safely (preventing cents string or locale errors)
            const rawVariantPrice = variant.price;
            const price = normalizeProductPrice(rawVariantPrice, options);
            
            // Normalize compareAt price
            const rawCompareAt = variant.compare_at_price;
            const compareAtPrice = rawCompareAt ? normalizeProductPrice(rawCompareAt, options) : (price > 0 ? Math.round(price * 1.35 * 100) / 100 : 0);
            
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
                const cleanLi = decodeHtmlEntities(li.replace(/<[^>]+>/g, '').trim());
                if (cleanLi && cleanLi.length < 120) {
                    bullets.push(cleanLi);
                }
            }
            const finalBullets = bullets.length > 0 ? bullets.slice(0, 6) : generateBenefitBullets(decodeHtmlEntities(title), cat);

            // Extract actual variants from source store
            const baseVPrice = p.variants && p.variants.length > 0 ? normalizeProductPrice(p.variants[0].price) : price;
            const realVariants = (p.variants || []).map(v => {
                const vPrice = normalizeProductPrice(v.price);
                const delta = Math.max(0, Math.round((vPrice - baseVPrice) * 100) / 100);
                return {
                    id: String(v.id || ''),
                    name: decodeHtmlEntities(v.title || 'Standard'),
                    price: vPrice,
                    priceDelta: delta,
                    compareAtPrice: v.compare_at_price ? normalizeProductPrice(v.compare_at_price) : 0,
                    available: v.available !== false,
                    sku: v.sku || ''
                };
            }).filter(v => v.name && v.name !== 'Default Title');

            // Extract authentic options (colors, sizes, etc.)
            const rawOptions = (p.options || []).map(opt => ({
                name: decodeHtmlEntities(opt.name),
                values: (opt.values || []).map(val => decodeHtmlEntities(val))
            })).filter(opt => opt.name && opt.name.toLowerCase() !== 'title');

            const isApparelProduct = /apparel|clothing|costume|outfit|shirt|jacket|shoes|pants|hoodie|harness|collar|vest|sweater|suit|dress|wear\b/i.test(`${title} ${cat}`);
            const isToyOrHardware = /toy|gun|blaster|rifle|pistol|launcher|bullet|nerf|ammo|magazine|battery|charger|rc\b|drone|car\b|truck|motor|gadget|knife|blade|tool|electronics|gel\s*ball|rubber/i.test(`${title} ${cat}`);

            const sizeOpt = (p.options || []).find(o => /size|sizing|dimensions|format|edition/i.test(o.name || ''));
            const extractedSizes = sizeOpt && Array.isArray(sizeOpt.values) && sizeOpt.values.length > 0
                ? sizeOpt.values.map(val => {
                    const matchedVar = realVariants.find(rv => rv.name.includes(decodeHtmlEntities(val)));
                    return {
                        name: decodeHtmlEntities(val),
                        priceDelta: matchedVar?.priceDelta || 0,
                        effectivePrice: matchedVar?.price || price
                    };
                })
                : (realVariants.length > 0 ? realVariants.map(v => ({
                    id: v.id,
                    name: v.name,
                    sku: v.sku,
                    priceDelta: v.priceDelta,
                    effectivePrice: v.price
                })) : (isApparelProduct && !isToyOrHardware ? [
                    { name: 'Small (S)', priceDelta: 0, effectivePrice: price },
                    { name: 'Medium (M)', priceDelta: 0, effectivePrice: price },
                    { name: 'Large (L)', priceDelta: 0, effectivePrice: price },
                    { name: 'X-Large (XL)', priceDelta: 0, effectivePrice: price }
                ] : [
                    { name: 'Standard Edition', priceDelta: 0, effectivePrice: price }
                ]));

            // Generate Contextual Product-Specific Bundles
            const customBundles = generateContextualBundles(decodeHtmlEntities(title), price, 'exact');
            const noun = extractProductNoun(decodeHtmlEntities(title));

            products.push({
                id: `prod_shp_${p.id || Math.random().toString(36).substring(2, 8)}`,
                name: decodeHtmlEntities(title),
                handle: p.handle,
                bodyHtml: rawHtml,
                description: cleanText(rawHtml) || `${decodeHtmlEntities(title)} engineered with premium grade materials.`,
                bullets: finalBullets,
                bulletPoints: finalBullets,
                kicker: 'OFFICIAL RELEASE',
                subtitle: `Engineered for performance, comfort, and premium everyday utility.`,
                price: price,
                compareAtPrice: compareAtPrice,
                sizes: extractedSizes,
                variants: realVariants,
                options: rawOptions,
                customBundles: customBundles,
                faqs: generateProductFaqs(title),
                badges: generateTrustBadges(),
                reviews: generateVerifiedReviews(title),
                rating: generateVerifiedReviews(title),
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

export async function importFromShopify(origin, targetPath = '', options = {}) {
    const isSinglePage = options.crawlScope === 'single_page';
    const productMatch = targetPath.match(/\/products\/([a-zA-Z0-9-_]+)/);

    // 1. Single Product URL direct extraction
    if (productMatch) {
        const handle = productMatch[1];
        try {
            const singleRes = await safeFetch(`${origin}/products/${handle}.json`, { timeoutMs: 7000 }).catch(() => null);
            if (singleRes && singleRes.ok) {
                const singleData = await singleRes.json().catch(() => ({}));
                if (singleData.product) {
                    return parseShopifyProducts([singleData.product], origin, options);
                }
            }
        } catch (e) {
            console.warn('Shopify single product endpoint failed, falling back:', e.message);
        }
    }

    // 2. Collection or Storewide catalog extraction with pagination
    let baseEndpoint = `${origin}/products.json`;
    if (targetPath.includes('/collections/')) {
        const collPath = targetPath.split('?')[0].replace(/\/$/, '');
        baseEndpoint = `${origin}${collPath}/products.json`;
    }

    try {
        const maxPages = isSinglePage ? 1 : (options.maxPages || 5);
        const limitPerPage = 50;
        let allRawProducts = [];
        const seenIds = new Set();

        for (let page = 1; page <= maxPages; page++) {
            const sep = baseEndpoint.includes('?') ? '&' : '?';
            const endpoint = `${baseEndpoint}${sep}limit=${limitPerPage}&page=${page}`;

            let res = await safeFetch(endpoint, { timeoutMs: 7000 }).catch(() => null);
            if (!res || !res.ok) {
                // If collection endpoint failed on page 1, fallback to store products.json
                if (page === 1 && baseEndpoint !== `${origin}/products.json`) {
                    baseEndpoint = `${origin}/products.json`;
                    res = await safeFetch(`${baseEndpoint}?limit=${limitPerPage}&page=1`, { timeoutMs: 7000 }).catch(() => null);
                }
            }

            if (!res || !res.ok) break;

            const data = await res.json().catch(() => ({}));
            const pageProducts = Array.isArray(data.products) ? data.products : [];

            if (pageProducts.length === 0) break;

            for (const p of pageProducts) {
                const idKey = String(p.id || p.handle || '');
                if (idKey && !seenIds.has(idKey)) {
                    seenIds.add(idKey);
                    allRawProducts.push(p);
                }
            }

            // Stop if reached final page or single page mode requested
            if (pageProducts.length < limitPerPage || isSinglePage) break;
        }

        if (allRawProducts.length > 0) {
            return parseShopifyProducts(allRawProducts, origin, options);
        }
    } catch (e) {
        console.warn('Shopify catalog fetch notice:', e.message);
    }

    return {
        products: [],
        categories: []
    };
}

