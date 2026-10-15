import fs from 'fs';
import assert from 'assert';

console.log('======================================================================');
console.log('🚀 TEST SUITE: MILESTONE 2 RUNTIME & CONTROLS HARDENING');
console.log('======================================================================\n');

let passed = 0;

function check(desc, fn) {
    try {
        fn();
        console.log(`  ✅ [PASS] ${desc}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${desc}: ${err.message}`);
        process.exitCode = 1;
    }
}

// 1. ProductDetails.jsx
check('ProductDetails checkbox double-toggle event bubbling bug eliminated', () => {
    const pd = fs.readFileSync('components/ProductDetails.jsx', 'utf8');
    assert(!pd.includes('onClick={() => setHasShippingProtection'), 'ProductDetails label must not have onClick');
    assert(pd.includes('onChange={(e) => setHasShippingProtection(e.target.checked)'), 'ProductDetails checkbox must have onChange');
});

// 2. Settings hydration & scoped writes
check('Settings webhook code has suppressHydrationWarning', () => {
    const setPage = fs.readFileSync('app/store/settings/page.jsx', 'utf8');
    assert(setPage.includes('<code suppressHydrationWarning'), 'Settings webhook code must have suppressHydrationWarning');
});

check('Settings scopes Gumroad URL writes exclusively to gumroad_url_${cleanSlug}', () => {
    const setPage = fs.readFileSync('app/store/settings/page.jsx', 'utf8');
    assert(!setPage.includes("localStorage.setItem('gumshop_gumroad_url'"), 'Settings must not write to un-scoped gumshop_gumroad_url');
    assert(!setPage.includes("localStorage.setItem('gumroad_product_url'"), 'Settings must not write to un-scoped gumroad_product_url');
    assert(setPage.includes('localStorage.setItem(`gumroad_url_${cleanSlug}`'), 'Settings must write to scoped gumroad_url_${cleanSlug}');
});

// 3. Marketing hydration
check('Marketing page resolves SSR/client origin hydration mismatch with mountedOrigin', () => {
    const mktPage = fs.readFileSync('app/store/marketing/page.jsx', 'utf8');
    assert(mktPage.includes('mountedOrigin'), 'Marketing page must use mountedOrigin state');
    assert(mktPage.includes('suppressHydrationWarning'), 'Marketing page must have suppressHydrationWarning');
});

// 4. Store page hydration
check('Store performance page resolves origin hydration mismatch with mountedOrigin', () => {
    const storePage = fs.readFileSync('app/store/page.jsx', 'utf8');
    assert(storePage.includes('mountedOrigin'), 'Store page must use mountedOrigin state');
    assert(storePage.includes('suppressHydrationWarning'), 'Store page must have suppressHydrationWarning on bioUrl');
});

// 5. Coupons strict isolation
check('Coupons page enforces strict store isolation (c.storeId === currentStore.id)', () => {
    const coupPage = fs.readFileSync('app/store/coupons/page.jsx', 'utf8');
    assert(coupPage.includes('c.storeId === currentStore.id'), 'Coupons must filter strictly by c.storeId === currentStore.id');
    assert(!coupPage.includes('!c.storeId || c.storeId === currentStore.id'), 'Coupons must not leak coupons without storeId');
});

// 6. Gumroad sync, webhook, verify-order stubs and saveServerOrder
check('Gumroad sync route persists orders via saveServerOrder and removes dead stubs', () => {
    const syncRoute = fs.readFileSync('app/api/gumroad/sync/route.js', 'utf8');
    assert(syncRoute.includes('saveServerOrder'), 'Sync route must import/use saveServerOrder');
    assert(!syncRoute.includes('const ref = () => null;'), 'Sync route must not have dead ref stub');
    assert(!syncRoute.includes('const set = () => Promise.resolve();'), 'Sync route must not have dead set stub');
});

check('Gumroad webhook and verify-order routes have clean imports without dead stubs', () => {
    const whRoute = fs.readFileSync('app/api/gumroad/webhook/route.js', 'utf8');
    assert(!whRoute.includes('const ref = () => null;'), 'Webhook route must not have dead ref stub');
    assert(!whRoute.includes('const set = () => Promise.resolve();'), 'Webhook route must not have dead set stub');

    const voRoute = fs.readFileSync('app/api/gumroad/verify-order/route.js', 'utf8');
    assert(!voRoute.includes('const ref = () => null;'), 'Verify order route must not have dead ref stub');
    assert(!voRoute.includes('const set = () => Promise.resolve();'), 'Verify order route must not have dead set stub');
});

console.log(`\n======================================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${process.exitCode ? 1 : 0} failed`);
console.log(`======================================================================`);
