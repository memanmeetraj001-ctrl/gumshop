import fs from 'node:fs';
import { resetAnalytics, getAnalyticsStats } from '../lib/db/analytics.js';

async function main() {
    console.log('Resetting analytics fleet-wide across memory, files, and Supabase...');
    const res = await resetAnalytics({ storeSlug: 'all' });
    console.log('resetAnalytics response:', res);

    if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync('data/analytics_daily.json', JSON.stringify({}), 'utf8');
    fs.writeFileSync('data/analytics_events.json', JSON.stringify([]), 'utf8');

    const timeframes = ['realtime', 'today', 'yesterday', '7d', '30d', 'all'];
    for (const tf of timeframes) {
        const stats = await getAnalyticsStats({ timeframe: tf });
        console.log(`Timeframe [${tf}]:`, {
            activeVisitors: stats.kpis.activeVisitorsNow,
            totalVisitors: stats.kpis.totalVisitors,
            totalPageviews: stats.kpis.totalPageviews,
            liveVisitorsCount: stats.liveVisitors.length
        });
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
