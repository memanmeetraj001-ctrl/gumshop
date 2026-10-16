/**
 * test_store_avatar_resolution.cjs
 * Verifies that store avatars/DPs are reliably resolved and normalized across
 * lib/db/stores.js and lib/supabase.js, preventing vanished store logos.
 */

const assert = require('assert');

async function runTests() {
    console.log('🧪 Starting Store Avatar / DP Resolution Tests...\n');

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`  ✅ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ FAIL: ${name}`);
            console.error(`     Error: ${err.message}`);
            failed++;
        }
    }

    async function testAsync(name, fn) {
        try {
            await fn();
            console.log(`  ✅ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ FAIL: ${name}`);
            console.error(`     Error: ${err.message}`);
            failed++;
        }
    }

    const { getAllStores, getStoreBySlug } = await import('../lib/db/stores.js');
    const { dbGetStores, dbGetStoreBySlug } = await import('../lib/supabase.js');

    // Test 1: getAllStores returns stores with non-empty logo and avatar
    await testAsync('getAllStores() resolves non-empty logo & avatar for all stores', async () => {
        const stores = await getAllStores();
        assert(Array.isArray(stores), 'stores should be an array');
        assert(stores.length >= 2, `Expected at least 2 stores, found ${stores.length}`);

        for (const store of stores) {
            assert(store.logo && typeof store.logo === 'string' && store.logo.length > 5,
                `Store ${store.username} missing valid logo: "${store.logo}"`);
            assert(store.avatar && typeof store.avatar === 'string' && store.avatar.length > 5,
                `Store ${store.username} missing valid avatar: "${store.avatar}"`);
            assert(store.logo_url && typeof store.logo_url === 'string' && store.logo_url.length > 5,
                `Store ${store.username} missing valid logo_url: "${store.logo_url}"`);
        }
    });

    // Test 2: getStoreBySlug for rubber-couch-toys-official-store
    await testAsync('getStoreBySlug("rubber-couch-toys-official-store") resolves valid DP', async () => {
        const store = await getStoreBySlug('rubber-couch-toys-official-store');
        assert(store, 'Store rubber-couch-toys-official-store not found');
        assert(store.logo && store.logo.startsWith('http'), `Expected http URL for logo, got: ${store.logo}`);
        assert(store.avatar && store.avatar.startsWith('http'), `Expected http URL for avatar, got: ${store.avatar}`);
    });

    // Test 3: getStoreBySlug for phantompaws-headless-horseman-pet-costume
    await testAsync('getStoreBySlug("phantompaws-headless-horseman-pet-costume") resolves valid DP', async () => {
        const store = await getStoreBySlug('phantompaws-headless-horseman-pet-costume');
        assert(store, 'Store phantompaws-headless-horseman-pet-costume not found');
        assert(store.logo && store.logo.startsWith('http'), `Expected http URL for logo, got: ${store.logo}`);
        assert(store.avatar && store.avatar.startsWith('http'), `Expected http URL for avatar, got: ${store.avatar}`);
        assert(store.logo.includes('1_1c648c33-92f0-4ba2-a0ec-487472836950.png') || store.logo.includes('shopify.com'),
            `Expected shopify cdn image for PhantomPaws, got ${store.logo}`);
    });

    // Test 4: dbGetStores returns valid logo & avatar
    await testAsync('dbGetStores() resolves non-empty logo & avatar', async () => {
        const stores = await dbGetStores();
        assert(Array.isArray(stores), 'dbGetStores should return an array');
        for (const store of stores) {
            assert(store.logo && store.logo.startsWith('http'), `Store ${store.username} missing logo in dbGetStores: ${store.logo}`);
            assert(store.avatar && store.avatar.startsWith('http'), `Store ${store.username} missing avatar in dbGetStores: ${store.avatar}`);
        }
    });

    // Test 5: dbGetStoreBySlug resolves valid DP
    await testAsync('dbGetStoreBySlug() resolves valid DP for PhantomPaws', async () => {
        const store = await dbGetStoreBySlug('phantompaws-headless-horseman-pet-costume');
        assert(store, 'Store phantompaws not found via dbGetStoreBySlug');
        assert(store.logo && store.logo.startsWith('http'), `Store logo invalid: ${store.logo}`);
        assert(store.avatar && store.avatar.startsWith('http'), `Store avatar invalid: ${store.avatar}`);
    });

    console.log(`\n========================================`);
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
