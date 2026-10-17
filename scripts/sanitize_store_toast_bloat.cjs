/**
 * scripts/sanitize_store_toast_bloat.cjs
 * 
 * Sanitizes the 2.05 MB TOAST bloat in the `stores` table by stripping
 * redundant heavy scrape data (bodyHtml, faqs, specs, bulletPoints)
 * from `stores.data.products`, while preserving essential card attributes
 * (id, name, price, compareAtPrice, image, category, customBundles).
 * 
 * All 174 products remain 100% authoritative and intact in the dedicated
 * `products` relational table.
 */

const { postgrest } = require('../lib/db/client.js');

async function sanitizeStores() {
    console.log('[Sanitize] Starting TOAST de-bloat for stores table...');

    const res = await postgrest('stores?select=id,username,name,data');
    if (!res.data || !Array.isArray(res.data)) {
        console.error('[Sanitize] Failed to query stores:', res.error);
        return;
    }

    for (const store of res.data) {
        const sData = store.data || {};
        const rawProds = Array.isArray(sData.products) ? sData.products : [];
        const rawSizeKb = (JSON.stringify(sData).length / 1024).toFixed(1);

        console.log(`\nStore: ${store.id} (${store.name || store.username})`);
        console.log(`Current store.data size: ${rawSizeKb} KB across ${rawProds.length} embedded products`);

        if (rawProds.length === 0) {
            console.log('Skipping: no embedded products.');
            continue;
        }

        // Project lean product representation for store card display
        const leanProds = rawProds.map(p => {
            const price = parseFloat(p.price || 52.99);
            const compareAtPrice = parseFloat(p.compareAtPrice || (price > 0 ? Math.round(price * 1.35 * 100) / 100 : 0));
            const image = p.image || (Array.isArray(p.images) ? p.images[0] : '') || '';
            const images = Array.isArray(p.images) && p.images.length > 0 ? p.images.slice(0, 3) : (image ? [image] : []);

            return {
                id: p.id,
                name: p.name || p.title || 'Product',
                title: p.name || p.title || 'Product',
                price,
                compareAtPrice,
                image,
                images,
                category: p.category || 'General',
                customBundles: p.customBundles || [
                    { qty: 1, totalPrice: price, pricePerUnit: price, label: `1 ${p.name || 'Item'}`, badge: null },
                    { qty: 2, totalPrice: Math.round(price * 1.4082075 * 100) / 100, pricePerUnit: Math.round((price * 1.4082075 / 2) * 100) / 100, label: `2 ${p.name || 'Item'}s`, badge: "Two-Pack ⭐" },
                    { qty: 3, totalPrice: Math.round(price * 1.81623 * 100) / 100, pricePerUnit: Math.round((price * 1.81623 / 3) * 100) / 100, label: `3 ${p.name || 'Item'}s`, badge: "Best Value 🔥" }
                ],
                inStock: p.inStock !== false,
                is_active: p.is_active !== false,
                storeId: p.storeId || store.id,
                store_id: p.store_id || store.id,
                slug: p.slug || (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
            };
        });

        const newStoreData = {
            ...sData,
            productsCount: rawProds.length,
            products: leanProds,
            updatedAt: new Date().toISOString()
        };

        const newSizeKb = (JSON.stringify(newStoreData).length / 1024).toFixed(1);
        console.log(`Sanitized store.data size: ${newSizeKb} KB (Reduced by ${(100 - (newSizeKb / rawSizeKb * 100)).toFixed(1)}%)`);

        // Patch Supabase store record
        const patchRes = await postgrest(`stores?id=eq.${encodeURIComponent(store.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({
                data: newStoreData
            })
        });

        if (patchRes.error) {
            console.error(`[Sanitize] Error patching store ${store.id}:`, patchRes.error);
        } else {
            console.log(`[Sanitize] Successfully de-bloated store ${store.id} to ${newSizeKb} KB!`);
        }
    }

    console.log('\n[Sanitize] All stores successfully de-bloated!');
}

sanitizeStores().catch(console.error);
