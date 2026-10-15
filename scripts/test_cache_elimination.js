/**
 * Verification Test: Cache Elimination & Real-Time Supabase Sync
 */
import assert from 'assert';
import { purgeStaleCatalogCaches } from '../lib/cachePurge.js';
import { getStoreAndCatalogSync } from '../lib/storePresets.js';
import { serverSaveStore, serverGetStore, serverSaveProducts, serverGetProducts } from '../lib/serverDb.js';

console.log('--- 🧪 STARTING CACHE ELIMINATION & LIVE SYNC TEST ---');

// Mock localStorage and sessionStorage for Node.js environment
class StorageMock {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] !== undefined ? this.store[key] : null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
    key(i) {
        return Object.keys(this.store)[i] || null;
    }
    get length() {
        return Object.keys(this.store).length;
    }
}

globalThis.window = {};
globalThis.localStorage = new StorageMock();
globalThis.sessionStorage = new StorageMock();

// Test 1: Verify Cache Purge cleans legacy keys while preserving session keys
console.log('Test 1: Testing purgeStaleCatalogCaches()...');
localStorage.setItem('cloned_store_retro', JSON.stringify({ name: 'Retro Store', products: [{ price: 29.99 }] }));
localStorage.setItem('store_retro', JSON.stringify({ name: 'Retro Store', products: [{ price: 29.99 }] }));
localStorage.setItem('gumshop_db_products/prod_123', JSON.stringify({ price: 19.99 }));
localStorage.setItem('gumshop_db_stores/store_retro', JSON.stringify({ id: 'store_retro' }));
localStorage.setItem('active_store_cache', JSON.stringify({ id: 'store_retro' }));

// Preserved session keys:
localStorage.setItem('gumshop_cart', JSON.stringify({ total: 52.99, cartItems: {} }));
localStorage.setItem('gumshop_auth_token', 'jwt_test_token_123');
localStorage.setItem('gumshop_gumroad_token', 'gumroad_api_key_456');

purgeStaleCatalogCaches();

assert.strictEqual(localStorage.getItem('cloned_store_retro'), null, 'cloned_store_ should be deleted');
assert.strictEqual(localStorage.getItem('store_retro'), null, 'store_ should be deleted');
assert.strictEqual(localStorage.getItem('gumshop_db_products/prod_123'), null, 'gumshop_db_products/ should be deleted');
assert.strictEqual(localStorage.getItem('gumshop_db_stores/store_retro'), null, 'gumshop_db_stores/ should be deleted');
assert.strictEqual(localStorage.getItem('active_store_cache'), null, 'active_store_cache should be deleted');

// Ensure essential session keys remain intact
assert.notStrictEqual(localStorage.getItem('gumshop_cart'), null, 'gumshop_cart must be preserved');
assert.strictEqual(localStorage.getItem('gumshop_auth_token'), 'jwt_test_token_123', 'auth token must be preserved');
assert.strictEqual(localStorage.getItem('gumshop_gumroad_token'), 'gumroad_api_key_456', 'gumroad token must be preserved');
console.log('✅ Test 1 Passed: Legacy catalog caches purged, session tokens preserved.');

// Test 2: getStoreAndCatalogSync never loads stale localStorage items for custom/cloned stores
console.log('Test 2: Verifying getStoreAndCatalogSync zero-stale-cache invariant...');
// Inject a stale clone into localStorage
localStorage.setItem('cloned_store_driftcars', JSON.stringify({
    name: 'Drift Cars Old Cache',
    products: [{ id: 'p_old', price: 9.99 }]
}));

const syncResult = getStoreAndCatalogSync('driftcars');
assert.strictEqual(syncResult.store, null, 'Custom store must not be loaded from localStorage synchronously');
assert.strictEqual(syncResult.products.length, 0, 'Products array must be empty to avoid stale price flash');
console.log('✅ Test 2 Passed: getStoreAndCatalogSync enforces pure live fetch.');

// Test 3: Live Server Single Source of Truth update and immediate consistency
console.log('Test 3: Testing live server update & immediate consistency...');
const testStore = {
    id: 'store_live_test',
    username: 'live-test',
    name: 'Live Test Store',
    themeColor: '#3B82F6'
};
await serverSaveStore(testStore);

const initialProducts = [
    { id: 'prod_test_live', storeId: 'store_live_test', name: 'Live Product', price: 52.99 }
];
await serverSaveProducts('store_live_test', initialProducts);

let fetched = await serverGetProducts('store_live_test');
assert.strictEqual(fetched[0].price, 52.99, 'Initial price must be 52.99');

// Now update price to 79.99 in serverDb
const updatedProducts = [
    { id: 'prod_test_live', storeId: 'store_live_test', name: 'Live Product', price: 79.99 }
];
await serverSaveProducts('store_live_test', updatedProducts);

fetched = await serverGetProducts('store_live_test');
assert.strictEqual(fetched[0].price, 79.99, 'Updated price must immediately reflect 79.99 with 0ms stale lag');
console.log('✅ Test 3 Passed: Live DB updates reflect immediately with zero delay.');

console.log('--- 🏆 ALL CACHE ELIMINATION TESTS PASSED 100% ---');
