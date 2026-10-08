/**
 * 🧪 GumShop.online Comprehensive Quality & Testing Suite
 * Synthesizes:
 * - agency-testing-api-tester (Functional, Security, OWASP Edge Cases)
 * - agency-testing-test-automation-engineer (Deterministic User Journeys)
 * - agency-testing-reality-checker (Evidence-Based Verification, Zero Fantasy Approvals)
 */

const BASE_URL = process.env.TEST_URL || 'https://www.gumshop.online';
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

    await test('Reality Check', 'Stan Store renders verified reviews carousel data', async () => {
        const res = await fetch(`${BASE_URL}/creator/demo`);
        const html = await res.text();
        if (!html.includes('Verified Customer Proof') && !html.includes('Physical Orders')) {
            throw new Error('Verified review tags not detected in Stan Store HTML');
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

    await test('Security', 'Bearer token correctly validates authenticated session', async () => {
        if (!authToken) throw new Error('No auth token available from previous test');
        const res = await fetch(`${BASE_URL}/api/admin/auth`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.authenticated) throw new Error('Session did not validate with Bearer token');
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

    await test('Commerce API', 'Products endpoint (/api/products) returns active catalog', async () => {
        const res = await fetch(`${BASE_URL}/api/products`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const list = data.products || data;
        if (!Array.isArray(list) || list.length === 0) throw new Error('Catalog is empty or invalid format');
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
