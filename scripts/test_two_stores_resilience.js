import assert from 'assert';
import { getAllLocalStores, getActiveStoreSync } from '../lib/activeStore.js';
import { isStoreDeleted } from '../lib/firebaseDb.js';
import { serverGetAllStores } from '../lib/serverDb.js';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Mock browser globals for client helpers test
const storage = {};
global.window = { location: { search: '' } };
global.document = { cookie: '' };
global.localStorage = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; }
};

async function testStores() {
    console.log('--- 1. Testing Supabase Direct Stores ---');
    const stores = await serverGetAllStores();
    console.log(`Found ${stores.length} stores in Supabase`);
    assert.strictEqual(stores.length, 2, `Expected exactly 2 stores, got ${stores.length}`);
    const slugs = stores.map(s => s.slug || s.username);
    assert.ok(slugs.includes('rubber-couch-toys-official-store'), 'Missing rubber-couch-toys-official-store');
    assert.ok(slugs.includes('phantompaws-headless-horseman-pet-costume'), 'Missing phantompaws-headless-horseman-pet-costume');
    console.log('✅ Supabase stores verification passed');

    console.log('\n--- 2. Testing HTTP /api/stores ---');
    const res = await fetch(`${BASE_URL}/api/stores`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.stores.length, 2, `Expected 2 stores from /api/stores, got ${data.stores.length}`);
    console.log('✅ /api/stores returns both stores:', data.stores.map(s => s.name));

    console.log('\n--- 3. Testing HTTP /api/store/data ---');
    const resData = await fetch(`${BASE_URL}/api/store/data`);
    assert.strictEqual(resData.status, 200);
    const dataObj = await resData.json();
    assert.strictEqual(dataObj.success, true);
    assert.ok(Array.isArray(dataObj.stores));
    assert.strictEqual(dataObj.stores.length, 2, `Expected 2 stores from /api/store/data, got ${dataObj.stores.length}`);
    console.log('✅ /api/store/data returns both stores:', dataObj.stores.map(s => s.name));

    console.log('\n--- 4. Testing Local Store Resilient Fallback ---');
    const localStores = getAllLocalStores();
    console.log('Local stores found:', localStores.map(s => s.name));
    assert.ok(localStores.length >= 2, `Expected at least 2 local stores, got ${localStores.length}`);
    const localSlugs = localStores.map(s => s.username);
    assert.ok(localSlugs.includes('rubber-couch-toys-official-store'));
    assert.ok(localSlugs.includes('phantompaws-headless-horseman-pet-costume'));
    console.log('✅ Local stores resilient fallback passed');

    console.log('\n--- 5. Testing Active Store Sync Fallback ---');
    const active = getActiveStoreSync();
    assert.ok(active, 'Active store must not be null');
    assert.ok(active.username, 'Active store must have username');
    console.log(`✅ Active store fallback passed: ${active.name} (${active.username})`);

    console.log('\n--- 6. Testing Deletion Protection for Primary Stores ---');
    assert.strictEqual(isStoreDeleted('rubber-couch-toys-official-store'), false);
    assert.strictEqual(isStoreDeleted('phantompaws-headless-horseman-pet-costume'), false);
    assert.strictEqual(isStoreDeleted('store_rubber-couch-toys-official-store'), false);
    assert.strictEqual(isStoreDeleted('store_phantompaws-headless-horseman-pet-costume'), false);
    console.log('✅ Deletion protection verified');

    console.log('\n🎉 ALL 6 VERIFICATIONS PASSED SUCCESSFULLY!');
}

testStores().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
