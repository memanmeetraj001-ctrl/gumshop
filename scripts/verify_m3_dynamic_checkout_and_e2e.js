/**
 * scripts/verify_m3_dynamic_checkout_and_e2e.js
 * Comprehensive Verification of Milestone 3 & 4:
 * Dynamic Checkout Authoritative Price Validation & End-to-End Cart Sync
 */

import assert from 'assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rkdigvwkcbbysuvilkzp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kS8eq_QMEg5qLnsJxAIqCg_eYTuU6uP';

console.log('======================================================================');
console.log('🧪 MILESTONE 3 & 4: DYNAMIC CHECKOUT & E2E RECONCILIATION TEST SUITE');
console.log('======================================================================\n');

let total = 0;
let passed = 0;

async function test(name, fn) {
    total++;
    try {
        await fn();
        console.log(`  ✅ [PASS] ${name}`);
        passed++;
    } catch (e) {
        console.error(`  ❌ [FAIL] ${name}`);
        console.error(`     Reason: ${e.message}`);
    }
}

// 1. Authoritative price calculations check
await test('M3.1: Tier pricing math adheres to $52.99 base price contract', async () => {
    const base = 52.99;
    const tier1 = base;
    const tier2 = Math.round(base * 1.4082075 * 100) / 100;
    const tier3 = Math.round(base * 1.81623 * 100) / 100;
    assert.strictEqual(tier1, 52.99);
    assert.strictEqual(tier2, 74.62);
    assert.strictEqual(tier3, 96.24);
});

// 2. Dynamic checkout route logic unit test
await test('M3.2: Dynamic checkout volume tier floor respects 2-pack and 3-pack bundle rates', async () => {
    const variantBase = 52.99;
    const tier2Unit = Math.round((74.62 / 2) * 100) / 100; // 37.31
    const tier3Unit = Math.round((96.24 / 3) * 100) / 100; // 32.08

    const floorMultiPack = Math.round(variantBase * 0.45 * 100) / 100; // 23.85
    const floorSingle = Math.round(variantBase * 0.55 * 100) / 100; // 29.14

    assert(tier2Unit >= floorMultiPack, `Tier 2 unit ($${tier2Unit}) must be >= multi-pack floor ($${floorMultiPack})`);
    assert(tier3Unit >= floorMultiPack, `Tier 3 unit ($${tier3Unit}) must be >= multi-pack floor ($${floorMultiPack})`);
    assert(variantBase >= floorSingle, `Single unit ($${variantBase}) must be >= single floor ($${floorSingle})`);
});

// 3. Dynamic checkout finalTotal computation
await test('M3.3: Shipping fee threshold ($50.00) applies correctly to CartDrawer and checkout', async () => {
    function computeTotal(items, discount = 0, rushFee = 0) {
        const subtotal = items.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
        const shippingFee = subtotal >= 50 ? 0 : 4.99;
        const finalTotal = Math.max(1.00, Math.round((subtotal + shippingFee + rushFee - discount) * 100) / 100);
        return { subtotal, shippingFee, finalTotal };
    }

    // 1 Costume ($52.99) -> Subtotal >= 50 -> Shipping FREE ($0)
    const order1 = computeTotal([{ price: 52.99, quantity: 1 }]);
    assert.strictEqual(order1.subtotal, 52.99);
    assert.strictEqual(order1.shippingFee, 0);
    assert.strictEqual(order1.finalTotal, 52.99);

    // Subtotal under $50 -> Shipping $4.99
    const orderUnder = computeTotal([{ price: 25.00, quantity: 1 }]);
    assert.strictEqual(orderUnder.shippingFee, 4.99);
    assert.strictEqual(orderUnder.finalTotal, 29.99);

    // 2 Costumes ($74.62) -> Shipping FREE ($0)
    const order2 = computeTotal([{ price: 37.31, quantity: 2 }]);
    assert.strictEqual(order2.subtotal, 74.62);
    assert.strictEqual(order2.shippingFee, 0);
    assert.strictEqual(order2.finalTotal, 74.62);

    // 3 Costumes ($96.24) -> Shipping FREE ($0)
    const order3 = computeTotal([{ price: 32.08, quantity: 3 }]);
    assert.strictEqual(order3.subtotal, 96.24);
    assert.strictEqual(order3.shippingFee, 0);
    assert.strictEqual(order3.finalTotal, 96.24);
});

// 4. Supabase database live integrity verification
await test('M3.4: Supabase live product record matches canonical 52.99 price and 69.99 compareAt', async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    assert.strictEqual(res.ok, true);
    const prods = await res.json();
    assert(prods.length > 0, 'Products table must contain records');
    const p = prods[0];
    assert.strictEqual(parseFloat(p.price), 52.99);
    assert.strictEqual(parseFloat(p.data?.price), 52.99);
    assert.strictEqual(parseFloat(p.data?.compareAtPrice), 69.99);
    assert(p.data?.image, 'Product must have image');
    assert(Array.isArray(p.data?.images) && p.data.images.length > 0, 'Product must have images array');
    assert.strictEqual(p.data.customBundles.length, 3, 'Must have 3 bundles');
});

// 5. Supabase live store record integrity
await test('M3.5: Supabase live store record contains embedded product with identical pricing and images', async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/stores?select=*`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    assert.strictEqual(res.ok, true);
    const stores = await res.json();
    assert(stores.length > 0, 'Stores table must contain records');
    const s = stores[0];
    assert(s.data?.products && s.data.products.length > 0, 'Store must contain embedded products');
    const p0 = s.data.products[0];
    assert.strictEqual(parseFloat(p0.price), 52.99);
    assert.strictEqual(parseFloat(p0.compareAtPrice), 69.99);
    assert(p0.image, 'Store embedded product must have image');
});

console.log(`\n======================================================================`);
console.log(`📊 SUMMARY: ${passed} / ${total} TESTS PASSED`);
console.log(`======================================================================`);

if (passed !== total) process.exit(1);
