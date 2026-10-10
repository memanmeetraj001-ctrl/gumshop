// scripts/sync_db_price_m1.js
// Authoritative database synchronization for Milestone 1

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rkdigvwkcbbysuvilkzp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kS8eq_QMEg5qLnsJxAIqCg_eYTuU6uP';

async function postgrest(path, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${path}`;
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=representation',
        ...options.headers
    };

    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let json = null;
    try {
        json = JSON.parse(text);
    } catch {}
    return { ok: res.ok, status: res.status, data: json, raw: text };
}

async function run() {
    console.log('--- 1. Fetching current products ---');
    const prodRes = await postgrest('products?select=*');
    if (!prodRes.ok) {
        console.error('Failed to fetch products:', prodRes.status, prodRes.raw);
        process.exit(1);
    }
    console.log(`Found ${prodRes.data.length} products.`);

    const targetProducts = prodRes.data.filter(p => 
        p.id.includes('phantompaws') || 
        (p.store_id && p.store_id.includes('phantompaws')) ||
        (p.name && p.name.toLowerCase().includes('headless horseman'))
    );
    console.log(`Found ${targetProducts.length} matching PhantomPaws product(s).`);

    for (const prod of targetProducts) {
        console.log(`Updating product: ${prod.id} (current price: ${prod.price})`);
        const currentData = prod.data || {};
        
        // Ensure custom bundles are exact
        const customBundles = [
            {
                qty: 1,
                totalPrice: 52.99,
                pricePerUnit: 52.99,
                label: "1 PhantomPaws",
                badge: null
            },
            {
                qty: 2,
                totalPrice: 74.62,
                pricePerUnit: 37.31,
                label: "2 PhantomPawss",
                badge: "Two-Pet Household ⭐"
            },
            {
                qty: 3,
                totalPrice: 96.24,
                pricePerUnit: 32.08,
                label: "3 PhantomPawss",
                badge: "Costume Party Pack 🔥"
            }
        ];

        const updatedData = {
            ...currentData,
            price: 52.99,
            compareAtPrice: 69.99,
            customBundles
        };

        const patchPayload = {
            price: 52.99,
            data: updatedData
        };

        const patchRes = await postgrest(`products?id=eq.${encodeURIComponent(prod.id)}`, {
            method: 'PATCH',
            body: JSON.stringify(patchPayload)
        });

        if (!patchRes.ok) {
            console.error(`Failed to patch product ${prod.id}:`, patchRes.status, patchRes.raw);
        } else {
            console.log(`Successfully patched product ${prod.id}: price=52.99, data.price=52.99, compareAtPrice=69.99`);
        }
    }

    console.log('\n--- 2. Fetching current stores ---');
    const storeRes = await postgrest('stores?select=*');
    if (!storeRes.ok) {
        console.error('Failed to fetch stores:', storeRes.status, storeRes.raw);
        process.exit(1);
    }
    console.log(`Found ${storeRes.data.length} stores.`);

    const targetStores = storeRes.data.filter(s =>
        s.id.includes('phantompaws') ||
        (s.username && s.username.includes('phantompaws'))
    );
    console.log(`Found ${targetStores.length} matching PhantomPaws store(s).`);

    for (const st of targetStores) {
        console.log(`Updating store: ${st.id} (${st.username})`);
        const sData = st.data || {};
        let productsList = Array.isArray(sData.products) ? [...sData.products] : [];

        if (productsList.length > 0) {
            productsList = productsList.map((p, idx) => {
                if (idx === 0 || p.name?.toLowerCase().includes('headless horseman') || p.id?.includes('phantompaws')) {
                    return {
                        ...p,
                        price: 52.99,
                        compareAtPrice: 69.99,
                        customBundles: [
                            {
                                qty: 1,
                                totalPrice: 52.99,
                                pricePerUnit: 52.99,
                                label: "1 PhantomPaws",
                                badge: null
                            },
                            {
                                qty: 2,
                                totalPrice: 74.62,
                                pricePerUnit: 37.31,
                                label: "2 PhantomPawss",
                                badge: "Two-Pet Household ⭐"
                            },
                            {
                                qty: 3,
                                totalPrice: 96.24,
                                pricePerUnit: 32.08,
                                label: "3 PhantomPawss",
                                badge: "Costume Party Pack 🔥"
                            }
                        ]
                    };
                }
                return p;
            });
        }

        const updatedStoreData = {
            ...sData,
            products: productsList
        };

        const patchStoreRes = await postgrest(`stores?id=eq.${encodeURIComponent(st.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ data: updatedStoreData })
        });

        if (!patchStoreRes.ok) {
            console.error(`Failed to patch store ${st.id}:`, patchStoreRes.status, patchStoreRes.raw);
        } else {
            console.log(`Successfully patched store ${st.id}: products[0].price=52.99, compareAtPrice=69.99`);
        }
    }

    console.log('\n--- 3. Verifying updated records ---');
    const verifyProd = await postgrest('products?select=*');
    const phantomProds = verifyProd.data.filter(p => p.id.includes('phantompaws'));
    for (const p of phantomProds) {
        console.log(`VERIFIED PRODUCT ${p.id}: price=${p.price}, data.price=${p.data?.price}, compareAt=${p.data?.compareAtPrice}, bundles=${p.data?.customBundles?.length}`);
    }

    const verifyStore = await postgrest('stores?select=*');
    const phantomStores = verifyStore.data.filter(s => s.id.includes('phantompaws'));
    for (const s of phantomStores) {
        console.log(`VERIFIED STORE ${s.id}: products[0].price=${s.data?.products?.[0]?.price}, compareAt=${s.data?.products?.[0]?.compareAtPrice}`);
    }
}

run().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
