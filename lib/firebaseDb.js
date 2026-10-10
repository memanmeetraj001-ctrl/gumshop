import { db } from "./firebase.js";

// Zero-Firebase stubs (100% Pure Supabase / Local storage architecture)
const ref = () => null;
const get = () => Promise.resolve(null);
const set = () => Promise.resolve(null);
const push = () => ({ key: `id_${Date.now()}` });
const update = () => Promise.resolve(null);
const remove = () => Promise.resolve(null);
const query = () => null;
const orderByChild = () => null;
const equalTo = () => null;

// ─── Helper: strip undefined values ───
const cleanData = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(cleanData);
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            cleaned[key] = typeof value === "object" ? cleanData(value) : value;
        }
    }
    return cleaned;
};

// ─── Resilient Timeout Helper (Prevents hanging when Firebase is offline or uninitialized) ───
const withTimeout = (promise, ms = 2500) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase operation timed out')), ms))
    ]);
};

// ─── Dual-Tier Storage Mirror: Client localStorage & Server Process Memory ───
globalThis.__gumshop_server_db_memory = globalThis.__gumshop_server_db_memory || new Map();

const getLocal = (path) => {
    if (typeof window === 'undefined') {
        return globalThis.__gumshop_server_db_memory.get(path) ?? null;
    }
    try {
        const item = localStorage.getItem(`gumshop_db_${path}`);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
};

const setLocal = (path, data) => {
    if (typeof window === 'undefined') {
        globalThis.__gumshop_server_db_memory.set(path, data);
        const parts = path.split('/');
        if (parts.length === 2) {
            const [collection, id] = parts;
            const existingColl = globalThis.__gumshop_server_db_memory.get(collection) || {};
            existingColl[id] = data;
            globalThis.__gumshop_server_db_memory.set(collection, existingColl);
        }
        return;
    }
    try {
        localStorage.setItem(`gumshop_db_${path}`, JSON.stringify(data));
        const parts = path.split('/');
        if (parts.length === 2) {
            const [collection, id] = parts;
            const existingColl = getLocal(collection) || {};
            existingColl[id] = data;
            localStorage.setItem(`gumshop_db_${collection}`, JSON.stringify(existingColl));
        }
    } catch (e) {}
};

const removeLocal = (path) => {
    if (typeof window === 'undefined') {
        globalThis.__gumshop_server_db_memory.delete(path);
        const parts = path.split('/');
        if (parts.length === 2) {
            const [collection, id] = parts;
            const existingColl = globalThis.__gumshop_server_db_memory.get(collection) || {};
            delete existingColl[id];
            globalThis.__gumshop_server_db_memory.set(collection, existingColl);
        }
        return;
    }
    try {
        localStorage.removeItem(`gumshop_db_${path}`);
        const parts = path.split('/');
        if (parts.length === 2) {
            const [collection, id] = parts;
            const existingColl = getLocal(collection) || {};
            delete existingColl[id];
            localStorage.setItem(`gumshop_db_${collection}`, JSON.stringify(existingColl));
        }
    } catch (e) {}
};

// ─── Generic Resilient CRUD ───

export async function dbGet(path) {
    try {
        if (db) {
            const snapshot = await withTimeout(get(ref(db, path)), 1500);
            if (snapshot && snapshot.exists()) {
                const val = snapshot.val();
                setLocal(path, val);
                return val;
            }
        }
    } catch (e) {
        console.warn(`Firebase get notice for ${path}:`, e.message);
    }

    const localVal = getLocal(path);
    if (localVal !== null) return localVal;

    return null;
}

export async function dbSet(path, data) {
    const cleaned = cleanData(data);
    setLocal(path, cleaned);

    try {
        if (db) {
            await withTimeout(set(ref(db, path), cleaned), 1500);
        }
    } catch (e) {
        console.warn(`Firebase set notice for ${path}:`, e.message);
    }
}

export async function dbPush(path, data) {
    const cleaned = cleanData(data);
    const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    setLocal(`${path}/${id}`, { id, ...cleaned });

    try {
        if (db) {
            const newRef = push(ref(db, path));
            const pushId = newRef.key || id;
            await withTimeout(set(newRef, { id: pushId, ...cleaned }), 1500);
            setLocal(`${path}/${pushId}`, { id: pushId, ...cleaned });
            return pushId;
        }
    } catch (e) {
        console.warn(`Firebase push notice for ${path}:`, e.message);
    }

    return id;
}

export async function dbUpdate(path, data) {
    const cleaned = cleanData(data);
    const existing = getLocal(path) || {};
    const merged = { ...existing, ...cleaned };
    setLocal(path, merged);

    try {
        if (db) {
            await withTimeout(update(ref(db, path), cleaned), 1500);
        }
    } catch (e) {
        console.warn(`Firebase update notice for ${path}:`, e.message);
    }
}

export async function dbRemove(path) {
    removeLocal(path);

    try {
        if (db) {
            await withTimeout(remove(ref(db, path)), 1500);
        }
    } catch (e) {
        console.warn(`Firebase remove notice for ${path}:`, e.message);
    }
}

export async function dbQuery(path, child, value) {
    try {
        if (db) {
            const q = query(ref(db, path), orderByChild(child), equalTo(value));
            const snapshot = await withTimeout(get(q), 1500);
            if (snapshot && snapshot.exists()) {
                return Object.entries(snapshot.val()).map(([id, val]) => ({ id, ...val }));
            }
        }
    } catch (e) {
        console.warn(`Firebase query notice for ${path}:`, e.message);
    }

    try {
        const coll = getLocal(path);
        if (coll && typeof coll === 'object') {
            const list = Object.entries(coll).map(([id, val]) => ({ id, ...val }));
            const filtered = list.filter(item => item[child] === value);
            if (filtered.length > 0) return filtered;
        }
    } catch (e) {}

    return [];
}

// ─── Users ───

export async function getUser(userId) {
    return await dbGet(`users/${userId}`);
}

export async function createUser(userId, data) {
    await dbSet(`users/${userId}`, {
        id: userId,
        name: data.name || "",
        email: data.email || "",
        image: data.image || "",
        role: data.role || "user",
        cart: data.cart || {},
        createdAt: new Date().toISOString(),
    });
}

export async function updateUser(userId, data) {
    await dbUpdate(`users/${userId}`, data);
}

export async function updateUserCart(userId, cart) {
    await dbUpdate(`users/${userId}`, { cart });
}

export async function getUserCart(userId) {
    const user = await getUser(userId);
    return user?.cart || null;
}

export async function getAllProducts() {
    const products = [];
    const seenIds = new Set();

    const addProduct = (p) => {
        if (!p) return;
        const id = p.id || (p.name ? `prod_${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : null);
        if (!id || seenIds.has(id)) return;
        if (isProductDeleted(id)) return;
        if (isJunkProductName(p.name || p.title)) return;
        if (p.price !== undefined && (parseFloat(p.price) <= 0 || isNaN(parseFloat(p.price)))) return;
        seenIds.add(id);
        products.push({
            ...p,
            id,
            price: parseFloat(p.price || 29.99),
            compareAtPrice: parseFloat(p.compareAtPrice || Math.round((p.price || 29.99) * 1.35 * 100) / 100),
            inStock: p.inStock !== false,
            images: p.images || (p.image ? [p.image] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500']),
            image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
            rating: p.rating || 5,
            reviewCount: p.reviewCount || 48,
            category: p.category || 'Featured'
        });
    };

    // 1. Direct query from Firebase / edgeDb
    try {
        const data = await dbGet("products");
        if (data && typeof data === 'object') {
            Object.entries(data).forEach(([id, val]) => addProduct({ id, ...val }));
        }
    } catch (e) {}

    // 2. Scan localStorage edgeDb for individual products
    if (typeof window !== 'undefined') {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith("gumshop_db_products/")) {
                    const parsed = JSON.parse(localStorage.getItem(key) || "null");
                    if (parsed) addProduct(parsed);
                }
            }
        } catch (e) {}

        // 3. Scan store objects for embedded products arrays
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith("cloned_store_") || key.startsWith("store_"))) {
                    const parsed = JSON.parse(localStorage.getItem(key) || "null");
                    if (parsed && Array.isArray(parsed.products)) {
                        parsed.products.forEach(addProduct);
                    }
                }
            }
        } catch (e) {}

        // 4. Scan sessionStorage
        try {
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith("cloned_store_")) {
                    const parsed = JSON.parse(sessionStorage.getItem(key) || "null");
                    if (parsed && Array.isArray(parsed.products)) {
                        parsed.products.forEach(addProduct);
                    }
                }
            }
        } catch (e) {}

        // 5. Cold-device fallback: query server API
        if (products.length === 0) {
            try {
                const apiRes = await fetch('/api/products');
                if (apiRes.ok) {
                    const apiData = await apiRes.json();
                    if (apiData.success && Array.isArray(apiData.products) && apiData.products.length > 0) {
                        apiData.products.forEach(addProduct);
                    }
                }
            } catch {}
        }
    }

    // 6. Central presets fallback (ONLY on brand new sessions if stores have never been cleared/reset)
    if (products.length === 0) {
        const hasCleared = typeof window !== 'undefined' && (
            localStorage.getItem('gumshop_stores_cleared') === 'true' ||
            localStorage.getItem('gumshop_empty_dashboard_ack') === 'true'
        );
        if (!hasCleared) {
            try {
                const { HIGHGEARTOYS_PRODUCTS, DEFAULT_STORE_STARTER_PRODUCTS, DEFAULT_DEMO_CREATOR } = await import('./storePresets.js');
                [...(HIGHGEARTOYS_PRODUCTS || []), ...(DEFAULT_STORE_STARTER_PRODUCTS || []), ...(DEFAULT_DEMO_CREATOR?.products || [])].forEach(addProduct);
            } catch {}
        }
    }

    return products.filter(p => !isProductDeleted(p.id));
}

export const DEFAULT_CATALOG_PRODUCTS = [];

export async function getProduct(productId) {
    if (!productId || isProductDeleted(productId)) return null;
    const cleanId = String(productId).trim();
    const data = await dbGet(`products/${cleanId}`);
    if (data && !isProductDeleted(cleanId)) return { id: cleanId, ...data };

    if (typeof window !== 'undefined') {
        const directLocal = localStorage.getItem(`gumshop_db_products/${cleanId}`);
        if (directLocal) {
            try { 
                const parsed = JSON.parse(directLocal);
                if (parsed && !isProductDeleted(parsed.id)) return parsed;
            } catch {}
        }
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('cloned_store_') || k.startsWith('store_') || k === 'gumshop_active_store')) {
                try {
                    const storeObj = JSON.parse(localStorage.getItem(k) || '{}');
                    if (Array.isArray(storeObj.products)) {
                        const found = storeObj.products.find(p => p.id === cleanId || p.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '-') === cleanId);
                        if (found && !isProductDeleted(found.id)) return found;
                    }
                } catch {}
            }
        }

        // Query server database API
        try {
            const apiRes = await fetch('/api/products');
            if (apiRes.ok) {
                const apiData = await apiRes.json();
                if (apiData.success && Array.isArray(apiData.products)) {
                    const found = apiData.products.find(p => p.id === cleanId || p.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '-') === cleanId);
                    if (found && !isProductDeleted(found.id)) return found;
                }
            }
        } catch {}
    }

    // Presets catalog fallback
    try {
        const { HIGHGEARTOYS_PRODUCTS, DEFAULT_STORE_STARTER_PRODUCTS, DEFAULT_DEMO_CREATOR } = await import('./storePresets.js');
        const allPresets = [...(HIGHGEARTOYS_PRODUCTS || []), ...(DEFAULT_STORE_STARTER_PRODUCTS || []), ...(DEFAULT_DEMO_CREATOR?.products || [])];
        const match = allPresets.find(p => p.id === cleanId || p.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '-') === cleanId);
        if (match && !isProductDeleted(match.id)) return match;
    } catch {}

    return null;
}

export async function createProduct(data) {
    const newId = data.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullProduct = {
        ...data,
        id: newId,
        price: parseFloat(data.price || 0),
        compareAtPrice: parseFloat(data.compareAtPrice || data.mrp || Math.round((data.price || 0) * 1.35 * 100) / 100),
        inStock: data.inStock !== false,
        image: data.image || (data.images && data.images[0]) || '',
        images: data.images || (data.image ? [data.image] : []),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await dbSet(`products/${newId}`, fullProduct);
    const finalId = newId;

    if (typeof window !== 'undefined') {
        localStorage.setItem(`gumshop_db_products/${finalId}`, JSON.stringify(fullProduct));

        // Sync into parent store's products array so storefront and dashboard show it immediately
        const cleanTarget = (data.storeId || '').toLowerCase().replace(/^store_/, '').trim();
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('cloned_store_') || k.startsWith('store_') || k.startsWith('gumshop_db_stores/') || k === 'gumshop_active_store')) {
                try {
                    const storeObj = JSON.parse(localStorage.getItem(k) || '{}');
                    if (storeObj && typeof storeObj === 'object' && !Array.isArray(storeObj)) {
                        const storeObjId = (storeObj.id || '').toLowerCase().replace(/^store_/, '').trim();
                        const storeObjSlug = (storeObj.username || storeObj.name || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                        const isMatchingStore = cleanTarget && (storeObjId === cleanTarget || storeObjSlug === cleanTarget);

                        if (isMatchingStore) {
                            if (!Array.isArray(storeObj.products)) storeObj.products = [];
                            const existingIdx = storeObj.products.findIndex(p => p.id === finalId);
                            if (existingIdx === -1) {
                                storeObj.products.unshift(fullProduct);
                            } else {
                                storeObj.products[existingIdx] = fullProduct;
                            }
                            localStorage.setItem(k, JSON.stringify(storeObj));
                        }
                    }
                } catch {}
            }
        }
        window.dispatchEvent(new Event('products_updated'));
    }

    // Sync product to dedicated server database API
    try {
        if (typeof window !== 'undefined' && data.storeId) {
            const cleanSlug = String(data.storeId).toLowerCase().replace(/^store_/, '').trim();
            fetch('/api/store/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    store: { id: data.storeId, username: cleanSlug }, 
                    products: [fullProduct] 
                })
            }).catch(() => {});
        } else if (data.storeId) {
            const { serverSaveProducts } = await import('./serverDb.js');
            await serverSaveProducts(data.storeId, [fullProduct]);
        }
    } catch (e) {}

    return finalId;
}

export async function updateProduct(productId, data) {
    if (!productId) return;
    await dbUpdate(`products/${productId}`, {
        ...data,
        updatedAt: new Date().toISOString(),
    });

    if (typeof window !== 'undefined') {
        let existing = {};
        try {
            const existingRaw = localStorage.getItem(`gumshop_db_products/${productId}`);
            if (existingRaw) existing = JSON.parse(existingRaw);
        } catch {}
        const merged = { ...existing, ...data, id: productId, updatedAt: new Date().toISOString() };
        localStorage.setItem(`gumshop_db_products/${productId}`, JSON.stringify(merged));

        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('cloned_store_') || k.startsWith('store_') || k.startsWith('gumshop_db_stores/') || k === 'gumshop_active_store')) {
                try {
                    const storeObj = JSON.parse(localStorage.getItem(k) || '{}');
                    if (Array.isArray(storeObj.products)) {
                        const pIdx = storeObj.products.findIndex(p => p.id === productId);
                        if (pIdx !== -1) {
                            storeObj.products[pIdx] = { ...storeObj.products[pIdx], ...data, id: productId };
                            localStorage.setItem(k, JSON.stringify(storeObj));
                        }
                    }
                } catch {}
            }
        }
        window.dispatchEvent(new Event('products_updated'));

        // Sync updated product to server database (Supabase)
        try {
            let fallbackStoreId = null;
            const activeRaw = localStorage.getItem('gumshop_active_store');
            if (activeRaw) {
                try {
                    const activeParsed = JSON.parse(activeRaw);
                    fallbackStoreId = activeParsed?.id || activeParsed?.username;
                } catch {}
            }
            const targetStoreId = merged.storeId || (existing && existing.storeId) || fallbackStoreId;
            if (targetStoreId) {
                const cleanSlug = String(targetStoreId).toLowerCase().replace(/^store_/, '').trim();
                fetch('/api/store/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        store: { id: targetStoreId, username: cleanSlug },
                        products: [merged]
                    })
                }).catch(() => {});
            }
        } catch {}
    } else {
        try {
            const targetStoreId = data.storeId;
            if (targetStoreId) {
                const { serverSaveProducts } = await import('./serverDb.js');
                await serverSaveProducts(targetStoreId, [{ ...data, id: productId }]);
            }
        } catch (e) {}
    }
}

// ─── Tombstone Registry for Zero-Resurrection Deletions ───

export function markProductDeleted(productId) {
    if (!productId || typeof window === 'undefined') return;
    try {
        const raw = localStorage.getItem('gumshop_deleted_products');
        const setIds = new Set(raw ? JSON.parse(raw) : []);
        setIds.add(productId);
        localStorage.setItem('gumshop_deleted_products', JSON.stringify(Array.from(setIds)));
    } catch (e) {}
}

export function isProductDeleted(productId) {
    if (!productId || typeof window === 'undefined') return false;
    try {
        const raw = localStorage.getItem('gumshop_deleted_products');
        if (!raw) return false;
        const list = JSON.parse(raw);
        return Array.isArray(list) && list.includes(productId);
    } catch (e) {
        return false;
    }
}

export function markStoreDeleted(storeIdOrSlug) {
    if (!storeIdOrSlug || typeof window === 'undefined') return;
    try {
        const raw = localStorage.getItem('gumshop_deleted_stores');
        const setStores = new Set(raw ? JSON.parse(raw) : []);
        const clean = String(storeIdOrSlug).toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');
        const unprefix = clean.replace(/^store-/, '').replace(/^store_/, '');
        setStores.add(clean);
        setStores.add(unprefix);
        setStores.add(`store_${unprefix}`);
        setStores.add(`store-${unprefix}`);
        localStorage.setItem('gumshop_deleted_stores', JSON.stringify(Array.from(setStores)));
    } catch (e) {}
}

export function isStoreDeleted(storeIdOrSlug) {
    if (!storeIdOrSlug || typeof window === 'undefined') return false;
    try {
        const raw = localStorage.getItem('gumshop_deleted_stores');
        if (!raw) return false;
        const list = JSON.parse(raw);
        if (!Array.isArray(list) || list.length === 0) return false;
        const setStores = new Set(list);
        const clean = String(storeIdOrSlug).toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');
        const unprefix = clean.replace(/^store-/, '').replace(/^store_/, '');
        return setStores.has(clean) || setStores.has(unprefix) || setStores.has(`store_${unprefix}`) || setStores.has(`store-${unprefix}`);
    } catch (e) {
        return false;
    }
}

export function isJunkProductName(name) {
    if (!name || typeof name !== 'string') return true;
    return /partial\s*payment|down\s*payment|advance\s*payment|deposit|booking\s*amount|shipping\s*protection|route\s*package|package\s*protection|transit\s*insurance|navidium|tip(\s|$)|tips(\s|$)|warranty|custom\s*order|gift\s*wrap|test\s*product|draft/i.test(name.trim());
}

export async function deleteProduct(productId) {
    if (!productId) return;

    // 1. Permanently register in tombstone set
    markProductDeleted(productId);

    // 2. Remove from Firebase / edgeDb
    await dbRemove(`products/${productId}`);

    // 3. Purge from localStorage
    if (typeof window !== 'undefined') {
        localStorage.removeItem(`gumshop_db_products/${productId}`);
        try {
            const rawProdsMap = localStorage.getItem('gumshop_db_products');
            if (rawProdsMap) {
                const map = JSON.parse(rawProdsMap);
                if (map && typeof map === 'object' && map[productId]) {
                    delete map[productId];
                    localStorage.setItem('gumshop_db_products', JSON.stringify(map));
                }
            }
        } catch {}
        localStorage.setItem('gumshop_empty_dashboard_ack', 'true');

        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('cloned_store_') || k.startsWith('store_') || k.startsWith('gumshop_db_stores/') || k === 'gumshop_active_store' || k === 'active_store_cache')) {
                try {
                    const storeObj = JSON.parse(localStorage.getItem(k) || '{}');
                    if (storeObj && typeof storeObj === 'object' && Array.isArray(storeObj.products)) {
                        const originalLen = storeObj.products.length;
                        storeObj.products = storeObj.products.filter(p => p && p.id !== productId);
                        if (storeObj.products.length !== originalLen) {
                            localStorage.setItem(k, JSON.stringify(storeObj));
                        }
                    }
                } catch {}
            }
        }

        // 4. Purge from sessionStorage
        try {
            for (let i = 0; i < sessionStorage.length; i++) {
                const k = sessionStorage.key(i);
                if (k && (k.startsWith('cloned_store_') || k.startsWith('store_'))) {
                    try {
                        const storeObj = JSON.parse(sessionStorage.getItem(k) || '{}');
                        if (storeObj && typeof storeObj === 'object' && Array.isArray(storeObj.products)) {
                            const originalLen = storeObj.products.length;
                            storeObj.products = storeObj.products.filter(p => p && p.id !== productId);
                            if (storeObj.products.length !== originalLen) {
                                sessionStorage.setItem(k, JSON.stringify(storeObj));
                            }
                        }
                    } catch {}
                }
            }
        } catch {}

        window.dispatchEvent(new Event('products_updated'));
        window.dispatchEvent(new Event('active_store_changed'));
    }

    // 5. Sync deletion to dedicated server database API / Supabase
    try {
        if (typeof window !== 'undefined') {
            fetch(`/api/store/data?productId=${encodeURIComponent(productId)}`, {
                method: 'DELETE'
            }).catch(() => {});
        } else {
            const { serverDeleteProduct } = await import('./serverDb.js');
            await serverDeleteProduct(productId);
        }
    } catch (e) {}
}

export async function getProductsByStore(storeId) {
    if (!storeId || isStoreDeleted(storeId)) return [];

    const cleanTargetId = (storeId || '').toLowerCase().replace(/^store_/, '').trim();
    const products = [];
    const seenIds = new Set();

    const addProduct = (p) => {
        if (!p) return;
        const id = p.id || (p.name ? `prod_${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : null);
        if (!id || seenIds.has(id)) return;
        if (isProductDeleted(id)) return;

        // Auto-purge placeholder/internal non-retail products (e.g. Partial Payment, down payments, COD deposits)
        const name = (p.name || p.title || '').trim();
        if (/partial\s*payment|down\s*payment|advance\s*payment|deposit|booking\s*amount|shipping\s*protection|route\s*package/i.test(name)) {
            return;
        }
        if (p.price !== undefined && (parseFloat(p.price) <= 0 || isNaN(parseFloat(p.price)))) {
            return;
        }

        // Strict Database Isolation: product must belong strictly to this store
        const pStoreId = (p.storeId || '').toLowerCase().replace(/^store_/, '').trim();
        if (!pStoreId || pStoreId !== cleanTargetId) return;

        seenIds.add(id);
        products.push({ ...p, id, storeId: storeId });
    };

    // 1. Direct query
    try {
        const direct = await dbQuery("products", "storeId", storeId);
        if (direct && Array.isArray(direct)) {
            direct.forEach(addProduct);
        }
    } catch (e) {}

    // 1b. Alternate storeId prefix
    try {
        const altId = storeId.startsWith("store_") ? storeId.replace("store_", "") : `store_${storeId}`;
        const altDirect = await dbQuery("products", "storeId", altId);
        if (altDirect && Array.isArray(altDirect)) {
            altDirect.forEach(addProduct);
        }
    } catch (e) {}

    // 2. Local edge storage check (gumshop_db_products)
    if (typeof window !== 'undefined') {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith("gumshop_db_products/")) {
                    const parsed = JSON.parse(localStorage.getItem(key) || "null");
                    if (parsed) {
                        addProduct(parsed);
                    }
                }
            }
        } catch (e) {}

        // 3. Check store objects in local cache for embedded products array
        try {
            const cachedStore = getLocal(`stores/${storeId}`) || 
                                JSON.parse(localStorage.getItem(`store_${storeId}`) || "null");
            if (cachedStore && Array.isArray(cachedStore.products)) {
                cachedStore.products.forEach(p => {
                    if (p && !isProductDeleted(p.id)) {
                        addProduct({ ...p, storeId });
                    }
                });
            }

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith("cloned_store_") || key.startsWith("store_") || key.startsWith("gumshop_db_stores/"))) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(key) || "null");
                        if (parsed && Array.isArray(parsed.products)) {
                            const parsedId = (parsed.id || '').toLowerCase().replace(/^store_/, '');
                            const parsedSlug = (parsed.username || parsed.name || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                            if (parsedId === cleanTargetId || parsedSlug === cleanTargetId) {
                                parsed.products.forEach(p => {
                                    if (p && !isProductDeleted(p.id)) {
                                        addProduct({ ...p, storeId });
                                    }
                                });
                            }
                        }
                    } catch {}
                }
            }
        } catch (e) {}
    }

    // 4. Server-side process cache fallback (Supabase & memoryStores)
    if (products.length === 0 && typeof window === 'undefined') {
        try {
            const { serverGetProducts } = await import('./serverDb.js');
            const serverProds = await serverGetProducts(storeId);
            if (Array.isArray(serverProds)) {
                serverProds.forEach(addProduct);
            }
        } catch (e) {}
    }

    return products.filter(p => !isProductDeleted(p.id));
}

// ─── Stores ───

export async function getAllStores() {
    try {
        const data = await dbGet("stores");
        if (data && Object.keys(data).length > 0) {
            return Object.entries(data)
                .map(([id, val]) => ({ id, ...val }))
                .filter(s => s && !isStoreDeleted(s.id) && !isStoreDeleted(s.username) && !isStoreDeleted(s.slug) && !isStoreDeleted(s.name));
        }
    } catch (e) {
        console.warn("getAllStores fallback:", e.message);
    }
    return [];
}

export async function getStore(storeId) {
    if (!storeId || isStoreDeleted(storeId)) return null;
    const data = await dbGet(`stores/${storeId}`);
    return data ? { id: storeId, ...data } : null;
}

export async function getStoreByUserId(userId, preferredSlug = null) {
    if (!userId) return null;

    let foundStore = null;
    const targetSlug = (preferredSlug || (typeof window !== 'undefined' ? localStorage.getItem('active_store_slug') : '') || '').toLowerCase().trim();

    // 1. Direct query by userId
    try {
        const stores = await dbQuery("stores", "userId", userId);
        if (stores && stores.length > 0) {
            if (targetSlug) {
                const match = stores.find(s => 
                    (s.username && s.username.toLowerCase() === targetSlug) ||
                    (s.id && (s.id.toLowerCase() === targetSlug || s.id.toLowerCase() === `store_${targetSlug}`)) ||
                    (s.name && s.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-') === targetSlug)
                );
                if (match) foundStore = match;
            }
            if (!foundStore) foundStore = stores[0];
        }
    } catch (e) {
        console.warn("dbQuery stores by userId notice:", e.message);
    }

    // 2. Direct key lookup: stores/store_${targetSlug} or stores/store_${userId}
    if (!foundStore && targetSlug) {
        try {
            foundStore = await getStore(`store_${targetSlug}`) || await getStore(targetSlug);
        } catch (e) {}
    }
    if (!foundStore) {
        try {
            foundStore = await getStore(`store_${userId}`) || await getStore(userId);
        } catch (e) {}
    }

    // 3. User document linked storeId
    if (!foundStore) {
        try {
            const userObj = await getUser(userId);
            if (userObj && userObj.storeId) {
                foundStore = await getStore(userObj.storeId);
            }
        } catch (e) {}
    }

    // 4. Scan all stores in case indexed query timed out or was unindexed
    if (!foundStore) {
        try {
            const all = await getAllStores();
            if (targetSlug) {
                foundStore = all.find(s => 
                    (s.username && s.username.toLowerCase() === targetSlug) || 
                    (s.id && (s.id.toLowerCase() === targetSlug || s.id.toLowerCase() === `store_${targetSlug}`))
                );
            }
            if (!foundStore) {
                foundStore = all.find(s => s.userId === userId || s.id === `store_${userId}` || s.id === userId);
            }
        } catch (e) {}
    }

    // 5. Local edge mirror keys (store_*, cloned_store_*)
    if (typeof window !== 'undefined') {
        try {
            // First try active store if matching
            if (targetSlug) {
                const direct = localStorage.getItem(`cloned_store_${targetSlug}`) || localStorage.getItem(`store_${targetSlug}`);
                if (direct) {
                    const parsedDirect = JSON.parse(direct);
                    if (parsedDirect) return parsedDirect;
                }
            }

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith("store_") || key.startsWith("cloned_store_"))) {
                    const parsed = JSON.parse(localStorage.getItem(key) || "null");
                    if (parsed) {
                        const pSlug = (parsed.username || parsed.name || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                        if (targetSlug && (pSlug === targetSlug || parsed.id === targetSlug || parsed.id === `store_${targetSlug}`)) {
                            return parsed;
                        }
                        if (parsed.userId === userId || parsed.id === `store_${userId}`) {
                            if (!foundStore) {
                                foundStore = parsed;
                            } else if ((!foundStore.products || !foundStore.products.length) && (parsed.products && parsed.products.length)) {
                                foundStore.products = parsed.products;
                            }
                        }
                    }
                }
            }
        } catch (e) {}
    }

    return foundStore;
}

export async function getStoreByUsername(username) {
    if (!username || isStoreDeleted(username)) return null;
    const lower = username.toLowerCase().trim();
    if (isStoreDeleted(lower)) return null;

    // 1. Direct indexed query
    try {
        const stores = await dbQuery("stores", "username", lower);
        if (stores && stores.length > 0) return stores[0];
    } catch (e) {
        console.warn("Direct dbQuery failed, attempting scan fallback:", e.message);
    }

    // 2. Resilient fallback: fetch all stores and match by username, slug, name, or id
    try {
        const all = await getAllStores();
        const found = all.find(s => 
            (s.username && s.username.toLowerCase() === lower) || 
            (s.id && s.id.toLowerCase() === lower) ||
            (s.id && s.id.toLowerCase().replace(/^store_/, '') === lower.replace(/^store_/, '')) ||
            (s.username && s.username.toLowerCase().replace(/^store_/, '') === lower.replace(/^store_/, '')) ||
            (s.name && s.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-') === lower) ||
            (s.slug && s.slug.toLowerCase() === lower)
        );
        if (found) return found;
    } catch (e) {
        console.warn("getAllStores scan fallback failed:", e.message);
    }

    // 3. Local edge mirror lookup (cloned_store_*, store_*)
    if (typeof window !== 'undefined') {
        try {
            const cached = localStorage.getItem(`cloned_store_${lower}`) || 
                           sessionStorage.getItem(`cloned_store_${lower}`) ||
                           localStorage.getItem(`store_${lower}`) ||
                           sessionStorage.getItem(`store_${lower}`);
            if (cached) return JSON.parse(cached);

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith("cloned_store_") || key.startsWith("store_"))) {
                    const parsed = JSON.parse(localStorage.getItem(key) || "null");
                    if (parsed && (
                        (parsed.username && parsed.username.toLowerCase() === lower) ||
                        (parsed.id && parsed.id.toLowerCase() === lower) ||
                        (parsed.id && parsed.id.toLowerCase().replace(/^store_/, '') === lower.replace(/^store_/, '')) ||
                        (parsed.username && parsed.username.toLowerCase().replace(/^store_/, '') === lower.replace(/^store_/, '')) ||
                        (parsed.name && parsed.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-') === lower)
                    )) {
                        return parsed;
                    }
                }
            }
        } catch (e) {}
    }

    return null;
}

export async function getStoresByStatus(status) {
    return await dbQuery("stores", "status", status);
}

export async function createStore(data) {
    const storeKey = data.id || `store_${Date.now()}`;
    const storeObj = {
        ...data,
        id: storeKey,
        status: data.status || "approved",
        isActive: true,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    await dbSet(`stores/${storeKey}`, storeObj);

    // Sync to dedicated server database API (Supabase & server memory)
    try {
        if (typeof window !== 'undefined') {
            fetch('/api/store/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ store: storeObj, products: storeObj.products || [] })
            }).catch(() => {});
        } else {
            const { serverSaveStore, serverSaveProducts } = await import('./serverDb.js');
            await serverSaveStore(storeObj);
            if (Array.isArray(storeObj.products) && storeObj.products.length > 0) {
                await serverSaveProducts(storeKey, storeObj.products);
            }
        }
    } catch (e) {}

    if (data.userId) {
        try {
            await updateUser(data.userId, { role: "storeOwner", storeId: storeKey });
        } catch (e) {
            console.warn("Failed to update user role to storeOwner:", e.message);
        }
    }
    return storeKey;
}

export async function updateStore(storeId, data) {
    await dbUpdate(`stores/${storeId}`, {
        ...data,
        updatedAt: new Date().toISOString(),
    });
    try {
        if (typeof window !== 'undefined') {
            fetch('/api/store/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ store: { id: storeId, ...data } })
            }).catch(() => {});
        } else {
            const { serverSaveStore } = await import('./serverDb.js');
            await serverSaveStore({ id: storeId, ...data });
        }
    } catch (e) {}
}

export async function deleteStore(storeId, storeSlug = null) {
    if (!storeId && !storeSlug) return;

    const raw1 = String(storeId || '').trim();
    const raw2 = String(storeSlug || '').trim();

    const clean1 = raw1.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    const clean2 = raw2.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    const unprefix1 = clean1.replace(/^store-/, '').replace(/^store_/, '');
    const unprefix2 = clean2.replace(/^store-/, '').replace(/^store_/, '');

    const allVariants = Array.from(new Set([
        clean1,
        clean2,
        unprefix1,
        unprefix2,
        `store_${unprefix1}`,
        `store_${unprefix2}`,
        `store-${unprefix1}`,
        `store-${unprefix2}`,
    ].filter(Boolean)));

    // 1. Permanently register in store tombstone registry
    allVariants.forEach(v => markStoreDeleted(v));

    // Sync deletion to dedicated server database API / Supabase
    try {
        const primaryId = `store_${unprefix1 || unprefix2}`;
        const primarySlug = unprefix2 || unprefix1;
        if (typeof window !== 'undefined') {
            fetch(`/api/store/data?id=${encodeURIComponent(primaryId)}&slug=${encodeURIComponent(primarySlug)}`, {
                method: 'DELETE'
            }).catch(() => {});
        } else {
            const { serverDeleteStore } = await import('./serverDb.js');
            await serverDeleteStore(primaryId, primarySlug);
        }
    } catch (e) {}

    // 2. Remove from Firebase database
    try {
        for (const v of allVariants) {
            await dbRemove(`stores/${v}`);
        }
    } catch (e) {}

    // 3. Purge all references from localStorage & sessionStorage
    if (typeof window !== 'undefined') {
        // A. Remove from gumshop_db_stores collection dictionary
        try {
            const rawColl = localStorage.getItem('gumshop_db_stores');
            if (rawColl) {
                const coll = JSON.parse(rawColl);
                allVariants.forEach(v => { delete coll[v]; });
                localStorage.setItem('gumshop_db_stores', JSON.stringify(coll));
            }
        } catch (e) {}

        // B. Remove all localStorage keys matching this store's id or slug
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            const kLower = k.toLowerCase();
            if (
                kLower === `store_${cleanId}` ||
                kLower === `store_${slug}` ||
                kLower === `cloned_store_${cleanId}` ||
                kLower === `cloned_store_${slug}` ||
                kLower === `gumshop_db_stores/${id}` ||
                kLower === `gumshop_db_stores/${slug}` ||
                kLower === `gumshop_db_stores/store_${slug}` ||
                kLower.includes(`_${cleanId}`) ||
                (slug && kLower.includes(`_${slug}`))
            ) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach(k => {
            try { localStorage.removeItem(k); } catch (e) {}
        });

        // C. Purge from sessionStorage
        try {
            sessionStorage.removeItem(`cloned_store_${slug}`);
            sessionStorage.removeItem(`cloned_store_${cleanId}`);
            sessionStorage.removeItem(`store_${slug}`);
            sessionStorage.removeItem(`store_${cleanId}`);
        } catch (e) {}

        // D. Purge all products associated with this store and register them in tombstone
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('gumshop_db_products/')) {
                try {
                    const prod = JSON.parse(localStorage.getItem(k) || 'null');
                    if (prod) {
                        const pStore = (prod.storeId || '').toLowerCase().replace(/^store_/, '');
                        if (pStore === cleanId || pStore === slug) {
                            markProductDeleted(prod.id);
                            localStorage.removeItem(k);
                        }
                    }
                } catch (e) {}
            }
        }

        // Also purge from gumshop_db_products collection dictionary
        try {
            const rawProds = localStorage.getItem('gumshop_db_products');
            if (rawProds) {
                const prodsColl = JSON.parse(rawProds);
                let changed = false;
                for (const [pId, pVal] of Object.entries(prodsColl)) {
                    const pStore = (pVal?.storeId || '').toLowerCase().replace(/^store_/, '');
                    if (pStore === cleanId || pStore === slug) {
                        markProductDeleted(pId);
                        delete prodsColl[pId];
                        changed = true;
                    }
                }
                if (changed) {
                    localStorage.setItem('gumshop_db_products', JSON.stringify(prodsColl));
                }
            }
        } catch (e) {}

        // E. Clear active store if it points to this deleted store
        try {
            const activeRaw = localStorage.getItem('gumshop_active_store');
            if (activeRaw) {
                const active = JSON.parse(activeRaw);
                const aSlug = (active.username || active.name || active.id || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                if (aSlug === slug || aSlug === cleanId || active.id === id) {
                    localStorage.removeItem('gumshop_active_store');
                    localStorage.removeItem('active_store_cache');
                    localStorage.removeItem('active_store_slug');
                }
            }
        } catch (e) {}

        localStorage.setItem('gumshop_empty_dashboard_ack', 'true');

        // Dispatch sync events so dashboard, storefronts, and creator modes update instantly
        window.dispatchEvent(new Event('stores_updated'));
        window.dispatchEvent(new Event('active_store_changed'));
        window.dispatchEvent(new Event('products_updated'));
    }
}

// ─── Orders ───

export async function getAllOrders() {
    try {
        const data = await dbGet("orders");
        if (data && Object.keys(data).length > 0) {
            return Object.entries(data).map(([id, val]) => ({ id, ...val }));
        }
    } catch (e) {
        console.warn("getAllOrders fallback:", e.message);
    }
    return [];
}

export async function getOrder(orderId) {
    if (!orderId) return null;
    const cleanId = orderId.trim();

    // 1. Fast-path check in local recent orders
    if (typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem('gumshop_recent_orders');
            if (raw) {
                const recents = JSON.parse(raw);
                const match = recents.find(o => o.id === cleanId || o.orderSessionId === cleanId);
                if (match) return match;
            }
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('gumshop_recent_orders_')) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(k) || '[]');
                        if (Array.isArray(parsed)) {
                            const match = parsed.find(o => o.id === cleanId || o.orderSessionId === cleanId);
                            if (match) return match;
                        }
                    } catch {}
                }
            }
        } catch (e) {}
    }

    // 2. Resilient DB fetch with built-in timeout
    try {
        const data = await dbGet(`orders/${cleanId}`);
        if (data) return { id: cleanId, ...data };
    } catch (e) {}

    return null;
}

export async function getOrdersByUser(userId) {
    return await dbQuery("orders", "userId", userId);
}

export async function getOrdersByStore(storeId) {
    return await dbQuery("orders", "storeId", storeId);
}

export async function createOrder(data) {
    const id = await dbPush("orders", {
        ...data,
        status: data.status || "Completed",
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    if (typeof window !== 'undefined') {
        try {
            const rawOrders = localStorage.getItem('gumshop_recent_orders');
            const recent = rawOrders ? JSON.parse(rawOrders) : [];
            const newOrder = { id: data.id || id, ...data, status: data.status || 'Completed' };
            recent.unshift(newOrder);
            localStorage.setItem('gumshop_recent_orders', JSON.stringify(recent.slice(0, 20)));
        } catch {}
    }

    return id;
}

export async function updateOrder(orderId, data) {
    await dbUpdate(`orders/${orderId}`, {
        ...data,
        updatedAt: new Date().toISOString(),
    });

    if (typeof window !== 'undefined') {
        try {
            const rawOrders = localStorage.getItem('gumshop_recent_orders');
            if (rawOrders) {
                const recent = JSON.parse(rawOrders);
                const updated = recent.map(o => (o.id === orderId || o.orderSessionId === orderId) ? { ...o, ...data, updatedAt: new Date().toISOString() } : o);
                localStorage.setItem('gumshop_recent_orders', JSON.stringify(updated));
            }
            const rawSingle = localStorage.getItem(`gumshop_db_orders/${orderId}`);
            if (rawSingle) {
                const single = JSON.parse(rawSingle);
                localStorage.setItem(`gumshop_db_orders/${orderId}`, JSON.stringify({ ...single, ...data, updatedAt: new Date().toISOString() }));
            }

            // Synchronize all store-scoped order caches (gumshop_recent_orders_${storeId})
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('gumshop_recent_orders_')) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(k) || '[]');
                        if (Array.isArray(parsed)) {
                            let matchFound = false;
                            const nextList = parsed.map(o => {
                                if (o && (o.id === orderId || o.orderSessionId === orderId)) {
                                    matchFound = true;
                                    return { ...o, ...data, updatedAt: new Date().toISOString() };
                                }
                                return o;
                            });
                            if (matchFound) {
                                localStorage.setItem(k, JSON.stringify(nextList));
                            }
                        }
                    } catch {}
                }
            }
            window.dispatchEvent(new Event('orders_updated'));
        } catch (e) {}
    }
}

// ─── Ratings ───

export async function getAllRatings() {
    const data = await dbGet("ratings");
    if (!data) return [];
    return Object.entries(data).map(([id, val]) => ({ id, ...val }));
}

export async function createRating(data) {
    const id = await dbPush("ratings", {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    // Also push this rating to the product's embedded rating array
    try {
        const product = await getProduct(data.productId);
        if (product) {
            const user = await getUser(data.userId);
            const currentRatings = Array.isArray(product.rating) ? product.rating : [];
            
            const newEmbeddedRating = {
                rating: data.rating,
                review: data.review,
                createdAt: new Date().toISOString(),
                user: {
                    name: user?.name || "Anonymous",
                    email: user?.email || "",
                    image: user?.image || ""
                }
            };
            
            await updateProduct(data.productId, {
                rating: [...currentRatings, newEmbeddedRating]
            });
        }
    } catch (e) {
        console.error("Failed to update product embedded rating", e);
    }

    return id;
}

// ─── Addresses ───

export async function getAddressesByUser(userId) {
    return await dbQuery("addresses", "userId", userId);
}

export async function createAddress(data) {
    const id = await dbPush("addresses", {
        ...data,
        createdAt: new Date().toISOString(),
    });
    return id;
}

// ─── Coupons ───

export async function getAllCoupons() {
    let list = [];
    try {
        const data = await dbGet("coupons");
        if (data && typeof data === 'object') {
            list = Object.entries(data).map(([code, val]) => ({ code, ...val }));
        }
    } catch (e) {}

    // Check client-side edge storage for offline/cached coupons
    if (typeof window !== 'undefined') {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith("gumshop_db_coupons/") || key === "gumshop_db_coupons")) {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            parsed.forEach(c => {
                                if (c?.code && !list.find(item => item.code === c.code)) {
                                    list.push(c);
                                }
                            });
                        } else if (parsed && parsed.code && !list.find(item => item.code === parsed.code)) {
                            list.push(parsed);
                        }
                    }
                }
            }
        } catch (e) {}
    }

    if (list.length === 0) {
        return [
            {
                code: 'SAVE10',
                description: 'Welcome Deal: 10% OFF Any Order',
                discount: 10,
                expiresAt: new Date(Date.now() + 86400000 * 365).toISOString(),
                isPublic: true,
            },
            {
                code: 'SAVE20',
                description: '⚡ Flash Deals: 20% OFF Everything',
                discount: 20,
                expiresAt: new Date(Date.now() + 86400000 * 365).toISOString(),
                isPublic: true,
            },
            {
                code: 'VIP15',
                description: 'VIP Club Member: 15% OFF',
                discount: 15,
                expiresAt: new Date(Date.now() + 86400000 * 365).toISOString(),
                isPublic: true,
            }
        ];
    }
    return list;
}

export async function getCoupon(code) {
    if (!code) return null;
    const cleanCode = String(code).toUpperCase().trim();
    
    // 1. Direct DB lookup
    try {
        const data = await dbGet(`coupons/${cleanCode}`);
        if (data) return { code: cleanCode, ...data };
    } catch (e) {}

    // 2. Client-side edge storage lookup (created by merchant in /store/coupons)
    if (typeof window !== 'undefined') {
        try {
            const direct = localStorage.getItem(`gumshop_db_coupons/${cleanCode}`);
            if (direct) {
                const parsed = JSON.parse(direct);
                if (parsed) return { code: cleanCode, ...parsed };
            }

            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('gumshop_db_coupons/')) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(k) || 'null');
                        if (parsed && String(parsed.code).toUpperCase().trim() === cleanCode) {
                            return { code: cleanCode, ...parsed };
                        }
                    } catch {}
                }
            }
        } catch (e) {}
    }

    // Built-in storewide promotional coupons (matches top banner, exit modal & newsletter)
    if (cleanCode === 'SAVE10') {
        return {
            code: 'SAVE10',
            description: 'Welcome Deal: 10% OFF Any Order',
            discount: 10,
            expiresAt: new Date(Date.now() + 86400000 * 365).toISOString()
        };
    }
    if (cleanCode === 'SAVE20') {
        return {
            code: 'SAVE20',
            description: '⚡ Flash Deals: 20% OFF Everything',
            discount: 20,
            expiresAt: new Date(Date.now() + 86400000 * 365).toISOString()
        };
    }
    if (cleanCode === 'VIP15') {
        return {
            code: 'VIP15',
            description: 'VIP Club Member: 15% OFF',
            discount: 15,
            expiresAt: new Date(Date.now() + 86400000 * 365).toISOString()
        };
    }
    if (cleanCode === 'FLASH25') {
        return {
            code: 'FLASH25',
            description: 'Lightning Sale: 25% OFF',
            discount: 25,
            expiresAt: new Date(Date.now() + 86400000 * 365).toISOString()
        };
    }
    if (cleanCode === 'NEW20') {
        return {
            code: 'NEW20',
            description: 'New Customer Special: 20% OFF',
            discount: 20,
            expiresAt: new Date(Date.now() + 86400000 * 365).toISOString()
        };
    }

    return null;
}

export async function createCoupon(data) {
    if (!data?.code) return;
    const cleanCode = String(data.code).toUpperCase().trim();
    const payload = {
        code: cleanCode,
        description: data.description,
        discount: data.discount,
        type: data.type || 'percentage',
        minSpend: data.minSpend !== undefined ? Number(data.minSpend) : 0,
        usageLimit: data.usageLimit !== undefined ? Number(data.usageLimit) : 0,
        usedCount: Number(data.usedCount || 0),
        forNewUser: data.forNewUser || false,
        forMember: data.forMember || false,
        isPublic: data.isPublic || false,
        storeId: data.storeId || null,
        productId: data.productId || null,
        expiresAt: data.expiresAt,
        createdAt: data.createdAt || new Date().toISOString(),
    };
    try {
        await dbSet(`coupons/${cleanCode}`, payload);
    } catch (e) {}
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(`gumshop_db_coupons/${cleanCode}`, JSON.stringify(payload));
            if (data.code !== cleanCode) {
                localStorage.removeItem(`gumshop_db_coupons/${data.code}`);
            }
        } catch (e) {}
    }
}

export async function incrementCouponUsage(code) {
    if (!code) return;
    const cleanCode = code.toUpperCase().trim();
    try {
        const coupon = await getCoupon(cleanCode);
        if (coupon) {
            const newCount = (Number(coupon.usedCount) || 0) + 1;
            await dbUpdate(`coupons/${cleanCode}`, { usedCount: newCount });
            if (typeof window !== 'undefined') {
                const local = localStorage.getItem(`gumshop_db_coupons/${cleanCode}`);
                if (local) {
                    try {
                        const parsed = JSON.parse(local);
                        parsed.usedCount = newCount;
                        localStorage.setItem(`gumshop_db_coupons/${cleanCode}`, JSON.stringify(parsed));
                    } catch {}
                }
            }
        }
    } catch (e) {}
}

export async function deleteCoupon(code) {
    if (!code) return;
    const cleanCode = String(code).toUpperCase().trim();
    try {
        await dbRemove(`coupons/${cleanCode}`);
        if (code !== cleanCode) {
            await dbRemove(`coupons/${code}`);
        }
    } catch (e) {}
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem(`gumshop_db_coupons/${cleanCode}`);
            if (code !== cleanCode) {
                localStorage.removeItem(`gumshop_db_coupons/${code}`);
            }
        } catch (e) {}
    }
}

// ─── Contact Messages ───

export async function createContactMessage(data) {
    const id = await dbPush("contactMessages", {
        ...data,
        createdAt: new Date().toISOString(),
    });
    return id;
}

export async function getAllContactMessages() {
    const data = await dbGet("contactMessages");
    if (!data) return [];
    return Object.entries(data).map(([id, val]) => ({ id, ...val }));
}

// ─── Master Import History ───

export async function recordImportHistory(data) {
    const id = data.id || `imp_${Date.now()}`;
    await dbSet(`importHistory/${id}`, {
        ...data,
        id,
        createdAt: data.createdAt || new Date().toISOString()
    });
    return id;
}

export async function getAllImportHistory() {
    const data = await dbGet("importHistory");
    if (!data) return [];
    return Object.entries(data).map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

