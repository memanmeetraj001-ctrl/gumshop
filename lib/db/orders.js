/**
 * lib/db/orders.js
 * 
 * Authoritative Supabase Orders Layer.
 * Direct PostgreSQL persistence with ZERO browser localStorage caching.
 * Provides idempotent order tracking and verification.
 */

import { postgrest } from './client.js';
import { normalizeStoreSlug, formatStoreId } from './stores.js';

const _processedSales = new Map();
const _fallbackOrders = new Map();
let _ordersTableAvailable = null; // null = untested, true = exists, false = missing

export function normalizeOrder(row) {
    if (!row) return null;
    const d = row.data || {};
    const storeSlug = normalizeStoreSlug(row.store_id || d.storeId || d.store_id);

    const isPaid = typeof d.isPaid === 'boolean'
        ? d.isPaid
        : (d.paymentStatus === 'PAID' || row.status === 'paid' || d.status === 'paid');

    const paymentStatus = d.paymentStatus || (isPaid ? 'PAID' : (d.status === 'unpaid' || row.status === 'unpaid' ? 'CHECKOUT_STARTED' : 'PENDING'));
    const fulfillmentStatus = d.fulfillmentStatus || (row.status === 'delivered' ? 'DELIVERED' : row.status === 'shipped' ? 'SHIPPED' : (isPaid ? 'PROCESSING' : 'UNFULFILLED'));

    let status = row.status || d.status;
    if (!status || status === 'paid') {
        status = isPaid ? 'processing' : 'unpaid';
    }

    return {
        ...d,
        id: row.id,
        orderId: row.id,
        store_id: formatStoreId(storeSlug),
        storeId: formatStoreId(storeSlug),
        storeSlug,
        total: parseFloat(row.total || d.total || 0),
        status,
        paymentStatus,
        fulfillmentStatus,
        isPaid,
        items: Array.isArray(d.items) ? d.items : (typeof d.items === 'string' ? d.items : []),
        customer: d.customer || {},
        customerEmail: d.customer?.email || d.customerEmail || row.customer_email || '',
        createdAt: row.created_at || d.createdAt || d.checkoutInitiatedAt || new Date().toISOString()
    };
}

export async function createOrder(orderData) {
    const storeSlug = normalizeStoreSlug(orderData.storeId || orderData.store_id);
    const storeWithPrefix = formatStoreId(storeSlug);
    const id = orderData.id || orderData.orderId || `order_${storeSlug}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const total = parseFloat(orderData.total || orderData.amount || 0);

    const isPaid = typeof orderData.isPaid === 'boolean'
        ? orderData.isPaid
        : (orderData.paymentStatus === 'PAID' || orderData.status === 'paid');

    const paymentStatus = orderData.paymentStatus || (isPaid ? 'PAID' : 'CHECKOUT_STARTED');
    const fulfillmentStatus = orderData.fulfillmentStatus || (isPaid ? 'PROCESSING' : 'UNFULFILLED');
    const status = orderData.status || (isPaid ? 'processing' : 'unpaid');

    const normalizedItem = {
        ...orderData,
        id,
        orderId: id,
        store_id: storeWithPrefix,
        storeId: storeWithPrefix,
        storeSlug,
        total,
        status,
        paymentStatus,
        fulfillmentStatus,
        isPaid,
        customer_email: orderData.customer?.email || orderData.customerEmail || '',
        createdAt: orderData.createdAt || orderData.checkoutInitiatedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const payload = {
        id,
        store_id: storeWithPrefix,
        total,
        status,
        customer_email: orderData.customer?.email || orderData.customerEmail || '',
        data: normalizedItem
    };

    let res = null;
    if (_ordersTableAvailable !== false) {
        res = await postgrest('orders', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(payload)
        });
        if (res.status === 404 || (typeof res.error === 'string' && res.error.includes('PGRST205'))) {
            _ordersTableAvailable = false;
        } else if (res.status < 400) {
            _ordersTableAvailable = true;
        }
    }

    // If orders table is missing in Supabase schema, persist directly inside the store record
    if (!res || res.error || res.status === 404) {
        try {
            const storeRes = await postgrest(`stores?or=(id.eq.${encodeURIComponent(storeSlug)},id.eq.${encodeURIComponent(storeWithPrefix)},username.eq.${encodeURIComponent(storeSlug)})&limit=1`);
            if (storeRes.data && storeRes.data.length > 0) {
                const storeRow = storeRes.data[0];
                const sData = storeRow.data || {};
                const existingOrders = Array.isArray(sData.orders) ? sData.orders : [];
                const updatedOrders = [normalizedItem, ...existingOrders.filter(o => o.id !== id)];
                
                await postgrest(`stores?id=eq.${encodeURIComponent(storeRow.id)}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        data: {
                            ...sData,
                            orders: updatedOrders
                        }
                    })
                });
            }
        } catch (e) {
            console.warn('Store-level order backup notice:', e.message);
        }
    }

    _fallbackOrders.set(id, normalizedItem);

    return normalizeOrder(payload);
}

export async function updateOrder(orderId, updates) {
    if (!orderId || !updates) return null;

    // 1. Try updating PostgreSQL orders table if available
    if (_ordersTableAvailable !== false) {
        try {
            const patchRes = await postgrest(`orders?id=eq.${encodeURIComponent(orderId)}`, {
                method: 'PATCH',
                headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify(updates)
            });
            if (patchRes.status === 404 || (typeof patchRes.error === 'string' && patchRes.error.includes('PGRST205'))) {
                _ordersTableAvailable = false;
            } else if (patchRes.data && patchRes.data.length > 0) {
                return normalizeOrder(patchRes.data[0]);
            }
        } catch {}
    }

    // 2. Fallback: update in stores table
    try {
        const allStores = await postgrest('stores?id=not.like.system*&select=id,name,username,data');
        if (allStores.data && Array.isArray(allStores.data)) {
            for (const store of allStores.data) {
                const sData = store.data || {};
                const orders = sData.orders;
                if (Array.isArray(orders) && orders.some(o => o.id === orderId || o.orderId === orderId)) {
                    const updatedOrders = orders.map(o => {
                        if (o.id === orderId || o.orderId === orderId) {
                            return { ...o, ...updates, updatedAt: new Date().toISOString() };
                        }
                        return o;
                    });

                    await postgrest(`stores?id=eq.${encodeURIComponent(store.id)}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                            data: {
                                ...sData,
                                orders: updatedOrders
                            }
                        })
                    });

                    const updated = updatedOrders.find(o => o.id === orderId || o.orderId === orderId);
                    return normalizeOrder({ id: orderId, store_id: store.id, data: updated });
                }
            }
        }
    } catch (e) {
        console.warn('Fallback store order update error:', e.message);
    }

    return null;
}

export async function saveServerOrder(orderId, orderData) {
    return await createOrder({ id: orderId, ...orderData });
}

export async function getOrdersByStore(storeIdOrSlug) {
    const cleanSlug = normalizeStoreSlug(storeIdOrSlug);
    if (!cleanSlug) return [];

    const withPrefix = formatStoreId(cleanSlug);
    if (_ordersTableAvailable !== false) {
        try {
            const res = await postgrest(`orders?or=(store_id.eq.${encodeURIComponent(cleanSlug)},store_id.eq.${encodeURIComponent(withPrefix)})&select=*&order=created_at.desc`);
            if (res.status === 404 || (typeof res.error === 'string' && res.error.includes('PGRST205'))) {
                _ordersTableAvailable = false;
            } else if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                _ordersTableAvailable = true;
                return res.data.map(normalizeOrder).filter(Boolean);
            }
        } catch {}
    }

    // Fallback: read orders directly from store record in stores table
    try {
        const storeRes = await postgrest(`stores?or=(id.eq.${encodeURIComponent(cleanSlug)},id.eq.${encodeURIComponent(withPrefix)},username.eq.${encodeURIComponent(cleanSlug)})&limit=1`);
        if (storeRes.data && storeRes.data.length > 0) {
            const sData = storeRes.data[0].data || {};
            if (Array.isArray(sData.orders) && sData.orders.length > 0) {
                return sData.orders.map(o => normalizeOrder({ id: o.id, store_id: withPrefix, data: o }));
            }
        }
    } catch {}

    // Fallback 2: read from in-memory fallback orders
    const memOrders = Array.from(_fallbackOrders.values())
        .filter(o => {
            const oSlug = normalizeStoreSlug(o.storeId || o.store_id || o.storeSlug);
            return oSlug === cleanSlug || o.store_id === withPrefix || o.storeId === withPrefix;
        })
        .map(o => normalizeOrder({ id: o.id, store_id: withPrefix, data: o }));
    if (memOrders.length > 0) {
        return memOrders;
    }

    return [];
}

export async function getServerOrdersByStore(storeIdOrSlug) {
    return await getOrdersByStore(storeIdOrSlug);
}

export async function getAllOrders() {
    if (_ordersTableAvailable !== false) {
        try {
            const res = await postgrest('orders?select=*&order=created_at.desc');
            if (res.status === 404 || (typeof res.error === 'string' && res.error.includes('PGRST205'))) {
                _ordersTableAvailable = false;
            } else if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                _ordersTableAvailable = true;
                return res.data.map(normalizeOrder).filter(Boolean);
            }
        } catch {}
    }

    // Fallback: aggregate from all stores
    try {
        const allStores = await postgrest('stores?id=not.like.system*&select=id,name,username,data');
        if (allStores.data && Array.isArray(allStores.data)) {
            const aggregated = [];
            for (const row of allStores.data) {
                const sData = row.data || {};
                if (Array.isArray(sData.orders)) {
                    sData.orders.forEach(o => {
                        aggregated.push(normalizeOrder({ id: o.id, store_id: row.id, data: o }));
                    });
                }
            }
            return aggregated;
        }
    } catch {}

    return [];
}

export async function getOrderById(orderId) {
    if (!orderId) return null;

    if (_ordersTableAvailable !== false) {
        try {
            const res = await postgrest(`orders?id=eq.${encodeURIComponent(orderId)}&select=*&limit=1`);
            if (res.status === 404 || (typeof res.error === 'string' && res.error.includes('PGRST205'))) {
                _ordersTableAvailable = false;
            } else if (res.data && res.data.length > 0) {
                _ordersTableAvailable = true;
                return normalizeOrder(res.data[0]);
            }
        } catch {}
    }

    // Fallback: search store records for this order ID
    try {
        const allStores = await postgrest('stores?id=not.like.system*&select=id,name,username,data');
        if (allStores.data && Array.isArray(allStores.data)) {
            for (const row of allStores.data) {
                const sData = row.data || {};
                const found = (sData.orders || []).find(o => o.id === orderId || o.orderId === orderId);
                if (found) {
                    return normalizeOrder({ id: found.id, store_id: row.id, data: found });
                }
            }
        }
    } catch {}

    if (_fallbackOrders.has(orderId)) {
        const found = _fallbackOrders.get(orderId);
        return normalizeOrder({ id: found.id, store_id: found.store_id || found.storeId, data: found });
    }

    return null;
}

export async function getServerOrder(orderId) {
    return await getOrderById(orderId);
}

// ─── Deduplication Helpers ───
export async function isSaleProcessed(saleId) {
    if (!saleId) return false;
    return _processedSales.has(String(saleId));
}

export async function markSaleProcessed(saleId, orderId) {
    if (!saleId) return;
    _processedSales.set(String(saleId), { orderId, processedAt: new Date().toISOString() });
}

// ─── Deletion Helpers ───
export async function deleteServerOrder(orderId, storeSlug = '') {
    if (!orderId) return { success: false, error: 'orderId is required' };
    
    // 1. Delete from PostgreSQL orders table
    if (_ordersTableAvailable !== false) {
        try {
            const delRes = await postgrest(`orders?id=eq.${encodeURIComponent(orderId)}`, {
                method: 'DELETE'
            });
            if (delRes.status === 404 || (typeof delRes.error === 'string' && delRes.error.includes('PGRST205'))) {
                _ordersTableAvailable = false;
            }
        } catch (e) {
            console.warn('Postgrest order delete error:', e);
        }
    }

    // 2. Delete from parent store's data.orders array if stored embedded
    try {
        const cleanSlug = normalizeStoreSlug(storeSlug);
        const storeWithPrefix = formatStoreId(cleanSlug);
        const query = cleanSlug 
            ? `stores?or=(id.eq.${encodeURIComponent(cleanSlug)},id.eq.${encodeURIComponent(storeWithPrefix)},username.eq.${encodeURIComponent(cleanSlug)})&limit=1`
            : 'stores?select=*';
        
        const storeRes = await postgrest(query);
        if (storeRes.data && Array.isArray(storeRes.data)) {
            for (const storeRow of storeRes.data) {
                const sData = storeRow.data || {};
                if (Array.isArray(sData.orders) && sData.orders.some(o => o.id === orderId || o.orderId === orderId)) {
                    const remainingOrders = sData.orders.filter(o => o.id !== orderId && o.orderId !== orderId);
                    await postgrest(`stores?id=eq.${encodeURIComponent(storeRow.id)}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                            data: { ...sData, orders: remainingOrders }
                        })
                    });
                }
            }
        }
    } catch (e) {
        console.warn('Store embedded order delete error:', e);
    }

    // 3. Remove from in-memory fallback cache
    if (_fallbackOrders.has(orderId)) {
        _fallbackOrders.delete(orderId);
    }

    return { success: true, orderId };
}

export async function deleteUnpaidServerOrders(storeSlug = '') {
    const cleanSlug = normalizeStoreSlug(storeSlug);
    const storeWithPrefix = formatStoreId(cleanSlug);

    let deletedCount = 0;

    // 1. Delete unpaid from PostgreSQL orders table
    if (_ordersTableAvailable !== false) {
        try {
            let query = 'orders?or=(status.eq.unpaid,status.eq.checkout_started,status.ilike.*unpaid*)&select=id';
            if (cleanSlug) {
                query = `orders?or=(store_id.eq.${encodeURIComponent(cleanSlug)},store_id.eq.${encodeURIComponent(storeWithPrefix)})&or=(status.eq.unpaid,status.eq.checkout_started,status.ilike.*unpaid*)&select=id`;
            }
            const res = await postgrest(query);
            if (res.status === 404 || (typeof res.error === 'string' && res.error.includes('PGRST205'))) {
                _ordersTableAvailable = false;
            } else if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                const idsToDelete = res.data.map(r => r.id);
                for (const id of idsToDelete) {
                    await postgrest(`orders?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
                    deletedCount++;
                }
            }
        } catch (e) {
            console.warn('Postgrest unpaid delete error:', e);
        }
    }

    // 2. Delete unpaid from parent store data.orders array
    try {
        const query = cleanSlug 
            ? `stores?or=(id.eq.${encodeURIComponent(cleanSlug)},id.eq.${encodeURIComponent(storeWithPrefix)},username.eq.${encodeURIComponent(cleanSlug)})&limit=1`
            : 'stores?select=*';
        
        const storeRes = await postgrest(query);
        if (storeRes.data && Array.isArray(storeRes.data)) {
            for (const storeRow of storeRes.data) {
                const sData = storeRow.data || {};
                if (Array.isArray(sData.orders)) {
                    const originalCount = sData.orders.length;
                    const remainingOrders = sData.orders.filter(o => {
                        const isPaid = o.isPaid === true || o.paymentStatus === 'PAID' || o.status === 'paid';
                        return isPaid;
                    });
                    if (remainingOrders.length !== originalCount) {
                        deletedCount += (originalCount - remainingOrders.length);
                        await postgrest(`stores?id=eq.${encodeURIComponent(storeRow.id)}`, {
                            method: 'PATCH',
                            body: JSON.stringify({
                                data: { ...sData, orders: remainingOrders }
                            })
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.warn('Store embedded unpaid orders delete error:', e);
    }

    // 3. Clear from in-memory fallback
    for (const [id, ord] of _fallbackOrders.entries()) {
        const oSlug = normalizeStoreSlug(ord.storeSlug || ord.storeId || ord.store_id);
        if (!cleanSlug || oSlug === cleanSlug) {
            const isPaid = ord.isPaid === true || ord.paymentStatus === 'PAID';
            if (!isPaid) {
                _fallbackOrders.delete(id);
                deletedCount++;
            }
        }
    }

    return { success: true, deletedCount };
}
