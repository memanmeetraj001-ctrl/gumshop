/**
 * scripts/restore_174_products_to_db.cjs
 * 
 * Restores all 174 authentic products (names, prices, images, bundles, categories)
 * from `stores.data.products` into the `products` table in Supabase.
 */

const { postgrest } = require('../lib/db/client.js');

async function restoreProducts() {
    console.log('[Restore] Starting restoration of 174 authentic products...');

    // 1. Fetch store authentic products
    const sRes = await postgrest('stores?id=eq.store_rubber-couch-toys-official-store&select=data');
    const storeData = sRes.data?.[0]?.data || {};
    const prods = storeData.products || [];

    console.log(`[Restore] Found ${prods.length} authentic products in stores.data.products.`);
    if (prods.length === 0) {
        console.error('[Restore] No products found in store!');
        return;
    }

    const storeId = 'store_rubber-couch-toys-official-store';

    // 2. Prepare atomic PostgREST payloads
    const payload = prods.map((p, idx) => {
        const id = p.id || `prod_rubber-couch-toys-official-store_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        const name = p.name || p.title || `Gel Blaster Toy #${idx + 1}`;
        const price = parseFloat(p.price || 52.99);
        const compareAtPrice = parseFloat(p.compareAtPrice || (price > 0 ? Math.round(price * 1.35 * 100) / 100 : 0));
        const image = p.image || (Array.isArray(p.images) ? p.images[0] : '') || '';
        const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : (image ? [image] : []);
        const category = p.category || (name.toLowerCase().includes('water') ? 'Water Guns' : 'Gel Blasters');

        const customBundles = p.customBundles || [
            { qty: 1, totalPrice: price, pricePerUnit: price, label: `1 ${name}`, badge: null },
            { qty: 2, totalPrice: Math.round(price * 1.4082075 * 100) / 100, pricePerUnit: Math.round((price * 1.4082075 / 2) * 100) / 100, label: `2 ${name}s`, badge: "Two-Pack ⭐" },
            { qty: 3, totalPrice: Math.round(price * 1.81623 * 100) / 100, pricePerUnit: Math.round((price * 1.81623 / 3) * 100) / 100, label: `3 ${name}s`, badge: "Best Value 🔥" }
        ];

        return {
            id,
            store_id: storeId,
            name,
            price,
            data: {
                ...p,
                id,
                store_id: storeId,
                storeId: storeId,
                name,
                title: name,
                price,
                compareAtPrice,
                image,
                images,
                category,
                customBundles,
                inStock: p.inStock !== false,
                is_active: p.is_active !== false,
                slug: p.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            }
        };
    });

    // 3. Batch upsert into products table (50 items/batch to respect Cloudflare/PostgREST limits)
    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(payload.length / BATCH_SIZE);
    let totalUpserted = 0;

    for (let i = 0; i < payload.length; i += BATCH_SIZE) {
        const chunk = payload.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        console.log(`[Restore] Upserting batch ${batchNum}/${totalBatches} (${chunk.length} items)...`);

        const res = await postgrest('products', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(chunk)
        });

        if (res.error) {
            console.error(`[Restore] Error in batch ${batchNum}:`, res.error);
        } else {
            const count = Array.isArray(res.data) ? res.data.length : chunk.length;
            totalUpserted += count;
            console.log(`  ✅ Batch ${batchNum} completed: ${count} products restored.`);
        }
    }

    console.log(`\n🎉 [Restore Complete] Successfully restored ${totalUpserted} authentic products to products table!`);
}

restoreProducts().catch(console.error);
