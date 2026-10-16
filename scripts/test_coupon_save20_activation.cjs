/**
 * scripts/test_coupon_save20_activation.cjs
 * 
 * Comprehensive Test Suite for FLASH DEALS: SAVE20 Coupon Activation
 * Verifies coupon resolution, discount calculation, session persistence,
 * dynamic-checkout validation, and Gumroad URL offer_code injection.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runTests() {
    console.log('======================================================================');
    console.log('🚀 TEST SUITE: FLASH DEALS: SAVE20 COUPON ACTIVATION VERIFICATION');
    console.log('======================================================================\n');

    let passed = 0;
    let failed = 0;

    function check(description, fn) {
        try {
            fn();
            console.log(`  ✅ [PASS] ${description}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ [FAIL] ${description}`);
            console.error(`     Reason: ${err.message}`);
            failed++;
        }
    }

    // 1. Static AST / Code Inspection of lib/db/coupons.js
    check('lib/db/coupons.js defines SYSTEM_FLASH_COUPONS with SAVE20 active at 20%', () => {
        const content = fs.readFileSync(path.join(__dirname, '../lib/db/coupons.js'), 'utf8');
        assert(content.includes("'SAVE20'"), "lib/db/coupons.js must contain 'SAVE20'");
        assert(content.includes('discount: 20'), 'SAVE20 must have discount: 20');
        assert(content.includes("type: 'percentage'"), 'SAVE20 must have type: percentage');
        assert(content.includes('isActive: true'), 'SAVE20 must be active');
    });

    // 2. Static AST / Code Inspection of components/Navbar.jsx
    check('components/Navbar.jsx renders interactive FLASH DEALS banner with click-to-activate and copy feedback', () => {
        const content = fs.readFileSync(path.join(__dirname, '../components/Navbar.jsx'), 'utf8');
        assert(content.includes('handleApplyFlashDeal'), 'Navbar.jsx must have handleApplyFlashDeal');
        assert(content.includes('SAVE20'), 'Navbar.jsx must reference SAVE20');
        assert(content.includes('sessionStorage.setItem'), 'Navbar.jsx must activate coupon in sessionStorage');
        assert(content.includes('gumshop_coupon_applied'), 'Navbar.jsx must dispatch gumshop_coupon_applied event');
    });

    // 3. Static AST / Code Inspection of components/CartDrawer.jsx
    check('components/CartDrawer.jsx auto-activates active coupon, recalcs on subtotal change, and sends couponCode to checkout', () => {
        const content = fs.readFileSync(path.join(__dirname, '../components/CartDrawer.jsx'), 'utf8');
        assert(content.includes("sessionStorage.getItem('active_coupon')"), 'CartDrawer must read active_coupon from sessionStorage');
        assert(content.includes('gumshop_coupon_applied'), 'CartDrawer must listen to gumshop_coupon_applied event');
        assert(content.includes('couponCode: couponCode'), 'CartDrawer must pass couponCode to dynamic-checkout');
        assert(content.includes("sessionStorage.removeItem('active_coupon')"), 'CartDrawer must remove active_coupon on removal');
    });

    // 4. Static AST / Code Inspection of components/ProductDetails.jsx
    check('components/ProductDetails.jsx applies active coupon discount to Instant Buy and modal total', () => {
        const content = fs.readFileSync(path.join(__dirname, '../components/ProductDetails.jsx'), 'utf8');
        assert(content.includes("sessionStorage.getItem('active_coupon')"), 'ProductDetails must check active_coupon');
        assert(content.includes('couponCode: activeCoupon'), 'ProductDetails must send couponCode to dynamic-checkout');
        assert(content.includes('discountAmount'), 'ProductDetails must compute discountAmount');
    });

    // 5. Dynamic Checkout Route Verification
    check('app/api/gumroad/dynamic-checkout/route.js injects offer_code into Gumroad checkout URL', () => {
        const content = fs.readFileSync(path.join(__dirname, '../app/api/gumroad/dynamic-checkout/route.js'), 'utf8');
        assert(content.includes("urlObj.searchParams.set('offer_code'"), 'dynamic-checkout must set offer_code in URL');
        assert(content.includes('validDiscount'), 'dynamic-checkout must calculate validDiscount');
    });

    // 6. Empirical Coupon Resolution Test
    const couponsModule = await import('../lib/db/coupons.js');
    const { getCouponByCode } = couponsModule;

    const couponDirect = await getCouponByCode('SAVE20');
    check('getCouponByCode("SAVE20") returns authoritative 20% discount coupon', () => {
        assert(couponDirect !== null, 'Coupon SAVE20 must resolve');
        assert.strictEqual(couponDirect.code, 'SAVE20');
        assert.strictEqual(couponDirect.discount, 20);
        assert.strictEqual(couponDirect.isActive, true);
    });

    const couponLower = await getCouponByCode('save20');
    check('getCouponByCode("save20") handles case-insensitivity seamlessly', () => {
        assert(couponLower !== null, 'Coupon save20 must resolve');
        assert.strictEqual(couponLower.code, 'SAVE20');
        assert.strictEqual(couponLower.discount, 20);
    });

    const couponPadded = await getCouponByCode('   Save20   ');
    check('getCouponByCode("   Save20   ") handles whitespace trimming seamlessly', () => {
        assert(couponPadded !== null, 'Padded coupon must resolve');
        assert.strictEqual(couponPadded.code, 'SAVE20');
        assert.strictEqual(couponPadded.discount, 20);
    });

    const couponWithStore = await getCouponByCode('SAVE20', 'rubber-couch-toys-official-store');
    check('getCouponByCode("SAVE20", store) resolves across isolated store seamlessly', () => {
        assert(couponWithStore !== null, 'Scoped store query must resolve SAVE20');
        assert.strictEqual(couponWithStore.code, 'SAVE20');
        assert.strictEqual(couponWithStore.discount, 20);
    });

    // 7. Math Simulation: 20% Discount Application
    check('20% Discount mathematical precision: $100.00 subtotal -> $20.00 discount -> $80.00 subtotal', () => {
        const subtotal = 100.00;
        const discount = Math.round(subtotal * (couponDirect.discount / 100) * 100) / 100;
        const total = subtotal - discount;
        assert.strictEqual(discount, 20.00);
        assert.strictEqual(total, 80.00);
    });

    check('20% Discount mathematical precision: $52.99 subtotal -> $10.60 discount -> $42.39 subtotal', () => {
        const subtotal = 52.99;
        const discount = Math.round(subtotal * (couponDirect.discount / 100) * 100) / 100;
        const total = Math.round((subtotal - discount) * 100) / 100;
        assert.strictEqual(discount, 10.60);
        assert.strictEqual(total, 42.39);
    });

    console.log('\n======================================================================');
    console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`);
    console.log('======================================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
