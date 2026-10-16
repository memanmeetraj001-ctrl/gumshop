/**
 * lib/db/stores.js
 * 
 * Authoritative Supabase Store Data Layer.
 * Direct PostgreSQL persistence with ZERO browser localStorage caching.
 */

import { postgrest } from './client.js';

export function normalizeStoreSlug(slugOrId) {
    if (!slugOrId) return '';
    return String(slugOrId).toLowerCase().trim().replace(/^store_/, '').replace(/^store-/, '');
}

export function formatStoreId(slugOrId) {
    const slug = normalizeStoreSlug(slugOrId);
    return slug ? `store_${slug}` : 'store_default';
}

export async function getAllStores() {
    const res = await postgrest('stores?select=*&order=created_at.desc');
    if (!res.data || !Array.isArray(res.data)) return [];

    return res.data
        .filter(row => {
            const id = (row.id || '').toLowerCase();
            const username = (row.username || '').toLowerCase();
            if (id === 'store_live_test' || username === 'live-test') return false;
            if (id.startsWith('store_price_test_') || username.startsWith('price_test_')) return false;
            if (id.startsWith('_test_') || username.startsWith('_test_') || id.startsWith('__test_')) return false;
            if (id.startsWith('system_') || username.startsWith('system-') || id === 'system_analytics_fleet') return false;
            return true;
        })
        .map(row => {
        const sData = row.data || {};
        const slug = row.username || normalizeStoreSlug(row.id);
        const resolvedLogo = sData.logo || sData.avatar || sData.logo_url || sData.bioProfile?.avatar || (Array.isArray(sData.products) && sData.products[0]?.image) || '';
        const prods = Array.isArray(sData.products) ? sData.products : [];
        const prodsCount = typeof sData.productsCount === 'number' && sData.productsCount > 0
            ? sData.productsCount
            : prods.length;
        return {
            ...sData,
            id: row.id,
            name: row.name || sData.name || slug,
            slug,
            username: slug,
            description: sData.description || '',
            logo: resolvedLogo,
            avatar: resolvedLogo,
            logo_url: resolvedLogo,
            banner_url: sData.banner_url || '',
            theme: sData.theme || { primary: '#4f46e5', mode: 'dark' },
            singleProductStore: Boolean(sData.singleProductStore),
            is_homepage: Boolean(sData.is_homepage || sData.isHomepage),
            isHomepage: Boolean(sData.is_homepage || sData.isHomepage),
            productsCount: prodsCount,
            products: prods,
            createdAt: row.created_at
        };
    });
}

// In-memory resilient cache for active process stores (survives network aborts)
const _recentStoresCache = new Map();

export async function getStoreBySlug(slugOrId) {
    const cleanSlug = normalizeStoreSlug(slugOrId);
    if (!cleanSlug || cleanSlug.startsWith('system')) return null;

    const withPrefix = `store_${cleanSlug}`;
    const res = await postgrest(`stores?or=(id.eq.${encodeURIComponent(withPrefix)},id.eq.${encodeURIComponent(cleanSlug)},username.eq.${encodeURIComponent(cleanSlug)})&select=*&limit=1`);

    if (res.data && res.data.length > 0) {
        const row = res.data[0];
        const sData = row.data || {};
        const resolvedLogo = sData.logo || sData.avatar || sData.logo_url || sData.bioProfile?.avatar || (Array.isArray(sData.products) && sData.products[0]?.image) || '';
        const storeObj = {
            ...sData,
            id: row.id,
            name: row.name || sData.name || cleanSlug,
            slug: row.username || cleanSlug,
            username: row.username || cleanSlug,
            description: sData.description || '',
            logo: resolvedLogo,
            avatar: resolvedLogo,
            logo_url: resolvedLogo,
            banner_url: sData.banner_url || '',
            theme: sData.theme || { primary: '#4f46e5', mode: 'dark' },
            singleProductStore: Boolean(sData.singleProductStore),
            is_homepage: Boolean(sData.is_homepage || sData.isHomepage),
            isHomepage: Boolean(sData.is_homepage || sData.isHomepage),
            products: Array.isArray(sData.products) ? sData.products : [],
            createdAt: row.created_at
        };
        _recentStoresCache.set(cleanSlug, storeObj);
        _recentStoresCache.set(withPrefix, storeObj);
        return storeObj;
    }

    // Fast memory fallback if network timed out
    if (_recentStoresCache.has(cleanSlug)) return _recentStoresCache.get(cleanSlug);
    if (_recentStoresCache.has(withPrefix)) return _recentStoresCache.get(withPrefix);

    // Fallback: If single-store query failed or timed out, resolve from full store catalog
    try {
        const all = await getAllStores();
        const found = all.find(s => s.username === cleanSlug || s.id === withPrefix || s.id === cleanSlug);
        if (found) {
            _recentStoresCache.set(cleanSlug, found);
            return found;
        }
    } catch (_) {}

    return null;
}

export async function getHomepageStore() {
    // 1. Check for explicitly flagged homepage store in Supabase
    const res = await postgrest('stores?select=*&order=created_at.asc');
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const flagged = res.data.find(row => {
            const d = row.data || {};
            return d.is_homepage === true || d.isHomepage === true;
        });
        if (flagged) {
            const sData = flagged.data || {};
            const slug = flagged.username || normalizeStoreSlug(flagged.id);
            return {
                id: flagged.id,
                name: flagged.name || slug,
                slug,
                username: slug,
                ...sData
            };
        }

        // 2. Default to the primary/first active store
        const first = res.data[0];
        const sData = first.data || {};
        const slug = first.username || normalizeStoreSlug(first.id);
        return {
            id: first.id,
            name: first.name || slug,
            slug,
            username: slug,
            ...sData
        };
    }

    return null;
}

export async function createStore(storeData) {
    const slug = normalizeStoreSlug(storeData.slug || storeData.username || storeData.name);
    const id = storeData.id || formatStoreId(slug);
    const name = storeData.name || slug;

    const payload = {
        id,
        username: slug,
        name,
        data: {
            ...storeData,
            id,
            username: slug,
            name,
            description: storeData.description || '',
            logo_url: storeData.logo_url || '',
            banner_url: storeData.banner_url || '',
            theme: storeData.theme || { primary: '#4f46e5', mode: 'dark' },
            products: Array.isArray(storeData.products) ? storeData.products : [],
            updatedAt: new Date().toISOString()
        }
    };

    await postgrest('stores', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(payload)
    });

    const createdStore = {
        id,
        slug,
        username: slug,
        name,
        ...payload.data
    };
    _recentStoresCache.set(slug, createdStore);
    _recentStoresCache.set(id, createdStore);
    return createdStore;
}

export async function updateStore(storeIdOrSlug, updates) {
    const cleanSlug = normalizeStoreSlug(storeIdOrSlug);
    const existing = await getStoreBySlug(cleanSlug);
    if (!existing) return null;

    const mergedData = { ...existing, ...updates };
    const payload = {
        name: updates.name || existing.name,
        data: mergedData
    };

    await postgrest(`stores?id=eq.${encodeURIComponent(existing.id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });

    const updatedStore = { id: existing.id, ...mergedData };
    _recentStoresCache.set(cleanSlug, updatedStore);
    _recentStoresCache.set(existing.id, updatedStore);
    return updatedStore;
}

export async function deleteStore(storeIdOrSlug) {
    const cleanSlug = normalizeStoreSlug(storeIdOrSlug);
    if (!cleanSlug) return false;

    const withPrefix = `store_${cleanSlug}`;
    _recentStoresCache.delete(cleanSlug);
    _recentStoresCache.delete(withPrefix);

    // Cascade: delete all products belonging to this store
    await postgrest(`products?or=(store_id.eq.${encodeURIComponent(cleanSlug)},store_id.eq.${encodeURIComponent(withPrefix)})`, {
        method: 'DELETE'
    });

    // Delete store record
    const res = await postgrest(`stores?or=(id.eq.${encodeURIComponent(cleanSlug)},id.eq.${encodeURIComponent(withPrefix)},username.eq.${encodeURIComponent(cleanSlug)})`, {
        method: 'DELETE'
    });

    return res.status >= 200 && res.status < 300;
}
