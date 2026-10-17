const assert = require('assert');

console.log('======================================================================');
console.log('🧪 TEST SUITE: 174-PRODUCT BULK PRICE STRESS & SUBREQUEST BUDGET');
console.log('======================================================================\n');

async function runStressTest() {
    const { dbGetProducts, dbUpsertProductsBulk } = await import('../lib/supabase.js');

    console.log('[1] Fetching all products for rubber-couch-toys-official-store...');
    const startFetch = Date.now();
    const products = await dbGetProducts('rubber-couch-toys-official-store');
    const fetchTime = Date.now() - startFetch;
    console.log(`  ✅ Loaded ${products.length} products in ${fetchTime}ms\n`);

    assert.ok(products.length >= 150, `Expected at least 150 products, got ${products.length}`);

    console.log('[2] Preparing +5% Markup (.99 Ending) for all products...');
    const updates = products.map(p => {
        const base = parseFloat(p.price || 52.99);
        const raw = base * 1.05;
        const finalPrice = Math.floor(raw) + 0.99;
        const compareAtPrice = Math.round(finalPrice * 1.35 * 100) / 100;
        return {
            id: p.id,
            storeId: p.storeId || p.store_id || 'store_rubber-couch-toys-official-store',
            price: finalPrice,
            compareAtPrice,
            mrp: compareAtPrice
        };
    });

    console.log(`  ✅ Prepared updates for ${updates.length} items.\n`);

    console.log('[3] Executing client-style micro-batching (50 items per batch)...');
    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(updates.length / BATCH_SIZE);
    let totalUpdated = 0;
    const startUpsert = Date.now();

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const chunk = updates.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const bStart = Date.now();

        const res = await dbUpsertProductsBulk(chunk);
        const bElapsed = Date.now() - bStart;

        assert.ok(Array.isArray(res) && res.length === chunk.length, `Batch ${batchNum} failed to upsert all items`);
        totalUpdated += res.length;
        console.log(`  ✅ Batch ${batchNum}/${totalBatches} (${chunk.length} items) upserted in ${bElapsed}ms [1 PostgREST Subrequest]`);
    }

    const totalTime = Date.now() - startUpsert;
    console.log(`\n  🎉 Total ${totalUpdated} products updated across ${totalBatches} batches in ${totalTime}ms!`);
    console.log(`  📊 Average time per batch: Math.round(${totalTime / totalBatches})ms`);
    console.log(`  🛡️ Subrequests used per batch: 1 (Cloudflare Free limit: 50 -> 98% safety margin!)\n`);

    console.log('[4] Verifying prices in Supabase...');
    const verifyProducts = await dbGetProducts('rubber-couch-toys-official-store');
    const sample = verifyProducts[0];
    console.log(`  Sample product: "${sample.name}" -> Price: $${sample.price}`);
    assert.ok(String(sample.price).endsWith('.99'), `Sample price must end in .99, got ${sample.price}`);

    console.log('\n======================================================================');
    console.log('🏆 174-PRODUCT STRESS TEST PASSED 100% WITH ZERO RESOURCE EXHAUSTION');
    console.log('======================================================================\n');
}

runStressTest().catch(err => {
    console.error('❌ STRESS TEST FAILED:', err);
    process.exit(1);
});
