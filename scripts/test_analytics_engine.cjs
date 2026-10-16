const assert = require('assert');
const fs = require('fs');

console.log('======================================================================');
console.log('🚀 TEST SUITE: NATIVE BUILT-IN ANALYTICS ENGINE VERIFICATION');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(title, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✅ [PASS] ${title}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${title}`);
        console.error(`     Reason: ${err.message}`);
    }
}

async function runAsyncTests() {
    // 1. Contract & File Integrity
    test('lib/db/analytics.js exists and exports required methods', () => {
        const analytics = require('../lib/db/analytics.js');
        assert.strictEqual(typeof analytics.recordAnalyticsEvent, 'function');
        assert.strictEqual(typeof analytics.getAnalyticsStats, 'function');
        assert.strictEqual(typeof analytics.getCountryFlag, 'function');
        assert.strictEqual(typeof analytics.categorizeTraffic, 'function');
    });

    test('getCountryFlag correctly converts ISO 3166-1 alpha-2 codes to emojis', () => {
        const { getCountryFlag } = require('../lib/db/analytics.js');
        assert.strictEqual(getCountryFlag('US'), '🇺🇸');
        assert.strictEqual(getCountryFlag('GB'), '🇬🇧');
        assert.strictEqual(getCountryFlag('CA'), '🇨🇦');
        assert.strictEqual(getCountryFlag('DE'), '🇩🇪');
        assert.strictEqual(getCountryFlag('FR'), '🇫🇷');
        assert.strictEqual(getCountryFlag('IN'), '🇮🇳');
        assert.strictEqual(getCountryFlag(''), '🌐');
    });

    test('categorizeTraffic maps social, organic, paid, and direct traffic correctly', () => {
        const { categorizeTraffic } = require('../lib/db/analytics.js');
        assert.strictEqual(categorizeTraffic('', 'tiktok', 'social'), 'TikTok');
        assert.strictEqual(categorizeTraffic('https://l.instagram.com/', '', ''), 'Instagram');
        assert.strictEqual(categorizeTraffic('https://t.co/abc', '', ''), 'Twitter/X');
        assert.strictEqual(categorizeTraffic('https://www.google.com/search?q=gel+blaster', '', 'organic'), 'Organic Search');
        assert.strictEqual(categorizeTraffic('', '', 'cpc'), 'Paid Ads');
        assert.strictEqual(categorizeTraffic('', '', ''), 'Direct');
        assert.strictEqual(categorizeTraffic('https://partnerblog.com/review', '', ''), 'partnerblog.com');
    });

    // 2. Functional Tracking & Multi-Store Isolation
    await (async () => {
        const { recordAnalyticsEvent, getAnalyticsStats } = require('../lib/db/analytics.js');

        const testStoreA = 'test-analytics-store-alpha';
        const testStoreB = 'test-analytics-store-beta';
        const now = Date.now();

        // Simulate Store A visitor funnel
        await recordAnalyticsEvent({
            visitorId: 'vis_alpha_1',
            sessionId: 'sess_alpha_1',
            eventType: 'page_view',
            pathname: '/shop/test-analytics-store-alpha',
            storeSlug: testStoreA,
            deviceType: 'mobile',
            countryCode: 'US',
            trafficChannel: 'TikTok',
            timestamp: now - 30000
        });

        await recordAnalyticsEvent({
            visitorId: 'vis_alpha_1',
            sessionId: 'sess_alpha_1',
            eventType: 'product_view',
            pathname: '/product/prod_alpha_toy',
            productId: 'prod_alpha_toy',
            productName: 'Alpha Gel Blaster',
            storeSlug: testStoreA,
            timestamp: now - 25000
        });

        await recordAnalyticsEvent({
            visitorId: 'vis_alpha_1',
            sessionId: 'sess_alpha_1',
            eventType: 'add_to_cart',
            productId: 'prod_alpha_toy',
            storeSlug: testStoreA,
            timestamp: now - 20000
        });

        await recordAnalyticsEvent({
            visitorId: 'vis_alpha_1',
            sessionId: 'sess_alpha_1',
            eventType: 'initiate_checkout',
            productId: 'prod_alpha_toy',
            storeSlug: testStoreA,
            timestamp: now - 15000
        });

        // Simulate Store B visitor
        await recordAnalyticsEvent({
            visitorId: 'vis_beta_1',
            sessionId: 'sess_beta_1',
            eventType: 'page_view',
            pathname: '/shop/test-analytics-store-beta',
            storeSlug: testStoreB,
            deviceType: 'desktop',
            countryCode: 'GB',
            trafficChannel: 'Organic Search',
            timestamp: now - 10000
        });

        test('getAnalyticsStats isolates metrics by store with zero cross-store leakage', async () => {
            const statsA = await getAnalyticsStats({ timeframe: 'realtime', storeId: testStoreA });
            const statsB = await getAnalyticsStats({ timeframe: 'realtime', storeId: testStoreB });

            assert.strictEqual(statsA.kpis.activeVisitorsNow, 1, 'Store A must have exactly 1 active visitor');
            assert.strictEqual(statsB.kpis.activeVisitorsNow, 1, 'Store B must have exactly 1 active visitor');
            assert.strictEqual(statsA.store, testStoreA);
            assert.strictEqual(statsB.store, testStoreB);

            // Store A funnel checks
            const pViewsA = statsA.funnel.find(f => f.step === 'Product Views');
            const cartAddsA = statsA.funnel.find(f => f.step === 'Add to Cart');
            assert.ok(pViewsA && pViewsA.count >= 1, 'Store A must have product views');
            assert.ok(cartAddsA && cartAddsA.count >= 1, 'Store A must have cart adds');

            // Store B top pages must NOT include Store A
            const hasStoreAPagesInB = statsB.topPages.some(p => p.path.includes('store-alpha'));
            assert.strictEqual(hasStoreAPagesInB, false, 'Store B analytics must never leak Store A pages');
        });

        test('Fleet-wide aggregation accumulates both stores seamlessly', async () => {
            const fleet = await getAnalyticsStats({ timeframe: 'realtime', storeId: 'all' });
            assert.ok(fleet.kpis.activeVisitorsNow >= 2, 'Fleet-wide active visitors must reflect both store visitors');
            assert.ok(fleet.kpis.totalPageviews >= 2, 'Fleet-wide pageviews must combine all stores');
        });
    })();

    // 3. API Routes Integrity
    test('API route app/api/analytics/track/route.js exports POST with keepalive/sendBeacon support', () => {
        const code = fs.readFileSync('app/api/analytics/track/route.js', 'utf8');
        assert.ok(code.includes('export async function POST'), 'Must export POST handler');
        assert.ok(code.includes('text/plain'), 'Must support text/plain for navigator.sendBeacon');
        assert.ok(code.includes('crypto.createHash'), 'Must anonymize IPs for privacy');
        assert.ok(code.includes('recordAnalyticsEvent'), 'Must call recordAnalyticsEvent');
    });

    test('API route app/api/analytics/stats/route.js exports GET with timeframe and store filtering', () => {
        const code = fs.readFileSync('app/api/analytics/stats/route.js', 'utf8');
        assert.ok(code.includes('export async function GET'), 'Must export GET handler');
        assert.ok(code.includes('searchParams.get(\'timeframe\')'), 'Must parse timeframe');
        assert.ok(code.includes('searchParams.get(\'store\')'), 'Must parse store');
        assert.ok(code.includes('getAnalyticsStats'), 'Must call getAnalyticsStats');
    });

    // 4. Client Tracker & Integration
    test('components/AnalyticsTracker.jsx implements heartbeat, route change listeners, and trackEvent', () => {
        const code = fs.readFileSync('components/AnalyticsTracker.jsx', 'utf8');
        assert.ok(code.includes('export function trackEvent'), 'Must export trackEvent');
        assert.ok(code.includes('window.gumshopTrack'), 'Must expose window.gumshopTrack');
        assert.ok(code.includes('navigator.sendBeacon'), 'Must use sendBeacon');
        assert.ok(code.includes('heartbeat'), 'Must send 30s heartbeats');
    });

    test('app/layout.jsx mounts AnalyticsTracker inside Suspense boundary', () => {
        const layoutCode = fs.readFileSync('app/layout.jsx', 'utf8');
        assert.ok(layoutCode.includes('import AnalyticsTracker from "@/components/AnalyticsTracker"'), 'Must import AnalyticsTracker');
        assert.ok(layoutCode.includes('<AnalyticsTracker />'), 'Must render AnalyticsTracker');
        assert.ok(layoutCode.includes('<Suspense fallback={null}>'), 'Must wrap in Suspense');
    });

    test('ProductDetails.jsx and CartDrawer.jsx trigger product_view, add_to_cart, and initiate_checkout', () => {
        const pdCode = fs.readFileSync('components/ProductDetails.jsx', 'utf8');
        const cdCode = fs.readFileSync('components/CartDrawer.jsx', 'utf8');

        assert.ok(pdCode.includes('trackEvent(\'product_view\''), 'ProductDetails must track product_view');
        assert.ok(pdCode.includes('trackEvent(\'add_to_cart\''), 'ProductDetails must track add_to_cart');
        assert.ok(pdCode.includes('trackEvent(\'initiate_checkout\''), 'ProductDetails must track initiate_checkout');
        assert.ok(cdCode.includes('trackEvent(\'initiate_checkout\''), 'CartDrawer must track initiate_checkout');
    });

    test('Master Dashboard app/dashboard/page.jsx renders complete Google Analytics-grade command center', () => {
        const dashCode = fs.readFileSync('app/dashboard/page.jsx', 'utf8');
        assert.ok(dashCode.includes('Master Commerce Analytics'), 'Must render Master Commerce Analytics title');
        assert.ok(dashCode.includes('Live Active Shoppers Stream'), 'Must render Live Active Shoppers Stream');
        assert.ok(dashCode.includes('E-Commerce Conversion Funnel'), 'Must render Conversion Funnel');
        assert.ok(dashCode.includes('Traffic Acquisition Channels'), 'Must render Acquisition Channels');
        assert.ok(dashCode.includes('Top Performing Products'), 'Must render Top Performing Products');
        assert.ok(dashCode.includes('Top Pages Visited'), 'Must render Top Pages Visited');
        assert.ok(dashCode.includes('Devices'), 'Must render Devices breakdown');
        assert.ok(dashCode.includes('Top Countries'), 'Must render Top Countries breakdown');
    });

    console.log('\n======================================================================');
    console.log(`📊 RESULTS: ${passedTests}/${totalTests} passed`);
    console.log('======================================================================\n');

    if (passedTests !== totalTests) {
        process.exit(1);
    }
}

runAsyncTests();
