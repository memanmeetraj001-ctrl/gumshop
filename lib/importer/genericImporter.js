/**
 * Generic HTML, JSON-LD, and Media Asset Importer
 */

import { normalizeProductPrice, upgradeShopifyImageUrl, isCleanCatalogProduct } from './priceNormalizer.js';
import { enhanceProduct } from './productEnhancer.js';

export function extractHtmlMetadata(html, origin, hostParts) {
    const domainSlug = hostParts[0] || 'store';
    const formattedDomainName = domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1).replace(/[-_]/g, ' ');

    let storeName = formattedDomainName;
    let storeDescription = `Curated viral essentials and quality catalog from ${formattedDomainName}.`;
    let logoUrl = '';
    let faviconUrl = '';

    if (html) {
        // Title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
            const rawTitle = titleMatch[1].trim();
            storeName = rawTitle.split(/[-–|•:]/)[0].trim() || formattedDomainName;
        }

        // Description
        const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
        if (metaDescMatch) {
            storeDescription = metaDescMatch[1].trim();
        }

        // Favicon
        const faviconMatch = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i);
        if (faviconMatch) {
            let f = faviconMatch[1];
            if (f.startsWith('//')) f = 'https:' + f;
            else if (f.startsWith('/') && !f.startsWith('//')) f = new URL(f, origin).href;
            faviconUrl = f;
        }

        // Logo / OG Image
        const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        if (ogImageMatch) {
            let l = ogImageMatch[1];
            if (l.startsWith('//')) l = 'https:' + l;
            else if (l.startsWith('/') && !l.startsWith('//')) l = new URL(l, origin).href;
            logoUrl = l;
        } else if (faviconUrl) {
            logoUrl = faviconUrl;
        }
    }

    return {
        storeName,
        storeDescription,
        logoUrl,
        faviconUrl
    };
}

export function extractJsonLdProducts(html, origin, fallbackDesc) {
    const products = [];
    const categoriesSet = new Set();

    if (!html) return { products, categories: [] };

    const jsonLdMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const match of jsonLdMatches) {
        try {
            const parsed = JSON.parse(match[1]);
            const items = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
            for (const item of items) {
                if (item && item['@type'] === 'Product' && item.name) {
                    const rawPrice = item.offers?.price || item.offers?.lowPrice || (Array.isArray(item.offers) ? item.offers[0]?.price : null);
                    let rawImg = Array.isArray(item.image) ? item.image[0] : (item.image?.url || item.image || '');
                    if (rawImg.startsWith('//')) rawImg = 'https:' + rawImg;
                    else if (rawImg.startsWith('/') && !rawImg.startsWith('//')) rawImg = new URL(rawImg, origin).href;

                    rawImg = upgradeShopifyImageUrl(rawImg);
                    const finalPrice = normalizeProductPrice(rawPrice);

                    if (isCleanCatalogProduct(item.name, finalPrice, rawImg)) {
                        const cat = item.category || 'Featured';
                        categoriesSet.add(cat);

                        // Extract multiple images if present
                        let allImages = [];
                        if (Array.isArray(item.image)) {
                            allImages = item.image.map(img => {
                                let s = typeof img === 'string' ? img : (img?.url || '');
                                if (s.startsWith('//')) s = 'https:' + s;
                                else if (s.startsWith('/') && !s.startsWith('//')) s = new URL(s, origin).href;
                                return upgradeShopifyImageUrl(s);
                            }).filter(Boolean);
                        } else if (rawImg) {
                            allImages = [rawImg];
                        }

                        // Extract authentic JSON-LD reviews if available
                        let parsedReviews = [];
                        const itemReviews = Array.isArray(item.review) 
                            ? item.review 
                            : (item.review ? [item.review] : (Array.isArray(item.reviews) ? item.reviews : (item.reviews ? [item.reviews] : [])));
                        if (itemReviews.length > 0) {
                            parsedReviews = itemReviews.map(r => {
                                const author = typeof r.author === 'string' ? r.author : (r.author?.name || 'Customer');
                                const body = r.reviewBody || r.description || r.comment || r.review || '';
                                return {
                                    user: { name: author },
                                    author,
                                    name: author,
                                    userName: author,
                                    rating: Number(r.reviewRating?.ratingValue || r.rating || 5),
                                    review: body,
                                    comment: body,
                                    text: body,
                                    date: r.datePublished ? new Date(r.datePublished).toLocaleDateString() : 'Recent',
                                    badge: 'Verified Purchase',
                                    createdAt: r.datePublished || new Date().toISOString()
                                };
                            }).filter(r => Boolean(r.review));
                        }

                        const rawProd = {
                            id: `prod_jsonld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                            name: item.name.trim(),
                            slug: item.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
                            description: item.description || fallbackDesc,
                            price: finalPrice,
                            compareAtPrice: Math.round(finalPrice * 1.35 * 100) / 100,
                            currency: 'USD',
                            category: cat,
                            image: rawImg,
                            images: allImages.length > 0 ? allImages : [rawImg],
                            sku: item.sku || '',
                            reviews: parsedReviews,
                            inStock: true
                        };

                        const enhanced = enhanceProduct(rawProd, { roundingStrategy: 'exact' });
                        products.push(enhanced);
                    }
                }
            }
        } catch {}
    }

    return {
        products,
        categories: Array.from(categoriesSet)
    };
}

export function extractBanners(html, origin, logoUrl, detectedTheme) {
    const banners = [];

    if (html) {
        const imgMatches = [...html.matchAll(/<img[^>]+(?:data-src|src)=["']([^"']+)["'][^>]*>/gi)];
        for (const m of imgMatches) {
            const tagStr = m[0].toLowerCase();
            let src = m[1];
            if (
                tagStr.includes('banner') || 
                tagStr.includes('hero') || 
                tagStr.includes('slideshow') || 
                tagStr.includes('slider') || 
                tagStr.includes('header') ||
                tagStr.includes('promo') ||
                tagStr.includes('featured-campaign')
            ) {
                if (src.startsWith('//')) src = 'https:' + src;
                else if (src.startsWith('/') && !src.startsWith('//')) src = new URL(src, origin).href;

                if (
                    src.startsWith('http') && 
                    !src.includes('icon') && 
                    !src.includes('avatar') && 
                    !src.includes('badge') &&
                    !banners.includes(src)
                ) {
                    banners.push(src);
                }
            }
        }
    }

    if (banners.length === 0 && logoUrl && (logoUrl.includes('banner') || logoUrl.includes('hero') || logoUrl.includes('files'))) {
        banners.push(logoUrl);
    }

    return banners;
}
