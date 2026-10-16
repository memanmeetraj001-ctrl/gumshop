/**
 * lib/db/products.js
 * 
 * Authoritative Supabase Product Data Layer.
 * Direct PostgreSQL persistence with ZERO browser localStorage caching.
 * Authoritative price source of truth.
 */

import { postgrest } from './client.js';
import { normalizeStoreSlug, formatStoreId } from './stores.js';

export function normalizeProduct(row) {
    if (!row) return null;
    const d = row.data || {};

    const price = parseFloat(row.price !== undefined && row.price !== null ? row.price : (d.price || 52.99));
    const compareAtPrice = parseFloat(d.compareAtPrice || (price > 0 ? Math.round(price * 1.35 * 100) / 100 : 0));
    const images = Array.isArray(d.images) && d.images.length > 0 ? d.images : (d.images ? [d.images] : (d.image ? [d.image] : []));
    const image = d.image || images[0] || '';

    // Standardized volume bundles (1-pack, 2-pack, 3-pack)
    const customBundles = (Array.isArray(d.customBundles) && d.customBundles.length > 0) ? d.customBundles : [
        { qty: 1, totalPrice: price, pricePerUnit: price, label: `1 ${row.name || d.name || 'Item'}`, badge: null },
        { qty: 2, totalPrice: Math.round(price * 1.4082075 * 100) / 100, pricePerUnit: Math.round((price * 1.4082075 / 2) * 100) / 100, label: `2 ${row.name || d.name || 'Item'}s`, badge: "Two-Pack ⭐" },
        { qty: 3, totalPrice: Math.round(price * 1.81623 * 100) / 100, pricePerUnit: Math.round((price * 1.81623 / 3) * 100) / 100, label: `3 ${row.name || d.name || 'Item'}s`, badge: "Best Value 🔥" }
    ];

    const rawReviews = Array.isArray(d.reviews) && d.reviews.length > 0
        ? d.reviews
        : (Array.isArray(d.rating) && d.rating.length > 0 ? d.rating : []);

    const normalizedReviews = rawReviews.map((rev, idx) => {
        if (typeof rev === 'string') {
            return {
                id: `rev_${idx}`,
                comment: rev,
                review: rev,
                text: rev,
                author: 'Verified Buyer',
                name: 'Verified Buyer',
                rating: 5,
                badge: 'Verified Buyer',
                date: 'Recent'
            };
        }
        if (typeof rev === 'object' && rev !== null) {
            return {
                id: rev.id || `rev_${idx}`,
                comment: rev.comment || rev.review || rev.text || '',
                review: rev.review || rev.comment || rev.text || '',
                text: rev.text || rev.comment || rev.review || '',
                author: rev.author || rev.name || 'Verified Buyer',
                name: rev.name || rev.author || 'Verified Buyer',
                rating: typeof rev.rating === 'number' ? rev.rating : 5,
                badge: rev.badge || 'Verified Buyer',
                date: rev.date || 'Recent'
            };
        }
        return rev;
    }).filter(Boolean);

    const storeSlug = normalizeStoreSlug(row.store_id || d.storeId || d.store_id);

    return {
        ...d,
        id: row.id,
        store_id: formatStoreId(storeSlug),
        storeId: formatStoreId(storeSlug),
        storeSlug,
        title: row.name || d.title || d.name || 'Product',
        name: row.name || d.name || d.title || 'Product',
        slug: d.slug || (row.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: d.description || '',
        price,
        compareAtPrice,
        customBundles,
        image,
        images,
        reviews: normalizedReviews,
        rating: normalizedReviews,
        cost_of_goods: parseFloat(d.cost_of_goods || 0),
        inventory_quantity: d.inventory_quantity !== undefined ? parseInt(d.inventory_quantity) : 100,
        is_active: d.is_active !== false,
        category: d.category || 'General',
        gumroad_url: d.gumroad_url || '',
        createdAt: row.created_at
    };
}

export async function getProductsByStore(storeIdOrSlug) {
    if (!storeIdOrSlug) return [];
    const cleanSlug = normalizeStoreSlug(storeIdOrSlug);
    const withPrefix = formatStoreId(cleanSlug);

    const res = await postgrest(`products?or=(store_id.eq.${encodeURIComponent(cleanSlug)},store_id.eq.${encodeURIComponent(withPrefix)})&select=*&order=created_at.desc`);

    const seen = new Set();
    const result = [];
    if (res.data && Array.isArray(res.data)) {
        for (const row of res.data) {
            const prod = normalizeProduct(row);
            if (!prod) continue;
            const key = (prod.name || prod.title || prod.slug || '').trim().toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                result.push(prod);
            }
        }
    }

    // Safety net: Reconcile any products present in the store record if products table was empty
    if (result.length === 0) {
        try {
            const { getStoreBySlug } = await import('./stores.js');
            const storeRow = await getStoreBySlug(cleanSlug);
            if (storeRow) {
                const storeProds = Array.isArray(storeRow.products) ? storeRow.products : [];
                for (const sp of storeProds) {
                    const nameKey = (sp.name || sp.title || sp.slug || '').trim().toLowerCase();
                    if (!seen.has(nameKey)) {
                        seen.add(nameKey);
                        const price = parseFloat(sp.price || 52.99);
                        result.push({
                            ...sp,
                            id: sp.id || `prod_${cleanSlug}_${nameKey}`,
                            store_id: withPrefix,
                            storeId: withPrefix,
                            storeSlug: cleanSlug,
                            title: sp.name || sp.title || 'Product',
                            name: sp.name || sp.title || 'Product',
                            price
                        });
                    }
                }
            }
        } catch {}
    }

    return result;
}

export async function getAllProductsWithStores() {
    const [prodRes, storeRes] = await Promise.all([
        postgrest('products?select=*&order=created_at.desc&limit=250'),
        postgrest('stores?select=*&order=created_at.desc&limit=100')
    ]);

    const storeMap = {};
    if (storeRes.data && Array.isArray(storeRes.data)) {
        for (const s of storeRes.data) {
            const sData = s.data || {};
            const slug = normalizeStoreSlug(s.username || s.id);
            const name = s.name || sData.name || slug;
            const avatar = sData.logo_url || sData.avatar || '';
            const themeColor = sData.theme?.primary || sData.themeColor || '#4f46e5';
            storeMap[slug] = { name, slug, avatar, themeColor };
            storeMap[`store_${slug}`] = storeMap[slug];
        }
    }

    const seen = new Set();
    const result = [];

    if (prodRes.data && Array.isArray(prodRes.data)) {
        for (const row of prodRes.data) {
            const prod = normalizeProduct(row);
            if (!prod) continue;
            // Exclude test products & test stores from public marketplace view
            const isTest = prod.id?.includes('test') || prod.id?.startsWith('prod_a_') || prod.id?.startsWith('prod_b_') || 
                           prod.id?.startsWith('prod_live_') || prod.id?.startsWith('prod_ch1_') ||
                           prod.storeSlug?.includes('test') || prod.storeId?.includes('test');
            if (isTest) continue;

            // Orphan check: Never render products if their parent store does not exist in active stores
            const sInfo = storeMap[prod.storeSlug] || storeMap[prod.storeId];
            if (!sInfo) continue;

            // Deduplicate per store so duplicate database rows never display duplicate cards
            const storeKey = prod.storeSlug || prod.storeId || 'default';
            const nameKey = (prod.name || prod.title || prod.slug || '').trim().toLowerCase();
            const compositeKey = `${storeKey}:::${nameKey}`;
            if (seen.has(compositeKey)) continue;
            seen.add(compositeKey);

            result.push({
                ...prod,
                storeName: sInfo.name || prod.storeSlug,
                storeAvatar: sInfo.avatar || '',
                storeTheme: sInfo.themeColor || '#4f46e5'
            });
        }
    }

    // Safety net: Reconcile any products present in active store records that were missing in products table
    if (storeRes.data && Array.isArray(storeRes.data)) {
        for (const s of storeRes.data) {
            const sData = s.data || {};
            const slug = normalizeStoreSlug(s.username || s.id);
            if (slug.includes('test')) continue;
            const prods = Array.isArray(sData.products) ? sData.products : [];
            for (const p of prods) {
                const storeKey = slug;
                const nameKey = (p.name || p.title || p.slug || '').trim().toLowerCase();
                const compositeKey = `${storeKey}:::${nameKey}`;
                if (seen.has(compositeKey)) continue;
                seen.add(compositeKey);
                const sInfo = storeMap[slug] || {};
                const price = parseFloat(p.price || 52.99);
                result.push({
                    ...p,
                    id: p.id || `prod_${slug}_${nameKey}`,
                    store_id: formatStoreId(slug),
                    storeId: formatStoreId(slug),
                    storeSlug: slug,
                    title: p.name || p.title || 'Product',
                    name: p.name || p.title || 'Product',
                    price,
                    storeName: sInfo.name || slug,
                    storeAvatar: sInfo.avatar || '',
                    storeTheme: sInfo.themeColor || '#4f46e5'
                });
            }
        }
    }

    return result;
}

export async function getProductById(productId) {
    if (!productId) return null;

    let row = null;
    try {
        const res = await postgrest(`products?id=eq.${encodeURIComponent(productId)}&select=*&limit=1`);
        if (res.data && res.data.length > 0) {
            row = res.data[0];
        }
    } catch (e) {
        console.warn('getProductById lookup notice:', e?.message || e);
    }

    const isHollow = !row || !row.name || row.name === 'Product' || (!row.data?.image && (!row.data?.images || row.data?.images.length === 0));

    if (!isHollow) {
        const prod = normalizeProduct(row);
        // Ensure store details (name, slug, avatar, theme) are attached
        if (!prod.storeName || prod.storeName === 'GumShop' || prod.store_id === 'store_default') {
            try {
                const { getStoreBySlug } = await import('./stores.js');
                const store = await getStoreBySlug(prod.storeSlug);
                if (store) {
                    prod.storeName = store.name || prod.storeName;
                    prod.storeAvatar = store.avatar || store.logo || '';
                    prod.storeTheme = store.themeColor || '#10B981';
                }
            } catch {}
        }
        return prod;
    }

    // Self-healing fallback: Parse store slug directly from productId
    // e.g. "prod_rubber-couch-toys-official-store_1_zqv5" -> "rubber-couch-toys-official-store"
    let targetStoreSlug = '';
    const match = productId.match(/^prod_([a-zA-Z0-9-]+?)(?:_\d+.*)?$/);
    if (match && match[1]) {
        targetStoreSlug = match[1];
    }

    if (targetStoreSlug) {
        try {
            const { getStoreBySlug } = await import('./stores.js');
            const store = await getStoreBySlug(targetStoreSlug);
            if (store && Array.isArray(store.products)) {
                const matched = store.products.find(p => p.id === productId || p.slug === productId || (p.name && p.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-') === productId));
                if (matched && matched.name && matched.name !== 'Product') {
                    const price = parseFloat(matched.price) || 52.99;
                    const cleanSlug = targetStoreSlug.toLowerCase().trim().replace(/^store_/, '');
                    const healedProd = {
                        ...matched,
                        id: productId,
                        storeId: `store_${cleanSlug}`,
                        store_id: `store_${cleanSlug}`,
                        storeSlug: cleanSlug,
                        storeName: store.name || cleanSlug,
                        storeAvatar: store.avatar || store.logo || '',
                        storeTheme: store.themeColor || '#10B981',
                        price
                    };

                    // Trigger non-blocking async self-healing in database
                    postgrest('products', {
                        method: 'POST',
                        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
                        body: JSON.stringify({
                            id: productId,
                            store_id: `store_${cleanSlug}`,
                            name: matched.name,
                            price,
                            data: healedProd
                        })
                    }).catch(() => {});

                    return normalizeProduct({ id: productId, store_id: `store_${cleanSlug}`, name: matched.name, price, data: healedProd });
                }
            }
        } catch (err) {
            console.warn('Self-healing store lookup error:', err);
        }
    }

    const all = await getAllProductsWithStores();
    return all.find(p => p.id === productId || p.slug === productId || p.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '-') === productId) || null;
}


export async function createProduct(productData) {
    const storeSlug = normalizeStoreSlug(productData.store_id || productData.storeId);
    const storeWithPrefix = formatStoreId(storeSlug);
    const id = productData.id || `prod_${storeSlug}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const title = productData.title || productData.name || 'Product';
    const price = parseFloat(productData.price) || 52.99;
    const compareAtPrice = parseFloat(productData.compareAtPrice || (price > 0 ? Math.round(price * 1.35 * 100) / 100 : 0));
    const cost = parseFloat(productData.cost_of_goods) || parseFloat((price * 0.45).toFixed(2));
    const images = Array.isArray(productData.images) && productData.images.length > 0 ? productData.images : (productData.images ? [productData.images] : (productData.image ? [productData.image] : []));
    const image = productData.image || images[0] || '';

    const payload = {
        id,
        store_id: storeWithPrefix,
        name: title,
        price,
        data: {
            ...productData,
            id,
            store_id: storeWithPrefix,
            storeId: storeWithPrefix,
            title,
            name: title,
            slug: productData.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: productData.description || '',
            price,
            compareAtPrice,
            customBundles: productData.customBundles || [],
            cost_of_goods: cost,
            inventory_quantity: parseInt(productData.inventory_quantity) || 100,
            is_active: productData.is_active !== false,
            images,
            image,
            category: productData.category || 'General',
            gumroad_url: productData.gumroad_url || '',
            updatedAt: new Date().toISOString()
        }
    };

    await postgrest('products', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(payload)
    });

    // Mirror to parent store's embedded products array in Supabase
    try {
        const storeRes = await postgrest(`stores?or=(id.eq.${encodeURIComponent(storeSlug)},id.eq.${encodeURIComponent(storeWithPrefix)},username.eq.${encodeURIComponent(storeSlug)})&limit=1`);
        if (storeRes.data && storeRes.data.length > 0) {
            const storeRow = storeRes.data[0];
            const sData = storeRow.data || {};
            const existingProds = Array.isArray(sData.products) ? sData.products : [];
            const updatedProds = [...existingProds.filter(p => p.id !== id), payload.data];
            await postgrest(`stores?id=eq.${encodeURIComponent(storeRow.id)}`, {
                method: 'PATCH',
                body: JSON.stringify({ data: { ...sData, products: updatedProds } })
            });
        }
    } catch {}

    return normalizeProduct(payload);
}

export async function createProductsBatch(productsArray) {
    if (!Array.isArray(productsArray) || productsArray.length === 0) return [];

    const CHUNK_SIZE = 25;
    const inserted = [];

    for (let i = 0; i < productsArray.length; i += CHUNK_SIZE) {
        const chunk = productsArray.slice(i, i + CHUNK_SIZE);
        const payloads = chunk.map(productData => {
            const rawSlug = productData.storeId || productData.store_id || productData.storeSlug || 'default';
            const storeSlug = normalizeStoreSlug(rawSlug);
            const storeWithPrefix = formatStoreId(storeSlug);
            const price = parseFloat(productData.price || 52.99);
            const cost = parseFloat(productData.cost_of_goods || (price * 0.45));
            const images = Array.isArray(productData.images) && productData.images.length > 0 
                ? productData.images 
                : (productData.image ? [productData.image] : []);
            const image = productData.image || images[0] || '';
            const id = productData.id || `prod_${storeSlug}_${Math.random().toString(36).substring(2, 7)}`;

            return {
                id,
                store_id: storeWithPrefix,
                name: productData.name || productData.title || 'Product',
                price,
                data: {
                    ...productData,
                    id,
                    store_id: storeWithPrefix,
                    storeId: storeWithPrefix,
                    storeSlug,
                    name: productData.name || productData.title || 'Product',
                    title: productData.title || productData.name || 'Product',
                    price,
                    cost_of_goods: cost,
                    inventory_quantity: parseInt(productData.inventory_quantity) || 100,
                    is_active: productData.is_active !== false,
                    images,
                    image,
                    category: productData.category || 'General',
                    gumroad_url: productData.gumroad_url || '',
                    updatedAt: new Date().toISOString()
                }
            };
        });

        await postgrest('products', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(payloads)
        });
        inserted.push(...payloads.map(normalizeProduct));
    }

    return inserted;
}

export async function updateProduct(productId, updates) {
    if (!productId) return null;
    const existing = await getProductById(productId);

    // If product does not exist yet, treat update as upsert creation
    if (!existing) {
        return await createProduct({ id: productId, ...updates });
    }

    const price = updates.price !== undefined ? parseFloat(updates.price) : existing.price;
    const name = updates.title || updates.name || existing.name;
    const mergedData = {
        ...existing,
        ...updates,
        id: productId,
        price,
        name,
        title: name,
        updatedAt: new Date().toISOString()
    };

    // Calculate bundle prices if price changed
    if (updates.price !== undefined && (!updates.customBundles || updates.customBundles.length === 0)) {
        mergedData.customBundles = [
            { qty: 1, totalPrice: price, pricePerUnit: price, label: `1 ${name}`, badge: null },
            { qty: 2, totalPrice: Math.round(price * 1.4082075 * 100) / 100, pricePerUnit: Math.round((price * 1.4082075 / 2) * 100) / 100, label: `2 ${name}s`, badge: "Two-Pack ⭐" },
            { qty: 3, totalPrice: Math.round(price * 1.81623 * 100) / 100, pricePerUnit: Math.round((price * 1.81623 / 3) * 100) / 100, label: `3 ${name}s`, badge: "Best Value 🔥" }
        ];
    }

    const payload = {
        name,
        price,
        data: mergedData
    };
    if (updates.store_id || updates.storeId) {
        const newStoreSlug = normalizeStoreSlug(updates.store_id || updates.storeId);
        payload.store_id = formatStoreId(newStoreSlug);
        mergedData.store_id = payload.store_id;
        mergedData.storeId = payload.store_id;
    }

    await postgrest(`products?id=eq.${encodeURIComponent(productId)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });

    // Update parent store record in Supabase
    const storeSlug = normalizeStoreSlug(existing.store_id || existing.storeId);
    if (storeSlug) {
        try {
            const storeWithPrefix = formatStoreId(storeSlug);
            const storeRes = await postgrest(`stores?or=(id.eq.${encodeURIComponent(storeSlug)},id.eq.${encodeURIComponent(storeWithPrefix)},username.eq.${encodeURIComponent(storeSlug)})&limit=1`);
            if (storeRes.data && storeRes.data.length > 0) {
                const storeRow = storeRes.data[0];
                const sData = storeRow.data || {};
                if (Array.isArray(sData.products)) {
                    sData.products = sData.products.map(p => p.id === productId ? { ...p, ...mergedData } : p);
                    await postgrest(`stores?id=eq.${encodeURIComponent(storeRow.id)}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ data: sData })
                    });
                }
            }
        } catch {}
    }

    return normalizeProduct({ id: productId, ...payload });
}

export async function deleteProduct(productId) {
    if (!productId) return false;
    const existing = await getProductById(productId);

    const res = await postgrest(`products?id=eq.${encodeURIComponent(productId)}`, {
        method: 'DELETE'
    });

    // Also remove from parent store's products array
    if (existing) {
        const storeSlug = normalizeStoreSlug(existing.store_id || existing.storeId);
        if (storeSlug) {
            try {
                const storeWithPrefix = formatStoreId(storeSlug);
                const storeRes = await postgrest(`stores?or=(id.eq.${encodeURIComponent(storeSlug)},id.eq.${encodeURIComponent(storeWithPrefix)},username.eq.${encodeURIComponent(storeSlug)})&limit=1`);
                if (storeRes.data && storeRes.data.length > 0) {
                    const storeRow = storeRes.data[0];
                    const sData = storeRow.data || {};
                    if (Array.isArray(sData.products)) {
                        sData.products = sData.products.filter(p => p.id !== productId);
                        await postgrest(`stores?id=eq.${encodeURIComponent(storeRow.id)}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ data: sData })
                        });
                    }
                }
            } catch {}
        }
    }

    return res.status >= 200 && res.status < 300;
}
