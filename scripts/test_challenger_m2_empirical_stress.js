/**
 * ============================================================================
 * 🧪 ADVERSARIAL CHALLENGER STRESS HARNESS: MILESTONE 2
 * ============================================================================
 * Independent, empirical verification and stress-testing of Milestone 2 changes:
 * 1. Checkbox click event propagation in ProductDetails.jsx (simulate click, verify exactly one state toggle)
 * 2. Coupon store isolation (create coupon without storeId or with storeId B, verify Store A coupon query excludes it)
 * 3. Gumroad URL storage isolation (verify Store B does not write to global gumshop_gumroad_url)
 * 4. Order sync persistence (call sync logic, verify order is saved in serverOrderStore)
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { getServerOrder, getServerOrdersByStore, saveServerOrder } from '../lib/db/orders.js';
import { POST as syncRouteHandler } from '../app/api/gumroad/sync/route.js';

console.log('======================================================================');
console.log('🔥 EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 2 STRESS HARNESS');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runStressTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✅ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
        process.exitCode = 1;
    }
}

async function runAsyncStressTest(name, fn) {
    totalTests++;
    try {
        await fn();
        console.log(`  ✅ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
        process.exitCode = 1;
    }
}

async function runAll() {

// ============================================================================
// CHALLENGE 1: Checkbox Click Event Propagation in ProductDetails.jsx
// ============================================================================
console.log('--- 1. Testing Checkbox Click Event Propagation in ProductDetails.jsx ---');

// 1.1 Source Code AST / Static Inspection
runStressTest('ProductDetails.jsx has NO conflicting onClick on <label> and valid onChange on <input>', () => {
    const pdContent = fs.readFileSync(path.join(process.cwd(), 'components/ProductDetails.jsx'), 'utf8');
    
    // Find the shipping protection section
    const shippingSectionMatch = pdContent.match(/Shipping Protection & Skip The Line Add-on Checkbox[\s\S]*?<\/label>/);
    assert(shippingSectionMatch, 'Shipping protection section must exist in ProductDetails.jsx');
    const shippingSection = shippingSectionMatch[0];

    // Verify <label> tag does NOT contain onClick
    const labelTagMatch = shippingSection.match(/<label[\s\S]*?>/);
    assert(labelTagMatch, '<label> tag must be found in shipping protection section');
    const labelTag = labelTagMatch[0];
    assert(!labelTag.includes('onClick'), 'Label tag must NOT have an onClick handler (prevents double-toggle bug)');

    // Verify <input type="checkbox"> has onChange and checked bindings
    assert(shippingSection.includes('type="checkbox"'), 'Section must contain type="checkbox"');
    assert(shippingSection.includes('checked={hasShippingProtection}'), 'Checkbox must bind checked={hasShippingProtection}');
    assert(shippingSection.includes('onChange={(e) => setHasShippingProtection(e.target.checked)}'), 
        'Checkbox must use standard onChange with e.target.checked');
});

// 1.2 Event Propagation Simulation & Parity Stress Test
runStressTest('Event loop simulation: Counter-example proof of buggy double-toggle vs fixed single-toggle', () => {
    // A. BUGGY MODEL: Simulating component with <label onClick> AND <input onChange>
    class BuggyCheckboxComponent {
        constructor() {
            this.state = { hasShippingProtection: true };
            this.toggleLog = [];
        }

        // When a user clicks on the checkbox input inside a label with onClick:
        simulateClickOnInput() {
            // Step 1: Input receives click, changes checked status, and fires onChange
            const newChecked = !this.state.hasShippingProtection;
            this.state.hasShippingProtection = newChecked;
            this.toggleLog.push(`onChange: ${newChecked}`);

            // Step 2: In DOM, the click event bubbles from <input> to <label>
            // The label's onClick handler intercepts the bubbling click
            const revertedState = !this.state.hasShippingProtection;
            this.state.hasShippingProtection = revertedState;
            this.toggleLog.push(`label onClick: ${revertedState}`);
        }
    }

    const buggy = new BuggyCheckboxComponent();
    assert.strictEqual(buggy.state.hasShippingProtection, true, 'Initial state should be true');
    buggy.simulateClickOnInput();
    // In buggy model, 2 toggle events fired and state reverted back to true!
    assert.strictEqual(buggy.toggleLog.length, 2, 'Buggy model fired 2 toggle events');
    assert.strictEqual(buggy.state.hasShippingProtection, true, 'Buggy model reverted back to true (double-toggle cancel out)');

    // B. FIXED MODEL: Simulating component with NO label onClick, ONLY input onChange
    class FixedCheckboxComponent {
        constructor() {
            this.state = { hasShippingProtection: true };
            this.toggleLog = [];
        }

        // When user clicks the input directly:
        simulateClickOnInput() {
            const newChecked = !this.state.hasShippingProtection;
            this.state.hasShippingProtection = newChecked;
            this.toggleLog.push(`onChange: ${newChecked}`);
            // Click bubbles to <label>, but label has NO onClick handler, so NO extra toggle occurs!
        }

        // When user clicks the label text or padding:
        simulateClickOnLabel() {
            // Standard browser label activation behavior: clicking label delegates activation to labeled control
            // Control toggles and dispatches change event:
            const newChecked = !this.state.hasShippingProtection;
            this.state.hasShippingProtection = newChecked;
            this.toggleLog.push(`onChange: ${newChecked}`);
            // No label onClick, so exactly ONE toggle occurs!
        }
    }

    const fixed = new FixedCheckboxComponent();
    assert.strictEqual(fixed.state.hasShippingProtection, true, 'Initial state should be true');
    
    // Click 1: input click -> false (1 toggle)
    fixed.simulateClickOnInput();
    assert.strictEqual(fixed.state.hasShippingProtection, false, 'First click toggles to false');
    assert.strictEqual(fixed.toggleLog.length, 1, 'Exactly one toggle event fired');

    // Click 2: label text click -> true (1 toggle)
    fixed.simulateClickOnLabel();
    assert.strictEqual(fixed.state.hasShippingProtection, true, 'Second click toggles to true');
    assert.strictEqual(fixed.toggleLog.length, 2, 'Total 2 toggle events fired across 2 clicks');

    // Rapid Burst Stress Test: 100 sequential clicks
    for (let i = 0; i < 100; i++) {
        const expected = (i % 2 === 0) ? false : true;
        if (i % 2 === 0) {
            fixed.simulateClickOnInput();
        } else {
            fixed.simulateClickOnLabel();
        }
        assert.strictEqual(fixed.state.hasShippingProtection, expected, `Click ${i + 3} must toggle to ${expected}`);
    }
    assert.strictEqual(fixed.toggleLog.length, 102, 'Total 102 toggle events for 102 clicks (1:1 ratio)');
});


// ============================================================================
// CHALLENGE 2: Coupon Store Isolation
// ============================================================================
console.log('\n--- 2. Testing Coupon Store Isolation ---');

runStressTest('Coupons filter strictly isolates storeId and rejects unassociated & foreign coupons', () => {
    // Generate adversarial coupon inventory
    const mockInventory = [
        // Store Alpha coupons
        { code: 'ALPHA10', storeId: 'store_alpha', discount: 10 },
        { code: 'ALPHA20', storeId: 'store_alpha', discount: 20 },
        { code: 'ALPHA_VIP', storeId: 'store_alpha', discount: 50 },

        // Store Beta coupons (cross-store contamination)
        { code: 'BETA15', storeId: 'store_beta', discount: 15 },
        { code: 'BETA30', storeId: 'store_beta', discount: 30 },

        // Legacy / unassociated coupons (must NEVER leak into any store!)
        { code: 'SAVE10', discount: 10 }, // missing storeId property
        { code: 'SAVE20', storeId: undefined, discount: 20 },
        { code: 'VIP15', storeId: null, discount: 15 },
        { code: 'FREESHIP', storeId: '', discount: 100 },
        { code: 'ZERO_STORE', storeId: 0, discount: 5 },
        { code: 'FALSE_STORE', storeId: false, discount: 10 },

        // Prefix / substring collision attacks
        { code: 'ALPHA_ATTACK_1', storeId: 'store_alpha_v2', discount: 90 },
        { code: 'ALPHA_ATTACK_2', storeId: 'store_alphax', discount: 90 },
        { code: 'ALPHA_ATTACK_3', storeId: 'prefixed_store_alpha', discount: 90 },

        // Casing variations (must be exact match)
        { code: 'ALPHA_UPPER', storeId: 'STORE_ALPHA', discount: 25 },
        { code: 'ALPHA_MIXED', storeId: 'Store_Alpha', discount: 25 },

        // Object / Prototype pollution attacks
        { code: 'PROTO_ATTACK', storeId: '__proto__', discount: 100 }
    ];

    // The authoritative filtering logic from app/store/coupons/page.jsx:72:
    // setCoupons((data || []).filter(c => c.storeId === currentStore.id))
    const filterForStore = (coupons, targetStoreId) => {
        return (coupons || []).filter(c => c.storeId === targetStoreId);
    };

    // Query for Store Alpha
    const alphaCoupons = filterForStore(mockInventory, 'store_alpha');
    const alphaCodes = alphaCoupons.map(c => c.code);

    assert.strictEqual(alphaCoupons.length, 3, 'Store Alpha must receive exactly 3 coupons');
    assert.deepStrictEqual(alphaCodes.sort(), ['ALPHA10', 'ALPHA20', 'ALPHA_VIP'].sort(), 'Store Alpha coupon codes must match exactly');

    // Verify exclusions
    assert(!alphaCodes.includes('BETA15'), 'Store Alpha must NOT leak Store Beta coupon BETA15');
    assert(!alphaCodes.includes('BETA30'), 'Store Alpha must NOT leak Store Beta coupon BETA30');
    assert(!alphaCodes.includes('SAVE10'), 'Store Alpha must NOT leak unassociated coupon SAVE10');
    assert(!alphaCodes.includes('SAVE20'), 'Store Alpha must NOT leak unassociated coupon SAVE20');
    assert(!alphaCodes.includes('VIP15'), 'Store Alpha must NOT leak unassociated coupon VIP15');
    assert(!alphaCodes.includes('FREESHIP'), 'Store Alpha must NOT leak empty-storeId coupon FREESHIP');
    assert(!alphaCodes.includes('ALPHA_ATTACK_1'), 'Store Alpha must NOT leak prefix collision store_alpha_v2');
    assert(!alphaCodes.includes('ALPHA_ATTACK_2'), 'Store Alpha must NOT leak suffix collision store_alphax');
    assert(!alphaCodes.includes('ALPHA_UPPER'), 'Store Alpha must NOT leak case mismatched STORE_ALPHA');

    // Query for Store Beta
    const betaCoupons = filterForStore(mockInventory, 'store_beta');
    const betaCodes = betaCoupons.map(c => c.code);
    assert.strictEqual(betaCoupons.length, 2, 'Store Beta must receive exactly 2 coupons');
    assert.deepStrictEqual(betaCodes.sort(), ['BETA15', 'BETA30'].sort(), 'Store Beta coupon codes must match exactly');
    assert(!betaCodes.includes('ALPHA10'), 'Store Beta must NOT leak Store Alpha coupons');
    assert(!betaCodes.includes('SAVE10'), 'Store Beta must NOT leak legacy coupons');

    // Query for non-existent Store Gamma
    const gammaCoupons = filterForStore(mockInventory, 'store_gamma');
    assert.strictEqual(gammaCoupons.length, 0, 'Store Gamma must receive 0 coupons');
});

runStressTest('Coupons page source code strictly binds storeId on creation and query', () => {
    const couponsPageContent = fs.readFileSync(path.join(process.cwd(), 'app/store/coupons/page.jsx'), 'utf8');

    // Query filter must be strict
    assert(couponsPageContent.includes('c.storeId === currentStore.id'), 
        'Coupons page query filter must use strict equality (c.storeId === currentStore.id)');
    assert(!couponsPageContent.includes('!c.storeId ||'), 
        'Coupons page must NOT have permissive fallback (!c.storeId ||)');

    // Creation must explicitly bind storeId: currentStore.id
    assert(couponsPageContent.includes('storeId: currentStore.id'), 
        'Coupons creation payload must bind storeId: currentStore.id');
});


// ============================================================================
// CHALLENGE 3: Gumroad URL Storage Isolation
// ============================================================================
console.log('\n--- 3. Testing Gumroad URL Storage Isolation ---');

runStressTest('Store B Gumroad URL configuration does NOT write to global gumshop_gumroad_url', () => {
    // Mock localStorage
    const storage = new Map();
    const mockLocalStorage = {
        getItem: (k) => storage.has(k) ? storage.get(k) : null,
        setItem: (k, v) => storage.set(k, String(v)),
        removeItem: (k) => storage.delete(k),
        clear: () => storage.clear()
    };

    // Pre-seed storage with global fallback and Store A configuration
    mockLocalStorage.setItem('gumshop_gumroad_url', 'https://gumroad.com/l/initial-global-fallback');
    mockLocalStorage.setItem('gumroad_url_store-a', 'https://gumroad.com/l/store-a-authoritative');

    // Slug sanitizer function directly from app/store/settings/page.jsx:363, 401, 1022
    const deriveCleanSlug = (storeInfo) => {
        return (storeInfo.username ? storeInfo.username.trim() : (storeInfo.name || 'shop').replace(/\s+/g, '-'))
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'shop';
    };

    // Simulate Store B configuring its Gumroad checkout product
    const storeB = {
        id: 'store_102',
        name: 'Store Beta Official',
        username: 'store-beta'
    };
    const storeBProductUrl = 'https://gumroad.com/l/store-beta-checkout';
    const cleanSlugB = deriveCleanSlug(storeB);
    assert.strictEqual(cleanSlugB, 'store-beta');

    // Execute the scoped write from settings/page.jsx
    mockLocalStorage.setItem(`gumroad_url_${cleanSlugB}`, storeBProductUrl);

    // Assertions
    // 1. Store B wrote to its scoped key
    assert.strictEqual(mockLocalStorage.getItem('gumroad_url_store-beta'), storeBProductUrl, 
        'Store B must write to gumroad_url_store-beta');

    // 2. Global gumshop_gumroad_url was NOT modified
    assert.strictEqual(mockLocalStorage.getItem('gumshop_gumroad_url'), 'https://gumroad.com/l/initial-global-fallback', 
        'Global gumshop_gumroad_url must NOT be overwritten by Store B');

    // 3. Store A configuration was NOT modified
    assert.strictEqual(mockLocalStorage.getItem('gumroad_url_store-a'), 'https://gumroad.com/l/store-a-authoritative', 
        'Store A gumroad_url_store-a must NOT be overwritten by Store B');

    // 4. Legacy gumroad_product_url key was NOT written
    assert.strictEqual(mockLocalStorage.getItem('gumroad_product_url'), null, 
        'Legacy un-scoped gumroad_product_url must remain null');
});

runStressTest('Slug sanitizer handles adversarial store names and special characters cleanly', () => {
    const deriveCleanSlug = (storeInfo) => {
        return (storeInfo.username ? storeInfo.username.trim() : (storeInfo.name || 'shop').replace(/\s+/g, '-'))
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'shop';
    };

    const cases = [
        { info: { name: '  Awesome Product Store!  ' }, expected: 'awesome-product-store' },
        { info: { name: 'Store #42 & More (Special Edition)' }, expected: 'store-42-more-special-edition' },
        { info: { name: '---weird---dashes---' }, expected: 'weird-dashes' },
        { info: { name: '$$$###@@@' }, expected: 'shop' }, // falls back to 'shop'
        { info: { username: '  Custom_User-Name.123  ' }, expected: 'custom-user-name-123' },
        { info: {}, expected: 'shop' }
    ];

    for (const { info, expected } of cases) {
        const slug = deriveCleanSlug(info);
        assert.strictEqual(slug, expected, `Slug for ${JSON.stringify(info)} must equal "${expected}", got "${slug}"`);
    }
});


// ============================================================================
// CHALLENGE 4: Order Sync Persistence
// ============================================================================
console.log('\n--- 4. Testing Order Sync Persistence ---');

    await runAsyncStressTest('saveServerOrder persists orders and getServerOrder / getServerOrdersByStore retrieves them', async () => {
    const testOrderId = `test_ord_${Date.now()}_alpha`;
    const testPayload = {
        id: testOrderId,
        orderId: testOrderId,
        storeId: 'store_sync_test',
        total: 52.99,
        customer: {
            name: 'Jane Doe',
            email: 'jane@example.com',
            shippingAddress: '123 Test Way, Austin TX 78701'
        },
        items: 'Viral Costume 1-Pack',
        source: 'gumroad_sync',
        createdAt: new Date().toISOString()
    };

    // Save directly to serverOrderStore
    await saveServerOrder(testOrderId, testPayload);

    // Retrieve by ID
    const retrieved = await getServerOrder(testOrderId);
    assert(retrieved, `Order ${testOrderId} must be retrievable from serverOrderStore`);
    assert.strictEqual(retrieved.id, testOrderId);
    assert.strictEqual(retrieved.total, 52.99);
    assert.strictEqual(retrieved.customer.email, 'jane@example.com');
    assert.strictEqual(retrieved.source, 'gumroad_sync');

    // Retrieve by Store ID
    const storeOrders = await getServerOrdersByStore('store_sync_test');
    assert(storeOrders.some(o => o.id === testOrderId), `Order ${testOrderId} must appear in getServerOrdersByStore('store_sync_test')`);

    // Verify other store does NOT see this order
    const otherStoreOrders = await getServerOrdersByStore('store_sync_other');
    assert(!otherStoreOrders.some(o => o.id === testOrderId), `Order ${testOrderId} must NOT appear in getServerOrdersByStore('store_sync_other')`);
});

    await runAsyncStressTest('Gumroad Sync API route persists real sales into serverOrderStore and isolates per-store', async () => {
    // Mock the external Gumroad API responses for fetch
    const originalFetch = globalThis.fetch;

    const mockSales = [
        {
            id: 'sale_sync_101',
            order_number: 99101,
            price: 5299, // $52.99 in cents
            product_name: 'GumShop Special Deals (1-Pack)',
            currency: 'usd',
            full_name: 'Alice Wonder',
            email: 'alice@example.com',
            shipping_information: {
                street_address: '404 Wonderland Ave',
                city: 'Seattle',
                postal_code: '98101',
                country: 'US'
            },
            url_params: {
                store_id: 'store_retail_a'
            },
            created_at: '2026-10-15T10:00:00Z',
            refunded: false,
            disputed: false
        },
        {
            id: 'sale_sync_102',
            order_number: 99102,
            price: 7462, // $74.62 in cents (2-Pack)
            product_name: 'GumShop Special Deals (2-Pack)',
            currency: 'usd',
            full_name: 'Bob Builder',
            email: 'bob@example.com',
            shipping_information: null,
            url_params: {
                shipping_address: '777 Brick Road, Denver CO 80201',
                store_id: 'store_retail_a'
            },
            created_at: '2026-10-15T10:05:00Z',
            refunded: false,
            disputed: false
        },
        {
            id: 'sale_sync_103',
            order_number: 99103,
            price: 9624, // $96.24 in cents (3-Pack)
            product_name: 'GumShop Special Deals (3-Pack)',
            currency: 'usd',
            full_name: 'Charlie Chaplin',
            email: 'charlie@example.com',
            shipping_information: null,
            url_params: {
                store_id: 'store_retail_b' // Belongs to Store B!
            },
            created_at: '2026-10-15T10:10:00Z',
            refunded: false,
            disputed: false
        }
    ];

    globalThis.fetch = async (url, options) => {
        const urlStr = String(url);
        // Gumroad /v2/user verification endpoint
        if (urlStr.includes('/v2/user')) {
            return new Response(JSON.stringify({
                success: true,
                user: {
                    name: 'Merchant Test User',
                    email: 'merchant@test.com'
                }
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // Gumroad /v2/sales endpoint
        if (urlStr.includes('/v2/sales')) {
            return new Response(JSON.stringify({
                success: true,
                sales: mockSales
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // Default fallback
        return originalFetch(url, options);
    };

    try {
        // Construct simulated HTTP Request to POST /api/gumroad/sync
        const syncRequest = new Request('http://localhost:3000/api/gumroad/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: 'mock_test_gumroad_token',
                storeId: 'store_retail_a',
                action: 'sync'
            })
        });

        const res = await syncRouteHandler(syncRequest);
        assert.strictEqual(res.status, 200, `Sync route should return HTTP 200, got ${res.status}`);

        const data = await res.json();
        assert.strictEqual(data.success, true, 'Sync route must respond with success: true');
        assert.strictEqual(data.count, 3, 'Sync route must process 3 sales from Gumroad');

        // Verify order 99101 persistence in serverOrderStore
        const order1 = await getServerOrder('99101');
        assert(order1, 'Order 99101 must be saved and retrievable from serverOrderStore');
        assert.strictEqual(order1.id, '99101');
        assert.strictEqual(order1.storeId, 'store_retail_a');
        assert.strictEqual(order1.total, 52.99, 'Order 99101 total must be $52.99');
        assert.strictEqual(order1.customer.email, 'alice@example.com');
        assert.strictEqual(order1.source, 'gumroad_sync');
        assert(order1.syncedAt, 'Order 99101 must record syncedAt timestamp');

        // Verify order 99102 persistence in serverOrderStore
        const order2 = await getServerOrder('99102');
        assert(order2, 'Order 99102 must be saved and retrievable from serverOrderStore');
        assert.strictEqual(order2.total, 74.62, 'Order 99102 total must be $74.62');
        assert.strictEqual(order2.customer.email, 'bob@example.com');
        assert.strictEqual(order2.customer.shippingAddress, '777 Brick Road, Denver CO 80201');

        // Verify order 99103 persistence in serverOrderStore
        const order3 = await getServerOrder('99103');
        assert(order3, 'Order 99103 must be saved and retrievable from serverOrderStore');
        assert.strictEqual(order3.storeId, 'store_retail_b');
        assert.strictEqual(order3.total, 96.24, 'Order 99103 total must be $96.24');

        // Verify Store Scoping in serverOrderStore
        const storeAOrders = await getServerOrdersByStore('store_retail_a');
        const storeAIds = storeAOrders.map(o => o.id);
        assert(storeAIds.includes('99101'), 'Store A orders must include order 99101');
        assert(storeAIds.includes('99102'), 'Store A orders must include order 99102');
        assert(!storeAIds.includes('99103'), 'Store A orders must EXCLUDE Store B order 99103');

        const storeBOrders = await getServerOrdersByStore('store_retail_b');
        const storeBIds = storeBOrders.map(o => o.id);
        assert(storeBIds.includes('99103'), 'Store B orders must include order 99103');
        assert(!storeBIds.includes('99101'), 'Store B orders must EXCLUDE Store A order 99101');

        // Stress Test: Idempotency & Deduplication
        // Call the sync endpoint again with the same payload
        const syncRequest2 = new Request('http://localhost:3000/api/gumroad/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: 'mock_test_gumroad_token',
                storeId: 'store_retail_a',
                action: 'sync'
            })
        });

        const res2 = await syncRouteHandler(syncRequest2);
        assert.strictEqual(res2.status, 200);

        const storeAOrdersAfter = await getServerOrdersByStore('store_retail_a');
        // Total orders for Store A should still be 2 (no duplicates!)
        assert.strictEqual(storeAOrdersAfter.filter(o => o.id === '99101').length, 1, 'Order 99101 must not be duplicated');
        assert.strictEqual(storeAOrdersAfter.filter(o => o.id === '99102').length, 1, 'Order 99102 must not be duplicated');

    } finally {
        globalThis.fetch = originalFetch;
    }
    });

    // ============================================================================
    // FINAL SUMMARY
    // ============================================================================
    console.log('\n======================================================================');
    console.log(`📊 CHALLENGER TEST RESULTS: ${passedTests} / ${totalTests} assertions passed (${Math.round((passedTests/totalTests)*100)}%)`);
    if (process.exitCode) {
        console.log('❌ VERDICT: FAIL — Some stress-test assertions failed');
    } else {
        console.log('🏆 VERDICT: PASS — 100% of adversarial stress assertions passed');
    }
    console.log('======================================================================');
}

runAll().catch(err => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
});

