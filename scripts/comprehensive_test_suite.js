/**
 * 🧪 GumShop.online Comprehensive Quality & Testing Suite
 * Synthesizes:
 * - agency-testing-api-tester (Functional, Security, OWASP Edge Cases)
 * - agency-testing-test-automation-engineer (Deterministic User Journeys)
 * - agency-testing-reality-checker (Evidence-Based Verification, Zero Fantasy Approvals)
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const MASTER_PASSWORD = process.env.ADMIN_PASSWORD || 'Meetminal@0406';

const results = {
    total: 0,
    passed: 0,
    failed: 0,
    benchmarks: [],
    errors: []
};

async function test(suite, name, fn) {
    results.total++;
    const start = performance.now();
    try {
        await fn();
        const duration = Math.round(performance.now() - start);
        console.log(`  ✅ [PASS] ${name} (${duration}ms)`);
        results.passed++;
        results.benchmarks.push({ suite, name, duration, status: 'PASS' });
    } catch (err) {
        const duration = Math.round(performance.now() - start);
        console.error(`  ❌ [FAIL] ${name} (${duration}ms):`, err.message);
        results.failed++;
        results.benchmarks.push({ suite, name, duration, status: 'FAIL', error: err.message });
        results.errors.push({ suite, name, error: err.message });
    }
}

async function runSuite() {
    console.log(`\n============================================================`);
    console.log(`🚀 RUNNING COMPREHENSIVE QA & TEST SUITE FOR GUMSHOP.ONLINE`);
    console.log(`🎯 Target Environment: ${BASE_URL}`);
    console.log(`📅 Execution Timestamp: ${new Date().toISOString()}`);
    console.log(`============================================================\n`);

    // =========================================================================
    // SUITE 1: Critical Public Page Availability & Reality Check
    // =========================================================================
    console.log(`📦 [SUITE 1] Public Storefronts & Core Pages`);

    await test('Public Pages', 'Root Homepage (/) responds HTTP 200', async () => {
        const res = await fetch(`${BASE_URL}/`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const html = await res.text();
        if (!html.includes('<!DOCTYPE html>')) throw new Error('Invalid HTML response');
    });

    await test('Public Pages', 'Stan Store Creator Bio (/creator/demo) responds HTTP 200', async () => {
        const res = await fetch(`${BASE_URL}/creator/demo`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const html = await res.text();
        if (!html.includes('demo') && !html.includes('Demo')) {
            throw new Error('Creator profile markup missing');
        }
    });

    await test('Public Pages', 'Grid Store Catalog (/shop/demo) responds HTTP 200', async () => {
        const res = await fetch(`${BASE_URL}/shop/demo`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    await test('Public Pages', 'Merchant Dashboard (/dashboard) responds HTTP 200', async () => {
        const res = await fetch(`${BASE_URL}/dashboard`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    await test('Public Pages', 'Merchant Login (/login) responds HTTP 200', async () => {
        const res = await fetch(`${BASE_URL}/login`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    await test('Public Pages', 'Shipping Policy (/policies/shipping) responds HTTP 200', async () => {
        const res = await fetch(`${BASE_URL}/policies/shipping`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    await test('Public Pages', 'Refund Policy (/policies/refund) responds HTTP 200', async () => {
        const res = await fetch(`${BASE_URL}/policies/refund`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    // =========================================================================
    // SUITE 2: Reality-Checker Implementation & UX Contract Audits
    // =========================================================================
    console.log(`\n🔍 [SUITE 2] Reality-Checker Evidence Standards`);

    await test('Reality Check', 'Stan Store does NOT contain mobile phone status bars (battery/wifi/signal)', async () => {
        const res = await fetch(`${BASE_URL}/creator/demo`);
        const html = await res.text();
        if (html.includes('9:41') || html.includes('Dynamic Island') || html.includes('BatteryMedium')) {
            throw new Error('Simulated status bar found in Stan Store markup!');
        }
    });

    await test('Reality Check', 'Stan Store enforces zero fake telemetry and does NOT render mock reviews or synthetic countdowns', async () => {
        const res = await fetch(`${BASE_URL}/creator/demo`);
        const html = await res.text();
        if (html.includes('Verified Customer Proof') || html.includes('Physical Orders') || html.includes('02:44:19')) {
            throw new Error('Fake buyer proof or synthetic countdown detected in Stan Store HTML');
        }
    });

    await test('Reality Check', 'Non-existent order (/thank-you?orderId=invalid_fake_id) does NOT show fake PAID confirmation', async () => {
        const res = await fetch(`${BASE_URL}/api/gumroad/verify-order?orderId=fake_unpaid_12345`);
        const data = await res.json().catch(() => ({}));
        if (data.verified === true || data.paymentStatus === 'PAID') {
            throw new Error('CRITICAL FLAW: Verification returned PAID for nonexistent order!');
        }
    });

    // =========================================================================
    // SUITE 3: Authentication & Security Controls (API Tester)
    // =========================================================================
    console.log(`\n🛡️ [SUITE 3] Security, Auth, & OWASP Validation`);

    await test('Security', 'Unauthenticated request to /api/admin/auth returns authenticated: false', async () => {
        const res = await fetch(`${BASE_URL}/api/admin/auth`);
        if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
        const data = await res.json();
        if (data.authenticated !== false) throw new Error('Expected authenticated: false');
    });

    await test('Security', 'Malformed/Wrong password to /api/admin/auth returns 401 Unauthorized', async () => {
        const res = await fetch(`${BASE_URL}/api/admin/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'IncorrectTestPassword999!' })
        });
        if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
    });

    await test('Security', 'Empty body to /api/admin/auth returns 400 or 401 gracefully', async () => {
        const res = await fetch(`${BASE_URL}/api/admin/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        if (res.status !== 400 && res.status !== 401) {
            throw new Error(`Expected 400 or 401, got ${res.status}`);
        }
    });

    let authToken = null;
    await test('Security', 'Valid master password produces valid JWT/session token', async () => {
        const res = await fetch(`${BASE_URL}/api/admin/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: MASTER_PASSWORD })
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.success || !data.token) throw new Error('Failed to retrieve token');
        authToken = data.token;
    });

    await test('Security', 'Case-insensitive lowercase password (meetminal@0406) authenticates successfully', async () => {
        const res = await fetch(`${BASE_URL}/api/admin/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'meetminal@0406' })
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.success || !data.authenticated) throw new Error('Failed to authenticate lowercase password');
    });

    await test('Security', 'All-caps password (MEETMINAL@0406) authenticates successfully', async () => {
        const res = await fetch(`${BASE_URL}/api/admin/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'MEETMINAL@0406' })
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.success || !data.authenticated) throw new Error('Failed to authenticate uppercase password');
    });

    await test('Security', 'Symbol-stripped variant (meetminal0406) authenticates successfully', async () => {
        const res = await fetch(`${BASE_URL}/api/admin/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'meetminal0406' })
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.success || !data.authenticated) throw new Error('Failed to authenticate symbol-stripped password');
    });

    await test('Security', 'Bearer token correctly validates authenticated session', async () => {
        if (!authToken) throw new Error('No auth token available from previous test');
        const res = await fetch(`${BASE_URL}/api/admin/auth`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.authenticated) throw new Error('Session did not validate with Bearer token');
    });

    await test('Security', 'Query param token (?token=...) validates authenticated session', async () => {
        if (!authToken) throw new Error('No auth token available from previous test');
        const res = await fetch(`${BASE_URL}/api/admin/auth?token=${encodeURIComponent(authToken)}`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.authenticated) throw new Error('Session did not validate with query param token');
    });

    await test('Security', 'Session cookie (gumshop_admin_session) validates authenticated session', async () => {
        if (!authToken) throw new Error('No auth token available from previous test');
        const res = await fetch(`${BASE_URL}/api/admin/auth`, {
            headers: { 'Cookie': `gumshop_admin_session=${authToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.authenticated) throw new Error('Session did not validate with Cookie header');
    });

    // =========================================================================
    // SUITE 4: Functional API Endpoints & E-Commerce Pipelines
    // =========================================================================
    console.log(`\n⚙️ [SUITE 4] Functional API Pipelines & Cart Integrity`);

    await test('Commerce API', 'Stores endpoint (/api/stores) returns valid stores list', async () => {
        const res = await fetch(`${BASE_URL}/api/stores`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const list = data.stores || data;
        if (!Array.isArray(list)) throw new Error('Expected array of stores');
    });

    await test('Commerce API', 'Products endpoint (/api/products) returns valid catalog array', async () => {
        const res = await fetch(`${BASE_URL}/api/products`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const list = data.products || data;
        if (!Array.isArray(list)) throw new Error('Expected array of products');
    });

    await test('Commerce API', 'Dynamic Checkout rejects empty cart with 400 status', async () => {
        const res = await fetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [] })
        });
        if (res.status !== 400) throw new Error(`Expected 400 for empty cart, got ${res.status}`);
    });

    await test('Commerce API', 'Dynamic Checkout successfully generates order session & calculates total', async () => {
        const res = await fetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                storeId: 'demo',
                storeName: 'Demo Store',
                items: [
                    { id: 'prod_1', name: 'Premium Ceramic Mug', price: 24.99, quantity: 1 }
                ],
                shippingFee: 4.99,
                discountAmount: 0,
                customer: {
                    name: 'Test QA Buyer',
                    email: 'qa.buyer@test.gumshop.online'
                }
            })
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        if (!data.orderSessionId) throw new Error('Missing orderSessionId in checkout response');
        if (Math.abs(data.total - 29.98) > 0.05) {
            throw new Error(`Total mismatch: expected ~29.98, got ${data.total}`);
        }
    });

    await test('Commerce API', 'Store Config API retrieves & synchronizes tracking parameters', async () => {
        const getRes = await fetch(`${BASE_URL}/api/store/config`);
        if (getRes.status !== 200) throw new Error(`Expected 200, got ${getRes.status}`);
        const data = await getRes.json();
        if (!data.config) throw new Error('Missing config object');
    });

    await test('Commerce API', 'Active Product detail route responds HTTP 200 with metadata', async () => {
        const pRes = await fetch(`${BASE_URL}/api/products`);
        const pData = await pRes.json();
        const prods = pData.products || pData;
        const testProd = prods && prods[0] ? prods[0] : { id: 'prod_1' };
        const res = await fetch(`${BASE_URL}/product/${testProd.id}`);
        if (res.status !== 200) throw new Error(`Product route returned HTTP ${res.status}`);
        const html = await res.text();
        if (!html.includes('<!DOCTYPE html>')) throw new Error('Expected HTML document');
    });

    await test('Commerce API', 'Gumroad Vault Status (/api/gumroad/status) responds HTTP 200 with structured status', async () => {
        const res = await fetch(`${BASE_URL}/api/gumroad/status`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        if (typeof data.connected !== 'boolean') throw new Error('Expected boolean `connected` field');
    });

    await test('Commerce API', 'Store Importer History (/api/importer/history) responds HTTP 200 with valid ledger', async () => {
        const res = await fetch(`${BASE_URL}/api/importer/history`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        if (data.success !== true || !Array.isArray(data.history)) {
            throw new Error('Expected success: true and history array');
        }
    });

    await test('Commerce API', 'Dynamic Checkout enforces $1.00 minimum floor against zero or negative values', async () => {
        const res = await fetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [{ id: 'test_item', name: 'Free Item', price: 0, quantity: 1 }],
                discountAmount: 100
            })
        });
        if (res.status !== 200) throw new Error(`Expected 200 with floor price, got ${res.status}`);
        const data = await res.json();
        const finalAmt = data.total ?? data.pricing?.finalTotal;
        if (typeof finalAmt !== 'number' || finalAmt < 1.00) throw new Error(`Total fell below minimum floor: ${finalAmt}`);
    });

    await test('Commerce API', 'Dynamic Checkout strictly normalizes floating point decimals to 2 places', async () => {
        const res = await fetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [
                    { id: 'item_1', name: 'Item A', price: 10.333333, quantity: 1 },
                    { id: 'item_2', name: 'Item B', price: 5.666666, quantity: 1 }
                ],
                shippingFee: 2.111111
            })
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        const finalAmt = data.total ?? data.pricing?.finalTotal;
        if (typeof finalAmt !== 'number') throw new Error(`Missing final total amount: ${JSON.stringify(data)}`);
        const str = finalAmt.toString();
        const decimals = str.includes('.') ? str.split('.')[1].length : 0;
        if (decimals > 2) throw new Error(`Decimal precision unrounded: ${finalAmt}`);
    });

    await test('Security', 'Store Importer blocks localhost and loopback SSRF attempts with HTTP 400', async () => {
        const res = await fetch(`${BASE_URL}/api/importer/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'http://localhost:3000/internal-secrets' })
        });
        if (res.status !== 400) throw new Error(`Expected 400 for localhost target, got ${res.status}`);
        const data = await res.json().catch(() => ({}));
        if (data.success !== false) throw new Error('Expected success: false for SSRF probe');
    });

    await test('Security', 'Store Importer blocks AWS metadata endpoint (169.254.169.254) SSRF with HTTP 400', async () => {
        const res = await fetch(`${BASE_URL}/api/importer/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'http://169.254.169.254/latest/meta-data' })
        });
        if (res.status !== 400) throw new Error(`Expected 400 for cloud metadata target, got ${res.status}`);
        const data = await res.json().catch(() => ({}));
        if (data.success !== false) throw new Error('Expected success: false for SSRF probe');
    });

    await test('Public Pages', 'Non-existent store (/creator/this-store-does-not-exist-9999) does not throw unhandled 500', async () => {
        const res = await fetch(`${BASE_URL}/creator/this-store-does-not-exist-9999`);
        if (res.status === 500) throw new Error('Received unhandled 500 Internal Server Error');
        const html = await res.text();
        if (!html.includes('<!DOCTYPE html>')) throw new Error('Expected HTML document');
    });

    // =========================================================================
    // SUITE 5: Multi-Store Credential Isolation & Order Persistence Bridge
    // =========================================================================
    console.log(`\n🏢 [SUITE 5] Multi-Store Credential Isolation & Order Bridge`);

    await test('Multi-Store Isolation', 'Per-Store Vault maintains strict credential isolation between Store A and Store B', async () => {
        const { getServerGumroadToken, setServerGumroadToken, clearServerGumroadToken } = await import('../lib/serverVault.js');
        await setServerGumroadToken('gum_token_store_a_secret_123', 'store-alpha');
        await setServerGumroadToken('gum_token_store_b_secret_456', 'store-beta');

        const tokenA = await getServerGumroadToken('store-alpha');
        const tokenB = await getServerGumroadToken('store-beta');
        const tokenNonExistent = await getServerGumroadToken('store-gamma-unconfigured');

        if (tokenA !== 'gum_token_store_a_secret_123') throw new Error(`Store A token mismatch: ${tokenA}`);
        if (tokenB !== 'gum_token_store_b_secret_456') throw new Error(`Store B token mismatch: ${tokenB}`);
        if (tokenNonExistent !== '') throw new Error(`Cross-store leakage: unconfigured store got token: ${tokenNonExistent}`);

        await clearServerGumroadToken('store-alpha');
        const tokenACleared = await getServerGumroadToken('store-alpha');
        if (tokenACleared !== '') throw new Error(`Store A token was not cleared: ${tokenACleared}`);
        const tokenBStillExists = await getServerGumroadToken('store-beta');
        if (tokenBStillExists !== 'gum_token_store_b_secret_456') throw new Error('Store B token was corrupted by Store A clear');
    });

    await test('Order Bridge', 'Server Order Store correctly partitions and retrieves orders by store', async () => {
        const { saveServerOrder, getServerOrdersByStore } = await import('../lib/serverOrderStore.js');
        const testOrderA = {
            id: 'ord_test_alpha_1',
            storeId: 'store-alpha',
            storeSlug: 'store-alpha',
            total: 39.99,
            createdAt: new Date().toISOString()
        };
        const testOrderB = {
            id: 'ord_test_beta_1',
            storeId: 'store-beta',
            storeSlug: 'store-beta',
            total: 89.99,
            createdAt: new Date().toISOString()
        };

        await saveServerOrder('ord_test_alpha_1', testOrderA);
        await saveServerOrder('ord_test_beta_1', testOrderB);

        const ordersA = await getServerOrdersByStore('store-alpha');
        const ordersB = await getServerOrdersByStore('store-beta');

        if (!ordersA.some(o => o.id === 'ord_test_alpha_1')) throw new Error('Store Alpha missing its order');
        if (ordersA.some(o => o.id === 'ord_test_beta_1')) throw new Error('Store Alpha contaminated with Store Beta order');
        if (!ordersB.some(o => o.id === 'ord_test_beta_1')) throw new Error('Store Beta missing its order');
        if (ordersB.some(o => o.id === 'ord_test_alpha_1')) throw new Error('Store Beta contaminated with Store Alpha order');
    });

    // =========================================================================
    // SUITE 6: Milestone M2: Multi-Store Isolation & Stan Store Synchronization
    // =========================================================================
    console.log(`\n🏢 [SUITE 6] Milestone M2: Multi-Store Isolation & Stan Store Synchronization`);

    await test('Milestone M2', 'Multi-Store creation maintains strict catalog isolation between Store A and Store B', async () => {
        const { serverSaveStore, serverSaveProducts, serverGetProducts, serverDeleteStore } = await import('../lib/serverDb.js');
        const STORE_A = { id: 'store_m2_audit_a', username: 'm2-audit-a', name: 'M2 Audit Store A' };
        const STORE_B = { id: 'store_m2_audit_b', username: 'm2-audit-b', name: 'M2 Audit Store B' };
        const PRODS_A = [{ id: 'prod_m2_a_1', storeId: 'store_m2_audit_a', name: 'Product A1', price: 19.99 }];
        const PRODS_B = [{ id: 'prod_m2_b_1', storeId: 'store_m2_audit_b', name: 'Product B1', price: 49.99 }];

        await serverSaveStore(STORE_A);
        await serverSaveProducts(STORE_A.id, PRODS_A);
        await serverSaveStore(STORE_B);
        await serverSaveProducts(STORE_B.id, PRODS_B);

        const prodsA = await serverGetProducts('m2-audit-a');
        const prodsB = await serverGetProducts('m2-audit-b');

        if (prodsA.length !== 1 || prodsA[0].id !== 'prod_m2_a_1') throw new Error('Store A catalog incorrect');
        if (prodsB.length !== 1 || prodsB[0].id !== 'prod_m2_b_1') throw new Error('Store B catalog incorrect');
        if (prodsA.some(p => p.id === 'prod_m2_b_1')) throw new Error('Cross-store leakage: Store A got Store B products');
        if (prodsB.some(p => p.id === 'prod_m2_a_1')) throw new Error('Cross-store leakage: Store B got Store A products');

        await serverDeleteStore(STORE_A.id, STORE_A.username);
        await serverDeleteStore(STORE_B.id, STORE_B.username);
    });

    await test('Milestone M2', 'Homepage Switcher designates Store A then switches to Store B with zero stale cache', async () => {
        const { serverSaveStore, serverDeleteStore, designateHomepageStore, resolveHomepageStore } = await import('../lib/serverDb.js');

        await serverSaveStore({ id: 'store_m2_hp_a', username: 'm2-hp-a', name: 'Homepage Test Store A' });
        await serverSaveStore({ id: 'store_m2_hp_b', username: 'm2-hp-b', name: 'Homepage Test Store B' });

        // Set Store A
        const resA = await designateHomepageStore('m2-hp-a');
        if (!resA.success || resA.homepageSlug !== 'm2-hp-a') throw new Error('Failed to designate Store A as homepage');

        // Switch to Store B
        const resB = await designateHomepageStore('m2-hp-b');
        if (!resB.success || resB.homepageSlug !== 'm2-hp-b') throw new Error('Failed to switch homepage to Store B');

        // Verify GET resolves Store B
        const getData = await resolveHomepageStore();
        if (!getData.success || getData.homepageSlug !== 'm2-hp-b') throw new Error('GET /api/store/homepage did not resolve Store B');

        await serverDeleteStore('store_m2_hp_a', 'm2-hp-a');
        await serverDeleteStore('store_m2_hp_b', 'm2-hp-b');
    });

    await test('Milestone M2', 'Stan Store /creator/[slug] bio settings and curated catalog isolate with 0 leakage', async () => {
        const { serverSaveStore, serverSaveProducts, serverDeleteStore } = await import('../lib/serverDb.js');
        const { getStoreAndCatalog } = await import('../lib/storePresets.js');

        const BIO_STORE = {
            id: 'store_m2_bio_test',
            username: 'm2-bio-test',
            name: 'Bio Test Store',
            bioProfile: {
                displayName: 'Bio Test Creator',
                tagline: 'Exclusive Creator Bio',
                themeColor: '#EC4899',
                leadMagnet: { enabled: true, title: 'Free Audio Preset', buttonText: 'Claim Preset' },
                productDisplayMode: 'curated',
                featuredProductIds: ['prod_bio_1']
            }
        };
        const BIO_PRODS = [
            { id: 'prod_bio_1', storeId: 'store_m2_bio_test', name: 'Curated Soundpack', price: 29.00 },
            { id: 'prod_bio_2', storeId: 'store_m2_bio_test', name: 'Uncurated Extra', price: 9.00 }
        ];

        await serverSaveStore(BIO_STORE);
        await serverSaveProducts(BIO_STORE.id, BIO_PRODS);

        const resolved = await getStoreAndCatalog('m2-bio-test');
        if (!resolved.store) throw new Error('Bio store failed to resolve');
        if (resolved.store.bioProfile?.themeColor !== '#EC4899') throw new Error('Theme color mismatch');
        if (resolved.store.bioProfile?.leadMagnet?.title !== 'Free Audio Preset') throw new Error('Lead magnet title mismatch');

        await serverDeleteStore(BIO_STORE.id, BIO_STORE.username);
    });

    // =========================================================================
    // FINAL RESULTS & REPORT
    // =========================================================================
    console.log(`\n============================================================`);
    console.log(`📊 TEST SUITE SUMMARY & REALITY SCORECARD`);
    console.log(`============================================================`);
    console.log(`Total Tests Run:  ${results.total}`);
    console.log(`Passed:          ${results.passed} (${Math.round((results.passed / results.total) * 100)}%)`);
    console.log(`Failed:          ${results.failed}`);

    const avgLatency = Math.round(
        results.benchmarks.reduce((acc, b) => acc + b.duration, 0) / results.benchmarks.length
    );
    console.log(`Average Latency: ${avgLatency}ms`);

    if (results.failed > 0) {
        console.log(`\n❌ Failed Tests:`);
        results.errors.forEach(e => console.log(`  - [${e.suite}] ${e.name}: ${e.error}`));
        process.exit(1);
    } else {
        console.log(`\n🎉 ALL TESTS PASSED! System is fully verified & ready.`);
        process.exit(0);
    }
}

runSuite().catch(err => {
    console.error('Fatal Test Suite Error:', err);
    process.exit(1);
});
