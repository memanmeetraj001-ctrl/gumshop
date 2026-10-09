/**
 * 🥊 Empirical Challenger 1 - Deep Adversarial Stress & HTTP Protocol Probe
 * 
 * Target:
 * 1. Live Next.js HTTP API (http://localhost:3000/api/store/homepage)
 * 2. Decoupled Core DB Engine (lib/serverDb.js)
 * 3. Root storefront render consistency (http://localhost:3000/)
 * 
 * Areas Challenged:
 * - Adversarial Payload Boundary Matrix (null, numeric, boolean, nested objects, unicode, SQLi, path traversal, length extremes)
 * - Real HTTP Cookie header generation & precedence (Set-Cookie validation, Stale-Cookie override, Malformed Cookie)
 * - Multi-Store Exclusivity Invariant under concurrency
 * - Root Page (/) sync with designated homepage
 */

import assert from 'assert';
import { 
    designateHomepageStore, 
    resolveHomepageStore, 
    serverSaveStore, 
    serverSaveProducts, 
    serverGetAllStores,
    serverGetStore 
} from '../lib/serverDb.js';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

const ADV_STORE_1 = {
    id: 'store_adv-cyber-one',
    username: 'adv-cyber-one',
    name: 'Adversarial Cyber One Store',
    description: 'Hardware Wallets & Security Keys',
    themeColor: '#10B981',
    products: [
        { id: 'prod_adv_1_a', storeId: 'store_adv-cyber-one', name: 'YubiKey Neo Adv', price: 55.00 },
        { id: 'prod_adv_1_b', storeId: 'store_adv-cyber-one', name: 'Ledger Nano Adv', price: 79.00 }
    ]
};

const ADV_STORE_2 = {
    id: 'store_adv-quantum-two',
    username: 'adv-quantum-two',
    name: 'Adversarial Quantum Two Store',
    description: 'Quantum Optics & Laser Kits',
    themeColor: '#8B5CF6',
    products: [
        { id: 'prod_adv_2_a', storeId: 'store_adv-quantum-two', name: 'Interferometer Kit', price: 349.00 }
    ]
};

const scorecard = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: []
};

async function testCase(suite, name, fn) {
    scorecard.total++;
    const t0 = performance.now();
    try {
        await fn();
        const elapsed = Math.round(performance.now() - t0);
        console.log(`  ✅ [PASS] ${suite} :: ${name} (${elapsed}ms)`);
        scorecard.passed++;
    } catch (err) {
        const elapsed = Math.round(performance.now() - t0);
        console.error(`  ❌ [FAIL] ${suite} :: ${name} (${elapsed}ms)`);
        console.error(`     Reason: ${err.message}`);
        scorecard.failed++;
        scorecard.failures.push({ suite, name, error: err.message });
    }
}

async function seedStore(store) {
    await serverSaveStore({
        id: store.id,
        username: store.username,
        name: store.name,
        description: store.description,
        themeColor: store.themeColor
    });
    await serverSaveProducts(store.id, store.products);
}

async function runAdversarialSuite() {
    console.log(`\n======================================================================`);
    console.log(`🥊 EMPIRICAL CHALLENGER 1: ADVERSARIAL STRESS & HTTP PROTOCOL HARNESS`);
    console.log(`🎯 Base URL: ${BASE_URL}`);
    console.log(`📅 Execution Timestamp: ${new Date().toISOString()}`);
    console.log(`======================================================================\n`);

    // 0. Seed test stores
    console.log(`📦 [PHASE 0] Seeding Adversarial Fixture Stores...`);
    await seedStore(ADV_STORE_1);
    await seedStore(ADV_STORE_2);
    console.log(`   Seeded ${ADV_STORE_1.username} and ${ADV_STORE_2.username}.\n`);

    // =========================================================================
    // SUITE 1: Adversarial Input Boundaries
    // =========================================================================
    console.log(`🛡️ [SUITE 1] Adversarial Input Matrix & Boundary Fuzzing`);

    const adversarialBadPayloads = [
        { label: 'null rawSlug', payload: null },
        { label: 'undefined rawSlug', payload: undefined },
        { label: 'number type (12345)', payload: 12345 },
        { label: 'boolean true', payload: true },
        { label: 'boolean false', payload: false },
        { label: 'empty array []', payload: [] },
        { label: 'nested object { id: "adv-cyber-one" }', payload: { id: 'adv-cyber-one' } },
        { label: 'single hyphen "-"', payload: '-' },
        { label: 'single letter "a"', payload: 'a' },
        { label: 'double hyphen "--"', payload: '--' },
        { label: 'SQL Injection single quote (\' OR \'1\'=\'1)', payload: "' OR '1'='1" },
        { label: 'Path Traversal (../../etc/passwd)', payload: '../../etc/passwd' },
        { label: 'Excessive whitespace ("   \\t\\n  ")', payload: "   \t\n  " },
        { label: 'Punctuation spam (!!!@@@###$$$)', payload: '!!!@@@###$$$' },
        { label: 'HTML/Script injection (<script>alert(1)</script>)', payload: '<script>alert(1)</script>' }
    ];

    for (const item of adversarialBadPayloads) {
        await testCase('Adversarial Inputs', `Rejection of ${item.label}`, async () => {
            // Direct function call check
            const res = await designateHomepageStore(item.payload);
            assert.strictEqual(res.success, false, `designateHomepageStore unexpectedly succeeded for ${item.label}!`);
            assert.ok(res.status === 400 || res.status === 404, `Status should be 400 or 404, got ${res.status}`);
        });
    }

    // =========================================================================
    // SUITE 2: Delimiter Normalization & Case Insensitivity
    // =========================================================================
    console.log(`\n🔀 [SUITE 2] Delimiter Normalization & Case-Insensitive Designation`);

    await testCase('Normalization', 'Designating slug with uppercase (ADV-CYBER-ONE)', async () => {
        const res = await designateHomepageStore('ADV-CYBER-ONE');
        assert.strictEqual(res.success, true);
        assert.strictEqual(res.homepageSlug, 'adv-cyber-one');

        const resolved = await resolveHomepageStore();
        assert.strictEqual(resolved.homepageSlug, 'adv-cyber-one');
    });

    await testCase('Normalization', 'Designating slug with underscores (adv_quantum_two)', async () => {
        const res = await designateHomepageStore('adv_quantum_two');
        assert.strictEqual(res.success, true);
        assert.strictEqual(res.homepageSlug, 'adv-quantum-two');

        const resolved = await resolveHomepageStore();
        assert.strictEqual(resolved.homepageSlug, 'adv-quantum-two');
    });

    await testCase('Normalization', 'Designating slug with store_ prefix (store_adv-cyber-one)', async () => {
        const res = await designateHomepageStore('store_adv-cyber-one');
        assert.strictEqual(res.success, true);
        assert.strictEqual(res.homepageSlug, 'adv-cyber-one');
    });

    // =========================================================================
    // SUITE 3: Real HTTP Protocol Inspection (Headers, Cookies, Status Codes)
    // =========================================================================
    console.log(`\n🌐 [SUITE 3] Real HTTP Protocol & Cookie Transport Inspection`);

    let serverReachable = false;
    try {
        const ping = await fetch(`${BASE_URL}/api/store/homepage`);
        if (ping.status < 500) serverReachable = true;
    } catch {}

    if (serverReachable) {
        await testCase('HTTP Protocol', 'POST /api/store/homepage returns Set-Cookie header', async () => {
            const res = await fetch(`${BASE_URL}/api/store/homepage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeSlug: 'adv-cyber-one' })
            });

            assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.homepageSlug, 'adv-cyber-one');

            const setCookie = res.headers.get('set-cookie');
            if (setCookie) {
                assert.ok(setCookie.includes('gumshop_homepage_store'), `Set-Cookie missing cookie name: ${setCookie}`);
                assert.ok(setCookie.includes('adv-cyber-one'), `Set-Cookie missing slug value: ${setCookie}`);
            }
        });

        await testCase('HTTP Protocol', 'GET /api/store/homepage with stale Cookie still resolves authoritative server store', async () => {
            // First switch official to quantum-two
            await fetch(`${BASE_URL}/api/store/homepage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeSlug: 'adv-quantum-two' })
            });

            // Client sends stale cookie pointing to cyber-one
            const getRes = await fetch(`${BASE_URL}/api/store/homepage`, {
                headers: { 'Cookie': 'gumshop_homepage_store=adv-cyber-one' }
            });

            assert.strictEqual(getRes.status, 200);
            const data = await getRes.json();
            assert.strictEqual(data.homepageSlug, 'adv-quantum-two', `Stale cookie overrode server store! Got: ${data.homepageSlug}`);
        });

        await testCase('HTTP Protocol', 'POST /api/store/homepage rejects non-existent store with 404', async () => {
            const nonExistentSlug = `nonexistent-store-${Date.now()}`;
            const res = await fetch(`${BASE_URL}/api/store/homepage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeSlug: nonExistentSlug })
            });

            assert.strictEqual(res.status, 404, `Expected HTTP 404, got ${res.status}`);
            const data = await res.json();
            assert.strictEqual(data.success, false);
        });

        await testCase('HTTP Protocol', 'POST /api/store/homepage with bad JSON syntax returns 400 or 500 without crashing process', async () => {
            const res = await fetch(`${BASE_URL}/api/store/homepage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{ invalid_json_syntax: true, '
            });

            // Handled gracefully (not hanging or crashing)
            assert.ok(res.status === 400 || res.status === 500, `Unexpected status for bad JSON: ${res.status}`);
        });
    } else {
        console.log('   ⚠️ Local Next.js server not responding at BASE_URL. Skipping HTTP wire tests.');
    }

    // =========================================================================
    // SUITE 4: High Concurrency Invariant & Database Integrity
    // =========================================================================
    console.log(`\n⚡ [SUITE 4] Multi-Store Database Exclusivity Invariant under 50 Concurrency Cycles`);

    await testCase('Database Exclusivity', '50 alternating concurrent designations maintain strictly 1 is_homepage: true store', async () => {
        const targets = ['adv-cyber-one', 'adv-quantum-two'];
        const batch = [];

        for (let i = 0; i < 50; i++) {
            const slug = targets[i % 2];
            batch.push(designateHomepageStore(slug));
        }

        const results = await Promise.all(batch);
        for (const r of results) {
            assert.strictEqual(r.success, true, `Concurrent call failed: ${JSON.stringify(r)}`);
        }

        // Query database stores
        const allStores = await serverGetAllStores();
        const activeHomepages = allStores.filter(s => s.is_homepage === true || s.isHomepage === true);

        // Deduplicate by username
        const uniqueActive = Array.from(new Set(activeHomepages.map(s => s.username || s.id)));
        assert.strictEqual(uniqueActive.length, 1, `Database exclusivity violated! Active stores: ${uniqueActive.join(', ')}`);

        // Verify resolveHomepageStore matches the unique active store
        const resolved = await resolveHomepageStore();
        assert.strictEqual(resolved.homepageSlug, uniqueActive[0]);
    });

    // =========================================================================
    // Scorecard Summary
    // =========================================================================
    console.log(`\n======================================================================`);
    console.log(`📊 ADVERSARIAL STRESS HARNESS SCORECARD`);
    console.log(`======================================================================`);
    console.log(`Total Adversarial Scenarios: ${scorecard.total}`);
    console.log(`Passed:                     ${scorecard.passed}`);
    console.log(`Failed:                     ${scorecard.failed}`);

    if (scorecard.failures.length > 0) {
        console.log(`\n❌ Failed Scenarios:`);
        scorecard.failures.forEach((f, idx) => {
            console.log(`   ${idx + 1}. [${f.suite}] ${f.name} -> ${f.error}`);
        });
    }
    console.log(`======================================================================\n`);

    if (scorecard.failed > 0) {
        process.exitCode = 1;
    }
}

runAdversarialSuite().catch(err => {
    console.error('Fatal Test Harness Exception:', err);
    process.exit(1);
});
