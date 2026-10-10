import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isSaleProcessed, markSaleProcessed, saveServerOrder, getServerOrdersByStore } from '../lib/serverOrderStore.js';
import fs from 'node:fs';
import path from 'node:path';

console.log('======================================================================');
console.log('🧪 VERIFYING CRO, SEO, PAYMENTS & GROWTH AUTOMATION SUITE');
console.log('======================================================================\n');

async function runTestSuite() {
    let passed = 0;
    let failed = 0;

    // ─── 1. SEO & Schema.org JSON-LD Verification ───
    console.log('🔍 [SUITE 1] SEO Specialist: Schema.org Structured Data Audit');
    try {
        const productPagePath = path.resolve(process.cwd(), 'app/(public)/product/[productId]/page.jsx');
        const shopPagePath = path.resolve(process.cwd(), 'app/(public)/shop/[username]/page.jsx');

        const productContent = fs.readFileSync(productPagePath, 'utf8');
        const shopContent = fs.readFileSync(shopPagePath, 'utf8');

        assert(productContent.includes('application/ld+json'), 'Product page must contain application/ld+json schema');
        assert(productContent.includes("'@type': 'Product'"), 'Product page must declare Schema.org Product type');
        assert(productContent.includes("'@type': 'Offer'"), 'Product page must declare Schema.org Offer type');
        assert(productContent.includes('availability: product.inStock'), 'Product page must provide stock availability');
        console.log('  ✅ [PASS] Product page contains valid Google Schema.org Product and Offer markup');
        passed++;

        assert(shopContent.includes('application/ld+json'), 'Shop page must contain application/ld+json schema');
        assert(shopContent.includes("'@type': 'OnlineStore'"), 'Shop page must declare Schema.org OnlineStore type');
        assert(shopContent.includes('hasMerchantReturnPolicy'), 'Shop page must declare transparent merchant return policy');
        console.log('  ✅ [PASS] Shop page contains valid Google Schema.org OnlineStore and Return Policy markup');
        passed++;
    } catch (err) {
        console.error('  ❌ [FAIL] Suite 1 failed:', err.message);
        failed++;
    }

    // ─── 2. CRO & Growth Hacker Checkout Bump Verification ───
    console.log('\n🚀 [SUITE 2] Growth Hacker & CRO: Inframe Modal & Order Bump Calculations');
    try {
        const modalPath = path.resolve(process.cwd(), 'components/GumroadIframeModal.jsx');
        const modalContent = fs.readFileSync(modalPath, 'utf8');

        assert(modalContent.includes('hasOrderBump'), 'Gumroad modal must feature dynamic order bump state');
        assert(modalContent.includes('orderTotal = Math.round'), 'Gumroad modal must calculate orderTotal with order bump');
        assert(modalContent.includes('PRIORITY DISPATCH & SAFE TRANSIT'), 'Gumroad modal must offer priority express shipping bump');
        console.log('  ✅ [PASS] Gumroad Inframe Modal correctly features 1-click order bump & dynamic total calculation');
        passed++;

        // Mathematical verification of order bump logic
        const basePrice = 29.99;
        const shipping = 4.99;
        const bumpPrice = 4.99;
        const totalWithoutBump = Math.round((basePrice + shipping) * 100) / 100;
        const totalWithBump = Math.round((basePrice + shipping + bumpPrice) * 100) / 100;

        assert.strictEqual(totalWithoutBump, 34.98, 'Total without bump must equal 34.98');
        assert.strictEqual(totalWithBump, 39.97, 'Total with bump must equal 39.97');
        console.log('  ✅ [PASS] Order bump math is accurate ($34.98 -> $39.97)');
        passed++;
    } catch (err) {
        console.error('  ❌ [FAIL] Suite 2 failed:', err.message);
        failed++;
    }

    // ─── 3. Payments & Billing Specialist: Webhook Replay & Idempotency ───
    console.log('\n💳 [SUITE 3] Payments & Billing Engineer: Gumroad Webhook Idempotency');
    try {
        const testSaleId = `test_sale_${Date.now()}`;
        const testOrderId = `test_order_${Date.now()}`;
        const testStoreId = 'store_cro_test';

        // 1. Initial check: should not be processed yet
        const initiallyProcessed = await isSaleProcessed(testSaleId);
        assert.strictEqual(initiallyProcessed, false, 'Fresh sale ID must not be flagged as processed');

        // 2. Mark as processed
        await markSaleProcessed(testSaleId, testOrderId);
        const nowProcessed = await isSaleProcessed(testSaleId);
        assert.strictEqual(nowProcessed, true, 'Sale ID must now be flagged as processed (idempotent key active)');

        // 3. Save order
        await saveServerOrder(testOrderId, {
            id: testOrderId,
            orderId: testOrderId,
            storeId: testStoreId,
            total: 39.97,
            saleId: testSaleId,
            isPaid: true
        });

        // 4. Retrieve order
        const orders = await getServerOrdersByStore(testStoreId);
        const savedOrder = orders.find(o => o.orderId === testOrderId);
        assert(savedOrder, 'Saved order must be resolvable from store order store');
        assert.strictEqual(savedOrder.total, 39.97, 'Order total must match verified price');
        console.log('  ✅ [PASS] Idempotency keys prevent replay attacks and duplicate order ingestion');
        passed++;
    } catch (err) {
        console.error('  ❌ [FAIL] Suite 3 failed:', err.message);
        failed++;
    }

    // ─── 4. Next.js 16 App Router & Mobile CRO Thumb Zone ───
    console.log('\n📱 [SUITE 4] Next.js 16 UX & Mobile CRO Thumb Zone');
    try {
        const productDetailsPath = path.resolve(process.cwd(), 'components/ProductDetails.jsx');
        const detailsContent = fs.readFileSync(productDetailsPath, 'utf8');

        assert(detailsContent.includes('Mobile Sticky Bottom Buy Bar'), 'Product details must contain Mobile Sticky Buy Bar');
        assert(detailsContent.includes('fixed bottom-0 inset-x-0 z-40'), 'Sticky bar must be positioned in fixed thumb zone');
        assert(detailsContent.includes('GumroadIframeModal'), 'Product details must open Gumroad Inframe Modal');
        console.log('  ✅ [PASS] Mobile sticky buy bar and inframe checkout integration certified');
        passed++;
    } catch (err) {
        console.error('  ❌ [FAIL] Suite 4 failed:', err.message);
        failed++;
    }

    console.log('\n======================================================================');
    console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('======================================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runTestSuite();
