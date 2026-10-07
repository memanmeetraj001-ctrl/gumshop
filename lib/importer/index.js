/**
 * Master Intelligent Import Engine Orchestrator
 * High-performance, SSRF-safe analysis of public e-commerce websites.
 * Generates explicit classification (FULL_IMPORT | PARTIAL_IMPORT | NO_IMPORT)
 * and attaches complete provenance to every detected product and banner.
 */

import { validateScraperUrl, safeFetch } from '../security.js';
import { detectStorePlatform } from './detector.js';
import { importFromShopify } from './shopifyImporter.js';
import { extractHtmlMetadata, extractJsonLdProducts, extractBanners } from './genericImporter.js';

export async function analyzeStoreUrl(rawUrl) {
    // 1. SSRF and DNS rebinding validation
    const validation = await validateScraperUrl(rawUrl);
    if (!validation.valid) {
        return {
            success: false,
            classification: 'NO_IMPORT',
            error: validation.error || 'Invalid or forbidden URL'
        };
    }

    const { sanitizedUrl, origin, hostname } = validation;
    const hostParts = hostname.replace(/^www\./, '').split('.');

    let html = '';
    let fetchSuccess = false;

    // 2. Hardened Safe Fetch with timeout and redirect validation
    try {
        const res = await safeFetch(sanitizedUrl, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeoutMs: 12000,
            maxRedirects: 4
        });

        if (res.ok) {
            html = await res.text();
            fetchSuccess = true;
        }
    } catch (e) {
        // Network timeout or bot-guard - proceed to platform probes
        console.warn('Initial HTML fetch notice:', e.message);
    }

    // 3. Platform Detection
    const platform = detectStorePlatform(html);

    // 4. Metadata extraction
    const metadata = extractHtmlMetadata(html, origin, hostParts);

    // 5. Theme / Niche detection
    const combinedText = (sanitizedUrl + ' ' + metadata.storeName + ' ' + metadata.storeDescription).toLowerCase();
    let detectedTheme = 'viral_lander';
    let defaultPalette = '#10B981';

    if (combinedText.includes('cloth') || combinedText.includes('fashion') || combinedText.includes('apparel') || combinedText.includes('wear') || combinedText.includes('hoodie')) {
        detectedTheme = 'fashion_lookbook';
        defaultPalette = '#0F172A';
    } else if (combinedText.includes('beauty') || combinedText.includes('skin') || combinedText.includes('glow') || combinedText.includes('cosmetic')) {
        detectedTheme = 'clean_beauty';
        defaultPalette = '#F43F5E';
    } else if (combinedText.includes('tech') || combinedText.includes('audio') || combinedText.includes('gadget') || combinedText.includes('hardware') || combinedText.includes('rc') || combinedText.includes('drone')) {
        detectedTheme = 'tech_hardware';
        defaultPalette = '#06B6D4';
    } else if (combinedText.includes('digital') || combinedText.includes('notion') || combinedText.includes('course') || combinedText.includes('template')) {
        detectedTheme = 'digital_creator';
        defaultPalette = '#3B82F6';
    }

    // 6. Product Extraction Pipeline
    let rawProducts = [];
    let categoriesSet = new Set();
    let extractionMethod = 'GENERIC';

    // Strategy A: Shopify endpoint probe
    if (platform === 'shopify' || rawProducts.length === 0) {
        const parsedUrl = new URL(sanitizedUrl);
        const shopifyResult = await importFromShopify(origin, parsedUrl.pathname);
        if (shopifyResult.products.length > 0) {
            rawProducts = shopifyResult.products;
            shopifyResult.categories.forEach(c => categoriesSet.add(c));
            extractionMethod = 'SHOPIFY_API';
        }
    }

    // Strategy B: JSON-LD fallback
    if (rawProducts.length === 0 && html) {
        const jsonLdResult = extractJsonLdProducts(html, origin, metadata.storeDescription);
        if (jsonLdResult.products.length > 0) {
            rawProducts = jsonLdResult.products;
            jsonLdResult.categories.forEach(c => categoriesSet.add(c));
            extractionMethod = 'JSON_LD';
        }
    }

    // 7. Attach Full Provenance to Every Extracted Product
    const nowIso = new Date().toISOString();
    const products = rawProducts.map((p, idx) => ({
        ...p,
        id: p.id || `imp_prod_${idx}_${Date.now()}`,
        sourceUrl: sanitizedUrl,
        sourceStore: metadata.storeName,
        sourceProductUrl: p.url || `${origin}/products/${p.handle || idx}`,
        sourceImageUrl: p.image || p.images?.[0] || '',
        importedAt: nowIso,
        importMethod: extractionMethod,
        gumroadStatus: 'NOT_CONNECTED',
        syncStatus: 'NOT_CONNECTED'
    }));

    // 8. Banner Extraction with First-Class Schema
    const rawBanners = extractBanners(html, origin, metadata.logoUrl, detectedTheme);
    const banners = rawBanners.map((b, idx) => {
        const imgUrl = typeof b === 'string' ? b : (b?.image || b?.url || '');
        return {
            id: (typeof b === 'object' && b.id) || `imp_ban_${idx}_${Date.now()}`,
            title: (typeof b === 'object' && b.title) || `${metadata.storeName} Spotlight`,
            subtitle: (typeof b === 'object' && b.subtitle) || 'Exclusive Seasonal Release',
            image: imgUrl,
            position: idx === 0 ? 'hero' : 'secondary',
            displayOrder: idx + 1,
            status: 'active',
            sourceUrl: sanitizedUrl,
            importedAt: nowIso
        };
    }).filter(b => Boolean(b.image));

    // 9. Explicit Classification
    let classification = 'FULL_IMPORT';
    if (products.length === 0 && banners.length === 0) {
        classification = 'NO_IMPORT';
    } else if (products.length === 0 && banners.length > 0) {
        classification = 'PARTIAL_IMPORT';
    } else if (products.some(p => !p.price || !p.image)) {
        classification = 'PARTIAL_IMPORT';
    }

    return {
        success: classification !== 'NO_IMPORT',
        classification,
        platform,
        extractionMethod,
        store: {
            name: metadata.storeName,
            description: metadata.storeDescription,
            logo: metadata.logoUrl || (products[0]?.image || ''),
            favicon: metadata.faviconUrl,
            theme: detectedTheme,
            themeColor: defaultPalette,
            sourceUrl: sanitizedUrl,
            analyzedAt: nowIso
        },
        categories: Array.from(categoriesSet),
        banners,
        products,
        metrics: {
            productsDetected: products.length,
            bannersDetected: banners.length,
            categoriesDetected: categoriesSet.size,
            imagesDetected: products.reduce((acc, p) => acc + (p.images?.length || 1), 0) + banners.length
        }
    };
}
