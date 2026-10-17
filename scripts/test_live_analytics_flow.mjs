/**
 * scripts/test_live_analytics_flow.mjs
 * 
 * Verifies live analytics recording, persistence to Supabase, 
 * real-time active visitor counting, and stats retrieval.
 */

import { recordAnalyticsEvent, getAnalyticsStats, resetAnalytics } from '../lib/db/analytics.js';
import { postgrest } from '../lib/db/client.js';

async function run() {
    console.log('🧪 Starting Live Analytics Verification Suite...\n');

    // 1. Reset analytics to clean slate
    console.log('1️⃣ Resetting fleet analytics to clean zero...');
    const resetRes = await resetAnalytics({ storeSlug: 'all' });
    console.log('Reset result:', resetRes);

    // 2. Verify stats immediately return 0
    console.log('\n2️⃣ Verifying initial zero state from Supabase...');
    const zeroStats = await getAnalyticsStats({ timeframe: 'today' });
    console.log('Zero state KPIs:', zeroStats.kpis);
    if (zeroStats.kpis.totalPageviews !== 0 || zeroStats.kpis.activeVisitorsNow !== 0) {
        throw new Error('Initial state was not 0!');
    }
    console.log('✅ Initial zero state verified.');

    // 3. Record synthetic visitor events
    console.log('\n3️⃣ Recording simulated live visitor events...');
    const now = Date.now();
    const vis1 = 'test_vis_' + Math.random().toString(36).substring(2, 8);
    const vis2 = 'test_vis_' + Math.random().toString(36).substring(2, 8);

    // Visitor 1 on rubber couch store
    const evt1 = await recordAnalyticsEvent({
        visitorId: vis1,
        sessionId: 'sess_1',
        eventType: 'page_view',
        pathname: '/shop/rubber-couch-toys-official-store',
        pageTitle: 'Rubber Couch Toys - Shop',
        storeSlug: 'rubber-couch-toys-official-store',
        countryCode: 'US',
        country: 'United States',
        deviceType: 'mobile',
        timestamp: now
    });
    console.log('Recorded Event 1 (Visitor 1 Pageview):', evt1.id);

    // Visitor 1 views product
    const evt2 = await recordAnalyticsEvent({
        visitorId: vis1,
        sessionId: 'sess_1',
        eventType: 'product_view',
        pathname: '/product/plush-couch-bear',
        pageTitle: 'Plush Couch Bear',
        productId: 'plush-couch-bear',
        productName: 'Plush Couch Bear',
        storeSlug: 'rubber-couch-toys-official-store',
        countryCode: 'US',
        country: 'United States',
        deviceType: 'mobile',
        timestamp: now + 5000
    });
    console.log('Recorded Event 2 (Visitor 1 Product View):', evt2.id);

    // Visitor 2 on home page
    const evt3 = await recordAnalyticsEvent({
        visitorId: vis2,
        sessionId: 'sess_2',
        eventType: 'page_view',
        pathname: '/',
        pageTitle: 'GumShop Home',
        countryCode: 'GB',
        country: 'United Kingdom',
        deviceType: 'desktop',
        timestamp: now + 10000
    });
    console.log('Recorded Event 3 (Visitor 2 Pageview):', evt3.id);

    // 4. Query live stats
    console.log('\n4️⃣ Querying live stats from Supabase...');
    const liveStats = await getAnalyticsStats({ timeframe: 'today' });
    console.log('Live KPIs:', liveStats.kpis);
    console.log('Live Visitors count:', liveStats.liveVisitors.length);
    console.log('Top Pages:', liveStats.topPages);
    console.log('Devices:', liveStats.devices);
    console.log('Countries:', liveStats.countries);

    if (liveStats.kpis.activeVisitorsNow < 2) {
        throw new Error(`Expected at least 2 active visitors now, got ${liveStats.kpis.activeVisitorsNow}`);
    }
    if (liveStats.kpis.totalPageviews < 2) {
        throw new Error(`Expected at least 2 pageviews, got ${liveStats.kpis.totalPageviews}`);
    }
    console.log('✅ Live fleet stats verified successfully!');

    // 5. Query store-filtered stats for rubber-couch-toys-official-store
    console.log('\n5️⃣ Querying store-filtered stats for rubber-couch-toys-official-store...');
    const storeStats = await getAnalyticsStats({ timeframe: 'today', storeId: 'rubber-couch-toys-official-store' });
    console.log('Store KPIs:', storeStats.kpis);
    if (storeStats.kpis.activeVisitorsNow < 1) {
        throw new Error('Expected 1 active visitor for rubber couch toys store');
    }
    console.log('✅ Store-filtered isolation verified successfully!');

    // 6. Inspect direct Supabase row
    console.log('\n6️⃣ Verifying Supabase row persistence directly...');
    const dbRow = await postgrest('stores?id=eq.system_analytics_fleet&select=*', { bypassCache: true });
    const rowData = dbRow.data?.[0]?.data;
    console.log('Supabase row recent_events count:', rowData?.recent_events?.length);
    console.log('Supabase row daily_summaries keys:', Object.keys(rowData?.daily_summaries || {}));
    if (!rowData?.recent_events || rowData.recent_events.length === 0) {
        throw new Error('Supabase recent_events is empty!');
    }
    console.log('✅ Supabase persistence verified!');

    console.log('\n🎉 ALL LIVE ANALYTICS TESTS PASSED 100%!');
}

run().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
