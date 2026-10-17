// lib/supabase.js - Zero-Dependency High-Performance Supabase PostgREST Client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rkdigvwkcbbysuvilkzp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kS8eq_QMEg5qLnsJxAIqCg_eYTuU6uP';

const legacyCache = new Map();
const LEGACY_CACHE_TTL = 30 * 1000;

async function postgrestRequest(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const url = `${SUPABASE_URL}/rest/v1/${path}`;
    const cacheKey = `${method}:${path}:${options.body || ''}`;

    if (method !== 'GET') {
        legacyCache.clear();
    } else {
        const cached = legacyCache.get(cacheKey);
        if (cached && (Date.now() - cached.time < LEGACY_CACHE_TTL)) {
            return { data: cached.data, error: null, status: 200 };
        }
    }

    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=representation',
        ...options.headers
    };

    try {
        const controller = new AbortController();
        const timeoutMs = options.timeout || 8000;
        const timerId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
            ...options,
            headers,
            cache: 'no-store',
            signal: options.signal || controller.signal
        });
        clearTimeout(timerId);

        if (!response.ok) {
            const errText = await response.text();
            console.error(`Supabase API error (${path}):`, response.status, errText);
            if (legacyCache.has(cacheKey)) {
                return { data: legacyCache.get(cacheKey).data, error: null, status: 200 };
            }
            return { data: null, error: errText, status: response.status };
        }

        const data = await response.json().catch(() => null);
        if (method === 'GET' && data !== null) {
            legacyCache.set(cacheKey, { data, time: Date.now() });
        }
        return { data, error: null, status: response.status };
    } catch (err) {
        console.error(`Network notice connecting to Supabase (${path}):`, err.message);
        if (legacyCache.has(cacheKey)) {
            return { data: legacyCache.get(cacheKey).data, error: null, status: 200 };
        }
        return { data: null, error: err.message, status: 500 };
    }
}

// ================= STORES CRUD =================
export function normalizeStoreSlug(slugOrId) {
    if (!slugOrId) return '';
    return String(slugOrId).toLowerCase().trim().replace(/^store_/, '');
}

export async function dbGetAllStores() {
    const [res, prodsRes] = await Promise.all([
        postgrestRequest('stores?select=*&order=created_at.desc'),
        postgrestRequest('products?select=id,store_id')
    ]);
    if (!res.data || !Array.isArray(res.data)) return [];

    const productCounts = new Map();
    if (prodsRes?.data && Array.isArray(prodsRes.data)) {
        for (const p of prodsRes.data) {
            const rawSlug = normalizeStoreSlug(p.store_id);
            if (rawSlug) {
                productCounts.set(rawSlug, (productCounts.get(rawSlug) || 0) + 1);
                productCounts.set(`store_${rawSlug}`, (productCounts.get(`store_${rawSlug}`) || 0) + 1);
            }
        }
    }

    return res.data
        .filter(row => {
            const id = (row.id || '').toLowerCase();
            const username = (row.username || '').toLowerCase();
            if (id === 'store_live_test' || username === 'live-test') return false;
            if (id.startsWith('store_price_test_') || username.startsWith('price_test_')) return false;
            if (id.startsWith('store_m2_hp_') || username.startsWith('m2-hp-')) return false;
            if (id.startsWith('system_') || username.startsWith('system-') || id === 'system_analytics_fleet') return false;
            return true;
        })
        .map(row => {
            const sData = row.data || {};
            const slug = row.username || normalizeStoreSlug(row.id);
            const resolvedLogo = sData.logo || sData.avatar || sData.logo_url || sData.bioProfile?.avatar || (Array.isArray(sData.products) && sData.products[0]?.image) || '';
            const prods = Array.isArray(sData.products) ? sData.products : [];
            const countedFromDb = productCounts.get(slug) || productCounts.get(`store_${slug}`) || 0;
            const prodsCount = Math.max(
                countedFromDb,
                typeof sData.productsCount === 'number' ? sData.productsCount : 0,
                prods.length
            );
            return {
                ...sData,
                id: row.id,
                name: row.name,
                slug: row.username,
                username: row.username,
                description: sData.description || '',
                logo: resolvedLogo,
                avatar: resolvedLogo,
                logo_url: resolvedLogo,
                banner_url: sData.banner_url || '',
                theme: sData.theme || { primary: '#4f46e5', mode: 'dark' },
                themeColor: sData.themeColor || sData.bioProfile?.themeColor || '#10B981',
                bioProfile: sData.bioProfile || null,
                is_homepage: Boolean(sData.is_homepage || sData.isHomepage),
                isHomepage: Boolean(sData.is_homepage || sData.isHomepage),
                productsCount: prodsCount,
                createdAt: row.created_at
            };
        });
}

export async function dbGetStoreBySlug(slug) {
    if (!slug) return null;
    const cleanSlug = slug.toLowerCase().trim().replace(/^store_/, '');
    const cleanWithPrefix = `store_${cleanSlug}`;
    const res = await postgrestRequest(`stores?or=(username.eq.${cleanSlug},id.eq.${cleanSlug},id.eq.${cleanWithPrefix})&select=*&limit=1`);
    if (res.data && res.data.length > 0) {
        const row = res.data[0];
        const sData = row.data || {};
        let productsList = Array.isArray(sData.products) ? sData.products : [];
        const resolvedLogo = sData.logo || sData.avatar || sData.logo_url || sData.bioProfile?.avatar || (Array.isArray(productsList) && productsList[0]?.image) || '';

        return {
            ...sData,
            id: row.id,
            name: row.name,
            slug: row.username,
            username: row.username,
            description: sData.description || '',
            logo: resolvedLogo,
            avatar: resolvedLogo,
            logo_url: resolvedLogo,
            banner_url: sData.banner_url || '',
            theme: sData.theme || { primary: '#4f46e5', mode: 'dark' },
            themeColor: sData.themeColor || sData.bioProfile?.themeColor || '#10B981',
            bioProfile: sData.bioProfile || null,
            is_homepage: Boolean(sData.is_homepage || sData.isHomepage),
            isHomepage: Boolean(sData.is_homepage || sData.isHomepage),
            products: productsList,
            createdAt: row.created_at
        };
    }

    // Fallback: Resolve from full store list if single query timed out or failed
    try {
        const all = await dbGetAllStores();
        const found = all.find(s => s.username === cleanSlug || s.id === cleanWithPrefix || s.id === cleanSlug);
        if (found) return found;
    } catch (_) {}

    return null;
}

export const dbGetStores = dbGetAllStores;

export async function dbCreateStore(storeData) {
    const cleanSlug = storeData.slug.toLowerCase().trim().replace(/^store_/, '');
    const id = storeData.id || `store_${cleanSlug}`;
    const payload = {
        id,
        username: cleanSlug,
        name: storeData.name || cleanSlug,
        data: {
            id,
            username: cleanSlug,
            name: storeData.name || cleanSlug,
            description: storeData.description || '',
            logo_url: storeData.logo_url || '',
            banner_url: storeData.banner_url || '',
            theme: storeData.theme || { primary: '#4f46e5', mode: 'dark' },
            social_links: storeData.social_links || {},
            currency: storeData.currency || 'USD'
        }
    };

    const res = await postgrestRequest('stores', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(payload)
    });
    
    return {
        id,
        name: storeData.name,
        slug: cleanSlug,
        username: cleanSlug,
        description: storeData.description || '',
        logo_url: storeData.logo_url || '',
        banner_url: storeData.banner_url || '',
        theme: storeData.theme || { primary: '#4f46e5', mode: 'dark' }
    };
}

export async function dbDeleteStore(storeId) {
    if (!storeId) return false;
    const cleanSlug = String(storeId).toLowerCase().trim().replace(/^store_/, '');
    const cleanWithPrefix = `store_${cleanSlug}`;

    // Cascade: delete products for this store first
    await postgrestRequest(`products?or=(store_id.eq.${cleanSlug},store_id.eq.${cleanWithPrefix})`, {
        method: 'DELETE'
    });

    // Delete store
    const res = await postgrestRequest(`stores?or=(id.eq.${cleanSlug},id.eq.${cleanWithPrefix},username.eq.${cleanSlug})`, {
        method: 'DELETE'
    });
    return res.status >= 200 && res.status < 300;
}

// ================= PRODUCTS CRUD =================
export async function dbGetProducts(storeId) {
    let query = 'products?select=*&order=created_at.desc';
    if (storeId) {
        const cleanSlug = String(storeId).toLowerCase().trim().replace(/^store_/, '');
        const cleanWithPrefix = `store_${cleanSlug}`;
        const isPhantomTarget = cleanSlug.includes('phantompaws');
        query = `products?or=(store_id.eq.${cleanSlug},store_id.eq.${cleanWithPrefix}${isPhantomTarget ? ',store_id.ilike.*phantompaws*' : ''})&select=*&order=created_at.desc`;
    }
    const res = await postgrestRequest(query);
    if (!res.data || !Array.isArray(res.data)) return [];
    
    return res.data.map(row => {
        const d = row.data || {};
        const isPhantom = row.id?.includes('phantompaws') || row.store_id?.includes('phantompaws') || (row.name && row.name.toLowerCase().includes('headless horseman'));
        if (isPhantom && !row.price && !d.price && !d.updatedAt) {
            postgrestRequest(`products?id=eq.${encodeURIComponent(row.id)}`, {
                method: 'PATCH',
                body: JSON.stringify({ price: 52.99, data: { ...d, price: 52.99, compareAtPrice: 69.99 } })
            }).catch(() => {});
        }

        const price = parseFloat(row.price || d.price || 52.99);
        const compareAtPrice = parseFloat(d.compareAtPrice || (price === 52.99 ? 69.99 : (price > 0 ? Math.round(price * 1.35 * 100) / 100 : 0)));
        const images = Array.isArray(d.images) && d.images.length > 0 ? d.images : (d.images ? [d.images] : (d.image ? [d.image] : []));
        const image = d.image || images[0] || '';
        const customBundles = (Array.isArray(d.customBundles) && d.customBundles.length > 0) ? d.customBundles : [
            { qty: 1, totalPrice: price, pricePerUnit: price, label: `1 ${row.name || d.name || 'Item'}`, badge: null },
            { qty: 2, totalPrice: Math.round(price * 1.4082075 * 100) / 100, pricePerUnit: Math.round((price * 1.4082075 / 2) * 100) / 100, label: `2 ${row.name || d.name || 'Item'}s`, badge: "Two-Pet Household ⭐" },
            { qty: 3, totalPrice: Math.round(price * 1.81623 * 100) / 100, pricePerUnit: Math.round((price * 1.81623 / 3) * 100) / 100, label: `3 ${row.name || d.name || 'Item'}s`, badge: "Costume Party Pack 🔥" }
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
                    content: rev,
                    author: 'Verified Buyer',
                    name: 'Verified Buyer',
                    rating: 5,
                    badge: 'Verified Buyer',
                    date: 'Recent'
                };
            }
            if (typeof rev === 'object' && rev !== null) {
                const comment = rev.comment || rev.review || rev.text || rev.content || rev.body || '';
                const author = rev.author || rev.user?.name || rev.name || rev.userName || 'Verified Buyer';
                const date = rev.date || (rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent');
                const rating = typeof rev.rating === 'number' ? rev.rating : (typeof rev.stars === 'number' ? rev.stars : 5);
                const badge = rev.badge || (rev.verified !== false ? 'Verified Buyer' : '');
                const avatar = rev.user?.image || rev.avatar || rev.image || '';
                return {
                    ...rev,
                    comment,
                    review: comment,
                    text: comment,
                    author,
                    name: author,
                    date,
                    rating,
                    badge,
                    avatar
                };
            }
            return rev;
        }).filter(r => r && (typeof r === 'object' ? Boolean(r.comment || r.review || r.text) : true));

        return {
            ...d,
            id: row.id,
            store_id: row.store_id,
            storeId: row.store_id,
            title: row.name || d.title || 'Product',
            name: row.name || d.name || 'Product',
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
            inventory_quantity: d.inventory_quantity !== undefined ? d.inventory_quantity : 100,
            is_active: d.is_active !== false,
            category: d.category || 'General',
            gumroad_url: d.gumroad_url || '',
            createdAt: row.created_at
        };
    });
}

export async function dbCreateProduct(productData) {
    const cleanSlug = String(productData.store_id).toLowerCase().trim().replace(/^store_/, '');
    const storeWithPrefix = `store_${cleanSlug}`;
    const id = productData.id || `prod_${cleanSlug}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const title = productData.title || productData.name || 'Product';
    const price = parseFloat(productData.price) || 52.99;
    const compareAtPrice = parseFloat(productData.compareAtPrice || (price === 52.99 ? 69.99 : Math.round(price * 1.35 * 100) / 100));
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
            gumroad_url: productData.gumroad_url || ''
        }
    };

    const res = await postgrestRequest('products', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(payload)
    });

    return {
        id,
        store_id: storeWithPrefix,
        storeId: storeWithPrefix,
        title,
        name: title,
        price,
        compareAtPrice,
        customBundles: productData.customBundles || [],
        image,
        images,
        reviews: productData.reviews || [],
        rating: productData.rating || productData.reviews || [],
        cost_of_goods: cost,
        inventory_quantity: parseInt(productData.inventory_quantity) || 100,
        is_active: productData.is_active !== false,
        category: productData.category || 'General',
        gumroad_url: productData.gumroad_url || ''
    };
}

export async function dbUpdateProduct(id, updates) {
    const existing = await postgrestRequest(`products?id=eq.${id}&limit=1`);
    if (existing.data && existing.data.length > 0) {
        const row = existing.data[0];
        const currentData = row.data || {};
        const updatedData = { ...currentData, ...updates, id };
        const price = updates.price !== undefined ? parseFloat(updates.price) : parseFloat(row.price || currentData.price || 0);
        const name = updates.title || updates.name || row.name || currentData.name || 'Product';
        
        const payload = {
            name,
            price,
            data: updatedData
        };
        await postgrestRequest(`products?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        // Also update parent store's embedded products array in Supabase (skip during bulk batch operations)
        const storeId = row.store_id || currentData.storeId || updates.storeId;
        if (storeId && !updates._skipStoreSync) {
            try {
                const cleanSlug = String(storeId).toLowerCase().trim().replace(/^store_/, '');
                const cleanWithPrefix = `store_${cleanSlug}`;
                const storeRes = await postgrestRequest(`stores?or=(id.eq.${cleanSlug},id.eq.${cleanWithPrefix},username.eq.${cleanSlug})&limit=1`);
                if (storeRes.data && storeRes.data.length > 0) {
                    const storeRow = storeRes.data[0];
                    const sData = storeRow.data || {};
                    if (Array.isArray(sData.products) && sData.products.length > 0) {
                        sData.products = sData.products.map(p => p.id === id ? { ...p, ...updatedData, price, name } : p);
                        await postgrestRequest(`stores?id=eq.${encodeURIComponent(storeRow.id)}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ data: sData })
                        });
                    }
                }
            } catch {}
        }

        return { id, ...updatedData, price, name };
    }
    return updates;
}

export async function dbUpsertProductsBulk(products) {
    if (!Array.isArray(products) || products.length === 0) return [];
    
    const payload = products.map(p => {
        const id = p.id;
        const cleanSlug = String(p.storeId || p.store_id || '').toLowerCase().trim().replace(/^store_/, '');
        const storeWithPrefix = cleanSlug ? `store_${cleanSlug}` : (p.store_id || 'store_default');
        const price = p.price !== undefined ? parseFloat(p.price) : 0;
        const currentData = p.data || p;
        const name = p.name || p.title || currentData.name || currentData.title || 'Product';
        const image = p.image || currentData.image || (Array.isArray(p.images) ? p.images[0] : (Array.isArray(currentData.images) ? currentData.images[0] : ''));
        const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : (Array.isArray(currentData.images) ? currentData.images : (image ? [image] : []));

        const row = {
            id,
            store_id: storeWithPrefix,
            name,
            price,
            data: {
                ...currentData,
                ...p,
                id,
                store_id: storeWithPrefix,
                name,
                price
            }
        };

        if (image) {
            row.data.image = image;
            row.data.images = images;
        }
        return row;
    });

    const res = await postgrestRequest('products', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(payload)
    });

    return res.data || products;
}

export async function dbDeleteProduct(id) {
    const res = await postgrestRequest(`products?id=eq.${id}`, {
        method: 'DELETE'
    });
    return res.status >= 200 && res.status < 300;
}

// ================= RESET ALL DATA =================
export async function dbResetAllData() {
    try {
        await postgrestRequest('products?id=not.is.null', { method: 'DELETE' });
        await postgrestRequest('stores?id=not.is.null', { method: 'DELETE' });
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}
