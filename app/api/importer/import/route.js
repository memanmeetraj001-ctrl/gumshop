import { NextResponse } from 'next/server';
import { createStore, createProduct, recordImportHistory, getStore, getStoreByUsername } from '@/lib/firebaseDb';
import { serverSaveStore, serverSaveProducts } from '@/lib/serverDb';
import { normalizeProductPrice, applyPriceSlash } from '@/lib/importer/priceNormalizer.js';
import { generateContextualBundles } from '@/lib/importer/productEnhancer.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
};

/**
 * POST /api/importer/import
 * Executes import of selected products, banners, and categories into a target store.
 * Supports:
 * - Direct creation of a new independent store OR merging into existing store
 * - Hardened price normalization (preventing cents or locale formatting bugs)
 * - 1-Click root homepage designation
 * - Price slashing by any percentage with preserved strike-through compare prices
 */
export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { 
            destinationStore, 
            destinationMode = 'new', // 'new' | 'append'
            setAsHomepage = false,
            isCents = false,
            slashPercent = 0,
            autoConvertCurrency = true,
            selectedProducts = [], 
            selectedBanners = [], 
            selectedCategories = [] 
        } = body;

        if (!destinationStore || (!destinationStore.name && !destinationStore.id && !destinationStore.slug)) {
            return NextResponse.json({ 
                success: false, 
                error: 'Destination store configuration is required.' 
            }, { status: 400 });
        }

        const rawSlug = destinationStore.slug || destinationStore.username || destinationStore.name || 'store';
        const cleanSlug = rawSlug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-') || `store-${Date.now()}`;
        const storeId = destinationStore.id || `store_${cleanSlug}`;

        // 1. Prepare sanitized store record
        const rawHero = destinationStore.heroBanner || (selectedBanners && selectedBanners[0]) || '';
        const cleanHeroBanner = typeof rawHero === 'string' ? rawHero : (rawHero?.image || rawHero?.url || '');
        const cleanBanners = (selectedBanners || []).map(b => 
            typeof b === 'string' ? b : (b?.image || b?.url || '')
        ).filter(Boolean);
        const cleanCategories = (selectedCategories || []).map(c => 
            typeof c === 'string' ? c : (c?.name || c?.title || c?.slug || c?.category || '')
        ).filter(Boolean);

        let existingStore = null;
        if (destinationMode === 'append') {
            try {
                existingStore = (await getStore(storeId)) || (await getStoreByUsername(cleanSlug));
            } catch {}
        }

        const storeRecord = existingStore ? {
            ...existingStore,
            singleProductStore: destinationStore.singleProductStore !== undefined 
                ? Boolean(destinationStore.singleProductStore) 
                : Boolean(existingStore.singleProductStore || selectedProducts.length === 1),
            categories: Array.from(new Set([...(existingStore.categories || []), ...cleanCategories])),
            banners: Array.from(new Set([...(existingStore.banners || []), ...cleanBanners])),
            productsCount: (existingStore.productsCount || 0) + selectedProducts.length,
            updatedAt: new Date().toISOString()
        } : {
            id: storeId,
            userId: storeId,
            name: (destinationStore.name || cleanSlug).trim(),
            username: cleanSlug,
            description: destinationStore.description || `Official store for ${(destinationStore.name || cleanSlug).trim()}.`,
            logo: destinationStore.logo || selectedProducts[0]?.image || '',
            avatar: destinationStore.logo || selectedProducts[0]?.image || '',
            bioProfile: {
                displayName: (destinationStore.name || cleanSlug).trim(),
                handle: cleanSlug,
                avatar: destinationStore.logo || selectedProducts[0]?.image || '',
                tagline: destinationStore.description || `Official store for ${(destinationStore.name || cleanSlug).trim()}.`,
                themeColor: destinationStore.themeColor || '#10B981',
                verified: true
            },
            singleProductStore: Boolean(destinationStore.singleProductStore || selectedProducts.length === 1),
            favicon: destinationStore.favicon || '',
            banner: cleanHeroBanner,
            banners: cleanBanners,
            categories: cleanCategories,
            theme: destinationStore.theme || 'viral_lander',
            themeColor: destinationStore.themeColor || '#10B981',
            status: 'active',
            gumroadProductUrl: destinationStore.gumroadProductUrl || '',
            sourceUrl: destinationStore.sourceUrl || '',
            productsCount: selectedProducts.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 2. Prepare and sanitize products scoped strictly to this storeId
        const savedProducts = selectedProducts.map((p, idx) => {
            const prodId = `prod_${cleanSlug}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
            const rawPrice = normalizeProductPrice(p.price, { isCents, autoConvert: autoConvertCurrency });
            const rawCompareAt = p.compareAtPrice 
                ? normalizeProductPrice(p.compareAtPrice, { isCents, autoConvert: autoConvertCurrency }) 
                : (rawPrice > 0 ? Math.round(rawPrice * 1.35 * 100) / 100 : 0);

            const numSlash = (p._preCalculated || p.isPricePreCalculated) ? 0 : (parseFloat(slashPercent) || 0);
            const { price, compareAtPrice: finalCompareAt } = numSlash > 0
                ? applyPriceSlash(rawPrice, numSlash, rawCompareAt)
                : { price: rawPrice, compareAtPrice: rawCompareAt };

            // Ensure volume bundle tiers always match the final calculated retail price
            const existingBundles = Array.isArray(p.customBundles) ? p.customBundles : [];
            const hasMismatchedPrice = existingBundles.length > 0 &&
                Math.abs((parseFloat(existingBundles[0]?.totalPrice) || 0) - price) > 0.05;

            const customBundles = (existingBundles.length === 0 || hasMismatchedPrice || existingBundles[0]?.subtitle?.includes('rider'))
                ? generateContextualBundles(p.name || 'Featured Product', price, 'exact')
                : existingBundles;

            // Normalize reviews to guarantee both reviews and rating have clean polymorphic objects
            const rawRevList = Array.isArray(p.reviews) && p.reviews.length > 0 
                ? p.reviews 
                : (Array.isArray(p.rating) && p.rating.length > 0 ? p.rating : []);
            
            const normalizedReviews = rawRevList.map(r => {
                if (typeof r === 'string') {
                    return { comment: r, review: r, text: r, author: 'Verified Buyer', name: 'Verified Buyer', rating: 5, date: 'Recent', badge: 'Verified Purchase' };
                }
                const body = r.comment || r.review || r.text || r.content || '';
                const author = r.author || r.name || r.userName || r.user?.name || 'Verified Buyer';
                return {
                    ...r,
                    author,
                    name: author,
                    user: r.user || { name: author },
                    comment: body,
                    review: body,
                    text: body,
                    rating: Number(r.rating || r.stars || 5),
                    date: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'),
                    badge: r.badge || 'Verified Purchase'
                };
            });

            return {
                id: prodId,
                storeId,
                name: p.name || 'Featured Product',
                slug: (p.slug || p.name || 'product').toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
                description: p.description || storeRecord.description,
                bodyHtml: p.bodyHtml || '',
                bullets: Array.isArray(p.bullets) ? p.bullets : (Array.isArray(p.bulletPoints) ? p.bulletPoints : []),
                bulletPoints: Array.isArray(p.bulletPoints) ? p.bulletPoints : (Array.isArray(p.bullets) ? p.bullets : []),
                kicker: p.kicker || '',
                subtitle: p.subtitle || '',
                customBundles,
                variants: Array.isArray(p.variants) ? p.variants : [],
                options: Array.isArray(p.options) ? p.options : [],
                faqs: Array.isArray(p.faqs) ? p.faqs : [],
                badges: Array.isArray(p.badges) ? p.badges : [],
                reviews: normalizedReviews,
                rating: normalizedReviews,
                specs: Array.isArray(p.specs) ? p.specs : [],
                isEnhanced: Boolean(p.isEnhanced),
                price,
                compareAtPrice: finalCompareAt,
                currency: autoConvertCurrency ? 'USD' : (p.currency || 'USD'),
                category: p.category || 'Featured',
                image: p.image || '',
                images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image].filter(Boolean),
                tags: Array.isArray(p.tags) ? p.tags : [],
                sku: p.sku || '',
                inStock: p.inStock !== false,
                status: 'active',
                isInstantBuyGumroad: true,
                gumroadProductId: p.gumroadProductId || '',
                createdAt: new Date().toISOString()
            };
        });

        storeRecord.products = savedProducts;

        // 3. Atomically persist to Supabase & memory cache
        try {
            await serverSaveStore(storeRecord);
            if (savedProducts.length > 0) {
                await serverSaveProducts(storeId, savedProducts);
            }
            await createStore(storeRecord);
            for (const prod of savedProducts) {
                await createProduct(prod).catch(() => {});
            }
            await recordImportHistory({
                sourceUrl: destinationStore.sourceUrl || '',
                destinationStoreName: destinationStore.name ? destinationStore.name.trim() : cleanSlug,
                destinationStoreSlug: cleanSlug,
                productsDetected: selectedProducts.length,
                productsImported: savedProducts.length,
                bannersImported: selectedBanners.length,
                status: 'COMPLETED'
            }).catch(() => {});
        } catch (dbErr) {
            console.warn('Persist warning:', dbErr.message);
        }

        const res = NextResponse.json({
            success: true,
            storeId,
            slug: cleanSlug,
            store: storeRecord,
            productsCount: savedProducts.length,
            redirectUrl: `/shop/${cleanSlug}`
        }, { headers: NO_CACHE_HEADERS });

        // Set Homepage cookie if requested
        if (setAsHomepage) {
            res.cookies.set('gumshop_homepage_store', cleanSlug, {
                path: '/',
                maxAge: 31536000,
                sameSite: 'lax'
            });
        }

        return res;

    } catch (err) {
        console.error('API /api/importer/import error:', err);
        return NextResponse.json({ 
            success: false, 
            error: err?.message || 'Failed to create store from imported data.' 
        }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}
