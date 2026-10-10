// scripts/challenge_m1_price_sync_adversarial.js
// EMPIRICAL CHALLENGER 2: ADVERSARIAL STRESS TEST SUITE
// Milestone 1: Authoritative Price Sync & Database Updates

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Ensure environment variables are loaded from .env.local if not present
const envPath = path.join(PROJECT_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmed.substring(0, eqIdx).trim();
                const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
                if (!process.env[key]) {
                    process.env[key] = val;
                }
            }
        }
    }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rkdigvwkcbbysuvilkzp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kS8eq_QMEg5qLnsJxAIqCg_eYTuU6uP';

process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = SUPABASE_KEY;

console.log('================================================================');
console.log('🥊 CHALLENGER 2: EMPIRICAL ADVERSARIAL STRESS TEST SUITE');
console.log('   Milestone 1: Authoritative Price Sync & Database Updates');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(name, assertionFn) {
    totalTests++;
    try {
        assertionFn();
        console.log(`  ✅ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}`);
        console.error(`     Error: ${err.message}`);
        failedTests++;
        failures.push({ name, error: err.message, stack: err.stack });
    }
}

async function asyncTest(name, assertionFn) {
    totalTests++;
    try {
        await assertionFn();
        console.log(`  ✅ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}`);
        console.error(`     Error: ${err.message}`);
        failedTests++;
        failures.push({ name, error: err.message, stack: err.stack });
    }
}

// ============================================================================
// SECTION 1: COMPARE-AT-PRICE FALLBACK LOGIC UNDER ADVERSARIAL EDGE CASES
// ============================================================================
console.log('----------------------------------------------------------------');
console.log('SECTION 1: compareAtPrice Fallback Logic Stress Matrix');
console.log('----------------------------------------------------------------');

// Model the component calculation logic (ProductCard, ProductQuickView, ProductDetails, Creator page)
function calculateComponentPricing(product, sizeDelta = 0) {
    const rawPrice = product?.price !== undefined && product?.price !== null && product?.price !== '' ? product.price : 52.99;
    const price = parseFloat(rawPrice);
    const unitPrice = price;
    const effectiveUnitPrice = unitPrice + sizeDelta;
    const compareAt = parseFloat(product?.compareAtPrice || product?.mrp || (unitPrice === 52.99 ? 69.99 : Math.round(unitPrice * 1.35 * 100) / 100)) + sizeDelta;
    const discountPercent = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
    return { price, unitPrice, effectiveUnitPrice, compareAt, discountPercent };
}

// Model the backend data adapter calculation logic (lib/supabase.js, lib/serverDb.js)
function calculateDataAdapterPricing(row) {
    const d = row?.data || {};
    const price = parseFloat(row?.price || (row?.data && row.data.price) || 52.99);
    const compareAtPrice = parseFloat(d.compareAtPrice || (price === 52.99 ? 69.99 : Math.round(price * 1.35 * 100) / 100));
    return { price, compareAtPrice };
}

// 1.1 Strict $52.99 -> $69.99 check
test('E1.1: When price is 52.99 and compareAtPrice is undefined, compareAt is STRICTLY 69.99 (not 71.54)', () => {
    const res = calculateComponentPricing({ price: 52.99 });
    assert.strictEqual(res.price, 52.99);
    assert.strictEqual(res.compareAt, 69.99);
    assert.notStrictEqual(res.compareAt, 71.54, 'Should NOT be unrounded 71.54');
    assert.strictEqual(res.discountPercent, 24); // (69.99 - 52.99) / 69.99 = 24.289% -> 24%
});

test('E1.2: When price is 52.99 as string "52.99", compareAt is STRICTLY 69.99', () => {
    const res = calculateComponentPricing({ price: "52.99" });
    assert.strictEqual(res.price, 52.99);
    assert.strictEqual(res.compareAt, 69.99);
});

test('E1.3: When price is undefined, price defaults to 52.99 and compareAt is STRICTLY 69.99', () => {
    const res = calculateComponentPricing({});
    assert.strictEqual(res.price, 52.99);
    assert.strictEqual(res.compareAt, 69.99);
    assert.strictEqual(res.discountPercent, 24);
});

test('E1.4: When price is null, price defaults to 52.99 and compareAt is STRICTLY 69.99', () => {
    const res = calculateComponentPricing({ price: null });
    assert.strictEqual(res.price, 52.99);
    assert.strictEqual(res.compareAt, 69.99);
});

test('E1.5: When price is empty string "", price defaults to 52.99 and compareAt is STRICTLY 69.99', () => {
    const res = calculateComponentPricing({ price: "" });
    assert.strictEqual(res.price, 52.99);
    assert.strictEqual(res.compareAt, 69.99);
});

test('E1.6: When price is 0 (free item / lead magnet), price remains 0 and compareAt calculates 0', () => {
    const res = calculateComponentPricing({ price: 0 });
    assert.strictEqual(res.price, 0, 'Price must remain 0 for genuine 0-price items');
    assert.strictEqual(res.compareAt, 0, 'CompareAt for 0 price calculates 0');
    assert.strictEqual(res.discountPercent, 0);
});

test('E1.7: When price is "0" (string 0), price remains 0 and compareAt is 0', () => {
    const res = calculateComponentPricing({ price: "0" });
    assert.strictEqual(res.price, 0);
    assert.strictEqual(res.compareAt, 0);
});

test('E1.8: When custom compareAtPrice is explicitly provided (e.g. 79.99), it is preserved', () => {
    const res = calculateComponentPricing({ price: 52.99, compareAtPrice: 79.99 });
    assert.strictEqual(res.price, 52.99);
    assert.strictEqual(res.compareAt, 79.99);
    assert.strictEqual(res.discountPercent, 34); // (79.99 - 52.99) / 79.99 = 33.75% -> 34%
});

test('E1.9: Non-52.99 price (e.g. 100.00) calculates standard 1.35x markup: 135.00', () => {
    const res = calculateComponentPricing({ price: 100.00 });
    assert.strictEqual(res.price, 100.00);
    assert.strictEqual(res.compareAt, 135.00);
    assert.strictEqual(res.discountPercent, 26); // (135 - 100) / 135 = 25.92% -> 26%
});

test('E1.10: Backend data adapter resolves row.price precedence over stale row.data.price (29.99)', () => {
    const res = calculateDataAdapterPricing({
        price: 52.99,
        data: { price: 29.99 } // Stale unmigrated JSONB
    });
    assert.strictEqual(res.price, 52.99, 'Column price must strictly win over stale data.price');
    assert.strictEqual(res.compareAtPrice, 69.99);
});

// ============================================================================
// SECTION 2: VOLUME BUNDLE MATHEMATICS & PRECISION VERIFICATION
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('SECTION 2: Volume Bundle Math & Precision Verification');
console.log('----------------------------------------------------------------');

function generateQuantityTiersFallback(unitPrice, itemName = 'PhantomPaws') {
    return [
        {
            qty: 1,
            label: `1 ${itemName}`,
            pricePerUnit: unitPrice,
            totalPrice: unitPrice,
            badge: null
        },
        {
            qty: 2,
            label: `2 ${itemName}s`,
            pricePerUnit: Math.round((Math.round(unitPrice * 1.4082075 * 100) / 100 / 2) * 100) / 100,
            totalPrice: Math.round(unitPrice * 1.4082075 * 100) / 100,
            badge: "Two-Pet Household ⭐"
        },
        {
            qty: 3,
            label: `3 ${itemName}s`,
            pricePerUnit: Math.round((Math.round(unitPrice * 1.81623 * 100) / 100 / 3) * 100) / 100,
            totalPrice: Math.round(unitPrice * 1.81623 * 100) / 100,
            badge: "Costume Party Pack 🔥"
        }
    ];
}

test('V2.1: Tier 1 (1 Costume) math is exactly $52.99 total, $52.99 / unit', () => {
    const tiers = generateQuantityTiersFallback(52.99);
    const t1 = tiers[0];
    assert.strictEqual(t1.qty, 1);
    assert.strictEqual(t1.totalPrice, 52.99);
    assert.strictEqual(t1.pricePerUnit, 52.99);
    assert.strictEqual(t1.badge, null);
});

test('V2.2: Tier 2 (2 Costumes) math is exactly $74.62 total, $37.31 / unit, badge "Two-Pet Household ⭐"', () => {
    const tiers = generateQuantityTiersFallback(52.99);
    const t2 = tiers[1];
    assert.strictEqual(t2.qty, 2);
    assert.strictEqual(t2.totalPrice, 74.62, `Expected 74.62, got ${t2.totalPrice}`);
    assert.strictEqual(t2.pricePerUnit, 37.31, `Expected 37.31, got ${t2.pricePerUnit}`);
    assert.strictEqual(t2.badge, "Two-Pet Household ⭐");
    // Mathematical consistency check
    assert.strictEqual(Math.round(t2.pricePerUnit * 2 * 100) / 100, 74.62, '2 * pricePerUnit must equal totalPrice');
});

test('V2.3: Tier 3 (3 Costumes) math is exactly $96.24 total, $32.08 / unit, badge "Costume Party Pack 🔥"', () => {
    const tiers = generateQuantityTiersFallback(52.99);
    const t3 = tiers[2];
    assert.strictEqual(t3.qty, 3);
    assert.strictEqual(t3.totalPrice, 96.24, `Expected 96.24, got ${t3.totalPrice}`);
    assert.strictEqual(t3.pricePerUnit, 32.08, `Expected 32.08, got ${t3.pricePerUnit}`);
    assert.strictEqual(t3.badge, "Costume Party Pack 🔥");
    // Mathematical consistency check
    assert.strictEqual(Math.round(t3.pricePerUnit * 3 * 100) / 100, 96.24, '3 * pricePerUnit must equal totalPrice');
});

test('V2.4: Discount percentages are strictly increasing per tier', () => {
    const baseUnit = 52.99;
    const tiers = generateQuantityTiersFallback(baseUnit);
    
    const retail1 = baseUnit * 1; // 52.99
    const retail2 = baseUnit * 2; // 105.98
    const retail3 = baseUnit * 3; // 158.97
    
    const disc1 = ((retail1 - tiers[0].totalPrice) / retail1) * 100; // 0%
    const disc2 = ((retail2 - tiers[1].totalPrice) / retail2) * 100; // 29.59%
    const disc3 = ((retail3 - tiers[2].totalPrice) / retail3) * 100; // 39.46%
    
    assert.strictEqual(disc1, 0);
    assert(disc2 > 29 && disc2 < 30, `Expected ~29.6%, got ${disc2.toFixed(2)}%`);
    assert(disc3 > 39 && disc3 < 40, `Expected ~39.5%, got ${disc3.toFixed(2)}%`);
    assert(disc3 > disc2, 'Tier 3 discount must be strictly greater than Tier 2');
});

test('V2.5: Size variant delta integration (+ $5.00) preserves bundle formulas without NaN or precision loss', () => {
    const baseWithVariant = 52.99 + 5.00; // 57.99
    const tiers = generateQuantityTiersFallback(baseWithVariant);
    
    assert.strictEqual(tiers[0].totalPrice, 57.99);
    assert.strictEqual(tiers[1].totalPrice, 81.66); // 57.99 * 1.4082075 = 81.6619 -> 81.66
    assert.strictEqual(tiers[1].pricePerUnit, 40.83); // 81.66 / 2 = 40.83
    assert.strictEqual(tiers[2].totalPrice, 105.32); // 57.99 * 1.81623 = 105.323 -> 105.32
    assert.strictEqual(tiers[2].pricePerUnit, 35.11); // 105.32 / 3 = 35.1066 -> 35.11
});

// ============================================================================
// SECTION 3: LIVE SUPABASE POSTGRESQL & OFFLINE PRESET PERSISTENCE
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('SECTION 3: Live Supabase Queries & Persistent Data Verification');
console.log('----------------------------------------------------------------');

await asyncTest('S3.1: Live Supabase Products Table Query: price is 52.99 and compareAtPrice is 69.99', async () => {
    const url = `${SUPABASE_URL}/rest/v1/products?select=*`;
    const res = await fetch(url, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    assert.strictEqual(res.ok, true, `HTTP status ${res.status}`);
    const products = await res.json();
    assert(Array.isArray(products) && products.length > 0, 'Products list must not be empty');
    
    const phantomProds = products.filter(p => 
        p.id.includes('phantompaws') || 
        (p.store_id && p.store_id.includes('phantompaws'))
    );
    assert(phantomProds.length > 0, 'Must have at least 1 PhantomPaws product');

    for (const prod of phantomProds) {
        console.log(`      Inspecting live product: ${prod.id}`);
        assert.strictEqual(parseFloat(prod.price), 52.99, `Column price must be 52.99 (got ${prod.price})`);
        assert.strictEqual(parseFloat(prod.data?.price), 52.99, `data.price must be 52.99 (got ${prod.data?.price})`);
        assert.strictEqual(parseFloat(prod.data?.compareAtPrice), 69.99, `data.compareAtPrice must be 69.99 (got ${prod.data?.compareAtPrice})`);
        
        // Check bundles
        const bundles = prod.data?.customBundles;
        assert(Array.isArray(bundles) && bundles.length === 3, 'Must have 3 customBundles');
        assert.strictEqual(bundles[0].totalPrice, 52.99);
        assert.strictEqual(bundles[0].pricePerUnit, 52.99);
        assert.strictEqual(bundles[1].totalPrice, 74.62);
        assert.strictEqual(bundles[1].pricePerUnit, 37.31);
        assert.strictEqual(bundles[1].badge, "Two-Pet Household ⭐");
        assert.strictEqual(bundles[2].totalPrice, 96.24);
        assert.strictEqual(bundles[2].pricePerUnit, 32.08);
        assert.strictEqual(bundles[2].badge, "Costume Party Pack 🔥");
    }
});

await asyncTest('S3.2: Live Supabase Stores Table Query: products[0] price is 52.99 and compareAt is 69.99', async () => {
    const url = `${SUPABASE_URL}/rest/v1/stores?select=*`;
    const res = await fetch(url, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    assert.strictEqual(res.ok, true, `HTTP status ${res.status}`);
    const stores = await res.json();
    assert(Array.isArray(stores) && stores.length > 0, 'Stores list must not be empty');

    const phantomStores = stores.filter(s =>
        s.id.includes('phantompaws') ||
        (s.username && s.username.includes('phantompaws'))
    );
    assert(phantomStores.length > 0, 'Must have at least 1 PhantomPaws store');

    for (const store of phantomStores) {
        console.log(`      Inspecting live store: ${store.id} (${store.username})`);
        const p0 = store.data?.products?.[0];
        assert(p0, 'Store must contain products[0]');
        assert.strictEqual(parseFloat(p0.price), 52.99, `Store p0.price must be 52.99 (got ${p0.price})`);
        assert.strictEqual(parseFloat(p0.compareAtPrice), 69.99, `Store p0.compareAtPrice must be 69.99 (got ${p0.compareAtPrice})`);
        
        const bundles = p0.customBundles;
        assert(Array.isArray(bundles) && bundles.length === 3, 'Store p0 must have 3 customBundles');
        assert.strictEqual(bundles[0].totalPrice, 52.99);
        assert.strictEqual(bundles[1].totalPrice, 74.62);
        assert.strictEqual(bundles[2].totalPrice, 96.24);
    }
});

// ============================================================================
// SECTION 4: OFFLINE PRESETS & CODE MODULE CONTRACTS
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('SECTION 4: Offline Presets & Code Module Verification');
console.log('----------------------------------------------------------------');

await asyncTest('M4.1: lib/storePresets.js DEFAULT_DEMO_CREATOR and getStoreAndCatalog resolver', async () => {
    const { DEFAULT_DEMO_CREATOR, getStoreAndCatalog } = await import('../lib/storePresets.js');
    
    // Check preset product 0
    const demoProd0 = DEFAULT_DEMO_CREATOR.products[0];
    assert.strictEqual(demoProd0.id, 'prod_demo_3d_icons');
    assert.strictEqual(demoProd0.price, 52.99, `Expected 52.99, got ${demoProd0.price}`);
    assert.strictEqual(demoProd0.compareAtPrice, 69.99, `Expected 69.99, got ${demoProd0.compareAtPrice}`);

    // Check getStoreAndCatalog('demo')
    const demoCatalog = await getStoreAndCatalog('demo');
    assert(demoCatalog.store, 'Demo store should resolve');
    assert(demoCatalog.products.length > 0, 'Demo products should resolve');
    assert.strictEqual(demoCatalog.products[0].price, 52.99);
    assert.strictEqual(demoCatalog.products[0].compareAtPrice, 69.99);

    // Check getStoreAndCatalog('phantompaws-headless-horseman-pet-costume')
    const phantomCatalog = await getStoreAndCatalog('phantompaws-headless-horseman-pet-costume');
    assert(phantomCatalog.store, 'Phantom store should resolve');
    assert(phantomCatalog.products.length > 0, 'Phantom products should resolve');
    assert.strictEqual(phantomCatalog.products[0].price, 52.99);
    assert.strictEqual(phantomCatalog.products[0].compareAtPrice, 69.99);
});

await asyncTest('M4.2: lib/serverDb.js serverGetStore and serverGetProducts authoritative query', async () => {
    const { serverGetStore, serverGetProducts } = await import('../lib/serverDb.js');
    const store = await serverGetStore('phantompaws-headless-horseman-pet-costume');
    assert(store, 'Store must be returned from Supabase');
    assert.strictEqual(store.username, 'phantompaws-headless-horseman-pet-costume');

    const products = await serverGetProducts('store_phantompaws-headless-horseman-pet-costume');
    assert(Array.isArray(products) && products.length > 0, 'Products should not be empty');
    const p0 = products[0];
    assert.strictEqual(parseFloat(p0.price), 52.99, `p0.price must be 52.99 (got ${p0.price})`);
    assert.strictEqual(parseFloat(p0.compareAtPrice), 69.99, `p0.compareAtPrice must be 69.99 (got ${p0.compareAtPrice})`);
});

test('M4.3: Zero remaining occurrences of $29.99 in components/ and cart/page.jsx', () => {
    const heroCode = fs.readFileSync(path.join(PROJECT_ROOT, 'components/Hero.jsx'), 'utf8');
    const cartCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app/(public)/cart/page.jsx'), 'utf8');
    const creatorCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app/(public)/creator/[username]/page.jsx'), 'utf8');

    assert(!heroCode.includes('29.99'), 'Hero.jsx must have 0 occurrences of 29.99');
    assert(!cartCode.includes('29.99'), 'cart/page.jsx must have 0 occurrences of 29.99');
    assert(!creatorCode.includes('29.99'), 'creator/[username]/page.jsx must have 0 occurrences of 29.99');
});

// ============================================================================
// FINAL SCORECARD
// ============================================================================
console.log('\n================================================================');
console.log(`📊 CHALLENGER 2 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
if (failedTests > 0) {
    console.error(`❌ ${failedTests} TESTS FAILED!`);
    for (const f of failures) {
        console.error(`   - ${f.name}: ${f.error}`);
    }
    process.exit(1);
} else {
    console.log('🎉 ALL ADVERSARIAL TESTS PASSED EMPIRICALLY!');
    console.log('================================================================\n');
}
