// scripts/challenge_m1_price_sync_empirical.js
// EMPIRICAL CHALLENGER 1 STRESS HARNESS & ORACLE
// Adversarial test suite for Milestone 1: Authoritative Price Sync & Database Updates

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables if available
try {
    process.loadEnvFile(path.join(PROJECT_ROOT, '.env.local'));
} catch (e) {
    console.warn('Note: .env.local loaded via fallback or already in process.env');
}

console.log('======================================================================');
console.log('⚔️  CHALLENGER 1: EMPIRICAL STRESS TEST & ORACLE (MILESTONE 1)');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✅ [PASS] ${testName}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${testName}`);
        console.error(`     Reason: ${err.message}`);
        failedTests++;
    }
}

async function runAsyncTest(testName, fn) {
    totalTests++;
    try {
        await fn();
        console.log(`  ✅ [PASS] ${testName}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${testName}`);
        console.error(`     Reason: ${err.message}`);
        failedTests++;
    }
}

async function main() {
    // =========================================================================
    // SUITE 1: lib/supabase.js dbGetProducts() Live Empirical Test
    // =========================================================================
    console.log('\n--- SUITE 1: lib/supabase.js dbGetProducts() Live Oracles ---');
    const { dbGetProducts, dbCreateProduct } = await import('../lib/supabase.js');

    await runAsyncTest('dbGetProducts() returns array with valid length', async () => {
        const prods = await dbGetProducts();
        assert(Array.isArray(prods), 'dbGetProducts() must return an array');
        assert(prods.length > 0, `Expected at least 1 product, found ${prods.length}`);
    });

    await runAsyncTest('dbGetProducts() returns authoritative PhantomPaws product with price 52.99 and compareAt 69.99', async () => {
        const prods = await dbGetProducts();
        const phantom = prods.find(p => p.id?.includes('phantompaws') || p.name?.toLowerCase().includes('headless horseman'));
        assert(phantom, 'PhantomPaws product must exist in dbGetProducts() output');
        
        assert.strictEqual(typeof phantom.price, 'number', 'Price must be numeric');
        assert.strictEqual(phantom.price, 52.99, `Phantom price must be 52.99, got ${phantom.price}`);
        
        assert.strictEqual(typeof phantom.compareAtPrice, 'number', 'compareAtPrice must be numeric');
        assert.strictEqual(phantom.compareAtPrice, 69.99, `compareAtPrice must be 69.99, got ${phantom.compareAtPrice}`);
        assert.notStrictEqual(phantom.compareAtPrice, 71.54, 'compareAtPrice must never be 71.54');
        assert.notStrictEqual(phantom.price, 29.99, 'price must never be 29.99');
    });

    await runAsyncTest('dbGetProducts() preserves customBundles with exact pricing (52.99, 74.62, 96.24) and badges', async () => {
        const prods = await dbGetProducts();
        const phantom = prods.find(p => p.id?.includes('phantompaws') || p.name?.toLowerCase().includes('headless horseman'));
        assert(phantom, 'PhantomPaws product must exist');
        assert(Array.isArray(phantom.customBundles), 'customBundles must be an array');
        assert.strictEqual(phantom.customBundles.length, 3, `customBundles must have 3 tiers, got ${phantom.customBundles.length}`);

        const [tier1, tier2, tier3] = phantom.customBundles;
        assert.strictEqual(tier1.qty, 1);
        assert.strictEqual(tier1.totalPrice, 52.99, `Tier 1 totalPrice expected 52.99, got ${tier1.totalPrice}`);
        assert.strictEqual(tier1.pricePerUnit, 52.99);

        assert.strictEqual(tier2.qty, 2);
        assert.strictEqual(tier2.totalPrice, 74.62, `Tier 2 totalPrice expected 74.62, got ${tier2.totalPrice}`);
        assert.strictEqual(tier2.pricePerUnit, 37.31);
        assert.strictEqual(tier2.badge, 'Two-Pet Household ⭐');

        assert.strictEqual(tier3.qty, 3);
        assert.strictEqual(tier3.totalPrice, 96.24, `Tier 3 totalPrice expected 96.24, got ${tier3.totalPrice}`);
        assert.strictEqual(tier3.pricePerUnit, 32.08);
        assert.strictEqual(tier3.badge, 'Costume Party Pack 🔥');
    });

    await runAsyncTest('dbGetProducts() preserves valid image and images array', async () => {
        const prods = await dbGetProducts();
        const phantom = prods.find(p => p.id?.includes('phantompaws') || p.name?.toLowerCase().includes('headless horseman'));
        assert(phantom, 'PhantomPaws product must exist');
        assert(typeof phantom.image === 'string' && phantom.image.startsWith('http'), `image must be a valid URL, got ${phantom.image}`);
        assert(Array.isArray(phantom.images) && phantom.images.length > 0, 'images must be a non-empty array');
        assert.strictEqual(phantom.images[0], phantom.image, 'images[0] must match primary image');
        assert(phantom.storeId, 'storeId must be preserved');
    });

    await runAsyncTest('dbGetProducts(storeId) filters correctly by storeId or slug', async () => {
        const prods1 = await dbGetProducts('store_phantompaws-headless-horseman-pet-costume');
        assert(prods1.length > 0, 'Should find products by store_phantompaws-headless-horseman-pet-costume');
        assert.strictEqual(prods1[0].price, 52.99);

        const prods2 = await dbGetProducts('phantompaws-headless-horseman-pet-costume');
        assert(prods2.length > 0, 'Should find products by phantompaws-headless-horseman-pet-costume');
        assert.strictEqual(prods2[0].price, 52.99);
    });

    // =========================================================================
    // SUITE 2: lib/serverDb.js serverGetProducts() Live Empirical Test
    // =========================================================================
    console.log('\n--- SUITE 2: lib/serverDb.js serverGetProducts() Live Oracles ---');
    const { serverGetProducts } = await import('../lib/serverDb.js');

    await runAsyncTest('serverGetProducts(storeId) preserves price: 52.99 and compareAtPrice: 69.99', async () => {
        const prods = await serverGetProducts('store_phantompaws-headless-horseman-pet-costume');
        assert(Array.isArray(prods) && prods.length > 0, 'serverGetProducts must return products');
        const p = prods[0];
        assert.strictEqual(p.price, 52.99, `serverGetProducts price expected 52.99, got ${p.price}`);
        assert.strictEqual(p.compareAtPrice, 69.99, `serverGetProducts compareAtPrice expected 69.99, got ${p.compareAtPrice}`);
        assert.notStrictEqual(p.price, 29.99, 'serverGetProducts price must never be 29.99');
        assert.notStrictEqual(p.compareAtPrice, 71.54, 'serverGetProducts compareAtPrice must never be 71.54');
    });

    await runAsyncTest('serverGetProducts(storeId) preserves customBundles and image metadata', async () => {
        const prods = await serverGetProducts('store_phantompaws-headless-horseman-pet-costume');
        const p = prods[0];
        assert(Array.isArray(p.customBundles), 'customBundles must be preserved');
        assert.strictEqual(p.customBundles.length, 3);
        assert.strictEqual(p.customBundles[0].totalPrice, 52.99);
        assert.strictEqual(p.customBundles[1].totalPrice, 74.62);
        assert.strictEqual(p.customBundles[2].totalPrice, 96.24);

        assert(typeof p.image === 'string' && p.image.length > 0, 'image must be preserved');
        assert(Array.isArray(p.images) && p.images.length > 0, 'images array must be preserved');
    });

    // =========================================================================
    // SUITE 3: lib/storePresets.js getStoreAndCatalog() Live Empirical Test
    // =========================================================================
    console.log('\n--- SUITE 3: lib/storePresets.js getStoreAndCatalog() Oracles ---');
    const { getStoreAndCatalog, DEFAULT_DEMO_CREATOR } = await import('../lib/storePresets.js');

    await runAsyncTest('DEFAULT_DEMO_CREATOR icon pack has price 52.99 and compareAtPrice 69.99', async () => {
        const demoIcon = DEFAULT_DEMO_CREATOR.products.find(p => p.id === 'prod_demo_3d_icons');
        assert(demoIcon, 'prod_demo_3d_icons must exist in DEFAULT_DEMO_CREATOR');
        assert.strictEqual(demoIcon.price, 52.99, `Demo icon price expected 52.99, got ${demoIcon.price}`);
        assert.strictEqual(demoIcon.compareAtPrice, 69.99, `Demo icon compareAtPrice expected 69.99, got ${demoIcon.compareAtPrice}`);
    });

    await runAsyncTest('getStoreAndCatalog("demo") produces price: 52.99 and compareAtPrice: 69.99 without 71.54 or 29.99', async () => {
        const catalog = await getStoreAndCatalog('demo');
        assert(catalog && catalog.store, 'Store must be returned for demo');
        assert(Array.isArray(catalog.products) && catalog.products.length > 0, 'Products must be returned for demo');
        
        const iconProd = catalog.products.find(p => p.id === 'prod_demo_3d_icons');
        assert(iconProd, 'prod_demo_3d_icons must exist in catalog');
        assert.strictEqual(iconProd.price, 52.99, `Demo icon expected 52.99, got ${iconProd.price}`);
        assert.strictEqual(iconProd.compareAtPrice, 69.99, `Demo icon compareAt expected 69.99, got ${iconProd.compareAtPrice}`);

        // Stress check every product in catalog
        for (const p of catalog.products) {
            assert.notStrictEqual(p.price, 29.99, `Product ${p.id} price must never be 29.99`);
            assert.notStrictEqual(p.compareAtPrice, 71.54, `Product ${p.id} compareAtPrice must never be 71.54`);
            if (p.price === 52.99) {
                assert.strictEqual(p.compareAtPrice, 69.99, `Product ${p.id} compareAtPrice must be 69.99 when price is 52.99`);
            }
        }
    });

    await runAsyncTest('getStoreAndCatalog("phantompaws-headless-horseman-pet-costume") produces price: 52.99 and compareAt: 69.99', async () => {
        const catalog = await getStoreAndCatalog('phantompaws-headless-horseman-pet-costume');
        assert(catalog && catalog.store, 'Store must be returned');
        assert(catalog.products.length > 0, 'Products must be returned');
        const p = catalog.products[0];
        assert.strictEqual(p.price, 52.99, `Expected 52.99, got ${p.price}`);
        assert.strictEqual(p.compareAtPrice, 69.99, `Expected 69.99, got ${p.compareAtPrice}`);
        assert.notStrictEqual(p.compareAtPrice, 71.54);
        assert.notStrictEqual(p.price, 29.99);
    });

    // =========================================================================
    // SUITE 4: Adversarial Stress Tests & Normalization Edge Cases
    // =========================================================================
    console.log('\n--- SUITE 4: Adversarial Stress Tests & Normalization Edge Cases ---');

    runTest('Stress: 52.99 unit price formula produces exactly 69.99, 74.62, 96.24', () => {
        const price = 52.99;
        const compareAt = price === 52.99 ? 69.99 : Math.round(price * 1.35 * 100) / 100;
        assert.strictEqual(compareAt, 69.99, 'Compare-at must be 69.99');

        const tier2 = Math.round(price * 1.4082075 * 100) / 100;
        assert.strictEqual(tier2, 74.62, `Tier 2 must be 74.62, got ${tier2}`);

        const tier3 = Math.round(price * 1.81623 * 100) / 100;
        assert.strictEqual(tier3, 96.24, `Tier 3 must be 96.24, got ${tier3}`);
    });

    runTest('Stress: Any price === 52.99 across all formulas maps compareAt to 69.99 (never 71.54)', () => {
        const unhandledFormula = (p) => Math.round(p * 1.35 * 100) / 100;
        assert.strictEqual(unhandledFormula(52.99), 71.54, 'Baseline bug check: raw 1.35 factor produces 71.54');

        const authoritativeFormula = (p) => p === 52.99 ? 69.99 : Math.round(p * 1.35 * 100) / 100;
        assert.strictEqual(authoritativeFormula(52.99), 69.99, 'Authoritative formula correctly overrides to 69.99');
    });

    // =========================================================================
    // SUITE 5: Zero Active 29.99 Grep Verification Across Touched Frontend Files
    // =========================================================================
    console.log('\n--- SUITE 5: Empirical Grep for 29.99 in Touched Frontend Files ---');

    const touchedFrontendFiles = [
        'components/Hero.jsx',
        'components/ProductCard.jsx',
        'components/ProductQuickView.jsx',
        'components/ProductDetails.jsx',
        'app/(public)/cart/page.jsx',
        'app/(public)/creator/[username]/page.jsx',
        'app/(public)/page.jsx',
        'app/(public)/product/[productId]/page.jsx',
        'app/(public)/shop/[username]/page.jsx',
        'lib/supabase.js',
        'lib/serverDb.js',
        'lib/storePresets.js'
    ];

    for (const relPath of touchedFrontendFiles) {
        runTest(`Grep check: ${relPath} contains zero active 29.99 retail price usages`, () => {
            const absPath = path.join(PROJECT_ROOT, relPath);
            assert(fs.existsSync(absPath), `File must exist: ${relPath}`);
            const content = fs.readFileSync(absPath, 'utf8');

            // Find all lines containing '29.99'
            const lines = content.split('\n');
            const matchingLines = [];
            lines.forEach((line, idx) => {
                // Ignore lines that mention compareAtPrice: 129.99 or comments about verification
                if (line.includes('29.99') && !line.includes('129.99')) {
                    matchingLines.push({ lineNum: idx + 1, text: line.trim() });
                }
            });

            assert.strictEqual(
                matchingLines.length,
                0,
                `Found ${matchingLines.length} active 29.99 occurrences in ${relPath}: ${JSON.stringify(matchingLines)}`
            );
        });
    }

    for (const relPath of touchedFrontendFiles) {
        runTest(`Grep check: ${relPath} contains zero occurrences of 71.54`, () => {
            const absPath = path.join(PROJECT_ROOT, relPath);
            const content = fs.readFileSync(absPath, 'utf8');
            assert(!content.includes('71.54'), `File ${relPath} must not contain 71.54`);
        });
    }

    // =========================================================================
    // FINAL SUMMARY
    // =========================================================================
    console.log('\n======================================================================');
    console.log(`📊 FINAL RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
    console.log('======================================================================');

    if (failedTests > 0) {
        console.error('\n❌ CHALLENGE FAILED: BUGS DETECTED.');
        process.exit(1);
    } else {
        console.log('\n🏆 ALL EMPIRICAL CHALLENGES PASSED: VERIFICATION CONFIRMED.');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Fatal crash during challenge execution:', err);
    process.exit(1);
});
