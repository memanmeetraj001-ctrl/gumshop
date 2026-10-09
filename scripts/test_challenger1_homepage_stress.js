/**
 * 🧪 Challenger 1: Empirical Homepage Switcher & Cache Consistency Stress Harness
 * 
 * Objectives:
 * 1. Rapid Alternating Switch (Store A -> Store B -> Store C, 30 cycles)
 *    - Verify immediate resolution on GET /api/store/homepage
 *    - Verify zero cross-store product or metadata contamination
 *    - Verify single-store is_homepage exclusivity in database
 * 2. High-Concurrency Race Condition Stress (30 simultaneous switches)
 *    - Detect race conditions, multi-store is_homepage conflicts, or 500 crashes
 * 3. Cookie Poisoning & Cache Invalidation Inspection
 *    - Examine whether client cookies override server homepage designation
 * 4. Input Validation & Phantom Store Injection Attacks
 *    - Test empty slug, whitespace slug, symbol-only slug, and non-existent slug
 */

import assert from 'assert';
import { 
    designateHomepageStore, 
    resolveHomepageStore, 
    serverSaveStore, 
    serverSaveProducts, 
    serverGetAllStores 
} from '../lib/serverDb.js';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

const STORE_ALPHA = {
    id: 'store_ch1-alpha',
    username: 'ch1-alpha',
    name: 'Challenger Alpha Store',
    description: 'Alpha High Performance Mechanicals',
    themeColor: '#4F46E5',
    products: [
        { id: 'prod_ch1_a1', storeId: 'store_ch1-alpha', name: 'Alpha Mechanical Keyboard', price: 129.99 },
        { id: 'prod_ch1_a2', storeId: 'store_ch1-alpha', name: 'Alpha Custom Cable', price: 29.99 }
    ]
};

const STORE_BETA = {
    id: 'store_ch1-beta',
    username: 'ch1-beta',
    name: 'Challenger Beta Store',
    description: 'Beta Botanical & Indoor Plants',
    themeColor: '#059669',
    products: [
        { id: 'prod_ch1_b1', storeId: 'store_ch1-beta', name: 'Beta Monstera Variegata', price: 89.99 },
        { id: 'prod_ch1_b2', storeId: 'store_ch1-beta', name: 'Beta Terracotta Pot', price: 24.99 },
        { id: 'prod_ch1_b3', storeId: 'store_ch1-beta', name: 'Beta Organic Fertilizer', price: 14.99 }
    ]
};

const STORE_GAMMA = {
    id: 'store_ch1-gamma',
    username: 'ch1-gamma',
    name: 'Challenger Gamma Store',
    description: 'Gamma Artisanal Coffee Roasters',
    themeColor: '#D97706',
    products: [
        { id: 'prod_ch1_g1', storeId: 'store_ch1-gamma', name: 'Gamma Ethiopian Yirgacheffe Beans', price: 22.00 }
    ]
};

const results = {
    total: 0,
    passed: 0,
    failed: 0,
    findings: []
};

async function check(category, testName, fn) {
    results.total++;
    const start = performance.now();
    try {
        await fn();
        const duration = Math.round(performance.now() - start);
        console.log(`  ✅ [PASS] ${category} :: ${testName} (${duration}ms)`);
        results.passed++;
    } catch (err) {
        const duration = Math.round(performance.now() - start);
        console.error(`  ❌ [FAIL] ${category} :: ${testName} (${duration}ms)`);
        console.error(`     Error: ${err.message}`);
        results.failed++;
        results.findings.push({ category, testName, error: err.message });
    }
}

async function api(path, options = {}) {
    if (path === '/api/store/homepage') {
        if (options.method === 'POST') {
            const body = options.body ? JSON.parse(options.body) : {};
            const res = await designateHomepageStore(body.storeSlug ?? body.username ?? body.storeId ?? body.id);
            return { status: res.status || 200, headers: new Headers(), data: res };
        } else {
            const cookieHeader = options.headers?.Cookie || options.headers?.cookie || '';
            const match = cookieHeader.match(/gumshop_homepage_store=([^;]+)/);
            const cookieSlug = match ? decodeURIComponent(match[1]) : '';
            const res = await resolveHomepageStore(cookieSlug);
            return { status: res.status || 200, headers: new Headers(), data: res };
        }
    }
    if (path === '/api/stores') {
        const stores = await serverGetAllStores();
        return { status: 200, headers: new Headers(), data: { success: true, stores } };
    }
    if (path === '/api/store/data' && options.method === 'POST') {
        const body = options.body ? JSON.parse(options.body) : {};
        if (body.store) {
            await serverSaveStore(body.store);
            if (body.products) {
                await serverSaveProducts(body.store.id, body.products);
            }
        }
        return { status: 200, headers: new Headers(), data: { success: true } };
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const text = await res.text();
    let data = null;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }
    return { status: res.status, headers: res.headers, data };
}

async function setupStore(store) {
    // Save store via /api/store/data
    const res = await api('/api/store/data', {
        method: 'POST',
        body: JSON.stringify({
            store: {
                id: store.id,
                username: store.username,
                name: store.name,
                description: store.description,
                themeColor: store.themeColor
            },
            products: store.products
        })
    });
    if (res.status !== 200 || !res.data?.success) {
        throw new Error(`Failed to seed store ${store.username}: status ${res.status}, error: ${JSON.stringify(res.data)}`);
    }
}

async function run() {
    console.log(`\n======================================================================`);
    console.log(`⚡ CHALLENGER 1: EMPIRICAL HOMEPAGE SWITCHER & CACHE STRESS SUITE`);
    console.log(`🎯 Base URL: ${BASE_URL}`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`======================================================================\n`);

    // 0. Setup Stores
    console.log(`📦 [PHASE 0] Seeding 3 Independent Test Stores (Alpha, Beta, Gamma)...`);
    await setupStore(STORE_ALPHA);
    await setupStore(STORE_BETA);
    await setupStore(STORE_GAMMA);
    console.log(`   Seeded Alpha (2 prods), Beta (3 prods), Gamma (1 prod).\n`);

    // 1. Rapid Alternating Switching (Sequential Stress)
    console.log(`🔄 [PHASE 1] Rapid Alternating Homepage Switching (30 sequential cycles)...`);
    const testStores = [STORE_ALPHA, STORE_BETA, STORE_GAMMA];

    await check('Rapid Switching', '30 Sequential Rapid Switches with Zero Cache Drift', async () => {
        for (let i = 0; i < 30; i++) {
            const target = testStores[i % testStores.length];
            
            // Switch homepage
            const switchRes = await api('/api/store/homepage', {
                method: 'POST',
                body: JSON.stringify({ storeSlug: target.username })
            });
            assert.strictEqual(switchRes.status, 200, `Switch failed with status ${switchRes.status}`);
            assert.strictEqual(switchRes.data.success, true, 'Switch response reported success=false');
            assert.strictEqual(switchRes.data.homepageSlug, target.username, `Target slug mismatch in switch response: expected ${target.username}, got ${switchRes.data.homepageSlug}`);

            // Immediate resolution check
            const getRes = await api('/api/store/homepage');
            assert.strictEqual(getRes.status, 200, `GET /api/store/homepage failed with status ${getRes.status}`);
            assert.strictEqual(getRes.data.success, true, 'GET homepage reported success=false');
            assert.strictEqual(getRes.data.homepageSlug, target.username, `Stale cache on GET: expected ${target.username}, got ${getRes.data.homepageSlug} at iteration ${i}`);

            const resolvedStore = getRes.data.homepageStore;
            assert.ok(resolvedStore, `homepageStore is null at iteration ${i}`);
            assert.strictEqual(resolvedStore.username, target.username, `homepageStore.username mismatch: expected ${target.username}, got ${resolvedStore.username}`);
            assert.strictEqual(resolvedStore.name, target.name, `homepageStore.name mismatch: expected ${target.name}, got ${resolvedStore.name}`);

            // Cross-store catalog leakage check
            const prods = resolvedStore.products || [];
            for (const p of prods) {
                const isContaminated = (target.username === 'ch1-alpha' && !p.id.startsWith('prod_ch1_a')) ||
                                       (target.username === 'ch1-beta' && !p.id.startsWith('prod_ch1_b')) ||
                                       (target.username === 'ch1-gamma' && !p.id.startsWith('prod_ch1_g'));
                if (isContaminated) {
                    throw new Error(`Cross-store product contamination in ${target.username}: found product ${p.id} (${p.name})!`);
                }
            }
        }
    });

    // 2. Database Exclusivity Check (Only ONE store has is_homepage = true)
    console.log(`\n🔍 [PHASE 2] Database is_homepage Exclusivity Verification...`);
    await check('Database Exclusivity', 'Exactly one store has is_homepage flag active in database', async () => {
        const storesRes = await api('/api/stores');
        assert.strictEqual(storesRes.status, 200);
        const stores = storesRes.data?.stores || [];
        const homepageStores = stores.filter(s => s.is_homepage === true || s.isHomepage === true);
        
        console.log(`   Stores marked is_homepage: ${homepageStores.map(s => s.username).join(', ') || 'None'}`);
        if (homepageStores.length > 1) {
            throw new Error(`Multiple stores have is_homepage: true concurrently! Found: ${homepageStores.map(s => s.username).join(', ')}`);
        }
        if (homepageStores.length === 0) {
            throw new Error(`Zero stores have is_homepage: true flag in database!`);
        }
    });

    // 3. Concurrency Stress Test (30 simultaneous switches)
    console.log(`\n💥 [PHASE 3] High-Concurrency Race Condition Stress (30 simultaneous switches)...`);
    await check('Concurrency', '30 concurrent homepage switch requests complete without 500 crashes or corrupt state', async () => {
        const promises = [];
        for (let i = 0; i < 30; i++) {
            const target = testStores[i % testStores.length];
            promises.push(
                api('/api/store/homepage', {
                    method: 'POST',
                    body: JSON.stringify({ storeSlug: target.username })
                })
            );
        }

        const responses = await Promise.all(promises);
        const failures = responses.filter(r => r.status !== 200 || !r.data?.success);
        if (failures.length > 0) {
            throw new Error(`${failures.length}/30 concurrent switch requests failed: statuses ${failures.map(f => f.status).join(',')}`);
        }

        // Verify final state is coherent
        const getRes = await api('/api/store/homepage');
        assert.strictEqual(getRes.status, 200);
        assert.ok(getRes.data.homepageSlug, 'Homepage slug is empty after concurrent flood');
        assert.ok(getRes.data.homepageStore, 'Homepage store is null after concurrent flood');
        assert.strictEqual(getRes.data.homepageStore.username, getRes.data.homepageSlug, 'Resolved store username does not match homepageSlug');

        // Check stores list for multi-flag corruption
        const storesRes = await api('/api/stores');
        const stores = storesRes.data?.stores || [];
        const activeHomepageStores = stores.filter(s => s.is_homepage === true || s.isHomepage === true);
        console.log(`   Concurrent test final active homepage stores: ${activeHomepageStores.map(s => s.username).join(', ')}`);
        if (activeHomepageStores.length > 1) {
            throw new Error(`Race condition caused multiple stores to retain is_homepage: true! Found: ${activeHomepageStores.map(s => s.username).join(', ')}`);
        }
    });

    // 4. Cookie Precedence & Cache Poisoning Assessment
    console.log(`\n🍪 [PHASE 4] Cookie Precedence & Cache Invalidation Behavior...`);
    await check('Cookie Invalidation', 'User with stale cookie is NOT stuck on old homepage when server designates new store', async () => {
        // Step 1: Designate Alpha
        await api('/api/store/homepage', {
            method: 'POST',
            body: JSON.stringify({ storeSlug: 'ch1-alpha' })
        });

        // Step 2: Simulate User who visited during Alpha era and has Alpha cookie
        const userCookie = 'gumshop_homepage_store=ch1-alpha';

        // Step 3: Admin changes official homepage to Beta
        await api('/api/store/homepage', {
            method: 'POST',
            body: JSON.stringify({ storeSlug: 'ch1-beta' })
        });

        // Step 4: User requests GET /api/store/homepage sending their old cookie
        const userReq = await api('/api/store/homepage', {
            headers: { 'Cookie': userCookie }
        });

        console.log(`   User with old cookie (ch1-alpha) queried after switch to ch1-beta: resolved to "${userReq.data.homepageSlug}"`);
        if (userReq.data.homepageSlug === 'ch1-alpha') {
            throw new Error(`STALE COOKIE POISONING: User cookie "gumshop_homepage_store=ch1-alpha" overrode the new official homepage "ch1-beta". Returning visitors are trapped on old store!`);
        }
    });

    // 5. Input Validation & Phantom Store Injection Attacks
    console.log(`\n🛡️ [PHASE 5] Input Validation & Adversarial Payloads...`);

    await check('Input Validation', 'Empty JSON body returns HTTP 400', async () => {
        const res = await api('/api/store/homepage', {
            method: 'POST',
            body: JSON.stringify({})
        });
        assert.strictEqual(res.status, 400, `Expected HTTP 400, got ${res.status}`);
        assert.strictEqual(res.data.success, false);
    });

    await check('Input Validation', 'Empty string storeSlug ("") returns HTTP 400', async () => {
        const res = await api('/api/store/homepage', {
            method: 'POST',
            body: JSON.stringify({ storeSlug: '' })
        });
        assert.strictEqual(res.status, 400, `Expected HTTP 400, got ${res.status}`);
        assert.strictEqual(res.data.success, false);
    });

    await check('Input Validation', 'Whitespace-only storeSlug ("   ") is rejected with HTTP 400', async () => {
        const res = await api('/api/store/homepage', {
            method: 'POST',
            body: JSON.stringify({ storeSlug: '   ' })
        });
        if (res.status === 200) {
            throw new Error(`SECURITY BUG: Whitespace slug "   " accepted with HTTP 200! Assigned slug: "${res.data.homepageSlug}"`);
        }
        assert.strictEqual(res.status, 400, `Expected HTTP 400 for whitespace slug, got ${res.status}`);
    });

    await check('Input Validation', 'Symbol-only storeSlug ("??@@##$$") is rejected with HTTP 400', async () => {
        const res = await api('/api/store/homepage', {
            method: 'POST',
            body: JSON.stringify({ storeSlug: '??@@##$$' })
        });
        if (res.status === 200) {
            throw new Error(`SECURITY BUG: Symbol slug "??@@##$$" sanitized to "${res.data.homepageSlug}" and designated as homepage!`);
        }
        assert.strictEqual(res.status, 400, `Expected HTTP 400 for symbol-only slug, got ${res.status}`);
    });

    await check('Input Validation', 'Non-existent storeSlug is rejected (404/400) and DOES NOT create phantom DB store', async () => {
        const phantomSlug = `phantom-adversarial-${Date.now()}`;
        const res = await api('/api/store/homepage', {
            method: 'POST',
            body: JSON.stringify({ storeSlug: phantomSlug })
        });
        
        // Check if database was poisoned with phantom store
        const storesRes = await api('/api/stores');
        const stores = storesRes.data?.stores || [];
        const phantomInDb = stores.find(s => s.username === phantomSlug || s.id === `store_${phantomSlug}`);

        if (phantomInDb) {
            throw new Error(`PHANTOM STORE INJECTION BUG: Setting non-existent store "${phantomSlug}" as homepage silently injected a ghost store into the database!`);
        }
        if (res.status === 200) {
            throw new Error(`LOGIC BUG: POST /api/store/homepage returned 200 for non-existent store "${phantomSlug}"!`);
        }
    });

    // Summary Scorecard
    console.log(`\n======================================================================`);
    console.log(`📊 CHALLENGER 1 EMPIRICAL SCORECARD`);
    console.log(`======================================================================`);
    console.log(`Total Scenarios Tested: ${results.total}`);
    console.log(`Passed:                ${results.passed}`);
    console.log(`Failed:                ${results.failed}`);
    if (results.findings.length > 0) {
        console.log(`\n❌ Empirical Failures / Vulnerabilities Discovered:`);
        results.findings.forEach((f, i) => {
            console.log(`  ${i + 1}. [${f.category}] ${f.testName}:`);
            console.log(`     -> ${f.error}`);
        });
    }
    console.log(`======================================================================\n`);

    if (results.failed > 0) {
        process.exitCode = 1;
    }
}

run().catch(err => {
    console.error('Fatal Harness Error:', err);
    process.exit(1);
});
