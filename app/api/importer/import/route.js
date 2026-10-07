import { NextResponse } from 'next/server';
import { createStore, createProduct, recordImportHistory } from '@/lib/firebaseDb';

/**
 * POST /api/importer/import
 * Executes import of selected products, banners, and categories into a target store.
 */
export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { 
            destinationStore, 
            selectedProducts = [], 
            selectedBanners = [], 
            selectedCategories = [] 
        } = body;

        if (!destinationStore || !destinationStore.name) {
            return NextResponse.json({ 
                success: false, 
                error: 'Destination store configuration is required.' 
            }, { status: 400 });
        }

        const rawSlug = destinationStore.slug || destinationStore.name;
        const cleanSlug = rawSlug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-') || `store-${Date.now()}`;
        const storeId = `store_${cleanSlug}`;

        // 1. Prepare sanitized store record
        const rawHero = destinationStore.heroBanner || (selectedBanners && selectedBanners[0]) || '';
        const cleanHeroBanner = typeof rawHero === 'string' ? rawHero : (rawHero?.image || rawHero?.url || '');
        const cleanBanners = (selectedBanners || []).map(b => 
            typeof b === 'string' ? b : (b?.image || b?.url || '')
        ).filter(Boolean);
        const cleanCategories = (selectedCategories || []).map(c => 
            typeof c === 'string' ? c : (c?.name || c?.title || c?.slug || c?.category || '')
        ).filter(Boolean);

        const storeRecord = {
            id: storeId,
            userId: storeId,
            name: destinationStore.name.trim(),
            username: cleanSlug,
            description: destinationStore.description || `Official store for ${destinationStore.name.trim()}.`,
            logo: destinationStore.logo || selectedProducts[0]?.image || '',
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
            const price = parseFloat(p.price || 0);
            const compareAt = parseFloat(p.compareAtPrice) || (price > 0 ? Math.round(price * 1.35 * 100) / 100 : 0);

            return {
                id: prodId,
                storeId,
                name: p.name || 'Featured Product',
                slug: (p.slug || p.name || 'product').toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
                description: p.description || storeRecord.description,
                price,
                compareAtPrice: compareAt,
                currency: p.currency || 'USD',
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

        // 3. Persist to Firestore and record history
        try {
            await createStore(storeRecord);
            for (const prod of savedProducts) {
                await createProduct(prod).catch(() => {});
            }
            await recordImportHistory({
                sourceUrl: destinationStore.sourceUrl || '',
                destinationStoreName: destinationStore.name.trim(),
                destinationStoreSlug: cleanSlug,
                productsDetected: selectedProducts.length,
                productsImported: savedProducts.length,
                bannersImported: selectedBanners.length,
                status: 'COMPLETED'
            }).catch(() => {});
        } catch (dbErr) {
            console.warn('Firebase persist error (will rely on edge client mirror):', dbErr.message);
        }

        return NextResponse.json({
            success: true,
            storeId,
            slug: cleanSlug,
            store: storeRecord,
            productsCount: savedProducts.length,
            redirectUrl: `/shop/${cleanSlug}`
        });

    } catch (err) {
        console.error('API /api/importer/import error:', err);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to create store from imported data.' 
        }, { status: 500 });
    }
}
