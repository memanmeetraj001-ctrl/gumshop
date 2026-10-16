import { resetAnalytics, getAnalyticsStats } from '../lib/db/analytics.js';

async function main() {
    console.log('======================================================================');
    console.log('🧹 EXECUTING ANALYTICS ZERO RESET ACROSS ALL STORES & FLEET');
    console.log('======================================================================\n');

    // 1. Reset all analytics fleet-wide
    const res = await resetAnalytics({ storeSlug: 'all' });
    console.log('✅ resetAnalytics executed successfully:', res);

    // 2. Verify Fleet-Wide Analytics are 0
    console.log('\n--- Verifying Fleet-Wide Stats ---');
    for (const tf of ['realtime', 'today', 'yesterday', '7d', '30d', 'all']) {
        const stats = await getAnalyticsStats({ timeframe: tf, storeId: 'all' });
        console.log(`Timeframe [${tf}]:`, {
            activeNow: stats.kpis.activeVisitorsNow,
            totalVisitors: stats.kpis.totalVisitors,
            totalPageviews: stats.kpis.totalPageviews,
            liveVisitorsCount: stats.liveVisitors.length,
            topPagesCount: stats.topPages.length,
            topProductsCount: stats.topProducts.length,
            acquisitionCount: stats.acquisition.length
        });

        if (stats.kpis.activeVisitorsNow !== 0) throw new Error(`activeVisitorsNow must be 0 for ${tf}`);
        if (stats.kpis.totalVisitors !== 0) throw new Error(`totalVisitors must be 0 for ${tf}`);
        if (stats.kpis.totalPageviews !== 0) throw new Error(`totalPageviews must be 0 for ${tf}`);
        if (stats.liveVisitors.length !== 0) throw new Error(`liveVisitors must be 0 for ${tf}`);
    }

    // 3. Verify Specific Stores are 0
    console.log('\n--- Verifying Individual Store Isolation ---');
    const stores = [
        'rubber-couch-toys-official-store',
        'phantompaws-headless-horseman-pet-costume'
    ];

    for (const slug of stores) {
        const stats = await getAnalyticsStats({ timeframe: 'today', storeId: slug });
        console.log(`Store [${slug}]:`, {
            activeNow: stats.kpis.activeVisitorsNow,
            totalVisitors: stats.kpis.totalVisitors,
            totalPageviews: stats.kpis.totalPageviews
        });
        if (stats.kpis.activeVisitorsNow !== 0) throw new Error(`activeVisitorsNow must be 0 for ${slug}`);
        if (stats.kpis.totalVisitors !== 0) throw new Error(`totalVisitors must be 0 for ${slug}`);
        if (stats.kpis.totalPageviews !== 0) throw new Error(`totalPageviews must be 0 for ${slug}`);
    }

    console.log('\n======================================================================');
    console.log('🎉 SUCCESS: All analytics have been verified at absolute zero!');
    console.log('======================================================================\n');
}

main().catch(err => {
    console.error('❌ Reset failed:', err);
    process.exit(1);
});
