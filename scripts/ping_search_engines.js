/**
 * Open Search Engine & Feed Ping Script for GumShop.online
 */

const HOST = 'gumshop.online';
const SITEMAP_URL = `https://${HOST}/sitemap.xml`;
const GOOGLE_FEED_URL = `https://${HOST}/api/feed/google-shopping`;

const PING_SERVICES = [
    {
        name: 'Google Shopping / Merchant Feed Validator',
        url: GOOGLE_FEED_URL,
        method: 'GET'
    },
    {
        name: 'Bing Sitemap Ping',
        url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
        method: 'GET'
    },
    {
        name: 'IndexNow Live Health Endpoint',
        url: `https://${HOST}/api/indexnow`,
        method: 'GET'
    }
];

async function run() {
    console.log('==================================================');
    console.log('🌐 PINGING SEARCH ENGINES & FEED AGGREGATORS');
    console.log('==================================================\n');

    for (const service of PING_SERVICES) {
        try {
            console.log(`[Ping] Pinging ${service.name}...`);
            const res = await fetch(service.url, { method: service.method });
            console.log(`  -> Status: HTTP ${res.status} ${res.ok ? '✅' : '⚠️'}`);
        } catch (e) {
            console.warn(`  -> ${service.name} failed:`, e.message);
        }
    }

    console.log('\n==================================================');
    console.log('✅ All open search engine and syndication pings executed.');
    console.log('==================================================\n');
}

run().catch(console.error);
