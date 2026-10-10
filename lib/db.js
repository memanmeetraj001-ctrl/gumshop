/**
 * ⚡ Unified E-Commerce Database Adapter (`lib/db.js`)
 * Pragmatic, strict store-isolated database with offline-first local edge sync
 * and optional Firebase Realtime Database backing.
 * 
 * Rules:
 * 1. Strict partition by storeId — no store ever leaks items into another store.
 * 2. An empty store has 0 products — no ghost demo items or resurrected defaults.
 * 3. Fast synchronous local edge reads with async background cloud persistence.
 */

import { db } from './firebase';
import { ref, get, set, update, remove, query, orderByChild, equalTo } from 'firebase/database';

// ─── Local Storage Helpers ───

function getLocal(key) {
    if (typeof window === 'undefined') return null;
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
    } catch {
        return null;
    }
}

function setLocal(key, val) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(val));
    } catch {}
}

function removeLocal(key) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(key);
    } catch {}
}

// ─── Store Partitioning & Sanitization ───

export function cleanSlug(nameOrSlug) {
    if (!nameOrSlug) return 'shop';
    return nameOrSlug.toString().toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-') || 'shop';
}

export function formatStoreId(slugOrId) {
    if (!slugOrId) return 'store_default';
    const clean = cleanSlug(slugOrId).replace(/^store_/, '');
    return `store_${clean}`;
}

export function isJunkProduct(name) {
    if (!name || typeof name !== 'string') return true;
    return /partial\s*payment|down\s*payment|advance\s*payment|deposit|booking\s*amount|shipping\s*protection|route\s*package|transit\s*insurance|navidium|tip(\s|$)|tips(\s|$)|warranty|custom\s*order|test\s*product|draft/i.test(name.trim());
}

export function isProductDeleted(productId) {
    if (!productId || typeof window === 'undefined') return false;
    const tombstones = getLocal('gumshop_tombstones') || [];
    return Array.isArray(tombstones) && tombstones.includes(productId);
}

export function markProductDeleted(productId) {
    if (!productId || typeof window === 'undefined') return;
    const tombstones = new Set(getLocal('gumshop_tombstones') || []);
    tombstones.add(productId);
    setLocal('gumshop_tombstones', Array.from(tombstones));
}

// ─── Store Management ───

export async function getAllStores() {
    const storesMap = new Map();

    // 1. Scan local edge storage
    if (typeof window !== 'undefined') {
        const cleared = localStorage.getItem('gumshop_stores_cleared') === 'true';
        if (!cleared) {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.startsWith('store_') || k.startsWith('cloned_store_') || k.startsWith('gumshop_db_stores/'))) {
                    const parsed = getLocal(k);
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed.name || parsed.username)) {
                        const sId = formatStoreId(parsed.id || parsed.username || parsed.name);
                        const slug = cleanSlug(parsed.username || parsed.name);
                        if (!storesMap.has(sId)) {
                            storesMap.set(sId, { ...parsed, id: sId, username: slug });
                        }
                    }
                }
            }
        }
    }

    // 2. Fetch from Firebase
    try {
        if (db) {
            const snap = await Promise.race([
                get(ref(db, 'stores')),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
            ]);
            if (snap && snap.exists()) {
                const remote = snap.val();
                Object.entries(remote).forEach(([id, val]) => {
                    const sId = formatStoreId(id);
                    if (!storesMap.has(sId) && val && typeof val === 'object') {
                        storesMap.set(sId, { id: sId, ...val, username: cleanSlug(val.username || val.name || sId) });
                    }
                });
            }
        }
    } catch {}

    const list = Array.from(storesMap.values());
    return list;
}

export async function getStore(storeIdOrSlug) {
    if (!storeIdOrSlug) return null;
    const sId = formatStoreId(storeIdOrSlug);
    const slug = cleanSlug(storeIdOrSlug).replace(/^store_/, '');

    // 1. Check local edge storage first (instant synchronous resolution)
    if (typeof window !== 'undefined') {
        const localDirect = getLocal(`store_${slug}`) || 
                            getLocal(`cloned_store_${slug}`) || 
                            getLocal(`gumshop_db_stores/${sId}`) ||
                            getLocal(`store_${sId}`);
        if (localDirect) return { ...localDirect, id: sId, username: slug };

        // Search any stored store object
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('store_') || k.startsWith('cloned_store_'))) {
                const parsed = getLocal(k);
                if (parsed && (parsed.id === sId || cleanSlug(parsed.username || parsed.name) === slug)) {
                    return { ...parsed, id: sId, username: slug };
                }
            }
        }
    }

    // 2. Fetch from Firebase
    try {
        if (db) {
            const snap = await Promise.race([
                get(ref(db, `stores/${sId}`)),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
            ]);
            if (snap && snap.exists()) {
                return { id: sId, username: slug, ...snap.val() };
            }
        }
    } catch {}

    return null;
}

export async function saveStore(storeData) {
    if (!storeData) return null;
    const slug = cleanSlug(storeData.username || storeData.name || 'shop');
    const sId = formatStoreId(storeData.id || slug);

    const fullStore = {
        ...storeData,
        id: sId,
        username: slug,
        name: storeData.name || slug,
        description: storeData.description || `Official digital storefront for ${storeData.name || slug}.`,
        status: storeData.status || 'approved',
        theme: storeData.theme || 'viral_lander',
        themeColor: storeData.themeColor || '#10B981',
        products: Array.isArray(storeData.products) ? storeData.products : [],
        reviews: storeData.reviews || [],
        videoReels: storeData.videoReels || [],
        gumroadToken: storeData.gumroadToken || '',
        updatedAt: new Date().toISOString(),
        createdAt: storeData.createdAt || new Date().toISOString()
    };

    // 1. Save to local edge storage
    if (typeof window !== 'undefined') {
        setLocal(`store_${slug}`, fullStore);
        setLocal(`cloned_store_${slug}`, fullStore);
        setLocal(`gumshop_db_stores/${sId}`, fullStore);
        setLocal('gumshop_active_store', fullStore);
        localStorage.setItem('active_store_slug', slug);
        localStorage.removeItem('gumshop_stores_cleared');
        window.dispatchEvent(new Event('active_store_changed'));
    }

    // 2. Persist to Firebase in background
    try {
        if (db) {
            await set(ref(db, `stores/${sId}`), fullStore);
        }
    } catch (e) {
        console.warn('Firebase store save notice:', e.message);
    }

    return fullStore;
}

export async function deleteStore(storeIdOrSlug) {
    if (!storeIdOrSlug) return;
    const sId = formatStoreId(storeIdOrSlug);
    const slug = cleanSlug(storeIdOrSlug).replace(/^store_/, '');

    // 1. Purge from local edge storage
    if (typeof window !== 'undefined') {
        removeLocal(`store_${slug}`);
        removeLocal(`cloned_store_${slug}`);
        removeLocal(`gumshop_db_stores/${sId}`);
        removeLocal(`gumshop_recent_orders_${sId}`);
        removeLocal(`gumshop_recent_orders_${slug}`);

        const active = (localStorage.getItem('active_store_slug') || '').toLowerCase();
        if (active === slug || active === sId) {
            localStorage.removeItem('active_store_slug');
            localStorage.removeItem('gumshop_active_store');
        }
        window.dispatchEvent(new Event('active_store_changed'));
    }

    // 2. Purge from Firebase
    try {
        if (db) {
            await remove(ref(db, `stores/${sId}`));
        }
    } catch {}
}

// ─── Products (Strictly Isolated by storeId) ───

export async function getProductsByStore(storeIdOrSlug) {
    if (!storeIdOrSlug) return [];
    const sId = formatStoreId(storeIdOrSlug);
    const slug = cleanSlug(storeIdOrSlug).replace(/^store_/, '');

    const productsMap = new Map();

    const addProd = (p) => {
        if (!p) return;
        const id = p.id || (p.name ? `prod_${cleanSlug(p.name)}` : null);
        if (!id || productsMap.has(id)) return;
        if (isProductDeleted(id)) return;
        if (isJunkProduct(p.name)) return;
        const price = parseFloat(p.price);
        if (isNaN(price) || price <= 0) return;

        productsMap.set(id, {
            ...p,
            id,
            storeId: sId,
            price,
            compareAtPrice: parseFloat(p.compareAtPrice || (price === 52.99 ? 69.99 : Math.round(price * 1.35 * 100) / 100)),
            inStock: p.inStock !== false,
            images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
            image: p.image || p.images?.[0] || '',
            category: p.category || 'Featured'
        });
    };

    // 1. Check embedded store object in local storage
    if (typeof window !== 'undefined') {
        const storeObj = getLocal(`store_${slug}`) || getLocal(`cloned_store_${slug}`) || getLocal(`gumshop_db_stores/${sId}`);
        if (storeObj && Array.isArray(storeObj.products)) {
            storeObj.products.forEach(addProd);
        }

        // Check products registered under this storeId
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('gumshop_db_products/')) {
                const p = getLocal(k);
                if (p && (formatStoreId(p.storeId) === sId || cleanSlug(p.storeId) === slug)) {
                    addProd(p);
                }
            }
        }
    }

    // 2. Query Firebase products where storeId == sId
    try {
        if (db) {
            const q = query(ref(db, 'products'), orderByChild('storeId'), equalTo(sId));
            const snap = await Promise.race([
                get(q),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
            ]);
            if (snap && snap.exists()) {
                Object.entries(snap.val()).forEach(([id, val]) => addProd({ id, ...val }));
            }
        }
    } catch {}

    return Array.from(productsMap.values());
}

export async function saveProduct(storeIdOrSlug, productData) {
    if (!productData) return null;
    const sId = formatStoreId(storeIdOrSlug || productData.storeId);
    const prodId = productData.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const price = parseFloat(productData.price || 52.99);
    const fullProd = {
        ...productData,
        id: prodId,
        storeId: sId,
        price,
        compareAtPrice: parseFloat(productData.compareAtPrice || (price === 52.99 ? 69.99 : Math.round(price * 1.35 * 100) / 100)),
        inStock: productData.inStock !== false,
        image: productData.image || productData.images?.[0] || '',
        images: Array.isArray(productData.images) && productData.images.length > 0 ? productData.images : (productData.image ? [productData.image] : []),
        category: productData.category || 'Featured',
        status: 'active',
        createdAt: productData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // 1. Save to local edge storage
    if (typeof window !== 'undefined') {
        setLocal(`gumshop_db_products/${prodId}`, fullProd);

        // Update embedded products array in the store
        const slug = cleanSlug(sId).replace(/^store_/, '');
        const storeObj = getLocal(`store_${slug}`) || getLocal(`cloned_store_${slug}`) || getLocal(`gumshop_db_stores/${sId}`);
        if (storeObj) {
            if (!Array.isArray(storeObj.products)) storeObj.products = [];
            const idx = storeObj.products.findIndex(p => p.id === prodId);
            if (idx === -1) storeObj.products.unshift(fullProd);
            else storeObj.products[idx] = fullProd;

            setLocal(`store_${slug}`, storeObj);
            setLocal(`cloned_store_${slug}`, storeObj);
            setLocal(`gumshop_db_stores/${sId}`, storeObj);
        }
        window.dispatchEvent(new Event('products_updated'));
    }

    // 2. Persist to Firebase in background
    try {
        if (db) {
            await set(ref(db, `products/${prodId}`), fullProd);
        }
    } catch {}

    return fullProd;
}

export async function deleteProduct(storeIdOrSlug, productId) {
    if (!productId) return;
    const sId = formatStoreId(storeIdOrSlug);
    const slug = cleanSlug(storeIdOrSlug).replace(/^store_/, '');

    // 1. Record tombstone so it can NEVER resurrect
    markProductDeleted(productId);

    // 2. Remove locally
    if (typeof window !== 'undefined') {
        removeLocal(`gumshop_db_products/${productId}`);

        const storeObj = getLocal(`store_${slug}`) || getLocal(`cloned_store_${slug}`) || getLocal(`gumshop_db_stores/${sId}`);
        if (storeObj && Array.isArray(storeObj.products)) {
            storeObj.products = storeObj.products.filter(p => p && p.id !== productId);
            setLocal(`store_${slug}`, storeObj);
            setLocal(`cloned_store_${slug}`, storeObj);
            setLocal(`gumshop_db_stores/${sId}`, storeObj);
        }
        window.dispatchEvent(new Event('products_updated'));
    }

    // 3. Remove from Firebase
    try {
        if (db) {
            await remove(ref(db, `products/${productId}`));
        }
    } catch {}
}

// ─── Orders (Strictly Isolated by storeId) ───

export async function getOrdersByStore(storeIdOrSlug) {
    if (!storeIdOrSlug) return [];
    const sId = formatStoreId(storeIdOrSlug);
    const slug = cleanSlug(storeIdOrSlug).replace(/^store_/, '');

    const ordersMap = new Map();

    // 1. Check local edge storage
    if (typeof window !== 'undefined') {
        const storeOrders = getLocal(`gumshop_recent_orders_${sId}`) || 
                            getLocal(`gumshop_recent_orders_${slug}`) || [];
        (Array.isArray(storeOrders) ? storeOrders : []).forEach(o => {
            const id = o.id || o.orderSessionId;
            if (id) ordersMap.set(id, { id, ...o, storeId: sId });
        });

        const general = getLocal('gumshop_recent_orders') || [];
        (Array.isArray(general) ? general : []).forEach(o => {
            if (o.storeId && (formatStoreId(o.storeId) === sId || cleanSlug(o.storeId) === slug)) {
                const id = o.id || o.orderSessionId;
                if (id) ordersMap.set(id, { id, ...o, storeId: sId });
            }
        });
    }

    // 2. Query Firebase orders
    try {
        if (db) {
            const q = query(ref(db, 'orders'), orderByChild('storeId'), equalTo(sId));
            const snap = await Promise.race([
                get(q),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
            ]);
            if (snap && snap.exists()) {
                Object.entries(snap.val()).forEach(([id, val]) => {
                    if (!ordersMap.has(id)) {
                        ordersMap.set(id, { id, ...val, storeId: sId });
                    }
                });
            }
        }
    } catch {}

    return Array.from(ordersMap.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function saveOrder(storeIdOrSlug, orderData) {
    if (!orderData) return null;
    const sId = formatStoreId(storeIdOrSlug || orderData.storeId);
    const slug = cleanSlug(sId).replace(/^store_/, '');
    const ordId = orderData.id || orderData.orderId || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const fullOrder = {
        ...orderData,
        id: ordId,
        orderId: ordId,
        orderNumber: orderData.orderNumber || `GS-${ordId.slice(-6).toUpperCase()}`,
        storeId: sId,
        status: orderData.status || 'processing',
        isPaid: orderData.isPaid !== false,
        total: parseFloat(orderData.total || 0),
        createdAt: orderData.createdAt || new Date().toISOString()
    };

    // 1. Save to local edge storage
    if (typeof window !== 'undefined') {
        setLocal('gumshop_latest_order', fullOrder);

        const storeKeys = [`gumshop_recent_orders_${sId}`, `gumshop_recent_orders_${slug}`];
        storeKeys.forEach(k => {
            const list = getLocal(k) || [];
            const filtered = list.filter(o => o.id !== ordId && o.orderId !== ordId);
            setLocal(k, [fullOrder, ...filtered].slice(0, 50));
        });

        const general = getLocal('gumshop_recent_orders') || [];
        const genFiltered = general.filter(o => o.id !== ordId && o.orderId !== ordId);
        setLocal('gumshop_recent_orders', [fullOrder, ...genFiltered].slice(0, 50));
    }

    // 2. Persist to Firebase in background
    try {
        if (db) {
            await set(ref(db, `orders/${ordId}`), fullOrder);
        }
    } catch {}

    return fullOrder;
}
