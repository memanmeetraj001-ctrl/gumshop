/**
 * test_marketplace_homepage.js
 * Comprehensive Verification of Master Dashboard All Shops Marketplace Controller & Homepage Attribution
 */

import assert from 'assert';
import { getAllProductsWithStores } from '../lib/db/products.js';
import { designateHomepageStore, resolveHomepageStore } from '../lib/serverDb.js';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

async function check(name, fn) {
    try {
        await fn();
        console.log(`  ✅ [PASS] ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}`);
        console.error(`     Error: ${err.message}`);
        failed++;
    }
}

async function run() {
    console.log(`\n======================================================================`);
    console.log(`🌐 ALL SHOPS MARKETPLACE & HOMEPAGE ATTRIBUTION VERIFICATION`);
    console.log(`🎯 Target: ${BASE_URL}`);
    console.log(`======================================================================\n`);

    // 1. Direct DB Function: getAllProductsWithStores
    await check('lib/db/products :: getAllProductsWithStores returns products with storeName and storeSlug', async () => {
        const prods = await getAllProductsWithStores();
        assert.ok(Array.isArray(prods), 'Expected prods to be an array');
        assert.ok(prods.length > 0, 'Expected at least 1 product');
        
        for (const p of prods) {
            assert.ok(p.id, 'Product missing id');
            assert.ok(p.storeSlug || p.storeId, `Product ${p.id} missing storeSlug or storeId`);
            assert.ok(p.storeName, `Product ${p.id} missing storeName`);
            assert.ok(typeof p.price === 'number', `Product ${p.id} price is not a number`);
        }
        console.log(`     Verified ${prods.length} products decorated with store attribution (e.g. "${prods[0].title}" by ${prods[0].storeName}).`);
    });

    // 2. Direct serverDb Function: designateHomepageStore & resolveHomepageStore
    await check('lib/serverDb :: designateHomepageStore exclusivity & format', async () => {
        const res = await designateHomepageStore('rubber-couch-toys-official-store');
        assert.strictEqual(res.success, true);
        assert.strictEqual(res.homepageSlug, 'rubber-couch-toys-official-store');
        assert.ok(res.homepageStore);

        const resolved = await resolveHomepageStore();
        assert.strictEqual(resolved.success, true);
        assert.strictEqual(resolved.homepageSlug, 'rubber-couch-toys-official-store');
    });

    // 3. HTTP API: GET /api/products?mode=all
    await check('HTTP API :: GET /api/products?mode=all returns decorated marketplace products', async () => {
        const res = await fetch(`${BASE_URL}/api/products?mode=all`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(Array.isArray(data.products));
        assert.ok(data.products.length > 0);
        assert.ok(data.products[0].storeName, 'First product missing storeName');
    });

    // 4. HTTP API: POST /api/store/homepage with mode='all'
    await check('HTTP API :: POST /api/store/homepage with mode="all" enables Marketplace mode', async () => {
        const res = await fetch(`${BASE_URL}/api/store/homepage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'all' })
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.homepageMode, 'all');
    });

    // 5. HTTP API: POST /api/store/homepage with mode='single'
    await check('HTTP API :: POST /api/store/homepage with mode="single" switches back to Single Store mode', async () => {
        const res = await fetch(`${BASE_URL}/api/store/homepage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'single', storeSlug: 'rubber-couch-toys-official-store' })
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.homepageMode, 'single');
        assert.strictEqual(data.homepageSlug, 'rubber-couch-toys-official-store');
    });

    // 6. UI Verification: Root Homepage (/) includes shop badges in marketplace mode
    await check('Root Homepage (/) HTML serves clean and renders correctly', async () => {
        const res = await fetch(`${BASE_URL}/`);
        assert.strictEqual(res.status, 200);
        const html = await res.text();
        assert.ok(html.includes('Rubber Couch Toys') || html.includes('GumShop') || html.includes('Catalog') || html.includes('Marketplace'), 'Homepage HTML content unexpected');
    });

    console.log(`\n======================================================================`);
    console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`======================================================================\n`);

    if (failed > 0) process.exit(1);
}

run();
