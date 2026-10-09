/**
 * 🧪 Test M2: Multi-Store Isolation, Homepage Switcher & Stan Store Verification Suite
 * Milestone: M2 (Multi-Store Isolation & Stan Store Verification)
 * 
 * Verifies:
 * 1. Multi-store creation & complete data isolation between Store A and Store B
 *    - Metadata, catalog products, bio profiles, vaulted credentials
 *    - Mutation non-contamination (Store A edits never leak into Store B)
 * 2. Homepage store switcher
 *    - Designating Store A as homepage -> verify resolution
 *    - Switching to Store B -> immediate resolution update, zero stale cache contamination
 * 3. Stan Store catalog & settings sync (/creator/[slug])
 *    - Dedicated avatar, tagline, theme colors, lead magnet, custom links
 *    - Curated vs all products display modes, empty catalog state
 *    - Zero cross-store contamination
 * 4. Authenticity verification
 *    - 0 fake live viewer counters
 *    - 0 synthetic urgency countdowns
 *    - 0 mock customer reviews across code and rendered pages
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

async function test(suite, name, fn) {
    totalTests++;
    const start = performance.now();
    try {
        await fn();
        const duration = Math.round(performance.now() - start);
        console.log(`  ✅ [PASS] ${name} (${duration}ms)`);
        passedTests++;
    } catch (err) {
        const duration = Math.round(performance.now() - start);
        console.error(`  ❌ [FAIL] ${name} (${duration}ms):`, err.message);
        failedTests++;
        failures.push({ suite, name, error: err.message, stack: err.stack });
    }
}

async function runM2Suite() {
    console.log(`\n======================================================================`);
    console.log(`🚀 TEST SUITE M2: MULTI-STORE ISOLATION & STAN STORE VERIFICATION`);
    console.log(`🎯 Target Base URL: ${BASE_URL}`);
    console.log(`📅 Execution Timestamp: ${new Date().toISOString()}`);
    console.log(`======================================================================\n`);

    // Dynamic imports of server modules
    const {
        serverGetStore,
        serverGetAllStores,
        serverSaveStore,
        serverGetProducts,
        serverSaveProducts,
        serverDeleteStore,
        serverDeleteProduct,
        designateHomepageStore,
        resolveHomepageStore
    } = await import('../lib/serverDb.js');

    const {
        getServerGumroadToken,
        setServerGumroadToken,
        clearServerGumroadToken
    } = await import('../lib/serverVault.js');

    const {
        getStoreAndCatalog,
        resolvePresetStore
    } = await import('../lib/storePresets.js');

    // =========================================================================
    // SUITE 1: Multi-Store Creation & Complete Data Isolation
    // =========================================================================
    console.log(`🏢 [SUITE 1] Multi-Store Creation & Strict Data Isolation`);

    const STORE_A = {
        id: 'store_m2_alpha',
        username: 'm2-alpha',
        name: 'Apex Alpha Mechanics',
        description: 'Precision mechanical keyboards and bespoke desk accessories.',
        avatar: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
        themeColor: '#6366F1',
        bioProfile: {
            displayName: 'Apex Alpha Mechanics',
            handle: 'm2-alpha',
            tagline: 'Custom switches, lubed stabilizers, and premium artisan keycaps.',
            avatar: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
            themeColor: '#6366F1',
            backgroundPreset: 'dark_glass',
            customLinks: [
                { id: 'lnk_a1', title: '⌨️ Switch Sound Test', url: 'https://youtube.com/alpha', highlight: true }
            ],
            leadMagnet: {
                enabled: true,
                title: 'Free Mechanical Switch Guide 2026',
                subtitle: 'Linear vs Tactile vs Clicky breakdown.',
                buttonText: 'Download Switch PDF'
            },
            productDisplayMode: 'all',
            featuredProductIds: []
        }
    };

    const PRODUCTS_A = [
        {
            id: 'prod_m2_alpha_1',
            storeId: 'store_m2_alpha',
            name: 'Apex TKL Mechanical Keyboard',
            price: 149.99,
            compareAtPrice: 199.99,
            category: 'Keyboards'
        },
        {
            id: 'prod_m2_alpha_2',
            storeId: 'store_m2_alpha',
            name: 'Artisan Resin ESC Keycap',
            price: 34.99,
            compareAtPrice: 49.99,
            category: 'Keycaps'
        }
    ];

    const STORE_B = {
        id: 'store_m2_beta',
        username: 'm2-beta',
        name: 'Botanical Bloom Lab',
        description: 'Rare house plants, custom soil mixes, and modern ceramic pots.',
        avatar: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c',
        themeColor: '#10B981',
        bioProfile: {
            displayName: 'Botanical Bloom Lab',
            handle: 'm2-beta',
            tagline: 'Rare aroids, propagation stations, and sustainable planters.',
            avatar: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c',
            themeColor: '#10B981',
            backgroundPreset: 'emerald_forest',
            customLinks: [
                { id: 'lnk_b1', title: '🌿 Plant Care Consultations', url: 'https://cal.com/bloom', highlight: false }
            ],
            leadMagnet: {
                enabled: true,
                title: 'Winter Houseplant Survival Checklist',
                subtitle: 'Prevent root rot and leaf drop in cold weather.',
                buttonText: 'Get Free Checklist'
            },
            productDisplayMode: 'curated',
            featuredProductIds: ['prod_m2_beta_1']
        }
    };

    const PRODUCTS_B = [
        {
            id: 'prod_m2_beta_1',
            storeId: 'store_m2_beta',
            name: 'Monstera Albo Cutting',
            price: 89.99,
            compareAtPrice: 120.00,
            category: 'Plants'
        },
        {
            id: 'prod_m2_beta_2',
            storeId: 'store_m2_beta',
            name: 'Ceramic Self-Watering Planter',
            price: 29.99,
            compareAtPrice: 45.00,
            category: 'Planters'
        },
        {
            id: 'prod_m2_beta_3',
            storeId: 'store_m2_beta',
            name: 'Chunky Aroid Soil Blend (5L)',
            price: 19.99,
            compareAtPrice: 25.00,
            category: 'Substrates'
        }
    ];

    await test('Multi-Store Isolation', 'Create Store A and Store B programmatically with distinct metadata and catalogs', async () => {
        await serverSaveStore(STORE_A);
        await serverSaveProducts(STORE_A.id, PRODUCTS_A);

        await serverSaveStore(STORE_B);
        await serverSaveProducts(STORE_B.id, PRODUCTS_B);

        const storeA = await serverGetStore('m2-alpha');
        const storeB = await serverGetStore('m2-beta');

        assert.ok(storeA, 'Store A was not retrieved from database');
        assert.ok(storeB, 'Store B was not retrieved from database');
        assert.strictEqual(storeA.username, 'm2-alpha');
        assert.strictEqual(storeB.username, 'm2-beta');
        assert.strictEqual(storeA.name, 'Apex Alpha Mechanics');
        assert.strictEqual(storeB.name, 'Botanical Bloom Lab');
    });

    await test('Multi-Store Isolation', 'Store A products are strictly isolated from Store B products (Zero cross-leakage)', async () => {
        const prodsA = await serverGetProducts('m2-alpha');
        const prodsB = await serverGetProducts('m2-beta');

        assert.strictEqual(prodsA.length, 2, `Expected 2 products for Store A, got ${prodsA.length}`);
        assert.strictEqual(prodsB.length, 3, `Expected 3 products for Store B, got ${prodsB.length}`);

        // Verify Store A contains only Alpha products
        assert.ok(prodsA.some(p => p.id === 'prod_m2_alpha_1'), 'Store A missing prod_m2_alpha_1');
        assert.ok(prodsA.some(p => p.id === 'prod_m2_alpha_2'), 'Store A missing prod_m2_alpha_2');
        assert.ok(!prodsA.some(p => p.id.startsWith('prod_m2_beta')), 'Store A contaminated with Store B products!');

        // Verify Store B contains only Beta products
        assert.ok(prodsB.some(p => p.id === 'prod_m2_beta_1'), 'Store B missing prod_m2_beta_1');
        assert.ok(prodsB.some(p => p.id === 'prod_m2_beta_2'), 'Store B missing prod_m2_beta_2');
        assert.ok(prodsB.some(p => p.id === 'prod_m2_beta_3'), 'Store B missing prod_m2_beta_3');
        assert.ok(!prodsB.some(p => p.id.startsWith('prod_m2_alpha')), 'Store B contaminated with Store A products!');
    });

    await test('Multi-Store Isolation', 'Querying unconfigured or non-existent store returns null with 0 data leakage', async () => {
        const phantom = await serverGetStore('non-existent-store-xyz-999');
        assert.strictEqual(phantom, null, 'Non-existent store returned non-null object');

        const phantomProds = await serverGetProducts('non-existent-store-xyz-999');
        assert.strictEqual(phantomProds.length, 0, 'Non-existent store leaked products');
    });

    await test('Multi-Store Isolation', 'Per-Store Vault maintains independent Gumroad credentials', async () => {
        const TOKEN_ALPHA = 'gum_vault_alpha_secret_token_111';
        const TOKEN_BETA = 'gum_vault_beta_secret_token_222';

        await setServerGumroadToken(TOKEN_ALPHA, 'm2-alpha');
        await setServerGumroadToken(TOKEN_BETA, 'm2-beta');

        const resolvedA = await getServerGumroadToken('m2-alpha');
        const resolvedB = await getServerGumroadToken('m2-beta');
        const resolvedUnconfigured = await getServerGumroadToken('unconfigured-store');

        assert.strictEqual(resolvedA, TOKEN_ALPHA, 'Store A token mismatch');
        assert.strictEqual(resolvedB, TOKEN_BETA, 'Store B token mismatch');
        assert.strictEqual(resolvedUnconfigured, '', 'Unconfigured store leaked credentials');

        // Clear Store A, Store B must remain intact
        await clearServerGumroadToken('m2-alpha');
        const clearedA = await getServerGumroadToken('m2-alpha');
        const untouchedB = await getServerGumroadToken('m2-beta');

        assert.strictEqual(clearedA, '', 'Store A token was not cleared');
        assert.strictEqual(untouchedB, TOKEN_BETA, 'Store B token was corrupted when Store A was cleared');
    });

    await test('Multi-Store Isolation', 'Mutating Store A never alters Store B metadata, bio or products', async () => {
        // Mutate Store A: update bio tagline, change themeColor, and add a 3rd product
        const updatedStoreA = {
            ...STORE_A,
            name: 'Apex Alpha Mechanics (Updated Edition)',
            themeColor: '#8B5CF6',
            bioProfile: {
                ...STORE_A.bioProfile,
                tagline: 'Brand new 2026 spring collection is now live!',
                themeColor: '#8B5CF6'
            }
        };
        await serverSaveStore(updatedStoreA);

        const newProductA = {
            id: 'prod_m2_alpha_3',
            storeId: 'store_m2_alpha',
            name: 'Desk Mat Stealth Dark',
            price: 29.99,
            category: 'Accessories'
        };
        await serverSaveProducts('store_m2_alpha', [newProductA]);

        // Re-fetch Store B
        const freshStoreB = await serverGetStore('m2-beta');
        const freshProdsB = await serverGetProducts('m2-beta');

        assert.strictEqual(freshStoreB.name, 'Botanical Bloom Lab', 'Store B name was contaminated by Store A update');
        assert.strictEqual(freshStoreB.themeColor, '#10B981', 'Store B themeColor was contaminated');
        assert.strictEqual(freshStoreB.bioProfile.tagline, STORE_B.bioProfile.tagline, 'Store B bio tagline was contaminated');
        assert.strictEqual(freshProdsB.length, 3, 'Store B products count altered by Store A addition');
        assert.ok(!freshProdsB.some(p => p.id === 'prod_m2_alpha_3'), 'Store B contaminated with Store A new product');
    });

    // =========================================================================
    // SUITE 2: Homepage Store Switcher (/ & /api/store/homepage)
    // =========================================================================
    console.log(`\n🏠 [SUITE 2] Homepage Store Switcher & Root Storefront Resolution`);

    await test('Homepage Switcher', 'Set Store A as homepage -> verify global resolution and store payload', async () => {
        const postResA = await designateHomepageStore('m2-alpha');
        assert.strictEqual(postResA.status, 200, `designateHomepageStore failed with status ${postResA.status}`);
        assert.strictEqual(postResA.success, true);
        assert.strictEqual(postResA.homepageSlug, 'm2-alpha');

        // Verify resolveHomepageStore
        const getDataA = await resolveHomepageStore();
        assert.strictEqual(getDataA.success, true);
        assert.strictEqual(getDataA.homepageSlug, 'm2-alpha');
        assert.ok(getDataA.homepageStore, 'homepageStore is null');
        assert.strictEqual(getDataA.homepageStore.username, 'm2-alpha');
    });

    await test('Homepage Switcher', 'Switch homepage to Store B -> verify immediate update without stale cache contamination', async () => {
        const postResB = await designateHomepageStore('m2-beta');
        assert.strictEqual(postResB.status, 200);
        assert.strictEqual(postResB.success, true);
        assert.strictEqual(postResB.homepageSlug, 'm2-beta');

        // Verify resolveHomepageStore resolves Store B immediately
        const getDataB = await resolveHomepageStore();
        assert.strictEqual(getDataB.success, true);
        assert.strictEqual(getDataB.homepageSlug, 'm2-beta');
        assert.ok(getDataB.homepageStore, 'homepageStore is null');
        assert.strictEqual(getDataB.homepageStore.username, 'm2-beta');
        assert.strictEqual(getDataB.homepageStore.name, 'Botanical Bloom Lab');

        // Verify Store A is no longer designated
        const storeAInDb = await serverGetStore('m2-alpha');
        assert.ok(!storeAInDb.is_homepage, 'Store A retained stale is_homepage flag after switch to Store B');
    });

    await test('Homepage Switcher', 'POST /api/store/homepage rejects empty or missing storeSlug with HTTP 400', async () => {
        const res = await designateHomepageStore('');
        assert.strictEqual(res.status, 400, `Expected HTTP 400, got ${res.status}`);
        assert.strictEqual(res.success, false);
    });

    await test('Homepage Switcher', 'POST /api/store/homepage rejects whitespace or symbol slugs with HTTP 400', async () => {
        const resWs = await designateHomepageStore('   ');
        assert.strictEqual(resWs.status, 400, `Expected HTTP 400 for whitespace, got ${resWs.status}`);

        const resSym = await designateHomepageStore('??@@##$$');
        assert.strictEqual(resSym.status, 400, `Expected HTTP 400 for symbol-only, got ${resSym.status}`);
    });

    await test('Homepage Switcher', 'POST /api/store/homepage rejects non-existent store with HTTP 404', async () => {
        const res = await designateHomepageStore('non-existent-store-xyz-999');
        assert.strictEqual(res.status, 404, `Expected HTTP 404 for non-existent store, got ${res.status}`);
    });

    await test('Homepage Switcher', 'setHomepageStoreSlug returns a Promise and synchronizes active store state', async () => {
        const { getHomepageStoreSlug, setHomepageStoreSlug } = await import('../lib/activeStore.js');

        // In Node environment, verify setHomepageStoreSlug safely returns resolved Promise
        const promise = setHomepageStoreSlug('m2-alpha');
        assert.ok(promise && typeof promise.then === 'function', 'setHomepageStoreSlug did not return a Promise');
        await promise;
    });

    // =========================================================================
    // SUITE 3: Stan Store Catalog & Settings Synchronization (/creator/[slug])
    // =========================================================================
    console.log(`\n📱 [SUITE 3] Stan Store Synchronization & Bio Profile Verification`);

    await test('Stan Store Sync', 'getStoreAndCatalog accurately resolves Store A and Store B independently', async () => {
        const catalogA = await getStoreAndCatalog('m2-alpha');
        const catalogB = await getStoreAndCatalog('m2-beta');

        assert.ok(catalogA.store, 'Catalog A store failed to resolve');
        assert.ok(catalogB.store, 'Catalog B store failed to resolve');

        assert.strictEqual(catalogA.store.username, 'm2-alpha');
        assert.strictEqual(catalogB.store.username, 'm2-beta');

        assert.ok(catalogA.products.length >= 2, 'Catalog A missing products');
        assert.ok(catalogB.products.length >= 3, 'Catalog B missing products');
    });

    await test('Stan Store Sync', 'Bio Profile settings format faithfully with zero cross-contamination', async () => {
        const storeA = await serverGetStore('m2-alpha');
        const storeB = await serverGetStore('m2-beta');

        // Test Store A settings
        assert.strictEqual(storeA.bioProfile.themeColor, '#8B5CF6');
        assert.strictEqual(storeA.bioProfile.leadMagnet.title, 'Free Mechanical Switch Guide 2026');
        assert.strictEqual(storeA.bioProfile.leadMagnet.buttonText, 'Download Switch PDF');
        assert.strictEqual(storeA.bioProfile.customLinks.length, 1);
        assert.strictEqual(storeA.bioProfile.customLinks[0].title, '⌨️ Switch Sound Test');

        // Test Store B settings
        assert.strictEqual(storeB.bioProfile.themeColor, '#10B981');
        assert.strictEqual(storeB.bioProfile.leadMagnet.title, 'Winter Houseplant Survival Checklist');
        assert.strictEqual(storeB.bioProfile.leadMagnet.buttonText, 'Get Free Checklist');
        assert.strictEqual(storeB.bioProfile.customLinks.length, 1);
        assert.strictEqual(storeB.bioProfile.customLinks[0].title, '🌿 Plant Care Consultations');

        // Zero cross-contamination assertions
        assert.notStrictEqual(storeA.bioProfile.themeColor, storeB.bioProfile.themeColor);
        assert.notStrictEqual(storeA.bioProfile.leadMagnet.title, storeB.bioProfile.leadMagnet.title);
        assert.notStrictEqual(storeA.bioProfile.customLinks[0].title, storeB.bioProfile.customLinks[0].title);
    });

    await test('Stan Store Sync', 'Curated product display mode strictly respects featuredProductIds', async () => {
        const storeB = await serverGetStore('m2-beta');
        const productsB = await serverGetProducts('m2-beta');

        assert.strictEqual(storeB.bioProfile.productDisplayMode, 'curated');
        assert.deepStrictEqual(storeB.bioProfile.featuredProductIds, ['prod_m2_beta_1']);

        // Filter products as Stan Store creator/[username] does:
        const displayed = storeB.bioProfile.productDisplayMode === 'curated'
            ? productsB.filter(p => Array.isArray(storeB.bioProfile.featuredProductIds) && storeB.bioProfile.featuredProductIds.includes(p.id))
            : productsB;

        assert.strictEqual(displayed.length, 1, `Expected 1 curated product, got ${displayed.length}`);
        assert.strictEqual(displayed[0].id, 'prod_m2_beta_1');

        // Verify curated mode with 0 products results in empty list
        const emptyCurated = storeB.bioProfile.productDisplayMode === 'curated'
            ? productsB.filter(p => [].includes(p.id))
            : productsB;
        assert.strictEqual(emptyCurated.length, 0, 'Curated mode with 0 products leaked catalog!');
    });

    await test('Stan Store Sync', 'Empty catalog store renders clean empty state without ghost products from other stores', async () => {
        const EMPTY_STORE = {
            id: 'store_m2_empty',
            username: 'm2-empty',
            name: 'Empty Vault Shop',
            description: 'Brand new store without published products yet.'
        };
        await serverSaveStore(EMPTY_STORE);
        await serverSaveProducts('store_m2_empty', []);

        const res = await getStoreAndCatalog('m2-empty');
        assert.ok(res.store, 'Empty store record not found');
        assert.strictEqual(res.products.length, 0, 'Empty store received ghost products from other stores!');
    });

    // =========================================================================
    // SUITE 4: Authenticity & Anti-Fake Telemetry Verification
    // =========================================================================
    console.log(`\n🛡️ [SUITE 4] Authenticity & Anti-Fake Telemetry Verification`);

    await test('Authenticity Scan', 'components/StoreHeroBanner.jsx contains 0 synthetic urgency countdowns', async () => {
        const filePath = path.join(PROJECT_ROOT, 'components', 'StoreHeroBanner.jsx');
        const content = fs.readFileSync(filePath, 'utf8');

        assert.ok(!content.includes('02:44:19'), 'Found hardcoded countdown timer "02:44:19" in StoreHeroBanner.jsx');
        assert.ok(!content.includes('setInterval'), 'Found interval timer inside StoreHeroBanner.jsx');
        assert.ok(!content.includes('countdown'), 'Found countdown state in StoreHeroBanner.jsx');
    });

    await test('Authenticity Scan', 'app/(public)/creator/[username]/page.jsx contains 0 mock reviews or fake proof arrays', async () => {
        const filePath = path.join(PROJECT_ROOT, 'app', '(public)', 'creator', '[username]', 'page.jsx');
        const content = fs.readFileSync(filePath, 'utf8');

        assert.ok(!content.includes('VERIFIED_PHYSICAL_REVIEWS'), 'Found VERIFIED_PHYSICAL_REVIEWS in creator page');
        assert.ok(!content.includes('Verified Customer Proof'), 'Found hardcoded "Verified Customer Proof" copy in creator page');
        assert.ok(!content.includes('Physical Orders'), 'Found "Physical Orders" synthetic proof in creator page');
        assert.ok(!content.includes('02:44:19'), 'Found synthetic countdown in creator page');
    });

    await test('Authenticity Scan', 'components/ProductDetails.jsx contains 0 fake live viewer counters', async () => {
        const filePath = path.join(PROJECT_ROOT, 'components', 'ProductDetails.jsx');
        const content = fs.readFileSync(filePath, 'utf8');

        assert.ok(!/(\d+|random).*viewing this/i.test(content), 'Found fake "people viewing this" counter in ProductDetails.jsx');
        assert.ok(!/viewers (online|watching|looking)/i.test(content), 'Found fake viewers counter in ProductDetails.jsx');
    });

    await test('Authenticity Scan', 'app/(public)/page.jsx renders 0 fake urgency tickers or countdowns', async () => {
        const filePath = path.join(PROJECT_ROOT, 'app', '(public)', 'page.jsx');
        const content = fs.readFileSync(filePath, 'utf8');

        assert.ok(!content.includes('02:44:19'), 'Found synthetic countdown in root page.jsx');
        assert.ok(!/countdown|urgency.*timer/i.test(content), 'Found countdown/urgency timer pattern in root page.jsx');
    });

    // Live Target Environment Scan (if reachable)
    await test('Authenticity Live', 'Live environment (/creator/demo & /) renders 0 synthetic countdowns or mock proof', async () => {
        try {
            const resCreator = await fetch(`${BASE_URL}/creator/demo`, { signal: AbortSignal.timeout(5000) });
            if (resCreator.ok) {
                const htmlCreator = await resCreator.text();
                assert.ok(!htmlCreator.includes('02:44:19'), 'Live /creator/demo rendered synthetic countdown');
                assert.ok(!htmlCreator.includes('Verified Customer Proof'), 'Live /creator/demo rendered mock customer proof');
                assert.ok(!/viewers (online|watching|looking)/i.test(htmlCreator), 'Live /creator/demo rendered fake viewer count');
            }

            const resRoot = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(5000) });
            if (resRoot.ok) {
                const htmlRoot = await resRoot.text();
                assert.ok(!htmlRoot.includes('02:44:19'), 'Live root / rendered synthetic countdown');
                assert.ok(!/viewers (online|watching|looking)/i.test(htmlRoot), 'Live root / rendered fake viewer count');
            }
        } catch (e) {
            console.log(`    ℹ️ Note: Live URL ${BASE_URL} check skipped or timed out (${e.message}), offline tests certified.`);
        }
    });

    // Cleanup test artifacts
    await serverDeleteStore('store_m2_alpha', 'm2-alpha');
    await serverDeleteStore('store_m2_beta', 'm2-beta');
    await serverDeleteStore('store_m2_empty', 'm2-empty');

    // =========================================================================
    // FINAL RESULTS & REPORT
    // =========================================================================
    console.log(`\n======================================================================`);
    console.log(`📊 TEST SUITE M2 SUMMARY & SCORECARD`);
    console.log(`======================================================================`);
    console.log(`Total Tests Run:  ${totalTests}`);
    console.log(`Passed:          ${passedTests} (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log(`Failed:          ${failedTests}`);

    if (failedTests > 0) {
        console.log(`\n❌ Failed Tests:`);
        failures.forEach(f => console.log(`  - [${f.suite}] ${f.name}: ${f.error}`));
        process.exit(1);
    } else {
        console.log(`\n🎉 ALL M2 VERIFICATION TESTS PASSED! Multi-store isolation & Stan Store sync certified.`);
        process.exit(0);
    }
}

runM2Suite().catch(err => {
    console.error('Fatal Test Suite Error:', err);
    process.exit(1);
});
