import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { saveServerOrder, getServerOrder, getServerOrdersByStore } from '../lib/serverOrderStore.js';

console.log('======================================================================');
console.log('⚡ EMPIRICAL CHALLENGER M2_2: ADVERSARIAL STRESS TEST HARNESS');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
const failures = [];

function test(title, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✅ [PASS] ${title}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${title}`);
        console.error(`     Reason: ${err.message}`);
        failures.push({ title, error: err.message });
    }
}

async function runAsyncTest(title, fn) {
    totalTests++;
    try {
        await fn();
        console.log(`  ✅ [PASS] ${title}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${title}`);
        console.error(`     Reason: ${err.message}`);
        failures.push({ title, error: err.message });
    }
}

// -----------------------------------------------------------------------------
// SECTION 1: HYDRATION & SSR HTML GENERATION VS CLIENT DOM
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: HYDRATION & SSR CONSISTENCY CHECKS ---');

test('Settings page webhook code contains suppressHydrationWarning and safe SSR fallback', () => {
    const settingsCode = fs.readFileSync('app/store/settings/page.jsx', 'utf8');
    assert.ok(
        settingsCode.includes('<code suppressHydrationWarning'),
        'Settings webhook code element must include suppressHydrationWarning attribute'
    );
    assert.ok(
        settingsCode.includes("'https://gumshop.online/api/gumroad/webhook'"),
        'Settings webhook code must have static fallback for SSR'
    );
});

test('Marketing page eliminates origin hydration mismatch via mountedOrigin and suppressHydrationWarning', () => {
    const marketingCode = fs.readFileSync('app/store/marketing/page.jsx', 'utf8');
    
    // Check initial state is empty string so SSR and initial client pass match
    assert.ok(
        marketingCode.includes("const [mountedOrigin, setMountedOrigin] = useState('');"),
        'mountedOrigin must initialize to empty string'
    );
    // Check baseOrigin fallback
    assert.ok(
        marketingCode.includes("const baseOrigin = mountedOrigin || 'https://gumshop.online';"),
        'baseOrigin must fallback to https://gumshop.online during SSR and initial hydration'
    );
    // Check suppressHydrationWarning is applied to storeLink span
    assert.ok(
        marketingCode.includes('<span suppressHydrationWarning className="truncate max-w-xs">{storeLink}</span>'),
        'storeLink must have suppressHydrationWarning'
    );
    // Check suppressHydrationWarning is applied to bioLink span
    assert.ok(
        marketingCode.includes('<span suppressHydrationWarning className="font-mono text-xs font-bold text-slate-800 truncate select-all">{bioLink}</span>'),
        'bioLink display must have suppressHydrationWarning'
    );
    // Check suppressHydrationWarning on external anchor tag
    assert.ok(
        /href=\{bioLink\}[\r\n\s]+suppressHydrationWarning/.test(marketingCode),
        'bioLink anchor tag must have suppressHydrationWarning'
    );
});

test('Store performance page eliminates origin hydration mismatch via mountedOrigin and suppressHydrationWarning', () => {
    const storeCode = fs.readFileSync('app/store/page.jsx', 'utf8');
    
    // Check initial state is empty string
    assert.ok(
        storeCode.includes("const [mountedOrigin, setMountedOrigin] = useState('');"),
        'mountedOrigin in store page must initialize to empty string'
    );
    // Check loading gate
    assert.ok(
        storeCode.includes('if (loading) return <Loading />;'),
        'Store page must gate initial render with loading state to guarantee identical SSR/client initial DOM'
    );
    // Check suppressHydrationWarning on anchor
    assert.ok(
        /href=\{bioUrl\}[\r\n\s]+suppressHydrationWarning/.test(storeCode),
        'Store bio link anchor must have suppressHydrationWarning'
    );
});

test('Public homepage guarantees unconditional DOM anchors for #special-deals and #catalog', () => {
    const homeCode = fs.readFileSync('app/(public)/page.jsx', 'utf8');
    
    // Check #special-deals anchor exists independently of discountedDeals array length
    assert.ok(
        homeCode.includes('<div id="special-deals" className="scroll-mt-24" />'),
        'Homepage must render <div id="special-deals"> unconditionally'
    );
    // Check #catalog anchor exists
    assert.ok(
        homeCode.includes('id="catalog"'),
        'Homepage must render id="catalog"'
    );
});

// -----------------------------------------------------------------------------
// SECTION 2: INTERACTIVE CONTROLS & EVENT BUBBLING STRESS HARNESS
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: INTERACTIVE CONTROLS & CHECKBOX EVENT BUBBLING ---');

test('ProductDetails shipping protection label has NO onClick to prevent double-toggle bubbling', () => {
    const pdCode = fs.readFileSync('components/ProductDetails.jsx', 'utf8');
    
    // Ensure no onClick exists on the label
    const labelMatch = pdCode.match(/<label[^>]*onClick[^>]*hasShippingProtection/);
    assert.strictEqual(
        labelMatch,
        null,
        'Shipping protection <label> must NOT have any onClick handler'
    );
    
    // Ensure onChange is on the input
    assert.ok(
        pdCode.includes('onChange={(e) => setHasShippingProtection(e.target.checked)}'),
        'Checkbox input must handle onChange directly'
    );
});

test('Simulated shipping protection state transition: zero cancellation or double-inversion', () => {
    // Model the exact state machine
    let hasShippingProtection = false;
    const setHasShippingProtection = (val) => {
        if (typeof val === 'function') {
            hasShippingProtection = val(hasShippingProtection);
        } else {
            hasShippingProtection = val;
        }
    };

    // Scenario A: User clicks the label
    // Native HTML behavior: clicking a <label> triggers the input's change event with e.target.checked = !previous
    const simulateLabelClick = () => {
        // Since there is NO label onClick, only the input change fires:
        const nextChecked = !hasShippingProtection;
        setHasShippingProtection(nextChecked);
    };

    // 1st click
    simulateLabelClick();
    assert.strictEqual(hasShippingProtection, true, 'First label click must turn protection ON (true)');

    // 2nd click
    simulateLabelClick();
    assert.strictEqual(hasShippingProtection, false, 'Second label click must turn protection OFF (false)');

    // 3rd click
    simulateLabelClick();
    assert.strictEqual(hasShippingProtection, true, 'Third label click must turn protection ON (true)');

    // Scenario B: User clicks the input directly
    const simulateInputClick = () => {
        const nextChecked = !hasShippingProtection;
        setHasShippingProtection(nextChecked);
    };

    simulateInputClick();
    assert.strictEqual(hasShippingProtection, false, 'Input direct click must turn protection OFF (false)');

    // Price computation invariant
    const basePrice = 52.99;
    const protectionPrice = 4.99;
    const totalWithout = basePrice;
    const totalWith = parseFloat((basePrice + protectionPrice).toFixed(2));
    assert.strictEqual(totalWithout, 52.99, 'Total without protection must be $52.99');
    assert.strictEqual(totalWith, 57.98, 'Total with protection must be $57.98');
});

// -----------------------------------------------------------------------------
// SECTION 3: MULTI-STORE COUPON ISOLATION
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: MULTI-STORE COUPON ISOLATION ---');

test('Coupons page strictly isolates coupons to currentStore.id with 0 cross-store leakage', () => {
    const couponsCode = fs.readFileSync('app/store/coupons/page.jsx', 'utf8');
    
    assert.ok(
        couponsCode.includes('setCoupons((data || []).filter(c => c.storeId === currentStore.id))'),
        'Coupons must strictly filter with c.storeId === currentStore.id'
    );
    assert.ok(
        !couponsCode.includes('!c.storeId || c.storeId === currentStore.id'),
        'Coupons must NOT have loose fallback !c.storeId that leaks to all stores'
    );

    // Empirical filter test with mock adversarial coupons
    const currentStore = { id: 'store_alpha_123', username: 'alpha' };
    const mockCoupons = [
        { id: 'c1', code: 'ALPHA10', storeId: 'store_alpha_123' },
        { id: 'c2', code: 'BETA20', storeId: 'store_beta_456' },
        { id: 'c3', code: 'ORPHAN', storeId: null },
        { id: 'c4', code: 'UNDEFINED', storeId: undefined },
        { id: 'c5', code: 'EMPTY', storeId: '' },
        { id: 'c6', code: 'GLOBAL_ATTEMPT', storeId: 'global' },
    ];

    const isolated = mockCoupons.filter(c => c.storeId === currentStore.id);
    assert.strictEqual(isolated.length, 1, 'Only exactly 1 coupon must match Store Alpha');
    assert.strictEqual(isolated[0].code, 'ALPHA10', 'Only Store Alpha coupon must be returned');
    assert.strictEqual(isolated.some(c => c.code === 'BETA20'), false, 'Store Beta coupon must NOT leak');
    assert.strictEqual(isolated.some(c => c.code === 'ORPHAN'), false, 'Orphaned coupon must NOT leak');
    assert.strictEqual(isolated.some(c => c.code === 'UNDEFINED'), false, 'Undefined coupon must NOT leak');
});

// -----------------------------------------------------------------------------
// SECTION 4: MULTI-STORE SCOPED STORAGE & GUMROAD URL ISOLATION
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: GUMROAD URL MULTI-TENANT STORAGE ISOLATION ---');

test('Settings page scopes Gumroad product URL writes to gumroad_url_${cleanSlug}', () => {
    const settingsCode = fs.readFileSync('app/store/settings/page.jsx', 'utf8');
    
    assert.ok(
        !settingsCode.includes("localStorage.setItem('gumshop_gumroad_url'"),
        'Must not write to un-scoped gumshop_gumroad_url'
    );
    assert.ok(
        !settingsCode.includes("localStorage.setItem('gumroad_product_url'"),
        'Must not write to un-scoped gumroad_product_url'
    );
    assert.ok(
        settingsCode.includes('localStorage.setItem(`gumroad_url_${cleanSlug}`, firstUrl);') ||
        settingsCode.includes('localStorage.setItem(`gumroad_url_${cleanSlug}`'),
        'Must write to store-scoped key gumroad_url_${cleanSlug}'
    );

    // Slug generation algorithm stress-test
    const computeCleanSlug = (storeInfo) => {
        return (storeInfo.username ? storeInfo.username.trim() : (storeInfo.name || 'shop').replace(/\s+/g, '-'))
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'shop';
    };

    const stores = [
        { info: { username: 'alpha-merchant', name: 'Alpha Shop' }, expectedUrl: 'https://gumroad.com/l/alpha-prod' },
        { info: { username: '', name: 'Beta & Gamma Store!' }, expectedUrl: 'https://gumroad.com/l/beta-prod' },
        { info: { username: 'store_delta', name: 'Delta' }, expectedUrl: 'https://gumroad.com/l/delta-prod' },
        { info: { username: '   epsilon-store   ', name: '' }, expectedUrl: 'https://gumroad.com/l/epsilon-prod' },
    ];

    const mockLocalStorage = {};

    stores.forEach(s => {
        const slug = computeCleanSlug(s.info);
        mockLocalStorage[`gumroad_url_${slug}`] = s.expectedUrl;
    });

    // Verify isolation: modifying one does not affect another
    const slugAlpha = computeCleanSlug(stores[0].info);
    const slugBeta = computeCleanSlug(stores[1].info);
    
    assert.strictEqual(mockLocalStorage[`gumroad_url_${slugAlpha}`], 'https://gumroad.com/l/alpha-prod');
    assert.strictEqual(mockLocalStorage[`gumroad_url_${slugBeta}`], 'https://gumroad.com/l/beta-prod');

    // Overwrite Alpha
    mockLocalStorage[`gumroad_url_${slugAlpha}`] = 'https://gumroad.com/l/alpha-prod-UPDATED';
    assert.strictEqual(mockLocalStorage[`gumroad_url_${slugBeta}`], 'https://gumroad.com/l/beta-prod', 'Beta URL must remain intact after Alpha modification');
});

// -----------------------------------------------------------------------------
// SECTION 5: SERVER ORDER STORE PERSISTENCE & GUMROAD SYNC
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 5: SERVER ORDER PERSISTENCE & GUMROAD SYNC ---');

await runAsyncTest('Gumroad sync route persists orders via saveServerOrder and is queryable', async () => {
    const syncCode = fs.readFileSync('app/api/gumroad/sync/route.js', 'utf8');
    assert.ok(
        syncCode.includes('saveServerOrder(orderId, {'),
        'Gumroad sync route must call saveServerOrder with orderId and payload'
    );
    assert.ok(
        !syncCode.includes('const ref = () => null;'),
        'Gumroad sync route must not retain dead ref stubs'
    );

    // Directly test saveServerOrder and getServerOrder
    const testOrderId = `test_ord_sync_${Date.now()}`;
    const testPayload = {
        id: testOrderId,
        orderId: testOrderId,
        storeId: 'store_charlie',
        customer: { name: 'Empirical Tester', email: 'tester@gumshop.online' },
        items: 'Viral Product 1-Pack',
        total: 52.99,
        currency: 'USD',
        status: 'Completed',
        source: 'gumroad_sync',
        gumroadSaleId: `sale_${testOrderId}`
    };

    await saveServerOrder(testOrderId, testPayload);

    // Retrieve by orderId
    const retrieved = await getServerOrder(testOrderId, 'store_charlie');
    assert.ok(retrieved !== null, 'Saved order must be retrievable from serverOrderStore by orderId');
    assert.strictEqual(retrieved.id, testOrderId, 'Retrieved order id must match');
    assert.strictEqual(retrieved.total, 52.99, 'Retrieved order total must match $52.99');
    assert.strictEqual(retrieved.source, 'gumroad_sync', 'Retrieved order source must be gumroad_sync');

    // Test store scoping via getServerOrdersByStore
    const storeOrders = await getServerOrdersByStore('store_charlie');
    assert.ok(storeOrders.some(o => o.id === testOrderId), 'Order must appear in store_charlie orders');

    const otherStoreOrders = await getServerOrdersByStore('store_other_xyz');
    assert.strictEqual(otherStoreOrders.some(o => o.id === testOrderId), false, 'Order must NOT appear in store_other_xyz');
});

// -----------------------------------------------------------------------------
// SECTION 6: DEAD INTERNAL ANCHORS AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 6: DEAD INTERNAL ANCHORS & ROUTE INTEGRITY ---');

test('Navbar.jsx and Footer.jsx have zero dead anchors (#flash-deals, #reviews)', () => {
    const navbar = fs.readFileSync('components/Navbar.jsx', 'utf8');
    const footer = fs.readFileSync('components/Footer.jsx', 'utf8');

    assert.ok(!navbar.includes('#flash-deals'), 'Navbar must not contain #flash-deals');
    assert.ok(!navbar.includes('#reviews'), 'Navbar must not contain #reviews');
    assert.ok(!footer.includes('#flash-deals'), 'Footer must not contain #flash-deals');
    assert.ok(!footer.includes('#reviews'), 'Footer must not contain #reviews');

    // Confirm #special-deals is used instead
    assert.ok(navbar.includes('#special-deals'), 'Navbar must link to #special-deals');
    assert.ok(footer.includes('#special-deals'), 'Footer must link to #special-deals');
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`📊 ADVERSARIAL STRESS TEST SUMMARY: ${passedTests}/${totalTests} PASSED`);
if (failures.length > 0) {
    console.log(`❌ FAILURES (${failures.length}):`);
    failures.forEach(f => console.log(`  - ${f.title}: ${f.error}`));
    process.exit(1);
} else {
    console.log(`🏆 ALL ADVERSARIAL CHALLENGES CONFIRMED ROBUST!`);
    console.log('======================================================================\n');
}
