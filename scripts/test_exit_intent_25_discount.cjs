/**
 * scripts/test_exit_intent_25_discount.cjs
 * 
 * Comprehensive Test Suite for Exit Intent 25% Discount & SAVE25 Coupon Activation
 * Verifies ExitIntentModal rendering, 25% discount copy, coupon persistence,
 * dynamic-checkout integration, and CartDrawer synchronization.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runTests() {
    console.log('======================================================================');
    console.log('🚀 TEST SUITE: EXIT INTENT 25% DISCOUNT & SAVE25 COUPON VERIFICATION');
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

    // 1. Static Verification of components/ExitIntentModal.jsx
    check('components/ExitIntentModal.jsx displays 25% OFF and SAVE25 promo code', () => {
        const content = fs.readFileSync(path.join(__dirname, '../components/ExitIntentModal.jsx'), 'utf8');
        assert(content.includes('25% OFF'), 'ExitIntentModal must display 25% OFF text');
        assert(content.includes('SAVE25'), 'ExitIntentModal must display SAVE25 promo code');
        assert(content.includes('Claim 25% Off & Keep Shopping'), 'Button text must say Claim 25% Off & Keep Shopping');
        assert(content.includes("sessionStorage.setItem('active_coupon', 'SAVE25')"), 'handleClaimDiscount must set active_coupon to SAVE25');
        assert(content.includes("detail: { code: 'SAVE25', discount: 25 }"), 'handleClaimDiscount must dispatch 25% coupon event');
        assert(content.includes("onApplyCoupon('SAVE25', 25)"), 'handleClaimDiscount must call onApplyCoupon with SAVE25 and 25');
    });

    // 2. Static Verification of lib/db/coupons.js
    check('lib/db/coupons.js defines active SAVE25 coupon with 25% percentage discount', () => {
        const content = fs.readFileSync(path.join(__dirname, '../lib/db/coupons.js'), 'utf8');
        assert(content.includes("'SAVE25':"), "lib/db/coupons.js must contain 'SAVE25'");
        assert(content.includes('discount: 25'), 'SAVE25 must have discount: 25');
        assert(content.includes("type: 'percentage'"), 'SAVE25 must have percentage type');
        assert(content.includes('isActive: true'), 'SAVE25 must be active');
    });

    // 3. Static Verification of components/CartDrawer.jsx
    check('components/CartDrawer.jsx recognizes SAVE25 and applies 25% discount', () => {
        const content = fs.readFileSync(path.join(__dirname, '../components/CartDrawer.jsx'), 'utf8');
        assert(content.includes("'SAVE25'"), 'CartDrawer must include SAVE25 in valid code checks');
        assert(content.includes("code === 'SAVE25'"), 'CartDrawer must compute 25% discount for SAVE25');
    });

    // 4. Static Verification of app/(public)/creator/[username]/page.jsx
    check('app/(public)/creator/[username]/page.jsx supports SAVE25 and passes 25% in ExitIntentModal', () => {
        const content = fs.readFileSync(path.join(__dirname, '../app/(public)/creator/[username]/page.jsx'), 'utf8');
        assert(content.includes("'SAVE25'"), 'Creator page must include SAVE25 in promo code fallbacks');
        assert(content.includes("const discNum = discount || 25"), 'Creator page ExitIntentModal must default to 25% discount');
    });

    // 5. Static Verification of components/ProductDetails.jsx
    check('components/ProductDetails.jsx recognizes SAVE25 and computes 25% discount for Buy Now', () => {
        const content = fs.readFileSync(path.join(__dirname, '../components/ProductDetails.jsx'), 'utf8');
        assert(content.includes("activeCoupon === 'SAVE25'"), 'ProductDetails must check for SAVE25 in instant Buy Now calculation');
    });

    // 6. Runtime Coupon Resolution Test
    const { getCouponByCode } = await import('../lib/db/coupons.js');
    const couponDirect = await getCouponByCode('SAVE25');
    check('getCouponByCode("SAVE25") resolves to authoritative 25% active discount', () => {
        assert(couponDirect !== null, 'Coupon SAVE25 must resolve');
        assert.strictEqual(couponDirect.code, 'SAVE25');
        assert.strictEqual(couponDirect.discount, 25);
        assert.strictEqual(couponDirect.discountType, 'percentage');
        assert.strictEqual(couponDirect.isActive, true);
    });

    const couponLower = await getCouponByCode('save25');
    check('getCouponByCode("save25") resolves case-insensitively', () => {
        assert(couponLower !== null, 'Lowercase save25 must resolve');
        assert.strictEqual(couponLower.code, 'SAVE25');
        assert.strictEqual(couponLower.discount, 25);
    });

    const couponScoped = await getCouponByCode('SAVE25', 'rubber-couch-toys-official-store');
    check('getCouponByCode("SAVE25", store) resolves across isolated store', () => {
        assert(couponScoped !== null, 'Scoped query must resolve SAVE25');
        assert.strictEqual(couponScoped.code, 'SAVE25');
        assert.strictEqual(couponScoped.discount, 25);
    });

    // 7. Dynamic Checkout Calculation Simulation Test
    check('Mathematical discount simulation: 25% discount on $100 order equals exactly $75', () => {
        const subtotal = 100.00;
        const discountPct = couponDirect.discount;
        const calculatedDiscount = Math.round(subtotal * (discountPct / 100) * 100) / 100;
        const finalTotal = subtotal - calculatedDiscount;
        assert.strictEqual(calculatedDiscount, 25.00);
        assert.strictEqual(finalTotal, 75.00);
    });

    console.log('\n======================================================================');
    console.log(`📊 RESULTS: ${passed}/${passed + failed} passed`);
    console.log('======================================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});
