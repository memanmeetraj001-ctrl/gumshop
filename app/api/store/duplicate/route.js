import { NextResponse } from 'next/server';
import { getStoreByUsername, getProductsByStore, createStore, createProduct } from '@/lib/firebaseDb';
import { resolvePresetStore, resolvePresetProducts } from '@/lib/storePresets';

/**
 * POST /api/store/duplicate
 * Duplicates an existing store and creates an independent store clone with optional asset copying.
 */
export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const sourceStoreSlug = body.sourceStoreSlug || body.sourceStoreId || body.sourceSlug;
        const newStoreName = body.newStoreName || body.name;
        const newStoreSlug = body.newStoreSlug || body.newUsername || body.newSlug;
        const copyBranding = body.copyBranding !== false;
        const copyProducts = body.copyProducts !== false;
        const copyBanners = body.copyBanners !== false;
        const copyTheme = body.copyTheme !== false;
        const copyGumroad = body.copyGumroad !== false;

        if (!sourceStoreSlug || !newStoreName) {
            return NextResponse.json({
                success: false,
                error: 'Source store slug and new store name are required.'
            }, { status: 400 });
        }

        const cleanNewSlug = (newStoreSlug || newStoreName).toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-') || `clone-${Date.now()}`;
        const newStoreId = `store_${cleanNewSlug}`;

        // 1. Fetch source store
        let sourceStore = null;
        try {
            sourceStore = await getStoreByUsername(sourceStoreSlug);
        } catch {}

        if (!sourceStore && typeof body.sourceStoreData === 'object') {
            sourceStore = body.sourceStoreData;
        }

        if (!sourceStore) {
            sourceStore = resolvePresetStore(sourceStoreSlug);
        }

        if (!sourceStore) {
            return NextResponse.json({
                success: false,
                error: `Could not find source store "${sourceStoreSlug}".`
            }, { status: 404 });
        }

        // 2. Fetch source products
        let sourceProducts = [];
        if (copyProducts) {
            try {
                sourceProducts = await getProductsByStore(sourceStore.id);
            } catch {}
            if ((!sourceProducts || sourceProducts.length === 0) && Array.isArray(sourceStore.products)) {
                sourceProducts = sourceStore.products;
            }
            if (!sourceProducts || sourceProducts.length === 0) {
                sourceProducts = resolvePresetProducts(sourceStoreSlug, sourceStore.id);
            }
        }

        // 3. Construct new independent store record
        const duplicatedStore = {
            id: newStoreId,
            userId: newStoreId,
            name: newStoreName.trim(),
            username: cleanNewSlug,
            description: sourceStore.description || `Official store for ${newStoreName.trim()}.`,
            logo: copyBranding ? (sourceStore.logo || '') : '',
            favicon: copyBranding ? (sourceStore.favicon || '') : '',
            banner: copyBanners ? (sourceStore.banner || '') : '',
            banners: copyBanners ? (Array.isArray(sourceStore.banners) ? [...sourceStore.banners] : []) : [],
            theme: copyTheme ? (sourceStore.theme || 'viral_lander') : 'viral_lander',
            themeColor: copyTheme ? (sourceStore.themeColor || '#10B981') : '#10B981',
            gumroadProductUrl: copyGumroad ? (sourceStore.gumroadProductUrl || '') : '',
            gumroadToken: copyGumroad ? (sourceStore.gumroadToken || '') : '',
            socials: copyBranding ? { ...(sourceStore.socials || {}) } : {},
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 4. Duplicate products with new IDs scoped strictly to newStoreId
        const duplicatedProducts = [];
        if (copyProducts && Array.isArray(sourceProducts)) {
            for (let i = 0; i < sourceProducts.length; i++) {
                const sp = sourceProducts[i];
                if (!sp || !sp.name) continue;

                const newProdId = `prod_${cleanNewSlug}_${i}_${Math.random().toString(36).substring(2, 6)}`;
                duplicatedProducts.push({
                    ...sp,
                    id: newProdId,
                    storeId: newStoreId,
                    images: Array.isArray(sp.images) ? [...sp.images] : (sp.image ? [sp.image] : []),
                    gumroadProductId: copyGumroad ? (sp.gumroadProductId || '') : '',
                    createdAt: new Date().toISOString()
                });
            }
        }

        duplicatedStore.products = duplicatedProducts;
        duplicatedStore.productsCount = duplicatedProducts.length;

        // 5. Persist to Firestore
        try {
            await createStore(duplicatedStore);
            for (const dp of duplicatedProducts) {
                await createProduct(dp).catch(() => {});
            }
        } catch (dbErr) {
            console.warn('Firebase duplication error:', dbErr.message);
        }

        return NextResponse.json({
            success: true,
            newStoreId,
            newStoreSlug: cleanNewSlug,
            store: duplicatedStore,
            redirectUrl: `/shop/${cleanNewSlug}`
        });

    } catch (err) {
        console.error('API /api/store/duplicate error:', err);
        return NextResponse.json({
            success: false,
            error: 'Failed to duplicate store.'
        }, { status: 500 });
    }
}
