/**
 * lib/serverDb.js
 * 
 * ⚡ Unified Server Database Interface
 * Backed directly by `lib/db/index.js` (Pure Supabase PostgreSQL).
 * Eliminates ephemeral in-memory server dictionaries and stale process caches.
 */

import {
    getAllStores as dbGetAllStores,
    getStoreBySlug as dbGetStoreBySlug,
    getHomepageStore as dbGetHomepageStore,
    createStore as dbCreateStore,
    updateStore as dbUpdateStore,
    deleteStore as dbDeleteStore,
    getProductsByStore as dbGetProductsByStore,
    getAllProductsWithStores as dbGetAllProductsWithStores,
    createProduct as dbCreateProduct,
    updateProduct as dbUpdateProduct,
    deleteProduct as dbDeleteProduct,
    normalizeStoreSlug,
    formatStoreId,
    postgrest
} from './db/index.js';

export function isSupabaseConfigured() {
    return true;
}

export async function serverGetStore(slugOrId) {
    if (!slugOrId) return null;
    const store = await dbGetStoreBySlug(slugOrId);
    if (store && (!store.products || store.products.length === 0)) {
        const prods = await dbGetProductsByStore(slugOrId);
        if (prods && prods.length > 0) {
            store.products = prods;
        }
    }
    return store;
}

export async function serverGetAllStores() {
    return await dbGetAllStores();
}

export async function serverSaveStore(store) {
    if (!store) return null;
    const slug = normalizeStoreSlug(store.slug || store.username || store.id);
    const existing = await dbGetStoreBySlug(slug);
    let result;
    if (existing) {
        result = await dbUpdateStore(slug, store);
    } else {
        result = await dbCreateStore(store);
    }

    // If products were included in store payload, persist them
    if (Array.isArray(store.products) && store.products.length > 0) {
        await serverSaveProducts(slug, store.products);
        result.products = store.products;
    }

    return result;
}

export async function serverDeleteStore(storeId, storeSlug = null) {
    const target = storeSlug || storeId;
    return await dbDeleteStore(target);
}

export async function serverGetProducts(storeId) {
    if (!storeId) return [];
    return await dbGetProductsByStore(storeId);
}

export async function serverSaveProducts(storeId, products) {
    if (!storeId || !Array.isArray(products)) return [];
    const cleanSlug = normalizeStoreSlug(storeId);
    const storeWithPrefix = formatStoreId(cleanSlug);

    const saved = [];
    for (const p of products) {
        if (!p) continue;
        const pWithStore = { ...p, store_id: storeWithPrefix, storeId: storeWithPrefix };
        if (p.id) {
            const updated = await dbUpdateProduct(p.id, pWithStore);
            saved.push(updated || pWithStore);
        } else {
            const created = await dbCreateProduct(pWithStore);
            saved.push(created);
        }
    }

    // Synchronize parent store record in Supabase stores table (stores?or=)
    try {
        const storeRes = await postgrest(`stores?or=(id.eq.${encodeURIComponent(cleanSlug)},id.eq.${encodeURIComponent(storeWithPrefix)},username.eq.${encodeURIComponent(cleanSlug)})&limit=1`);
        if (storeRes.data && storeRes.data.length > 0) {
            const storeRow = storeRes.data[0];
            const sData = storeRow.data || {};
            const existingProds = Array.isArray(sData.products) ? sData.products : [];
            const mergedMap = new Map();
            existingProds.forEach(item => { if (item?.id) mergedMap.set(item.id, item); });
            saved.forEach(item => { if (item?.id) mergedMap.set(item.id, item); });
            const mergedList = Array.from(mergedMap.values());

            await postgrest(`stores?id=eq.${encodeURIComponent(storeRow.id)}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    data: { ...sData, products: mergedList }
                })
            });
        }
    } catch {}

    return saved;
}

export async function serverDeleteProduct(productId) {
    if (!productId) return false;
    return await dbDeleteProduct(productId);
}

export async function serverWipeAllData() {
    try {
        await postgrest('products?id=not.is.null', { method: 'DELETE' });
        await postgrest('stores?id=not.is.null', { method: 'DELETE' });
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

export async function serverGetAllProductsWithStores() {
    return await dbGetAllProductsWithStores();
}

export async function designateHomepageStore(rawSlug) {
    if (typeof rawSlug !== 'string' || !rawSlug.trim()) {
        return { success: false, status: 400, error: 'storeSlug is required' };
    }

    const clean = normalizeStoreSlug(rawSlug);
    if (!clean || clean.length < 2) {
        return { success: false, status: 400, error: 'Invalid storeSlug format' };
    }

    const targetStore = await dbGetStoreBySlug(clean);
    if (!targetStore) {
        return { success: false, status: 404, error: `Store "${clean}" does not exist` };
    }

    const stores = await dbGetAllStores();
    for (const s of stores) {
        const isTarget = s.slug === clean || s.username === clean || s.id === clean || s.id === formatStoreId(clean);
        await dbUpdateStore(s.slug, {
            is_homepage: isTarget,
            isHomepage: isTarget
        });
    }

    return {
        success: true,
        status: 200,
        homepageSlug: clean,
        homepageStore: targetStore,
        totalStores: stores.length,
        message: `Store "${clean}" is now designated as the official homepage.`
    };
}

export const PRIMARY_FALLBACK_STORE = {
    id: 'store_rubber-couch-toys-official-store',
    name: 'Rubber Couch Toys Official Store',
    slug: 'rubber-couch-toys-official-store',
    username: 'rubber-couch-toys-official-store',
    description: 'We Sell Gel Ball Launcher (Toy Guns) which is a superior alternative to Airsoft.',
    theme: 'viral_lander',
    themeColor: '#18181B',
    logo: 'https://theluckylk.com/cdn/shop/files/30kb.webp?crop=center&height=32&v=1792057646&width=32',
    avatar: 'https://theluckylk.com/cdn/shop/files/30kb.webp?crop=center&height=32&v=1792057646&width=32',
    banner: 'https://theluckylk.com/cdn/shop/files/bannder_desk.webp?v=1787998207&width=1672',
    banners: [
        'https://theluckylk.com/cdn/shop/files/bannder_desk.webp?v=1787998207&width=1672',
        'https://theluckylk.com/cdn/shop/files/LKCJ_banner_desktop_2560x1440_orange_tip.webp?v=1787921834&width=2560'
    ],
    status: 'active',
    is_homepage: true,
    isHomepage: true,
    productsCount: 174
};

export async function resolveHomepageStore(cookieSlug = '') {
    const allStores = await dbGetAllStores().catch(() => []);
    let store = null;
    if (cookieSlug) {
        const clean = normalizeStoreSlug(cookieSlug);
        store = allStores.find(s => s.slug === clean || s.username === clean || s.id === clean || s.id === formatStoreId(clean));
        if (!store) {
            store = await dbGetStoreBySlug(cookieSlug).catch(() => null);
        }
    }
    if (!store) {
        store = allStores.find(s => s.is_homepage || s.isHomepage) || allStores[0];
    }
    if (!store) {
        store = await dbGetHomepageStore().catch(() => null);
    }
    if (!store) {
        store = { ...PRIMARY_FALLBACK_STORE };
    }

    if (store && (!store.products || store.products.length === 0)) {
        const prods = await dbGetProductsByStore(store.id || store.slug).catch(() => []);
        if (prods && prods.length > 0) {
            store.products = prods;
        } else {
            const all = await dbGetAllProductsWithStores().catch(() => []);
            if (all && all.length > 0) {
                store.products = all;
            }
        }
    }

    const slug = store?.slug || store?.username || normalizeStoreSlug(store?.id) || 'rubber-couch-toys-official-store';

    return {
        success: true,
        status: 200,
        homepageSlug: slug,
        homepageStore: store,
        totalStores: allStores.length || 1
    };
}
