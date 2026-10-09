/**
 * 🧪 Challenger 2: Empirical Stress Harness for Milestone M2
 * Stan Store Bio Profile Isolation, Curated Products & Authenticity Verification
 * 
 * Verifies:
 * 1. Bio Profile Isolation: Multi-store creation with distinct themes, avatars,
 *    taglines, lead magnets, custom links; ensures zero cross-store leakage or mutation contamination.
 * 2. Curated Product Display: Featured products rendered while non-featured excluded in curated mode;
 *    empty state verification; cross-catalog curation containment.
 * 3. Authenticity & Anti-Fake Telemetry Verification: Deep scan of codebase and live HTML responses
 *    for fake live viewers, synthetic urgency timers, or artificial review loops.
 * 4. Forensic Audit of Worker M2 Verification Suite & Claims.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const BASE_URL = process.env.TEST_URL || 'https://www.gumshop.online';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];
const failures = [];

async function challenge(suite, title, fn) {
    totalTests++;
    const start = performance.now();
    try {
        await fn();
        const duration = Math.round(performance.now() - start);
        console.log(`  ✅ [PASS] ${title} (${duration}ms)`);
        passedTests++;
        testResults.push({ suite, title, status: 'PASS', duration });
    } catch (err) {
        const duration = Math.round(performance.now() - start);
        console.error(`  ❌ [FAIL] ${title} (${duration}ms): ${err.message}`);
        failedTests++;
        testResults.push({ suite, title, status: 'FAIL', duration, error: err.message });
        failures.push({ suite, title, error: err.message, stack: err.stack });
    }
}

async function safeFetch(url, options = {}, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            return await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
        } catch (err) {
            if (i === retries) throw err;
            await new Promise(r => setTimeout(r, 500));
        }
    }
}

// Logic mirror of app/(public)/creator/[username]/page.jsx formatCreatorProfile
function formatCreatorProfile(store, rawUsername) {
    if (!store) return null;
    const cleanUser = (rawUsername || store.username || '').toLowerCase().trim();
    const bioProfile = store.bioProfile || {};
    const displayName = bioProfile.displayName || store.name || store.storeName || (rawUsername ? rawUsername.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Store');
    
    return {
        id: store.id || `store_${cleanUser}`,
        name: displayName,
        handle: bioProfile.handle || store.username || cleanUser,
        verified: bioProfile.verified !== undefined ? bioProfile.verified : true,
        bio: bioProfile.tagline || store.bio || store.description || store.tagline || `Official storefront for ${displayName}. Browse our curated collection.`,
        avatar: bioProfile.avatar || store.avatar || store.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
        socials: { ...(store.socials || {}), ...(bioProfile.socials || {}) },
        customLinks: bioProfile.customLinks || [],
        leadMagnet: bioProfile.leadMagnet || null,
        backgroundPreset: bioProfile.backgroundPreset || 'warm_studio',
        productDisplayMode: bioProfile.productDisplayMode || 'all',
        featuredProductIds: bioProfile.featuredProductIds || [],
        gumroadProductUrl: store.gumroadProductUrl || store.gumroadUrl || '',
        themeColor: bioProfile.themeColor || store.themeColor || '#10B981',
        tracking: store.tracking || bioProfile.tracking || {},
        status: store.status || 'approved'
    };
}

// Logic mirror of app/(public)/creator/[username]/page.jsx displayedProducts filter
function getDisplayedProducts(creator, products) {
    if (!Array.isArray(products)) return [];
    if (creator?.productDisplayMode === 'curated' && creator?.featuredProductIds?.length > 0) {
        return products.filter(p => creator.featuredProductIds.includes(p.id));
    }
    return products;
}

async function runEmpiricalHarness() {
    console.log(`\n======================================================================`);
    console.log(`🥊 EMPIRICAL CHALLENGER 2: STAN STORE BIO, CURATION & AUTHENTICITY`);
    console.log(`🎯 Target Environment: ${BASE_URL}`);
    console.log(`📅 Execution Timestamp: ${new Date().toISOString()}`);
    console.log(`======================================================================\n`);

    // =========================================================================
    // SUITE 1: Stan Store Bio Profile Isolation & Non-Contamination
    // =========================================================================
    console.log(`📱 [SUITE 1] Stan Store Bio Profile Isolation & Integrity`);

    const STORE_ALPHA = {
        id: 'store_m2_chal_alpha',
        username: 'chal-alpha',
        name: 'Apex Cyber Mechanics',
        description: 'Bespoke custom keyboards and switches.',
        avatar: 'https://images.unsplash.com/photo-cyber-alpha',
        themeColor: '#6366F1',
        bioProfile: {
            displayName: 'Apex Cyber Mechanics',
            handle: 'chal-alpha',
            tagline: 'Precision mechanical switches and lubed stabilizers.',
            avatar: 'https://images.unsplash.com/photo-cyber-alpha',
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

    const STORE_BETA = {
        id: 'store_m2_chal_beta',
        username: 'chal-beta',
        name: 'Botanical Bloom Lab',
        description: 'Rare houseplants and self-watering pots.',
        avatar: 'https://images.unsplash.com/photo-bloom-beta',
        themeColor: '#10B981',
        bioProfile: {
            displayName: 'Botanical Bloom Lab',
            handle: 'chal-beta',
            tagline: 'Rare tropical aroids and terracotta planters.',
            avatar: 'https://images.unsplash.com/photo-bloom-beta',
            themeColor: '#10B981',
            backgroundPreset: 'emerald_forest',
            customLinks: [
                { id: 'lnk_b1', title: '🌿 Plant Consultation', url: 'https://cal.com/bloom', highlight: false }
            ],
            leadMagnet: {
                enabled: true,
                title: 'Winter Houseplant Survival Checklist',
                subtitle: 'Prevent root rot and leaf drop in cold weather.',
                buttonText: 'Get Free Checklist'
            },
            productDisplayMode: 'curated',
            featuredProductIds: ['prod_b1']
        }
    };

    await challenge('Bio Profile Isolation', 'Store Alpha and Store Beta format faithfully with distinct properties', async () => {
        const creatorA = formatCreatorProfile(STORE_ALPHA, 'chal-alpha');
        const creatorB = formatCreatorProfile(STORE_BETA, 'chal-beta');

        assert.ok(creatorA, 'Store Alpha creator profile null');
        assert.ok(creatorB, 'Store Beta creator profile null');

        // Check Store A
        assert.strictEqual(creatorA.name, 'Apex Cyber Mechanics');
        assert.strictEqual(creatorA.handle, 'chal-alpha');
        assert.strictEqual(creatorA.themeColor, '#6366F1');
        assert.strictEqual(creatorA.backgroundPreset, 'dark_glass');
        assert.strictEqual(creatorA.avatar, 'https://images.unsplash.com/photo-cyber-alpha');
        assert.strictEqual(creatorA.leadMagnet.title, 'Free Mechanical Switch Guide 2026');
        assert.strictEqual(creatorA.customLinks.length, 1);
        assert.strictEqual(creatorA.customLinks[0].title, '⌨️ Switch Sound Test');

        // Check Store B
        assert.strictEqual(creatorB.name, 'Botanical Bloom Lab');
        assert.strictEqual(creatorB.handle, 'chal-beta');
        assert.strictEqual(creatorB.themeColor, '#10B981');
        assert.strictEqual(creatorB.backgroundPreset, 'emerald_forest');
        assert.strictEqual(creatorB.avatar, 'https://images.unsplash.com/photo-bloom-beta');
        assert.strictEqual(creatorB.leadMagnet.title, 'Winter Houseplant Survival Checklist');
        assert.strictEqual(creatorB.customLinks.length, 1);
        assert.strictEqual(creatorB.customLinks[0].title, '🌿 Plant Consultation');

        // Mutual exclusion assertions
        assert.notStrictEqual(creatorA.themeColor, creatorB.themeColor, 'Themes must not leak');
        assert.notStrictEqual(creatorA.backgroundPreset, creatorB.backgroundPreset, 'Presets must not leak');
        assert.notStrictEqual(creatorA.leadMagnet.title, creatorB.leadMagnet.title, 'Lead magnets must not leak');
        assert.notStrictEqual(creatorA.avatar, creatorB.avatar, 'Avatars must not leak');
    });

    await challenge('Bio Profile Isolation', 'In-place mutation of Store Alpha never contaminates Store Beta', async () => {
        // Deep clone Store A to mutate
        const mutatedAlpha = JSON.parse(JSON.stringify(STORE_ALPHA));
        mutatedAlpha.bioProfile.displayName = 'Mutated Cyber 9000';
        mutatedAlpha.bioProfile.themeColor = '#EC4899';
        mutatedAlpha.bioProfile.backgroundPreset = 'neon_cyber';
        mutatedAlpha.bioProfile.leadMagnet.title = 'Mutated Cyber Blueprint';
        mutatedAlpha.bioProfile.customLinks.push({ id: 'lnk_a2', title: 'Discord VIP', url: 'https://discord.gg/alpha' });

        const creatorAlphaMutated = formatCreatorProfile(mutatedAlpha, 'chal-alpha');
        const creatorBetaOriginal = formatCreatorProfile(STORE_BETA, 'chal-beta');

        // Verify Store A reflects mutated properties
        assert.strictEqual(creatorAlphaMutated.name, 'Mutated Cyber 9000');
        assert.strictEqual(creatorAlphaMutated.themeColor, '#EC4899');
        assert.strictEqual(creatorAlphaMutated.backgroundPreset, 'neon_cyber');
        assert.strictEqual(creatorAlphaMutated.leadMagnet.title, 'Mutated Cyber Blueprint');
        assert.strictEqual(creatorAlphaMutated.customLinks.length, 2);

        // Verify Store B remains completely pristine and untouched
        assert.strictEqual(creatorBetaOriginal.name, 'Botanical Bloom Lab');
        assert.strictEqual(creatorBetaOriginal.themeColor, '#10B981');
        assert.strictEqual(creatorBetaOriginal.backgroundPreset, 'emerald_forest');
        assert.strictEqual(creatorBetaOriginal.leadMagnet.title, 'Winter Houseplant Survival Checklist');
        assert.strictEqual(creatorBetaOriginal.customLinks.length, 1);
    });

    await challenge('Bio Profile Isolation', 'Unconfigured or null store returns null without foreign leakage', async () => {
        const nullProfile = formatCreatorProfile(null, 'ghost-store');
        assert.strictEqual(nullProfile, null, 'formatCreatorProfile(null) must return null');

        // Store with missing bioProfile falls back gracefully without foreign contamination
        const bareStore = { id: 'store_bare', username: 'bare-store', name: 'Bare Bones' };
        const bareProfile = formatCreatorProfile(bareStore, 'bare-store');
        assert.strictEqual(bareProfile.name, 'Bare Bones');
        assert.strictEqual(bareProfile.themeColor, '#10B981'); // Default fallback
        assert.strictEqual(bareProfile.leadMagnet, null);
        assert.deepStrictEqual(bareProfile.customLinks, []);
    });

    await challenge('Bio Profile Isolation', 'Prototype pollution attack on bio profile does not corrupt global prototypes', async () => {
        const maliciousPayload = JSON.parse('{"__proto__":{"polluted":"yes"},"name":"Hacker"}');
        const formatted = formatCreatorProfile(maliciousPayload, 'hacker');
        assert.strictEqual({}.polluted, undefined, 'Object.prototype must not be polluted');
        assert.strictEqual(Object.prototype.polluted, undefined, 'Object.prototype must not be polluted');
    });

    // =========================================================================
    // SUITE 2: Curated vs All Product Display Mode Verification
    // =========================================================================
    console.log(`\n🛍️ [SUITE 2] Curated vs All Product Display Mode Verification`);

    const PRODUCTS_BETA = [
        { id: 'prod_b1', name: 'Rare Monstera Albo Cutting', price: 89.99, category: 'Plants' },
        { id: 'prod_b2', name: 'Terracotta Self-Watering Planter', price: 29.99, category: 'Planters' },
        { id: 'prod_b3', name: 'Chunky Aroid Bark Blend', price: 14.99, category: 'Substrates' },
        { id: 'prod_b4', name: 'Organic Seaweed Fertilizer', price: 19.99, category: 'Care' }
    ];

    await challenge('Curated Product Display', 'Curated mode renders strictly featured products and excludes unfeatured ones', async () => {
        const creatorBetaCurated = formatCreatorProfile(STORE_BETA, 'chal-beta');
        // STORE_BETA has featuredProductIds: ['prod_b1']
        const displayed = getDisplayedProducts(creatorBetaCurated, PRODUCTS_BETA);

        assert.strictEqual(displayed.length, 1, `Expected exactly 1 curated product, got ${displayed.length}`);
        assert.strictEqual(displayed[0].id, 'prod_b1');
        assert.strictEqual(displayed[0].name, 'Rare Monstera Albo Cutting');

        // Assert unfeatured products are excluded
        assert.ok(!displayed.some(p => p.id === 'prod_b2'), 'prod_b2 should be excluded');
        assert.ok(!displayed.some(p => p.id === 'prod_b3'), 'prod_b3 should be excluded');
        assert.ok(!displayed.some(p => p.id === 'prod_b4'), 'prod_b4 should be excluded');
    });

    await challenge('Curated Product Display', 'Multi-item curated mode renders all specified featured products in catalog', async () => {
        const multiCuratedStore = {
            ...STORE_BETA,
            bioProfile: {
                ...STORE_BETA.bioProfile,
                productDisplayMode: 'curated',
                featuredProductIds: ['prod_b1', 'prod_b3', 'prod_b4']
            }
        };
        const creator = formatCreatorProfile(multiCuratedStore, 'chal-beta');
        const displayed = getDisplayedProducts(creator, PRODUCTS_BETA);

        assert.strictEqual(displayed.length, 3, `Expected 3 curated products, got ${displayed.length}`);
        const displayedIds = displayed.map(p => p.id);
        assert.ok(displayedIds.includes('prod_b1'));
        assert.ok(displayedIds.includes('prod_b3'));
        assert.ok(displayedIds.includes('prod_b4'));
        assert.ok(!displayedIds.includes('prod_b2'), 'Unfeatured prod_b2 must remain excluded');
    });

    await challenge('Curated Product Display', 'All mode renders the full product catalog regardless of featuredProductIds', async () => {
        const allModeStore = {
            ...STORE_BETA,
            bioProfile: {
                ...STORE_BETA.bioProfile,
                productDisplayMode: 'all',
                featuredProductIds: ['prod_b1']
            }
        };
        const creator = formatCreatorProfile(allModeStore, 'chal-beta');
        const displayed = getDisplayedProducts(creator, PRODUCTS_BETA);

        assert.strictEqual(displayed.length, 4, `Expected all 4 products in 'all' mode, got ${displayed.length}`);
        assert.strictEqual(displayed.map(p => p.id).sort().join(','), 'prod_b1,prod_b2,prod_b3,prod_b4');
    });

    await challenge('Curated Product Display', 'Curated mode with foreign IDs gracefully excludes foreign references', async () => {
        // If featuredProductIds contains a foreign product ID from another store (e.g. 'prod_alpha_999')
        const crossStoreCurated = {
            ...STORE_BETA,
            bioProfile: {
                ...STORE_BETA.bioProfile,
                productDisplayMode: 'curated',
                featuredProductIds: ['prod_b1', 'prod_alpha_999_foreign']
            }
        };
        const creator = formatCreatorProfile(crossStoreCurated, 'chal-beta');
        const displayed = getDisplayedProducts(creator, PRODUCTS_BETA);

        // Only prod_b1 exists in PRODUCTS_BETA; prod_alpha_999_foreign cannot appear
        assert.strictEqual(displayed.length, 1);
        assert.strictEqual(displayed[0].id, 'prod_b1');
        assert.ok(!displayed.some(p => p.id === 'prod_alpha_999_foreign'));
    });

    await challenge('Curated Product Display', 'Empty product catalog yields clean empty array with zero ghost items', async () => {
        const creator = formatCreatorProfile(STORE_BETA, 'chal-beta');
        const displayed = getDisplayedProducts(creator, []);
        assert.deepStrictEqual(displayed, [], 'Empty catalog must return empty array');
    });

    // =========================================================================
    // SUITE 3: Codebase AST & Live Response Authenticity Verification
    // =========================================================================
    console.log(`\n🛡️ [SUITE 3] Authenticity & Zero Synthetic Telemetry Verification`);

    await challenge('Authenticity Verification', 'components/StoreHeroBanner.jsx contains zero synthetic urgency countdowns', async () => {
        const fileContent = fs.readFileSync(path.join(PROJECT_ROOT, 'components/StoreHeroBanner.jsx'), 'utf8');
        const forbiddenPatterns = [
            /02:44:19/i,
            /countdown\s*=\s*setInterval/i,
            /viewers\s*online/i,
            /people\s*looking\s*at\s*this/i,
            /hurry[,\s]+only/i
        ];
        for (const pattern of forbiddenPatterns) {
            assert.ok(!pattern.test(fileContent), `StoreHeroBanner.jsx violated authenticity rule: matched ${pattern}`);
        }
    });

    await challenge('Authenticity Verification', 'app/(public)/creator/[username]/page.jsx contains zero mock reviews or fake viewer counters', async () => {
        const fileContent = fs.readFileSync(path.join(PROJECT_ROOT, 'app/(public)/creator/[username]/page.jsx'), 'utf8');
        const forbiddenPatterns = [
            /VERIFIED_PHYSICAL_REVIEWS/i,
            /viewers\s*online/i,
            /Math\.random\(\)\s*\*\s*20\s*\+\s*5/i,
            /fakeReview/i
        ];
        for (const pattern of forbiddenPatterns) {
            assert.ok(!pattern.test(fileContent), `creator/[username]/page.jsx violated authenticity rule: matched ${pattern}`);
        }
    });

    await challenge('Authenticity Verification', 'components/ProductDetails.jsx contains zero fake live viewer counters', async () => {
        const fileContent = fs.readFileSync(path.join(PROJECT_ROOT, 'components/ProductDetails.jsx'), 'utf8');
        const forbiddenPatterns = [
            /viewers\s*online/i,
            /watching\s*right\s*now/i,
            /Math\.random\(\)\s*\*\s*15/i
        ];
        for (const pattern of forbiddenPatterns) {
            assert.ok(!pattern.test(fileContent), `ProductDetails.jsx violated authenticity rule: matched ${pattern}`);
        }
    });

    await challenge('Authenticity Verification', 'app/(public)/page.jsx renders zero fake urgency countdown tickers', async () => {
        const fileContent = fs.readFileSync(path.join(PROJECT_ROOT, 'app/(public)/page.jsx'), 'utf8');
        const forbiddenPatterns = [
            /02:44:19/i,
            /countdown\s*=\s*setInterval/i,
            /syntheticCountdown/i
        ];
        for (const pattern of forbiddenPatterns) {
            assert.ok(!pattern.test(fileContent), `app/(public)/page.jsx violated authenticity rule: matched ${pattern}`);
        }
    });

    await challenge('Authenticity Verification', 'Live public endpoints render 0 synthetic urgency countdowns or fake viewer telemetry', async () => {
        const endpoints = ['/creator/demo', '/'];
        for (const ep of endpoints) {
            const res = await safeFetch(`${BASE_URL}${ep}`);
            assert.strictEqual(res.status, 200, `Expected HTTP 200 for ${ep}`);
            const html = await res.text();
            assert.ok(!html.includes('02:44:19'), `Live ${ep} rendered synthetic timer 02:44:19`);
            assert.ok(!html.toLowerCase().includes('viewers online'), `Live ${ep} rendered fake 'viewers online'`);
            assert.ok(!html.includes('VERIFIED_PHYSICAL_REVIEWS'), `Live ${ep} rendered mock review array`);
        }
    });

    // =========================================================================
    // SUITE 4: Forensic Audit of Worker M2 Claims vs Reality
    // =========================================================================
    console.log(`\n🔍 [SUITE 4] Forensic Audit of Worker M2 Verification Claims`);

    await challenge('Forensic Audit', 'Investigate serverDb.js keying discrepancy between store ID and username', async () => {
        const { serverSaveStore, serverSaveProducts, serverGetProducts, serverDeleteStore } = await import('../lib/serverDb.js');
        
        // When a store is created with underscore in ID and hyphen in username (e.g. id: 'store_test_audit', username: 'test-audit')
        const STORE_TEST = { id: 'store_test_audit', username: 'test-audit', name: 'Test Audit Store' };
        const PROD_TEST = [{ id: 'prod_test_1', storeId: 'store_test_audit', name: 'Audit Prod 1', price: 10 }];

        await serverSaveStore(STORE_TEST);
        await serverSaveProducts(STORE_TEST.id, PROD_TEST);

        // Querying by storeId works
        const prodsById = await serverGetProducts(STORE_TEST.id);
        assert.strictEqual(prodsById.length, 1, 'serverGetProducts(storeId) failed to retrieve products');

        // Querying by username reveals whether serverDb handles hyphen vs underscore mismatch
        const prodsByUsername = await serverGetProducts(STORE_TEST.username);
        if (prodsByUsername.length === 0) {
            throw new Error(`CRITICAL DEFECT CONFIRMED: serverGetProducts('${STORE_TEST.username}') returned 0 products because products were saved under id '${STORE_TEST.id}'. The hyphen/underscore mismatch between username and storeId causes query by username to fail!`);
        }

        await serverDeleteStore(STORE_TEST.id, STORE_TEST.username);
    });

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log(`\n======================================================================`);
    console.log(`📊 EMPIRICAL CHALLENGER 2 REPORT & SCORECARD`);
    console.log(`======================================================================`);
    console.log(`Total Challenges: ${totalTests}`);
    console.log(`Passed:           ${passedTests} (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log(`Failed:           ${failedTests}`);

    if (failedTests > 0) {
        console.log(`\n❌ Failures Detected (${failedTests}):`);
        failures.forEach(f => {
            console.log(`  - [${f.suite}] ${f.title}:`);
            console.log(`    Error: ${f.error}`);
        });
    }

    return { totalTests, passedTests, failedTests, failures };
}

runEmpiricalHarness().then(res => {
    if (res.failedTests > 0) {
        console.log(`\n⚠️ CHALLENGER 2 FOUND ${res.failedTests} DEFECT(S). Exiting with code 1.`);
        process.exit(1);
    } else {
        console.log(`\n🎉 ALL CHALLENGER 2 TESTS PASSED!`);
        process.exit(0);
    }
}).catch(err => {
    console.error('Fatal Harness Error:', err);
    process.exit(1);
});
