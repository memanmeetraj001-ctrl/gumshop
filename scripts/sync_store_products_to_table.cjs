/**
 * scripts/sync_store_products_to_table.cjs
 * 
 * Synchronizes authentic store catalog products from stores.data.products
 * into the standalone products table in Supabase.
 * Permanently overwrites any hollow "Product" stubs with full product names,
 * descriptions, high-res images, categories, and volume bundles.
 */

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

    const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body,
        cache: 'no-store'
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`PostgREST error on ${path} (${res.status}): ${text}`);
    }

    const data = await res.json().catch(() => null);
    return data;
}

async function runSync() {
    console.log('🔄 Starting Catalog Synchronization to Supabase Products Table...\n');

    // 1. Purge any orphaned hollow store_default stubs first
    console.log('Step 1: Checking and purging any remaining store_default stubs...');
    try {
        const stubs = await postgrestRequest('products?store_id=eq.store_default&select=id,name,store_id');
        if (stubs && stubs.length > 0) {
            console.log(`Found ${stubs.length} store_default stubs. Purging...`);
            for (const stub of stubs) {
                await postgrestRequest(`products?id=eq.${encodeURIComponent(stub.id)}`, {
                    method: 'DELETE'
                });
            }
            console.log(`  ✅ Purged ${stubs.length} orphaned store_default rows.`);
        } else {
            console.log('  ✅ No orphaned store_default stubs found.');
        }
    } catch (err) {
        console.warn('  Notice during stub cleanup:', err.message);
    }

    // 2. Fetch all active stores
    console.log('\nStep 2: Fetching all active stores from Supabase...');
    const stores = await postgrestRequest('stores?select=*&order=created_at.desc');
    console.log(`Found ${stores.length} store records.\n`);

    let totalUpserted = 0;
    let totalStoresProcessed = 0;

    for (const store of stores) {
        const storeId = store.id;
        const storeSlug = store.username || storeId.replace(/^store_/, '');
        const storeName = store.name || store.data?.name || storeSlug;

        // Skip internal/synthetic system stores
        if (storeId.startsWith('system_') || storeId.startsWith('test_')) continue;

        const catalog = Array.isArray(store.data?.products) ? store.data.products : [];
        if (catalog.length === 0) {
            console.log(`Store ${storeSlug} has no products in store.data.products. Skipping.`);
            continue;
        }

        console.log(`Processing Store: "${storeName}" (@${storeSlug}) - ${catalog.length} catalog products...`);
        totalStoresProcessed++;

        // Deduplicate & normalize products
        const validRows = [];
        for (let idx = 0; idx < catalog.length; idx++) {
            const p = catalog[idx];
            if (!p) continue;

            const name = (p.name || p.title || '').trim();
            if (!name || name === 'Product') {
                if (!p.title && !p.slug) continue;
            }

            const id = p.id || `prod_${storeSlug}_${idx + 1}`;
            const price = parseFloat(p.price) || 52.99;
            const compareAtPrice = parseFloat(p.compareAtPrice) || (price > 0 ? Math.round(price * 1.35 * 100) / 100 : 0);
            const images = Array.isArray(p.images) && p.images.length > 0 
                ? p.images 
                : (p.images ? [p.images] : (p.image ? [p.image] : []));
            const image = p.image || images[0] || '';

            const cleanData = {
                ...p,
                id,
                name: name || p.title || 'Product',
                title: name || p.title || 'Product',
                price,
                compareAtPrice,
                image,
                images,
                storeId,
                store_id: storeId,
                storeSlug,
                storeName,
                is_active: p.is_active !== false,
                inStock: p.inStock !== false,
                updatedAt: new Date().toISOString()
            };

            validRows.push({
                id,
                store_id: storeId,
                name: cleanData.name,
                price: cleanData.price,
                data: cleanData
            });
        }

        // Batch upsert into products table in chunks of 25
        const CHUNK_SIZE = 25;
        for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
            const chunk = validRows.slice(i, i + CHUNK_SIZE);
            await postgrestRequest('products', {
                method: 'POST',
                prefer: 'resolution=merge-duplicates,return=representation',
                body: JSON.stringify(chunk)
            });
            totalUpserted += chunk.length;
            process.stdout.write(`  Upserted ${Math.min(i + CHUNK_SIZE, validRows.length)} / ${validRows.length} products...\r`);
        }
        console.log(`\n  ✅ Store @${storeSlug}: successfully synced ${validRows.length} authentic products.`);
    }

    console.log(`\n🎉 Synchronization Complete!`);
    console.log(`- Total stores processed: ${totalStoresProcessed}`);
    console.log(`- Total products upserted: ${totalUpserted}\n`);
}

runSync().catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
});
