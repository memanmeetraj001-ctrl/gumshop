const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("======================================================================");
console.log("⚡ TEST SUITE: STAN STOREFRONT URGENCY & SCARCITY SYSTEM");
console.log("======================================================================");

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ [PASS] ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}:`, err.message);
        failed++;
    }
}

const pagePath = path.join(__dirname, '..', 'app', '(public)', 'creator', '[username]', 'page.jsx');
const content = fs.readFileSync(pagePath, 'utf8');

// 1. Flash Sale Urgency
test('Sticky Flash Sale Urgency Bar is rendered at top of page', () => {
    assert(content.includes('aria-label="Flash sale promotion"'), 'Missing flash sale promotion landmark');
    assert(content.includes('FLASH SALE: 20% OFF'), 'Missing flash sale label');
    assert(content.includes('flashCountdown.hours'), 'Missing countdown hours binding');
    assert(content.includes('flashCountdown.minutes'), 'Missing countdown minutes binding');
    assert(content.includes('flashCountdown.seconds'), 'Missing countdown seconds binding');
    assert(content.includes("handleApplyStanCoupon('SAVE20')"), 'Missing 1-click SAVE20 code application');
});

// 2. Shipping Cutoff & Social Demand Proof
test('Header renders real-time social demand proof and shipping cutoff pill', () => {
    assert(content.includes('socialDemand.orders'), 'Missing social demand orders count');
    assert(content.includes('socialDemand.viewers'), 'Missing social demand viewers count');
    assert(content.includes('shippingCutoff'), 'Missing shipping cutoff time display');
    assert(content.includes('Same-Day Dispatch'), 'Missing same-day dispatch guarantee');
});

// 3. Low-Stock Scarcity Badges & Claimed Progress Bars
test('Product cards render scarcity badges and claimed progress bars', () => {
    assert(content.includes('claimed'), 'Missing claimed inventory percentage');
    assert(content.includes('ONLY 3 LEFT') || content.includes('Only 3 Left'), 'Missing only 3 left scarcity badge');
    assert(content.includes('bg-gradient-to-r from-amber-500 to-rose-500'), 'Missing progress bar styling');
});

// 4. Cart Hold Reservation Timer
test('Sticky Buy Bar and Floating Cart Pill render cart hold reservation timer', () => {
    assert(content.includes('formattedReserveTime'), 'Missing formattedReserveTime timer binding');
    assert(content.includes('Hold:'), 'Missing hold timer label in sticky bar');
});

// 5. Quick-View Modal Scarcity Integration
test('Quick-View Options Modal contains scarcity and dispatch urgency', () => {
    assert(content.includes('HIGH DEMAND: ONLY 3 LEFT'), 'Missing high demand badge in quick-view');
    assert(content.includes('Order in {shippingCutoff} for Same-Day'), 'Missing same-day dispatch in quick-view');
});

// 6. Hook Safety & Zero Breaking Changes
test('Rule of hooks is preserved: urgency state declared at top before returns', () => {
    const flashIdx = content.indexOf('flashCountdown');
    const loadingIdx = content.indexOf('if (loading) return <Loading />;');
    assert(flashIdx > 0, 'flashCountdown must exist');
    assert(loadingIdx > 0, 'loading check must exist');
    assert(flashIdx < loadingIdx, 'flashCountdown hook MUST be declared before if (loading) return');
});

console.log("\n======================================================================");
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`);
console.log("======================================================================\n");

if (failed > 0) process.exit(1);
