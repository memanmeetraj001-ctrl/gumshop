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

    // 1. If Supabase is configured, query PostgreSQL
    const { url, key, isConfigured } = getSupabaseConfig();
    if (isConfigured) {
        try {
            const reqUrl = `${url}/rest/v1/stores?or=(username.eq.${clean},username.eq.${cleanWithPrefix},id.eq.${clean},id.eq.${cleanWithPrefix})&limit=1&select=*`;
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
    if (memoryStores.has(slugOrId)) return memoryStores.get(slugOrId);

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

    const inMem = Array.from(memoryStores.values());
    if (inMem.length > 0) return inMem;

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

    // Save in memory
    memoryStores.set(cleanSlug, normalizedStore);
    memoryStores.set(storeId, normalizedStore);

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

    if (cleanSlug) {
        memoryStores.delete(cleanSlug);
        memoryStores.delete(`store_${cleanSlug}`);
        memoryProducts.delete(cleanSlug);
        memoryProducts.delete(`store_${cleanSlug}`);
    }
    if (cleanId) {
        memoryStores.delete(cleanId);
        memoryStores.delete(`store_${cleanId}`);
        memoryProducts.delete(cleanId);
        memoryProducts.delete(`store_${cleanId}`);
    }

    const { url, key, isConfigured } = getSupabaseConfig();
    if (isConfigured) {
        try {
            const targets = Array.from(new Set([cleanSlug, `store_${cleanSlug}`, cleanId, `store_${cleanId}`].filter(Boolean)));
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

    const { url, key, isConfigured } = getSupabaseConfig();
    if (isConfigured) {
        try {
            const reqUrl = `${url}/rest/v1/products?or=(store_id.eq.${cleanSlug},store_id.eq.${cleanWithPrefix})&select=*&order=created_at.desc`;
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

    const inMem = memoryProducts.get(cleanSlug) || memoryProducts.get(cleanWithPrefix) || memoryProducts.get(cleanId);
    if (inMem && inMem.length > 0) return inMem;

    // Presets fallback ONLY if explicit demo store
    try {
        const { DEMO_PRESETS, resolvePresetProducts } = await import('./storePresets.js');
        if (DEMO_PRESETS[cleanSlug]) {
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
    const storeWithPrefix = `store_${cleanSlug}`;

    // Save in memory under all key variants
    memoryProducts.set(cleanSlug, products);
    memoryProducts.set(storeWithPrefix, products);
    memoryProducts.set(cleanId, products);

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
