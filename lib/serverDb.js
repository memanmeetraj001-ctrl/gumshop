/**
 * Dedicated Server Database Adapter for GumShop Online
 * Supports Supabase (PostgreSQL) via native fetch (Zero extra dependencies)
 * with graceful in-memory server cache fallback.
 */

function getSupabaseConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return { url, key, isConfigured: Boolean(url && key) };
}

// Server-side in-memory registry (persists across requests in the Node process)
const memoryStores = new Map();
const memoryProducts = new Map();

export function isSupabaseConfigured() {
    return getSupabaseConfig().isConfigured;
}

/**
 * Fetch a store by slug or ID
 */
export async function serverGetStore(slugOrId) {
    if (!slugOrId) return null;
    const clean = String(slugOrId).toLowerCase().trim().replace(/^store_/, '');
    const cleanWithPrefix = `store_${clean}`;
    const cleanSlug = clean.replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const cleanNoDashes = clean.replace(/[^a-z0-9]/g, '');

    // 1. If Supabase is configured, query PostgreSQL
    const { url, key, isConfigured } = getSupabaseConfig();
    if (isConfigured) {
        try {
            const queryConditions = [
                `username.ilike.${clean}`,
                `username.ilike.${cleanWithPrefix}`,
                `id.ilike.${clean}`,
                `id.ilike.${cleanWithPrefix}`,
                cleanSlug ? `username.ilike.${cleanSlug}` : null,
                cleanNoDashes ? `username.ilike.${cleanNoDashes}` : null,
                `name.ilike.${clean}`
            ].filter(Boolean).join(',');

            const reqUrl = `${url}/rest/v1/stores?or=(${queryConditions})&limit=1&select=*`;
            const res = await fetch(reqUrl, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`
                },
                cache: 'no-store'
            });
            if (res.ok) {
                const rows = await res.json();
                if (Array.isArray(rows) && rows.length > 0) {
                    const row = rows[0];
                    return {
                        id: row.id,
                        name: row.name,
                        username: row.username,
                        ...(row.data || {}),
                        createdAt: row.created_at
                    };
                }
                return null;
            }
        } catch (e) {
            console.warn('[serverDb] Supabase getStore error:', e.message);
        }
    }

    // 2. In-memory server cache fallback
    if (memoryStores.has(clean)) return memoryStores.get(clean);
    if (memoryStores.has(cleanWithPrefix)) return memoryStores.get(cleanWithPrefix);
    if (cleanSlug && memoryStores.has(cleanSlug)) return memoryStores.get(cleanSlug);
    if (cleanNoDashes && memoryStores.has(cleanNoDashes)) return memoryStores.get(cleanNoDashes);
    if (memoryStores.has(slugOrId)) return memoryStores.get(slugOrId);

    // Scan memory stores values for case-insensitive match
    for (const s of memoryStores.values()) {
        if (!s) continue;
        const sSlug = (s.username || s.name || s.id || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
        const sId = (s.id || '').toLowerCase().replace(/^store_/, '');
        if (sSlug === clean || sSlug === cleanSlug || sId === clean || s.username?.toLowerCase() === clean) {
            return s;
        }
    }

    // 3. Central presets fallback (ONLY if explicit preset exists)
    try {
        const { DEMO_PRESETS, resolvePresetStore } = await import('./storePresets.js');
        if (DEMO_PRESETS[clean]) {
            const preset = resolvePresetStore(clean);
            if (preset) return preset;
        }
    } catch {}

    return null;
}

/**
 * Fetch all stores
 */
export async function serverGetAllStores() {
    const { url, key, isConfigured } = getSupabaseConfig();
    if (isConfigured) {
        try {
            const reqUrl = `${url}/rest/v1/stores?select=*&order=created_at.desc`;
            const res = await fetch(reqUrl, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`
                },
                cache: 'no-store'
            });
            if (res.ok) {
                const rows = await res.json();
                if (Array.isArray(rows)) {
                    return rows.map(r => ({
                        id: r.id,
                        name: r.name,
                        username: r.username,
                        ...(r.data || {}),
                        createdAt: r.created_at
                    }));
                }
            }
        } catch (e) {
            console.warn('[serverDb] Supabase getAllStores error:', e.message);
        }
    }

    const seen = new Set();
    const uniqueStores = [];
    for (const s of memoryStores.values()) {
        const key = (s.username || s.id || '').toLowerCase().replace(/^store_/, '');
        if (key && !seen.has(key)) {
            seen.add(key);
            uniqueStores.push(s);
        }
    }
    if (uniqueStores.length > 0) return uniqueStores;

    return [];
}

/**
 * Save or update a store
 */
export async function serverSaveStore(store) {
    if (!store) return false;
    const cleanSlug = (store.username || store.slug || store.id || '').toLowerCase().trim().replace(/^store_/, '');
    if (!cleanSlug) return false;
    const storeId = store.id || `store_${cleanSlug}`;

    // Merge with existing cached store if present
    const existing = memoryStores.get(cleanSlug) || memoryStores.get(storeId) || {};
    const normalizedStore = {
        ...existing,
        ...store,
        id: storeId,
        username: cleanSlug,
        name: store.name || existing.name || cleanSlug
    };

    const cleanHyphen = cleanSlug.replace(/_/g, '-');
    const cleanUnderscore = cleanSlug.replace(/-/g, '_');

    // Index under all delimiter variants
    memoryStores.set(cleanSlug, normalizedStore);
    memoryStores.set(storeId, normalizedStore);
    memoryStores.set(cleanHyphen, normalizedStore);
    memoryStores.set(cleanUnderscore, normalizedStore);
    memoryStores.set(`store_${cleanHyphen}`, normalizedStore);
    memoryStores.set(`store_${cleanUnderscore}`, normalizedStore);

    if (Array.isArray(store.products) && store.products.length > 0) {
        normalizedStore.products = store.products;
    }

    const { url, key, isConfigured } = getSupabaseConfig();
    if (isConfigured) {
        try {
            const reqUrl = `${url}/rest/v1/stores`;
            const payload = {
                id: storeId,
                username: cleanSlug,
                name: normalizedStore.name,
                data: normalizedStore
            };
            const res = await fetch(reqUrl, {
                method: 'POST',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify(payload)
            });
            return res.ok;
        } catch (e) {
            console.warn('[serverDb] Supabase saveStore error:', e.message);
        }
    }

    return true;
}

/**
 * Delete a store
 */
export async function serverDeleteStore(storeId, storeSlug) {
    const cleanSlug = String(storeSlug || '').toLowerCase().trim().replace(/^store_/, '');
    const cleanId = String(storeId || '').toLowerCase().trim().replace(/^store_/, '');
    const cleanHyphen = cleanSlug ? cleanSlug.replace(/_/g, '-') : '';
    const cleanUnderscore = cleanSlug ? cleanSlug.replace(/-/g, '_') : '';
    const idHyphen = cleanId ? cleanId.replace(/_/g, '-') : '';
    const idUnderscore = cleanId ? cleanId.replace(/-/g, '_') : '';

    const targets = Array.from(new Set([
        cleanSlug,
        `store_${cleanSlug}`,
        cleanHyphen,
        cleanUnderscore,
        cleanHyphen ? `store_${cleanHyphen}` : null,
        cleanUnderscore ? `store_${cleanUnderscore}` : null,
        cleanId,
        `store_${cleanId}`,
        idHyphen,
        idUnderscore,
        idHyphen ? `store_${idHyphen}` : null,
        idUnderscore ? `store_${idUnderscore}` : null,
    ].filter(Boolean)));

    for (const t of targets) {
        memoryStores.delete(t);
        memoryProducts.delete(t);
    }

    const { url, key, isConfigured } = getSupabaseConfig();
    if (isConfigured) {
        try {
            for (const t of targets) {
                await fetch(`${url}/rest/v1/stores?or=(id.eq.${t},username.eq.${t})`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`
                    }
                });
                await fetch(`${url}/rest/v1/products?store_id=eq.${t}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`
                    }
                });
            }
        } catch (e) {
            console.warn('[serverDb] Supabase deleteStore error:', e.message);
        }
    }

    return true;
}

/**
 * Fetch products for a specific store
 */
export async function serverGetProducts(storeId) {
    if (!storeId) return [];
    const cleanId = String(storeId).toLowerCase().trim();
    const cleanSlug = cleanId.replace(/^store_/, '');
    const cleanWithPrefix = `store_${cleanSlug}`;
    const cleanHyphen = cleanSlug.replace(/_/g, '-');
    const cleanUnderscore = cleanSlug.replace(/-/g, '_');

    const { url, key, isConfigured } = getSupabaseConfig();
    if (isConfigured) {
        try {
            const reqUrl = `${url}/rest/v1/products?or=(store_id.ilike.${cleanSlug},store_id.ilike.${cleanWithPrefix},store_id.ilike.${cleanId},store_id.ilike.${cleanHyphen},store_id.ilike.store_${cleanHyphen},store_id.ilike.${cleanUnderscore},store_id.ilike.store_${cleanUnderscore})&select=*&order=created_at.desc`;
            const res = await fetch(reqUrl, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`
                },
                cache: 'no-store'
            });
            if (res.ok) {
                const rows = await res.json();
                if (Array.isArray(rows) && rows.length > 0) {
                    return rows.map(r => ({
                        id: r.id,
                        storeId: r.store_id,
                        name: r.name,
                        price: parseFloat(r.price || 0),
                        ...(r.data || {}),
                        createdAt: r.created_at
                    }));
                }
            }
        } catch (e) {
            console.warn('[serverDb] Supabase getProducts error:', e.message);
        }
    }

    // Check in-memory products under all variants
    const inMem = memoryProducts.get(cleanSlug) ||
                  memoryProducts.get(cleanWithPrefix) ||
                  memoryProducts.get(cleanId) ||
                  memoryProducts.get(cleanHyphen) ||
                  memoryProducts.get(`store_${cleanHyphen}`) ||
                  memoryProducts.get(cleanUnderscore) ||
                  memoryProducts.get(`store_${cleanUnderscore}`);
    if (inMem && inMem.length > 0) return inMem;

    // Check cached store
    const cachedStore = memoryStores.get(cleanSlug) ||
                        memoryStores.get(cleanWithPrefix) ||
                        memoryStores.get(cleanId) ||
                        memoryStores.get(cleanHyphen) ||
                        memoryStores.get(`store_${cleanHyphen}`) ||
                        memoryStores.get(cleanUnderscore) ||
                        memoryStores.get(`store_${cleanUnderscore}`);
    if (cachedStore) {
        if (Array.isArray(cachedStore.products) && cachedStore.products.length > 0) {
            return cachedStore.products;
        }
        if (cachedStore.id) {
            const byStoreId = memoryProducts.get(cachedStore.id.toLowerCase()) ||
                              memoryProducts.get(cachedStore.id.toLowerCase().replace(/^store_/, '')) ||
                              memoryProducts.get(cachedStore.id.toLowerCase().replace(/_/g, '-')) ||
                              memoryProducts.get(cachedStore.id.toLowerCase().replace(/^store_/, '').replace(/_/g, '-'));
            if (byStoreId && byStoreId.length > 0) return byStoreId;
        }
        if (cachedStore.username) {
            const byUser = memoryProducts.get(cachedStore.username.toLowerCase()) ||
                           memoryProducts.get(`store_${cachedStore.username.toLowerCase()}`) ||
                           memoryProducts.get(cachedStore.username.toLowerCase().replace(/_/g, '-')) ||
                           memoryProducts.get(cachedStore.username.toLowerCase().replace(/-/g, '_'));
            if (byUser && byUser.length > 0) return byUser;
        }
    }

    // Presets fallback ONLY if explicit demo store
    try {
        const { DEMO_PRESETS, resolvePresetProducts } = await import('./storePresets.js');
        if (DEMO_PRESETS[cleanSlug] || DEMO_PRESETS[cleanHyphen]) {
            const prods = resolvePresetProducts(cleanSlug, cleanWithPrefix);
            if (Array.isArray(prods) && prods.length > 0) return prods;
        }
    } catch {}

    return [];
}

/**
 * Save products for a specific store
 */
export async function serverSaveProducts(storeId, products) {
    if (!storeId || !Array.isArray(products)) return false;
    const cleanId = String(storeId).toLowerCase().trim();
    const cleanSlug = cleanId.replace(/^store_/, '');
    const cleanHyphen = cleanSlug.replace(/_/g, '-');
    const cleanUnderscore = cleanSlug.replace(/-/g, '_');
    const storeWithPrefix = `store_${cleanSlug}`;

    // Link with store record
    const linkedStore = memoryStores.get(cleanSlug) ||
                        memoryStores.get(cleanId) ||
                        memoryStores.get(cleanHyphen) ||
                        memoryStores.get(cleanUnderscore) ||
                        memoryStores.get(`store_${cleanHyphen}`) ||
                        memoryStores.get(`store_${cleanUnderscore}`);

    const existing = memoryProducts.get(cleanSlug) ||
                     memoryProducts.get(cleanId) ||
                     memoryProducts.get(cleanHyphen) ||
                     memoryProducts.get(cleanUnderscore) || [];
    const productMap = new Map(existing.map(p => [p.id, p]));
    products.forEach(p => {
        if (p && p.id) productMap.set(p.id, p);
    });
    const mergedList = Array.from(productMap.values());

    // Save in memory under all key variants
    memoryProducts.set(cleanSlug, mergedList);
    memoryProducts.set(storeWithPrefix, mergedList);
    memoryProducts.set(cleanId, mergedList);
    memoryProducts.set(cleanHyphen, mergedList);
    memoryProducts.set(`store_${cleanHyphen}`, mergedList);
    memoryProducts.set(cleanUnderscore, mergedList);
    memoryProducts.set(`store_${cleanUnderscore}`, mergedList);

    if (linkedStore) {
        linkedStore.products = mergedList;
        if (linkedStore.username) {
            const uName = linkedStore.username.toLowerCase();
            memoryProducts.set(uName, mergedList);
            memoryProducts.set(`store_${uName}`, mergedList);
            memoryProducts.set(uName.replace(/_/g, '-'), mergedList);
            memoryProducts.set(uName.replace(/-/g, '_'), mergedList);
            memoryProducts.set(`store_${uName.replace(/_/g, '-')}`, mergedList);
            memoryProducts.set(`store_${uName.replace(/-/g, '_')}`, mergedList);
        }
        if (linkedStore.id) {
            const lId = linkedStore.id.toLowerCase();
            memoryProducts.set(lId, mergedList);
            memoryProducts.set(lId.replace(/^store_/, ''), mergedList);
            memoryProducts.set(lId.replace(/_/g, '-'), mergedList);
            memoryProducts.set(lId.replace(/-/g, '_'), mergedList);
        }
    }

    const { url, key, isConfigured } = getSupabaseConfig();
    if (isConfigured && products.length > 0) {
        try {
            const reqUrl = `${url}/rest/v1/products`;
            const payload = products.map((p, idx) => ({
                id: p.id || `prod_${cleanSlug}_${Date.now()}_${idx}`,
                store_id: storeWithPrefix,
                name: p.name || p.title || 'Product',
                price: parseFloat(p.price || 0),
                data: {
                    ...p,
                    id: p.id || `prod_${cleanSlug}_${Date.now()}_${idx}`,
                    storeId: storeWithPrefix
                }
            }));

            const res = await fetch(reqUrl, {
                method: 'POST',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify(payload)
            });
            return res.ok;
        } catch (e) {
            console.warn('[serverDb] Supabase saveProducts error:', e.message);
        }
    }

    return true;
}

/**
 * Delete a product by ID
 */
export async function serverDeleteProduct(productId) {
    if (!productId) return false;
    const { url, key, isConfigured } = getSupabaseConfig();
    if (isConfigured) {
        try {
            await fetch(`${url}/rest/v1/products?id=eq.${encodeURIComponent(productId)}`, {
                method: 'DELETE',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`
                }
            });
        } catch (e) {
            console.warn('[serverDb] Supabase deleteProduct error:', e.message);
        }
    }
    return true;
}

/**
 * Completely wipe all stores and products data
 */
export async function serverWipeAllData() {
    memoryStores.clear();
    memoryProducts.clear();

    const { url, key, isConfigured } = getSupabaseConfig();
    if (isConfigured) {
        try {
            await fetch(`${url}/rest/v1/products?id=neq._nonexistent_`, {
                method: 'DELETE',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`
                }
            });
            await fetch(`${url}/rest/v1/stores?id=neq._nonexistent_`, {
                method: 'DELETE',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`
                }
            });
        } catch (e) {
            console.warn('[serverDb] Supabase wipe error:', e.message);
        }
    }

    return true;
}

let designationQueue = Promise.resolve();

/**
 * Designate an official homepage store with input validation and single-store exclusivity
 */
export async function designateHomepageStore(rawSlug) {
    if (typeof rawSlug !== 'string' || !rawSlug.trim()) {
        return { success: false, status: 400, error: 'storeSlug is required' };
    }

    const cleanSlug = rawSlug.toLowerCase().trim().replace(/^store_/, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    const alphanumeric = cleanSlug.replace(/-/g, '');

    if (!cleanSlug || cleanSlug === '-' || alphanumeric.length < 2) {
        return { success: false, status: 400, error: 'Invalid storeSlug format' };
    }

    const run = async () => {
        // Verify target store exists in database or presets
        let targetStore = await serverGetStore(cleanSlug);
        if (!targetStore) {
            try {
                const { resolvePresetStore } = await import('./storePresets.js');
                targetStore = resolvePresetStore(cleanSlug);
            } catch {}
        }

        if (!targetStore) {
            return { success: false, status: 404, error: `Store "${cleanSlug}" does not exist` };
        }

        // 1. Update in-memory global state
        globalThis.__gumshop_homepage_slug = cleanSlug;

        // 2. Update designated store with is_homepage: true
        await serverSaveStore({
            ...targetStore,
            is_homepage: true,
            isHomepage: true,
            updatedAt: new Date().toISOString()
        });

        // 3. Ensure other stores have is_homepage unset (Database exclusivity)
        const allStores = await serverGetAllStores();
        for (const s of allStores) {
            const sSlug = (s.username || s.id || '').toLowerCase().replace(/^store_/, '');
            if (sSlug !== cleanSlug && (s.is_homepage === true || s.isHomepage === true)) {
                await serverSaveStore({
                    ...s,
                    is_homepage: false,
                    isHomepage: false,
                    updatedAt: new Date().toISOString()
                });
            }
        }

        return {
            success: true,
            status: 200,
            homepageSlug: cleanSlug,
            message: `Store "${cleanSlug}" is now designated as the official homepage.`
        };
    };

    const nextPromise = designationQueue.then(run, run);
    designationQueue = nextPromise.catch(() => {});
    return nextPromise;
}

/**
 * Resolve the current homepage store, prioritizing authoritative server designation over cookies
 */
export async function resolveHomepageStore(cookieSlug = '') {
    const allStores = await serverGetAllStores();

    // 1. Authoritative server designated homepage (global memory or is_homepage flag)
    let serverDesignatedStore = null;
    if (globalThis.__gumshop_homepage_slug) {
        const target = globalThis.__gumshop_homepage_slug.toLowerCase();
        serverDesignatedStore = allStores.find(s => 
            (s.username && s.username.toLowerCase() === target) ||
            (s.id && (s.id.toLowerCase() === target || s.id.toLowerCase() === `store_${target}`))
        ) || await serverGetStore(target);
    }

    if (!serverDesignatedStore && allStores.length > 0) {
        serverDesignatedStore = allStores.find(s => s.is_homepage === true || s.isHomepage === true) || null;
    }

    // 2. Cookie only used as fallback if NO server homepage is explicitly designated
    const effectiveSlug = serverDesignatedStore?.username || globalThis.__gumshop_homepage_slug || (cookieSlug || '').toLowerCase().trim();

    let homepageStore = serverDesignatedStore;
    if (!homepageStore && effectiveSlug && allStores.length > 0) {
        homepageStore = allStores.find(s => 
            (s.username && s.username.toLowerCase() === effectiveSlug) ||
            (s.id && (s.id.toLowerCase() === effectiveSlug || s.id.toLowerCase() === `store_${effectiveSlug}`))
        ) || null;
    }

    if (!homepageStore && effectiveSlug) {
        homepageStore = await serverGetStore(effectiveSlug);
    }

    // Ensure products are attached to homepageStore if available
    if (homepageStore && (!homepageStore.products || homepageStore.products.length === 0)) {
        const prods = await serverGetProducts(homepageStore.id || homepageStore.username);
        if (Array.isArray(prods) && prods.length > 0) {
            homepageStore = { ...homepageStore, products: prods };
        }
    }

    const resolvedSlug = homepageStore?.username || effectiveSlug || (allStores[0]?.username || '');

    return {
        success: true,
        status: 200,
        homepageSlug: resolvedSlug,
        homepageStore: homepageStore || (allStores.length > 0 ? allStores[0] : null)
    };
}
