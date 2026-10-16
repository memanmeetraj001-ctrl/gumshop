/**
 * scripts/reconcile_and_sync_all_products.js
 * 
 * Authoritative Database Reconciliation Script:
 * 1. Removes stale duplicate PhantomPaws product row (leaving exactly 1 active product).
 * 2. Extracts and deduplicates all 174 unique Rubber Couch Toys products from store record.
 * 3. Batch-inserts all 174 unique products into Supabase products table.
 * 4. Reconciles store records so both PhantomPaws and Rubber Couch Toys have 100% synchronized catalogs.
 */

import { postgrest } from '../lib/db/client.js';

async function reconcile() {
    console.log('🚀 Starting Database Product Reconciliation & Deduplication...\n');

    // ==========================================
    // STEP 1: FIX PHANTOMPAWS DUPLICATE ROW
    // ==========================================
    console.log('Step 1: Inspecting PhantomPaws products in Supabase...');
    const phantomRes = await postgrest('products?store_id=eq.store_phantompaws-headless-horseman-pet-costume&select=id,name,created_at');
    const phantomRows = phantomRes.data || [];
    console.log(`  Found ${phantomRows.length} rows for PhantomPaws:`, phantomRows.map(r => r.id));

    if (phantomRows.length > 1) {
        // Keep the authoritative row 'prod_phantompaws-headless-horseman-pet-costume_0_dpz8'
        // Delete stale orphaned row 'prod_phantompaws-headless-horseman-pet-costume_0_9tv4' (or any row other than dpz8)
        const keepId = 'prod_phantompaws-headless-horseman-pet-costume_0_dpz8';
        for (const row of phantomRows) {
            if (row.id !== keepId) {
                console.log(`  Deleting duplicate orphaned row: ${row.id}...`);
                const delRes = await postgrest(`products?id=eq.${encodeURIComponent(row.id)}`, {
                    method: 'DELETE'
                });
                console.log(`  Deleted ${row.id}:`, delRes.error ? `Error: ${delRes.error}` : 'Success');
            }
        }
    }

    // Verify PhantomPaws is now exactly 1
    const phantomCheck = await postgrest('products?store_id=eq.store_phantompaws-headless-horseman-pet-costume&select=id,name');
    console.log(`  ✅ PhantomPaws now has exactly ${phantomCheck.data?.length} row(s) in products table.\n`);

    // ==========================================
    // STEP 2: RECONCILE RUBBER COUCH TOYS (174 ITEMS)
    // ==========================================
    console.log('Step 2: Inspecting Rubber Couch Toys products in store record...');
    const rcStoreRes = await postgrest('stores?id=eq.store_rubber-couch-toys-official-store');
    const rcStore = rcStoreRes.data?.[0];

    if (!rcStore) {
        console.error('❌ Rubber Couch Toys store record not found in Supabase!');
        process.exit(1);
    }

    const rawProducts = rcStore.data?.products || [];
    console.log(`  Total raw products in store.data.products: ${rawProducts.length}`);

    // Deduplicate unique products by normalized name
    const uniqueMap = new Map();
    for (const p of rawProducts) {
        if (!p) continue;
        const name = (p.name || p.title || '').trim();
        const normKey = name.toLowerCase();
        if (!normKey) continue;

        if (!uniqueMap.has(normKey)) {
            uniqueMap.set(normKey, p);
        }
    }

    const uniqueProducts = Array.from(uniqueMap.values());
    console.log(`  ✅ Deduplicated to exactly ${uniqueProducts.length} unique products.`);

    // Clean up existing rows in products table for Rubber Couch Toys
    console.log('  Clearing existing rows in products table for Rubber Couch Toys...');
    const clearRes = await postgrest('products?store_id=eq.store_rubber-couch-toys-official-store', {
        method: 'DELETE'
    });
    if (clearRes.error) {
        console.warn('  Warning during clear:', clearRes.error);
    } else {
        console.log('  Cleared existing table rows.');
    }

    // Prepare clean PostgREST payload rows for batch insertion
    const storeId = 'store_rubber-couch-toys-official-store';
    const storeSlug = 'rubber-couch-toys-official-store';

    const tableRows = uniqueProducts.map((p, idx) => {
        const id = p.id || `prod_rubber-couch-toys-official-store_${idx + 1}`;
        const name = p.name || p.title || 'Product';
        const price = parseFloat(p.price) || 52.99;
        const compareAtPrice = parseFloat(p.compareAtPrice) || (price > 0 ? Math.round(price * 1.35 * 100) / 100 : 0);

        const cleanData = {
            ...p,
            id,
            storeId,
            store_id: storeId,
            storeSlug,
            name,
            title: name,
            price,
            compareAtPrice,
            is_active: true,
            inStock: true
        };

        return {
            id,
            store_id: storeId,
            name,
            price,
            data: cleanData
        };
    });

    // Batch insert into products table in chunks of 25
    const CHUNK_SIZE = 25;
    console.log(`  Batch inserting ${tableRows.length} products in chunks of ${CHUNK_SIZE}...`);

    for (let i = 0; i < tableRows.length; i += CHUNK_SIZE) {
        const chunk = tableRows.slice(i, i + CHUNK_SIZE);
        const insertRes = await postgrest('products', {
            method: 'POST',
            prefer: 'resolution=merge-duplicates,return=representation',
            body: JSON.stringify(chunk)
        });

        if (insertRes.error) {
            console.error(`  ❌ Error inserting chunk ${i} - ${i + chunk.length}:`, insertRes.error);
        } else {
            console.log(`  ✅ Inserted products ${i + 1} to ${Math.min(i + CHUNK_SIZE, tableRows.length)} / ${tableRows.length}`);
        }
    }

    // Verify final products table count for Rubber Couch Toys
    const rcCheck = await postgrest('products?store_id=eq.store_rubber-couch-toys-official-store&select=id');
    console.log(`  ✅ Rubber Couch Toys now has exactly ${rcCheck.data?.length} products in products table.`);

    // Update stores table record with deduplicated 174 products and productsCount: 174
    console.log('  Updating stores table for Rubber Couch Toys...');
    const updatedStoreData = {
        ...rcStore.data,
        productsCount: uniqueProducts.length,
        products: uniqueProducts.map((p, idx) => ({
            ...p,
            id: p.id || `prod_rubber-couch-toys-official-store_${idx + 1}`,
            storeId,
            store_id: storeId,
            storeSlug
        }))
    };

    const updateStoreRes = await postgrest('stores?id=eq.store_rubber-couch-toys-official-store', {
        method: 'PATCH',
        body: JSON.stringify({
            data: updatedStoreData
        })
    });
    console.log('  Store record updated:', updateStoreRes.error ? `Error: ${updateStoreRes.error}` : 'Success');

    // ==========================================
    // STEP 3: FINAL VERIFICATION AUDIT
    // ==========================================
    console.log('\n==========================================');
    console.log('📊 FINAL AUDIT VERIFICATION');
    console.log('==========================================');

    const finalPhantom = await postgrest('products?store_id=eq.store_phantompaws-headless-horseman-pet-costume&select=id,name');
    console.log(`PhantomPaws items in products table: ${finalPhantom.data?.length} (Expected: 1)`);

    const finalRC = await postgrest('products?store_id=eq.store_rubber-couch-toys-official-store&select=id,name');
    console.log(`Rubber Couch Toys items in products table: ${finalRC.data?.length} (Expected: 174)`);

    if (finalPhantom.data?.length === 1 && finalRC.data?.length === 174) {
        console.log('\n🎉 ALL RECONCILIATIONS COMPLETED SUCCESSFULLY! ZERO DUPLICATES, FULL 174 CATALOG RESTORED.');
    } else {
        console.error('\n⚠️ Discrepancy remaining after reconciliation.');
        process.exit(1);
    }
}

reconcile().catch(err => {
    console.error('Fatal error during reconciliation:', err);
    process.exit(1);
});
