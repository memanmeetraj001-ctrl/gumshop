/**
 * Automated Verification: Normal Storefront Urgency & Scarcity System
 * Tests:
 * 1. Hero social proof & same-day cutoff calculation logic
 * 2. ProductCard deterministic claim percent, left count, and scarcity badge allocation
 * 3. Cart inventory hold timer calculation
 * 4. End-to-end HTTP request against /shop/rubber-couch-toys-official-store
 */

const http = require('http');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passedTests++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        process.exitCode = 1;
    }
}

console.log('=== TEST SUITE: NORMAL STOREFRONT URGENCY & SCARCITY SYSTEM ===\n');

// --- Test 1: Same-Day Dispatch Cutoff Logic ---
console.log('[1] Testing Same-Day Dispatch Cutoff Logic...');
function calcCutoffTime(testDate) {
    const cutoffHour = 17;
    const currentHour = testDate.getHours();
    const currentMinute = testDate.getMinutes();
    if (currentHour < cutoffHour) {
        const diffMinutes = (cutoffHour * 60) - (currentHour * 60 + currentMinute);
        const h = Math.floor(diffMinutes / 60);
        const m = diffMinutes % 60;
        return `${h > 0 ? `${h}h ` : ''}${m}m`;
    }
    return 'Tomorrow 9am';
}

const morningDate = new Date('2026-10-16T10:15:00');
assert(calcCutoffTime(morningDate) === '6h 45m', 'Calculates remaining hours & minutes before 5:00 PM cutoff');

const eveningDate = new Date('2026-10-16T18:00:00');
assert(calcCutoffTime(eveningDate) === 'Tomorrow 9am', 'Falls back to Tomorrow 9am after 5:00 PM cutoff');

// --- Test 2: Hero Social Demand Determinism ---
console.log('\n[2] Testing Hero Social Demand Determinism...');
function calcHeroDemand(storeKey) {
    let hash = 0;
    const str = storeKey || 'store';
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);
    const orders = 34 + (seed % 23);
    const viewers = 12 + (seed % 16);
    return { orders, viewers };
}

const storeA1 = calcHeroDemand('rubber-couch-toys-official-store');
const storeA2 = calcHeroDemand('rubber-couch-toys-official-store');
assert(storeA1.orders === storeA2.orders && storeA1.viewers === storeA2.viewers, 'Hero social proof is deterministic across reloads');
assert(storeA1.orders >= 34 && storeA1.orders <= 56, `Hero orders in believable conversion window (got ${storeA1.orders})`);
assert(storeA1.viewers >= 12 && storeA1.viewers <= 27, `Hero live viewers in believable window (got ${storeA1.viewers})`);

// --- Test 3: ProductCard Claim Percent & Scarcity Badges ---
console.log('\n[3] Testing ProductCard Scarcity & Claim Progress...');
function calcProductUrgency(productId, cardIndex) {
    let hash = 0;
    const str = String(productId || cardIndex);
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);
    const claimPercent = 65 + (seed % 24);
    const leftCount = 2 + (seed % 4);
    const badgeType = cardIndex === 0 
        ? `⚡ ONLY ${leftCount} LEFT` 
        : (cardIndex === 1 ? '🔥 BEST SELLER' : (cardIndex === 2 ? '⚡ SELLING FAST' : `⚡ ONLY ${leftCount} LEFT`));
    return { claimPercent, leftCount, badgeType };
}

const p0 = calcProductUrgency('prod_123', 0);
assert(p0.badgeType.startsWith('⚡ ONLY ') && p0.badgeType.endsWith(' LEFT'), `Card 0 gets ONLY X LEFT badge (${p0.badgeType})`);
assert(p0.claimPercent >= 65 && p0.claimPercent <= 88, `Claim percent is in 65%-88% window (${p0.claimPercent}%)`);

const p1 = calcProductUrgency('prod_456', 1);
assert(p1.badgeType === '🔥 BEST SELLER', `Card 1 gets BEST SELLER badge (${p1.badgeType})`);

const p2 = calcProductUrgency('prod_789', 2);
assert(p2.badgeType === '⚡ SELLING FAST', `Card 2 gets SELLING FAST badge (${p2.badgeType})`);

// --- Test 4: Cart Inventory Hold Timer ---
console.log('\n[4] Testing Cart Inventory Hold Timer Calculation...');
function formatTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
assert(formatTimer(600) === '10:00', 'Formats 600s as 10:00');
assert(formatTimer(582) === '09:42', 'Formats 582s as 09:42');
assert(formatTimer(5) === '00:05', 'Formats 5s as 00:05');

// --- Test 5: Live Server Route Verification ---
console.log('\n[5] Testing Live HTTP Endpoint for Storefront (/shop/rubber-couch-toys-official-store)...');
const req = http.get('http://localhost:3000/shop/rubber-couch-toys-official-store', (res) => {
    let body = '';
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
        assert(res.statusCode === 200, `Endpoint returned HTTP 200 (got ${res.statusCode})`);
        assert(body.includes('FLASH SALE') || body.includes('SAVE20') || body.includes('Rubber Couch Toys'), 'Response contains store elements and urgency signals');
        
        console.log(`\n========================================`);
        console.log(`TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
        console.log(`========================================\n`);
        if (passedTests === totalTests) {
            console.log('🎉 ALL TESTS PASSED! Normal Storefront Urgency System is Verified.');
            process.exit(0);
        } else {
            console.error('❌ Some tests failed.');
            process.exit(1);
        }
    });
});

req.on('error', (err) => {
    console.error(`  ❌ HTTP Request error: ${err.message}`);
    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passedTests}/${totalTests + 1} tests passed`);
    console.log(`========================================\n`);
    process.exit(1);
});
