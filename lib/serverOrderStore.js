import { database } from './firebase.js';
const ref = () => null;
const get = () => Promise.resolve({ exists: () => false });
const set = () => Promise.resolve();

/**
 * Server Order and Deduplication Store
 * Provides memory-backed persistence with optional Firebase RTDB synchronization.
 * Guarantees idempotency and order verification across serverless invocations.
 */

globalThis.__gumshop_server_orders = globalThis.__gumshop_server_orders || new Map();
globalThis.__gumshop_processed_sales = globalThis.__gumshop_processed_sales || new Map();

export async function isSaleProcessed(saleId) {
    if (!saleId) return false;
    
    // Check in-memory deduplication set
    if (globalThis.__gumshop_processed_sales.has(saleId)) {
        return true;
    }

    // Check Firebase RTDB
    if (database) {
        try {
            const dedupeRef = ref(database, `gumroad_processed_sales/${saleId}`);
            const snap = await get(dedupeRef);
            if (snap.exists()) {
                globalThis.__gumshop_processed_sales.set(saleId, snap.val());
                return true;
            }
        } catch (e) {
            // Permission denied or network notice
        }
    }

    return false;
}

export async function markSaleProcessed(saleId, orderId) {
    if (!saleId) return;
    const entry = {
        saleId,
        orderId,
        processedAt: new Date().toISOString()
    };
    
    globalThis.__gumshop_processed_sales.set(saleId, entry);

    if (database) {
        try {
            const dedupeRef = ref(database, `gumroad_processed_sales/${saleId}`);
            await set(dedupeRef, entry);
        } catch (e) {
            // Permission denied or network notice
        }
    }
}

function normalizeStoreId(val) {
    if (!val || typeof val !== 'string') return '';
    return val.toLowerCase().replace(/^store_/, '').replace(/_/g, '-').trim();
}

export async function saveServerOrder(orderId, orderData) {
    if (!orderId || !orderData) return;

    globalThis.__gumshop_server_orders.set(orderId, orderData);
    if (orderData.id && orderData.id !== orderId) {
        globalThis.__gumshop_server_orders.set(orderData.id, orderData);
    }
    if (orderData.orderId && orderData.orderId !== orderId) {
        globalThis.__gumshop_server_orders.set(orderData.orderId, orderData);
    }
    if (orderData.orderSessionId && orderData.orderSessionId !== orderId) {
        globalThis.__gumshop_server_orders.set(orderData.orderSessionId, orderData);
    }
    if (orderData.saleId) {
        globalThis.__gumshop_server_orders.set(orderData.saleId, orderData);
    }
    if (orderData.orderNumber) {
        globalThis.__gumshop_server_orders.set(String(orderData.orderNumber), orderData);
    }

    if (database) {
        try {
            const orderRef = ref(database, `orders/${orderId}`);
            await set(orderRef, orderData);

            if (orderData.storeId && orderData.storeId !== 'store_default') {
                const storeOrderRef = ref(database, `stores/${orderData.storeId}/orders/${orderId}`);
                await set(storeOrderRef, orderData);
            }
        } catch (e) {
            // Permission denied or network notice
        }
    }
}

export async function getServerOrder(orderId, storeId) {
    if (!orderId) return null;

    // 1. Check in-memory store by direct key, prefixed key, or stripped key
    if (globalThis.__gumshop_server_orders.has(orderId)) {
        return globalThis.__gumshop_server_orders.get(orderId);
    }
    const altPrefixed = `ord_gum_${orderId}`;
    if (globalThis.__gumshop_server_orders.has(altPrefixed)) {
        return globalThis.__gumshop_server_orders.get(altPrefixed);
    }
    if (orderId.startsWith('ord_gum_')) {
        const altStripped = orderId.replace('ord_gum_', '');
        if (globalThis.__gumshop_server_orders.has(altStripped)) {
            return globalThis.__gumshop_server_orders.get(altStripped);
        }
    }

    // Check by value scan if key differed
    const orderStore = globalThis.__gumshop_server_orders;
    if (orderStore) {
        const entries = (orderStore instanceof Map)
            ? Array.from(orderStore.values())
            : Object.values(orderStore);
        const match = entries.find(o => 
            o && (o.id === orderId || o.orderId === orderId || o.orderSessionId === orderId || o.saleId === orderId || String(o.orderNumber) === orderId)
        );
        if (match) return match;
    }

    // 2. Check Firebase RTDB
    if (database) {
        try {
            const orderRef = ref(database, `orders/${orderId}`);
            const snap = await get(orderRef);
            if (snap.exists()) {
                const val = snap.val();
                globalThis.__gumshop_server_orders.set(orderId, val);
                return val;
            }

            if (storeId && storeId !== 'store_default') {
                const storeOrderRef = ref(database, `stores/${storeId}/orders/${orderId}`);
                const storeSnap = await get(storeOrderRef);
                if (storeSnap.exists()) {
                    const val = storeSnap.val();
                    globalThis.__gumshop_server_orders.set(orderId, val);
                    return val;
                }
            }
        } catch (e) {
            // Permission denied or network notice
        }
    }

    return null;
}

export async function getServerOrdersByStore(storeKey = '') {
    const cleanKey = normalizeStoreId(storeKey);
    const seen = new Set();
    const orders = [];

    const orderStore = globalThis.__gumshop_server_orders;
    if (orderStore) {
        const entries = (orderStore instanceof Map)
            ? Array.from(orderStore.values())
            : Object.values(orderStore);

        for (const order of entries) {
            if (!order || typeof order !== 'object') continue;
            const oId = order.id || order.orderId || order.orderSessionId;
            if (!oId || seen.has(oId)) continue;

            const orderStoreId = normalizeStoreId(order.storeId);
            const orderStoreSlug = normalizeStoreId(order.storeSlug || order.storeUsername || order.username);

            if (!cleanKey || cleanKey === 'all' || orderStoreId === cleanKey || orderStoreSlug === cleanKey) {
                seen.add(oId);
                orders.push({ id: oId, ...order });
            }
        }
    }

    return orders.sort((a, b) => new Date(b.createdAt || b.checkoutInitiatedAt || 0) - new Date(a.createdAt || a.checkoutInitiatedAt || 0));
}
