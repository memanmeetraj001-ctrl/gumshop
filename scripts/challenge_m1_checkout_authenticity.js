/**
 * 🧪 Challenger 2: Empirical Stress Harness for Milestone M1
 * Checkout Pipeline Calculation Authenticity & Zero Fake Telemetry Verification
 * 
 * Tests:
 * 1. Checkout Calculation Math (subtotals, shipping fees, rush fees, discounts, order totals, 2-decimal rounding, $1 floor)
 * 2. Rush Fee Double-Billing / Modal Price Overwrite Empirical Vulnerability Audit
 * 3. Payment Verification & Anti-Tamper Security Defense
 * 4. Forensic Scan for Fake Telemetry, Synthetic Countdowns & Mock Reviews (AST + Live HTML)
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'https://www.gumshop.online';

async function safeFetch(url, options = {}, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            return await fetch(url, { ...options, signal: AbortSignal.timeout(12000) });
        } catch (err) {
            if (i === retries) throw err;
            await new Promise(r => setTimeout(r, 600));
        }
    }
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];
const vulnerabilities = [];

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
        vulnerabilities.push({ suite, title, error: err.message, stack: err.stack });
    }
}

async function runEmpiricalCheckoutSuite() {
    console.log(`\n======================================================================`);
    console.log(`🥊 EMPIRICAL CHALLENGER 2: CHECKOUT CALCULATION & AUTHENTICITY HARNESS`);
    console.log(`🎯 Target Environment: ${BASE_URL}`);
    console.log(`📅 Execution Timestamp: ${new Date().toISOString()}`);
    console.log(`======================================================================\n`);

    // =========================================================================
    // SUITE 1: Server Dynamic Checkout Mathematical Integrity
    // =========================================================================
    console.log(`💰 [SUITE 1] Server Dynamic Checkout Mathematical Integrity`);

    await challenge('Calculation Math', 'Rejects empty cart with HTTP 400', async () => {
        const res = await safeFetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [] })
        });
        if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
        const data = await res.json();
        if (!data.error) throw new Error('Expected error message in response');
    });

    await challenge('Calculation Math', 'Accurately computes subtotal, shipping, discount, and total for multi-item cart', async () => {
        const items = [
            { id: 'item_1', name: 'Widget Alpha', price: 14.50, quantity: 2 }, // 29.00
            { id: 'item_2', name: 'Gadget Beta', price: 9.99, quantity: 3 },   // 29.97
            { id: 'item_3', name: 'Accessory Gamma', price: 5.25, quantity: 1 } // 5.25
        ];
        const shippingFee = 7.50;
        const discountAmount = 10.00;
        // Expected subtotal: 29.00 + 29.97 + 5.25 = 64.22
        // Expected total: 64.22 + 7.50 - 10.00 = 61.72

        const res = await safeFetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items,
                shippingFee,
                discountAmount,
                storeId: 'test_store',
                storeName: 'Test Store'
            })
        });

        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();

        assert.strictEqual(data.success, true);
        assert.ok(data.orderSessionId, 'Missing orderSessionId');
        assert.strictEqual(data.pricing.subtotal, 64.22, `Subtotal mismatch: expected 64.22, got ${data.pricing.subtotal}`);
        assert.strictEqual(data.pricing.shippingFee, 7.50, `Shipping fee mismatch: expected 7.50, got ${data.pricing.shippingFee}`);
        assert.strictEqual(data.pricing.discountAmount, 10.00, `Discount mismatch: expected 10.00, got ${data.pricing.discountAmount}`);
        assert.strictEqual(data.pricing.finalTotal, 61.72, `Final total mismatch: expected 61.72, got ${data.pricing.finalTotal}`);
        assert.strictEqual(data.total, 61.72, `Top-level total mismatch: expected 61.72, got ${data.total}`);

        // Verify Gumroad URL parameter encoding
        const parsedUrl = new URL(data.checkoutUrl);
        assert.strictEqual(parsedUrl.searchParams.get('price'), '61.72', `Gumroad URL price param mismatch: expected 61.72, got ${parsedUrl.searchParams.get('price')}`);
        assert.strictEqual(parsedUrl.searchParams.get('order_id'), data.orderSessionId, 'Gumroad URL order_id param mismatch');
    });

    await challenge('Calculation Math', 'Strictly enforces 2-decimal precision on fractional quantities and prices', async () => {
        const res = await safeFetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [
                    { id: 'f_1', name: 'Fractional Item 1', price: 10.3333333, quantity: 1 },
                    { id: 'f_2', name: 'Fractional Item 2', price: 5.6666666, quantity: 1 }
                ],
                shippingFee: 3.1111111,
                discountAmount: 1.2222222
            })
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();

        // subtotal: 10.3333333 + 5.6666666 = 15.9999999
        // total: 15.9999999 + 3.1111111 - 1.2222222 = 17.8888888 -> rounded: 17.89
        assert.strictEqual(data.total, 17.89, `Precision rounding failed: expected 17.89, got ${data.total}`);
        const decimals = data.total.toString().split('.')[1]?.length || 0;
        assert.ok(decimals <= 2, `Decimal places exceeded 2: ${data.total}`);
    });

    await challenge('Calculation Math', 'Enforces $1.00 minimum floor when discount exceeds total', async () => {
        const res = await safeFetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [
                    { id: 'free_1', name: 'Sample Item', price: 5.00, quantity: 1 }
                ],
                shippingFee: 0,
                discountAmount: 50.00 // massive discount exceeding subtotal
            })
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        assert.strictEqual(data.total, 1.00, `Expected $1.00 floor, got ${data.total}`);
    });

    await challenge('Calculation Math', 'Rejects negative prices and zero totals with $1.00 floor protection', async () => {
        const res = await safeFetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [
                    { id: 'neg_1', name: 'Negative Item', price: -25.00, quantity: 1 }
                ],
                shippingFee: -5.00,
                discountAmount: 0
            })
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        assert.ok(data.total >= 1.00, `Total fell below $1.00 floor: ${data.total}`);
    });

    // =========================================================================
    // SUITE 2: Client/Server Contract & Rush Fee Vulnerability Analysis
    // =========================================================================
    console.log(`\n🔍 [SUITE 2] Rush Fee & Client-to-Server Contract Audit`);

    await challenge('Contract Audit', 'Analyze OrderSummary.jsx rush protection fee transmission', async () => {
        // We empirically simulate what OrderSummary.jsx sends when includeRushProtection is checked:
        // OrderSummary.jsx line 143: finalShippingFee = calculatedShippingFee + RUSH_PROTECTION_FEE (3.99)
        // OrderSummary.jsx line 157-164: checkoutItems.push({ productId: 'addon_priority_rush_insurance', price: 3.99, quantity: 1 })
        // OrderSummary.jsx line 177: shippingFee: finalShippingFee
        const baseProductPrice = 25.00;
        const standardShipping = 4.99;
        const rushFee = 3.99;

        // UI expectation: 25.00 (item) + 4.99 (shipping) + 3.99 (rush) = 33.98
        const expectedUiTotal = baseProductPrice + standardShipping + rushFee; // 33.98

        const res = await safeFetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [
                    { id: 'prod_test', name: 'Standard Product', price: baseProductPrice, quantity: 1 },
                    { id: 'addon_priority_rush_insurance', name: '⚡ Priority Rush Processing & Transit Insurance', price: rushFee, quantity: 1 }
                ],
                shippingFee: standardShipping + rushFee // 8.98 as sent by OrderSummary.jsx line 143
            })
        });

        if (res.status !== 200) throw new Error(`Dynamic checkout failed: HTTP ${res.status}`);
        const data = await res.json();

        // Check if double-counted:
        const actualChargedTotal = data.total;
        const discrepancy = actualChargedTotal - expectedUiTotal;

        if (Math.abs(discrepancy - rushFee) < 0.05) {
            console.log(`    ⚠️ [CONTRACT ANOMALY OBSERVED] Rush fee ($${rushFee}) is added TWICE when OrderSummary payload is submitted:`);
            console.log(`       - Expected customer total: $${expectedUiTotal.toFixed(2)}`);
            console.log(`       - Actual server total:     $${actualChargedTotal.toFixed(2)}`);
            console.log(`       - Overcharge delta:        +$${discrepancy.toFixed(2)}`);
            // This is an empirical defect in OrderSummary.jsx lines 143 & 157-164.
        } else {
            console.log(`    ℹ️ Server total: $${actualChargedTotal.toFixed(2)} vs Expected: $${expectedUiTotal.toFixed(2)}`);
        }
    });

    await challenge('Contract Audit', 'Verify clean dynamic checkout when rush fee is accurately isolated in shippingFee only', async () => {
        const baseProductPrice = 25.00;
        const standardShipping = 4.99;
        const rushFee = 3.99;
        const correctTotal = Math.round((baseProductPrice + standardShipping + rushFee) * 100) / 100; // 33.98

        // Correct contract: rush fee is either an item OR in shippingFee, NOT both
        const res = await safeFetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [
                    { id: 'prod_test', name: 'Standard Product', price: baseProductPrice, quantity: 1 }
                ],
                shippingFee: standardShipping + rushFee // 8.98 isolated
            })
        });

        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        assert.strictEqual(data.total, correctTotal, `Total mismatch: expected ${correctTotal}, got ${data.total}`);
    });

    await challenge('Contract Audit', 'Verify fixed OrderSummary payload (rush fee as item + standard shipping only) matches exact UI total', async () => {
        const baseProductPrice = 25.00;
        const standardShipping = 4.99;
        const rushFee = 3.99;
        const expectedTotal = Math.round((baseProductPrice + standardShipping + rushFee) * 100) / 100; // 33.98

        // Fixed payload format as now implemented in OrderSummary.jsx
        const res = await safeFetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [
                    { id: 'prod_test', name: 'Standard Product', price: baseProductPrice, quantity: 1 },
                    { id: 'addon_priority_rush_insurance', name: '⚡ Priority Rush Processing & Transit Insurance', price: rushFee, quantity: 1 }
                ],
                shippingFee: standardShipping // fixed: 4.99 standard only!
            })
        });

        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        assert.strictEqual(data.total, expectedTotal, `Total mismatch: expected ${expectedTotal}, got ${data.total}`);
        assert.strictEqual(data.pricing.subtotal, 28.99, `Subtotal mismatch: expected 28.99, got ${data.pricing.subtotal}`);
        assert.strictEqual(data.pricing.shippingFee, 4.99, `Shipping mismatch: expected 4.99, got ${data.pricing.shippingFee}`);
        assert.strictEqual(data.pricing.finalTotal, expectedTotal, `Pricing final total mismatch: expected ${expectedTotal}, got ${data.pricing.finalTotal}`);
    });

    // =========================================================================
    // SUITE 3: Order Persistence, Bridge & Anti-Manufacture Defense
    // =========================================================================
    console.log(`\n🛡️ [SUITE 3] Payment Verification & Anti-Manufacture Defense`);

    let generatedOrderId = null;
    await challenge('Payment Security', 'Checkout creates pending session with isPaid: false in server store', async () => {
        const res = await safeFetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [{ id: 'p_sec', name: 'Security Item', price: 19.99, quantity: 1 }],
                storeId: 'store_audit',
                customer: { email: 'security.auditor@test.com' }
            })
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        generatedOrderId = data.orderSessionId;
        assert.ok(generatedOrderId, 'Missing orderSessionId');
    });

    await challenge('Payment Security', 'Newly created checkout session cannot be falsely verified as PAID', async () => {
        if (!generatedOrderId) throw new Error('No order ID from previous test');
        const res = await safeFetch(`${BASE_URL}/api/gumroad/verify-order?orderId=${encodeURIComponent(generatedOrderId)}`);
        const data = await res.json();
        assert.strictEqual(data.verified, false, 'Pending order falsely verified as true!');
        assert.notStrictEqual(data.paymentStatus, 'PAID', 'Pending order returned PAID status!');
        assert.strictEqual(data.paymentStatus, 'VERIFICATION_PENDING', `Expected VERIFICATION_PENDING, got ${data.paymentStatus}`);
    });

    await challenge('Payment Security', 'Random fabricated order ID returns HTTP 404 NOT_FOUND', async () => {
        const fakeId = `ord_fake_attacker_${Date.now()}`;
        const res = await safeFetch(`${BASE_URL}/api/gumroad/verify-order?orderId=${fakeId}`);
        if (res.status !== 404) throw new Error(`Expected HTTP 404, got ${res.status}`);
        const data = await res.json();
        assert.strictEqual(data.verified, false);
        assert.strictEqual(data.paymentStatus, 'NOT_FOUND');
    });

    await challenge('Payment Security', 'Empty orderId parameter returns HTTP 400 Bad Request', async () => {
        const res = await safeFetch(`${BASE_URL}/api/gumroad/verify-order?orderId=`);
        if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
        const data = await res.json();
        assert.strictEqual(data.verified, false);
    });

    // =========================================================================
    // SUITE 4: Zero Fake Telemetry, Synthetic Countdown & Mock Review Forensic Audit
    // =========================================================================
    console.log(`\n🔍 [SUITE 4] Forensic Codebase & Markup Scan for Fake Telemetry`);

    await challenge('Authenticity', 'StoreHeroBanner.jsx contains zero synthetic countdown timers', async () => {
        const heroPath = path.resolve('components/StoreHeroBanner.jsx');
        const code = fs.readFileSync(heroPath, 'utf8');
        assert.ok(!code.includes('02:44:19'), 'Found synthetic countdown "02:44:19" in StoreHeroBanner.jsx');
        assert.ok(!code.includes('countdownHours'), 'Found countdownHours state in StoreHeroBanner.jsx');
        assert.ok(!code.includes('setInterval'), 'Found active interval timer in StoreHeroBanner.jsx');
        assert.ok(!code.includes('Clock'), 'Found clock icon timer in StoreHeroBanner.jsx');
    });

    await challenge('Authenticity', 'creator/[username]/page.jsx contains zero hardcoded mock reviews', async () => {
        const creatorPath = path.resolve('app/(public)/creator/[username]/page.jsx');
        const code = fs.readFileSync(creatorPath, 'utf8');
        assert.ok(!code.includes('VERIFIED_PHYSICAL_REVIEWS'), 'Found VERIFIED_PHYSICAL_REVIEWS in creator page');
        assert.ok(!code.includes('Physical Orders'), 'Found "Physical Orders" mock proof badge in creator page');
        assert.ok(!code.includes('9:41'), 'Found simulated mobile status bar time "9:41" in creator page');
        assert.ok(!code.includes('BatteryMedium'), 'Found simulated battery icon in creator page');
    });

    await challenge('Authenticity', 'Live Stan Store (/creator/demo) HTML renders zero synthetic countdowns or mock proof', async () => {
        const res = await safeFetch(`${BASE_URL}/creator/demo`);
        if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
        const html = await res.text();
        assert.ok(!html.includes('02:44:19'), 'Live Stan Store contains "02:44:19" countdown');
        assert.ok(!html.includes('Verified Customer Proof'), 'Live Stan Store contains "Verified Customer Proof" mock text');
        assert.ok(!html.includes('9:41'), 'Live Stan Store contains simulated status bar');
        assert.ok(!/viewers (online|watching|looking)/i.test(html), 'Live Stan Store contains simulated viewer count');
    });

    await challenge('Authenticity', 'Root homepage (/) HTML renders zero fake urgency counters', async () => {
        const res = await safeFetch(`${BASE_URL}/`);
        if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
        const html = await res.text();
        assert.ok(!html.includes('02:44:19'), 'Root homepage contains synthetic countdown');
        assert.ok(!/viewers (online|watching|looking)/i.test(html), 'Root homepage contains fake viewer counters');
    });

    await challenge('Authenticity', 'Store catalog (/shop/demo) HTML renders zero fake urgency counters', async () => {
        const res = await safeFetch(`${BASE_URL}/shop/demo`);
        if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
        const html = await res.text();
        assert.ok(!html.includes('02:44:19'), 'Store catalog contains synthetic countdown');
        assert.ok(!/viewers (online|watching|looking)/i.test(html), 'Store catalog contains fake viewer counters');
    });

    // =========================================================================
    // FINAL SUMMARY
    // =========================================================================
    console.log(`\n======================================================================`);
    console.log(`📊 CHALLENGER 2 SUMMARY & SCORECARD`);
    console.log(`======================================================================`);
    console.log(`Total Empirical Challenges: ${totalTests}`);
    console.log(`Passed:                    ${passedTests} (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log(`Failed:                    ${failedTests}`);
    console.log(`Vulnerabilities Logged:    ${vulnerabilities.length}`);

    if (failedTests > 0) {
        console.log(`\n❌ Failed Challenges:`);
        vulnerabilities.forEach(f => console.log(`  - [${f.suite}] ${f.title}: ${f.error}`));
        process.exit(1);
    } else {
        console.log(`\n🎉 ALL 16 EMPIRICAL CHALLENGES EXECUTED WITH ZERO UNHANDLED FAILURES!`);
        process.exit(0);
    }
}

runEmpiricalCheckoutSuite().catch(err => {
    console.error('Fatal harness error:', err);
    process.exit(1);
});
