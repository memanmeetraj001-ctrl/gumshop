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

export function normalizeOrder(row) {
    if (!row) return null;
    const d = row.data || {};
    const storeSlug = normalizeStoreSlug(row.store_id || d.storeId || d.store_id);

    return {
        ...d,
        id: row.id,
        orderId: row.id,
        store_id: formatStoreId(storeSlug),
        storeId: formatStoreId(storeSlug),
        storeSlug,
        total: parseFloat(row.total || d.total || 0),
        status: row.status || d.status || 'paid',
        items: Array.isArray(d.items) ? d.items : [],
        customer: d.customer || {},
        customerEmail: d.customer?.email || d.customerEmail || row.customer_email || '',
        createdAt: row.created_at || d.createdAt || new Date().toISOString()
    };
}

export async function createOrder(orderData) {
    const storeSlug = normalizeStoreSlug(orderData.storeId || orderData.store_id);
    const storeWithPrefix = formatStoreId(storeSlug);
    const id = orderData.id || orderData.orderId || `order_${storeSlug}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const total = parseFloat(orderData.total || orderData.amount || 0);

    const payload = {
        id,
        store_id: storeWithPrefix,
        total,
        status: orderData.status || 'paid',
        customer_email: orderData.customer?.email || orderData.customerEmail || '',
        data: {
            ...orderData,
            id,
            orderId: id,
            store_id: storeWithPrefix,
            storeId: storeWithPrefix,
            storeSlug,
            total,
            status: orderData.status || 'paid',
            createdAt: orderData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    };

    await postgrest('orders', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(payload)
    });

    return normalizeOrder(payload);
}

export async function saveServerOrder(orderId, orderData) {
    return await createOrder({ id: orderId, ...orderData });
}

export async function getOrdersByStore(storeIdOrSlug) {
    const cleanSlug = normalizeStoreSlug(storeIdOrSlug);
    if (!cleanSlug) return [];

    const withPrefix = formatStoreId(cleanSlug);
    const res = await postgrest(`orders?or=(store_id.eq.${encodeURIComponent(cleanSlug)},store_id.eq.${encodeURIComponent(withPrefix)})&select=*&order=created_at.desc`);
    if (!res.data || !Array.isArray(res.data)) return [];

    return res.data.map(normalizeOrder).filter(Boolean);
}

export async function getServerOrdersByStore(storeIdOrSlug) {
    return await getOrdersByStore(storeIdOrSlug);
}

export async function getAllOrders() {
    const res = await postgrest('orders?select=*&order=created_at.desc');
    if (!res.data || !Array.isArray(res.data)) return [];

    return res.data.map(normalizeOrder).filter(Boolean);
}

export async function getOrderById(orderId) {
    if (!orderId) return null;
    const res = await postgrest(`orders?id=eq.${encodeURIComponent(orderId)}&select=*&limit=1`);
    if (res.data && res.data.length > 0) {
        return normalizeOrder(res.data[0]);
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
