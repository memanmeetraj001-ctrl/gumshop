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

// Authoritative Global Flash & Promotional Coupons
const SYSTEM_FLASH_COUPONS = {
    'SAVE25': {
        id: 'coupon_system_save25',
        code: 'SAVE25',
        discount: 25,
        discountType: 'percentage',
        type: 'percentage',
        isActive: true,
        minSpend: 0,
        description: '⚡ EXIT INTENT: Extra 25% OFF Everything With Code SAVE25'
    },
    'SAVE20': {
        id: 'coupon_system_save20',
        code: 'SAVE20',
        discount: 20,
        discountType: 'percentage',
        type: 'percentage',
        isActive: true,
        minSpend: 0,
        description: '⚡ FLASH DEALS: Extra 20% OFF Everything With Code SAVE20'
    },
    'SAVE10': {
        id: 'coupon_system_save10',
        code: 'SAVE10',
        discount: 10,
        discountType: 'percentage',
        type: 'percentage',
        isActive: true,
        minSpend: 0,
        description: 'Welcome 10% Discount'
    },
    'FLASH25': {
        id: 'coupon_system_flash25',
        code: 'FLASH25',
        discount: 25,
        discountType: 'percentage',
        type: 'percentage',
        isActive: true,
        minSpend: 0,
        description: 'Flash 25% Discount'
    },
    'NEW20': {
        id: 'coupon_system_new20',
        code: 'NEW20',
        discount: 20,
        discountType: 'percentage',
        type: 'percentage',
        isActive: true,
        minSpend: 0,
        description: 'New Customer 20% Discount'
    },
    'VIP15': {
        id: 'coupon_system_vip15',
        code: 'VIP15',
        discount: 15,
        discountType: 'percentage',
        type: 'percentage',
        isActive: true,
        minSpend: 0,
        description: 'VIP 15% Discount'
    }
};

export async function getCouponByCode(code, storeIdOrSlug) {
    if (!code) return null;
    const cleanCode = code.toUpperCase().trim();
    const cleanSlug = normalizeStoreSlug(storeIdOrSlug);

    // 1. Check system flash coupons first for instant resolution
    if (SYSTEM_FLASH_COUPONS[cleanCode]) {
        return {
            ...SYSTEM_FLASH_COUPONS[cleanCode],
            storeId: cleanSlug ? formatStoreId(cleanSlug) : null
        };
    }

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
