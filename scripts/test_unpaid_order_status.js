import assert from 'assert';
import { normalizeOrder, createOrder, getOrdersByStore, updateOrder } from '../lib/db/orders.js';

async function runTests() {
    console.log('======================================================================');
    console.log('🚀 TEST SUITE: AUTHENTIC ORDER PAYMENT & FULFILLMENT STATUS SEPARATION');
    console.log('======================================================================\n');

    let passed = 0;

    // Test 1: Incomplete checkout session must NOT default to status: 'paid'
    const unpaidRow = {
        id: 'ord_test_unpaid_1',
        total: 54.99,
        created_at: new Date().toISOString(),
        data: {
            isPaid: false,
            paymentStatus: 'CHECKOUT_STARTED',
            orderStatus: 'PENDING',
            fulfillmentStatus: 'UNFULFILLED',
            total: 54.99
        }
    };
    const normalizedUnpaid = normalizeOrder(unpaidRow);
    assert.strictEqual(normalizedUnpaid.isPaid, false, 'isPaid must be false');
    assert.strictEqual(normalizedUnpaid.paymentStatus, 'CHECKOUT_STARTED', 'paymentStatus must be CHECKOUT_STARTED');
    assert.notStrictEqual(normalizedUnpaid.status, 'paid', 'status must NOT be paid for unpaid order');
    assert.strictEqual(normalizedUnpaid.status, 'unpaid', 'status should be unpaid');
    assert.strictEqual(normalizedUnpaid.fulfillmentStatus, 'UNFULFILLED');
    console.log('  ✅ [PASS] Incomplete checkout session normalizes to isPaid: false and status: "unpaid" (NEVER "paid")');
    passed++;

    // Test 2: Paid order normalizes correctly
    const paidRow = {
        id: 'ord_test_paid_1',
        total: 52.99,
        created_at: new Date().toISOString(),
        data: {
            isPaid: true,
            paymentStatus: 'PAID',
            orderStatus: 'CONFIRMED',
            fulfillmentStatus: 'PROCESSING',
            total: 52.99
        }
    };
    const normalizedPaid = normalizeOrder(paidRow);
    assert.strictEqual(normalizedPaid.isPaid, true, 'isPaid must be true');
    assert.strictEqual(normalizedPaid.paymentStatus, 'PAID', 'paymentStatus must be PAID');
    assert.strictEqual(normalizedPaid.fulfillmentStatus, 'PROCESSING');
    console.log('  ✅ [PASS] Confirmed paid order normalizes to isPaid: true and paymentStatus: "PAID"');
    passed++;

    // Test 3: Live store record for phantompaws-headless-horseman-pet-costume
    const storeOrders = await getOrdersByStore('phantompaws-headless-horseman-pet-costume');
    console.log(`  Fetched ${storeOrders.length} orders for phantompaws store`);
    const targetOrder = storeOrders.find(o => o.id === 'ord_1792080761013_qs2cy');
    if (targetOrder) {
        assert.strictEqual(targetOrder.isPaid, false, 'Target order must have isPaid: false');
        assert.strictEqual(targetOrder.paymentStatus, 'CHECKOUT_STARTED', 'paymentStatus must be CHECKOUT_STARTED');
        assert.notStrictEqual(targetOrder.status, 'paid', 'Target order must NOT display status: paid');
        console.log(`  ✅ [PASS] Real database order ord_1792080761013_qs2cy is confirmed UNPAID with status "${targetOrder.status}"`);
        passed++;
    } else {
        console.log('  ⚠️ [SKIP] Specific order not found (store may have clean slate)');
    }

    // Test 4: createOrder with unpaid checkout data does NOT write status: 'paid'
    const testCheckoutSession = {
        id: `ord_test_${Date.now()}`,
        storeId: 'store_test_isolation',
        total: 54.99,
        isPaid: false,
        paymentStatus: 'CHECKOUT_STARTED',
        fulfillmentStatus: 'UNFULFILLED'
    };
    const created = await createOrder(testCheckoutSession);
    assert.strictEqual(created.isPaid, false);
    assert.strictEqual(created.status, 'unpaid');
    assert.strictEqual(created.paymentStatus, 'CHECKOUT_STARTED');
    console.log('  ✅ [PASS] createOrder with checkout initiation preserves status: "unpaid"');
    passed++;

    console.log('\n======================================================================');
    console.log(`📊 RESULTS: ${passed} passed, 0 failed`);
    console.log('======================================================================\n');
}

runTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
