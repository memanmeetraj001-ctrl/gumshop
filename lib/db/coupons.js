/**
 * lib/db/coupons.js
 * 
 * Authoritative Supabase Coupons Layer.
 * Direct PostgreSQL persistence with ZERO browser localStorage caching.
 */

import { postgrest } from './client.js';
import { normalizeStoreSlug, formatStoreId } from './stores.js';

export async function getCouponsByStore(storeIdOrSlug) {
    const cleanSlug = normalizeStoreSlug(storeIdOrSlug);
    if (!cleanSlug) return [];

    const withPrefix = formatStoreId(cleanSlug);
    const res = await postgrest(`coupons?or=(store_id.eq.${encodeURIComponent(cleanSlug)},store_id.eq.${encodeURIComponent(withPrefix)})&select=*&order=created_at.desc`);
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map(row => {
            const d = row.data || {};
            return {
                ...d,
                id: row.id,
                code: (row.code || d.code || '').toUpperCase().trim(),
                discount: parseFloat(row.discount || d.discount || 0),
                discountType: d.discountType || 'percentage',
                store_id: formatStoreId(cleanSlug),
                storeId: formatStoreId(cleanSlug),
                usageCount: parseInt(d.usageCount || row.usage_count || 0),
                maxUses: d.maxUses !== undefined ? parseInt(d.maxUses) : null,
                isActive: d.isActive !== false,
                createdAt: row.created_at
            };
        });
    }

    // Fallback: read from store record
    try {
        const storeRes = await postgrest(`stores?or=(id.eq.${encodeURIComponent(cleanSlug)},id.eq.${encodeURIComponent(withPrefix)},username.eq.${encodeURIComponent(cleanSlug)})&limit=1`);
        if (storeRes.data && storeRes.data.length > 0) {
            const sData = storeRes.data[0].data || {};
            if (Array.isArray(sData.coupons)) {
                return sData.coupons;
            }
        }
    } catch {}

    return [];
}

export async function getCouponByCode(code, storeIdOrSlug) {
    if (!code) return null;
    const cleanCode = code.toUpperCase().trim();
    const cleanSlug = normalizeStoreSlug(storeIdOrSlug);

    let query = `coupons?code=eq.${encodeURIComponent(cleanCode)}&limit=1`;
    if (cleanSlug) {
        const withPrefix = formatStoreId(cleanSlug);
        query = `coupons?code=eq.${encodeURIComponent(cleanCode)}&or=(store_id.eq.${encodeURIComponent(cleanSlug)},store_id.eq.${encodeURIComponent(withPrefix)})&limit=1`;
    }

    const res = await postgrest(query);
    if (res.data && res.data.length > 0) {
        const row = res.data[0];
        const d = row.data || {};
        return {
            ...d,
            id: row.id,
            code: cleanCode,
            discount: parseFloat(row.discount || d.discount || 0),
            discountType: d.discountType || 'percentage',
            store_id: row.store_id,
            usageCount: parseInt(d.usageCount || row.usage_count || 0),
            maxUses: d.maxUses !== undefined ? parseInt(d.maxUses) : null,
            isActive: d.isActive !== false
        };
    }

    // Fallback: search store records
    try {
        const queryStores = cleanSlug 
            ? `stores?or=(id.eq.${encodeURIComponent(cleanSlug)},username.eq.${encodeURIComponent(cleanSlug)})&limit=1`
            : 'stores?select=*';
        const storeRes = await postgrest(queryStores);
        if (storeRes.data && Array.isArray(storeRes.data)) {
            for (const row of storeRes.data) {
                const sData = row.data || {};
                const found = (sData.coupons || []).find(c => (c.code || '').toUpperCase() === cleanCode);
                if (found) return found;
            }
        }
    } catch {}

    return null;
}

export async function createCoupon(couponData) {
    const storeSlug = normalizeStoreSlug(couponData.storeId || couponData.store_id);
    const storeWithPrefix = formatStoreId(storeSlug);
    const code = (couponData.code || '').toUpperCase().trim();
    const id = `coupon_${storeSlug}_${code}`;

    const normalized = {
        ...couponData,
        id,
        code,
        store_id: storeWithPrefix,
        storeId: storeWithPrefix,
        usageCount: 0,
        isActive: true,
        createdAt: new Date().toISOString()
    };

    const payload = {
        id,
        store_id: storeWithPrefix,
        code,
        discount: parseFloat(couponData.discount || 0),
        data: normalized
    };

    const res = await postgrest('coupons', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(payload)
    });

    // Fallback: persist inside store record
    if (res.error || res.status === 404) {
        try {
            const storeRes = await postgrest(`stores?or=(id.eq.${encodeURIComponent(storeSlug)},id.eq.${encodeURIComponent(storeWithPrefix)},username.eq.${encodeURIComponent(storeSlug)})&limit=1`);
            if (storeRes.data && storeRes.data.length > 0) {
                const storeRow = storeRes.data[0];
                const sData = storeRow.data || {};
                const existingCoupons = Array.isArray(sData.coupons) ? sData.coupons : [];
                const updatedCoupons = [normalized, ...existingCoupons.filter(c => (c.code || '').toUpperCase() !== code)];

                await postgrest(`stores?id=eq.${encodeURIComponent(storeRow.id)}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        data: {
                            ...sData,
                            coupons: updatedCoupons
                        }
                    })
                });
            }
        } catch (e) {
            console.warn('Store-level coupon backup notice:', e.message);
        }
    }

    return normalized;
}

export async function incrementCouponUsage(code, storeIdOrSlug) {
    const coupon = await getCouponByCode(code, storeIdOrSlug);
    if (!coupon) return false;

    const newUsage = (coupon.usageCount || 0) + 1;
    const updatedData = { ...coupon, usageCount: newUsage };

    await postgrest(`coupons?id=eq.${encodeURIComponent(coupon.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
            usage_count: newUsage,
            data: updatedData
        })
    });

    return true;
}

export async function deleteCoupon(code, storeIdOrSlug) {
    const coupon = await getCouponByCode(code, storeIdOrSlug);
    if (!coupon) return false;

    const res = await postgrest(`coupons?id=eq.${encodeURIComponent(coupon.id)}`, {
        method: 'DELETE'
    });

    return res.status >= 200 && res.status < 300;
}
