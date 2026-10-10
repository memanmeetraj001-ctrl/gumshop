// lib/supabase.js - Zero-Dependency Supabase PostgREST Client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rkdigvwkcbbysuvilkzp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kS8eq_QMEg5qLnsJxAIqCg_eYTuU6uP';

async function postgrestRequest(path, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${path}`;
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=representation',
        ...options.headers
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            cache: 'no-store'
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`Supabase API error (${path}):`, response.status, errText);
            return { data: null, error: errText, status: response.status };
        }

        const data = await response.json().catch(() => null);
        return { data, error: null, status: response.status };
    } catch (err) {
        console.error(`Network error connecting to Supabase (${path}):`, err.message);
        return { data: null, error: err.message, status: 500 };
    }
}

// ================= STORES CRUD =================
export async function dbGetAllStores() {
    const res = await postgrestRequest('stores?select=*&order=created_at.desc');
    if (!res.data || !Array.isArray(res.data)) return [];
    return res.data.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.username,
        username: row.username,
        description: row.data?.description || '',
        logo_url: row.data?.logo_url || '',
        banner_url: row.data?.banner_url || '',
        theme: row.data?.theme || { primary: '#4f46e5', mode: 'dark' },
        is_homepage: Boolean(row.data?.is_homepage || row.data?.isHomepage),
        isHomepage: Boolean(row.data?.is_homepage || row.data?.isHomepage),
        createdAt: row.created_at
    }));
}

export async function dbGetStoreBySlug(slug) {
    if (!slug) return null;
    const cleanSlug = slug.toLowerCase().trim().replace(/^store_/, '');
    const cleanWithPrefix = `store_${cleanSlug}`;
    const res = await postgrestRequest(`stores?or=(username.eq.${cleanSlug},id.eq.${cleanSlug},id.eq.${cleanWithPrefix})&select=*&limit=1`);
    if (res.data && res.data.length > 0) {
        const row = res.data[0];
        const sData = row.data || {};
        const isPhantomStore = row.id?.includes('phantompaws') || row.username?.includes('phantompaws');
        
        let productsList = Array.isArray(sData.products) ? sData.products : [];
        if (isPhantomStore && productsList.length > 0) {
            const p0 = productsList[0];
            if (p0 && (parseFloat(p0.price) !== 52.99 || parseFloat(p0.compareAtPrice) !== 69.99)) {
                productsList = productsList.map((p, idx) => idx === 0 ? {
                    ...p,
                    price: 52.99,
                    compareAtPrice: 69.99,
                    customBundles: [
                        { qty: 1, totalPrice: 52.99, pricePerUnit: 52.99, label: "1 PhantomPaws", badge: null },
                        { qty: 2, totalPrice: 74.62, pricePerUnit: 37.31, label: "2 PhantomPawss", badge: "Two-Pet Household ⭐" },
                        { qty: 3, totalPrice: 96.24, pricePerUnit: 32.08, label: "3 PhantomPawss", badge: "Costume Party Pack 🔥" }
                    ]
                } : p);
                postgrestRequest(`stores?id=eq.${encodeURIComponent(row.id)}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ data: { ...sData, products: productsList } })
                }).catch(() => {});
            }
        }

        return {
            id: row.id,
            name: row.name,
            slug: row.username,
            username: row.username,
            description: sData.description || '',
            logo_url: sData.logo_url || '',
            banner_url: sData.banner_url || '',
            theme: sData.theme || { primary: '#4f46e5', mode: 'dark' },
            is_homepage: Boolean(sData.is_homepage || sData.isHomepage),
            isHomepage: Boolean(sData.is_homepage || sData.isHomepage),
            products: productsList,
            createdAt: row.created_at
        };
    }
    return null;
}

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
        query = `products?or=(store_id.eq.${cleanSlug},store_id.eq.${cleanWithPrefix})&select=*&order=created_at.desc`;
    }
    const res = await postgrestRequest(query);
    if (!res.data || !Array.isArray(res.data)) return [];
    
    return res.data.map(row => {
        const d = row.data || {};
        const isPhantom = row.id?.includes('phantompaws') || row.store_id?.includes('phantompaws') || (row.name && row.name.toLowerCase().includes('headless horseman'));
        
        // Self-heal Supabase PostgreSQL record if outdated price found
        if (isPhantom && (parseFloat(row.price) !== 52.99 || parseFloat(d.price) !== 52.99 || parseFloat(d.compareAtPrice) !== 69.99)) {
            const standardBundles = [
                { qty: 1, totalPrice: 52.99, pricePerUnit: 52.99, label: "1 PhantomPaws", badge: null },
                { qty: 2, totalPrice: 74.62, pricePerUnit: 37.31, label: "2 PhantomPawss", badge: "Two-Pet Household ⭐" },
                { qty: 3, totalPrice: 96.24, pricePerUnit: 32.08, label: "3 PhantomPawss", badge: "Costume Party Pack 🔥" }
            ];
            postgrestRequest(`products?id=eq.${encodeURIComponent(row.id)}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    price: 52.99,
                    data: {
                        ...d,
                        price: 52.99,
                        compareAtPrice: 69.99,
                        customBundles: (Array.isArray(d.customBundles) && d.customBundles.length === 3) ? d.customBundles : standardBundles
                    }
                })
            }).catch(() => {});
        }

        const price = parseFloat(row.price || d.price || 52.99);
        const compareAtPrice = parseFloat(d.compareAtPrice || (price === 52.99 ? 69.99 : Math.round(price * 1.35 * 100) / 100));
        const images = Array.isArray(d.images) && d.images.length > 0 ? d.images : (d.images ? [d.images] : (d.image ? [d.image] : []));
        const image = d.image || images[0] || '';
        const customBundles = (Array.isArray(d.customBundles) && d.customBundles.length > 0) ? d.customBundles : [
            { qty: 1, totalPrice: price, pricePerUnit: price, label: `1 ${row.name || d.name || 'Item'}`, badge: null },
            { qty: 2, totalPrice: Math.round(price * 1.4082075 * 100) / 100, pricePerUnit: Math.round((price * 1.4082075 / 2) * 100) / 100, label: `2 ${row.name || d.name || 'Item'}s`, badge: "Two-Pet Household ⭐" },
            { qty: 3, totalPrice: Math.round(price * 1.81623 * 100) / 100, pricePerUnit: Math.round((price * 1.81623 / 3) * 100) / 100, label: `3 ${row.name || d.name || 'Item'}s`, badge: "Costume Party Pack 🔥" }
        ];

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
        const updatedData = { ...currentData, ...updates };
        const payload = {
            name: updates.title || updates.name || row.name,
            price: updates.price !== undefined ? parseFloat(updates.price) : row.price,
            data: updatedData
        };
        await postgrestRequest(`products?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });
        return { id, ...updatedData };
    }
    return updates;
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
