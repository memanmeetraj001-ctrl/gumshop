/**
 * Automated Multi-Engine IndexNow Batch Submission Script
 * Submits all active URLs from sitemap.xml to Bing and Yandex in safe batches.
 */

const HOST = 'gumshop.online';
const KEY = 'c4b8e5f2a1b94c3d8e7f1a2b3c4d5e6f';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const BATCH_SIZE = 30;

const ENDPOINTS = [
    { name: 'Bing IndexNow', url: 'https://www.bing.com/indexnow' },
    { name: 'Yandex IndexNow', url: 'https://yandex.com/indexnow' },
    { name: 'Global IndexNow', url: 'https://api.indexnow.org/indexnow' }
];

async function fetchSitemapUrls() {
    console.log(`[IndexNow] Fetching sitemap from https://${HOST}/sitemap.xml ...`);
    try {
        const res = await fetch(`https://${HOST}/sitemap.xml`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        const matches = xml.match(/<loc>(.*?)<\/loc>/g) || [];
        const urls = matches.map(m => m.replace(/<\/?loc>/g, '').trim());
        console.log(`[IndexNow] Discovered ${urls.length} URLs in sitemap.`);
        return urls;
    } catch (e) {
        console.warn(`[IndexNow] Failed to fetch live sitemap (${e.message}). Falling back to core routes.`);
        return [
            `https://${HOST}/`,
            `https://${HOST}/shop`,
            `https://${HOST}/llms.txt`,
            `https://${HOST}/llms-full.txt`,
            `https://${HOST}/creator/rubber-couch-toys-official-store`,
            `https://${HOST}/shop/rubber-couch-toys-official-store`,
            `https://${HOST}/creator/hauntdrone`,
            `https://${HOST}/shop/hauntdrone`,
            `https://${HOST}/creator/phantompaws-headless-horseman-pet-costume`,
            `https://${HOST}/shop/phantompaws-headless-horseman-pet-costume`
        ];
    }
}

async function submitBatch(urls, batchIndex, totalBatches) {
    const payload = {
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList: urls
    };

    console.log(`\n--- Submitting Batch ${batchIndex + 1}/${totalBatches} (${urls.length} URLs) ---`);
    console.log(`Sample: ${urls[0]} ...`);

    for (const ep of ENDPOINTS) {
        try {
            const res = await fetch(ep.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify(payload)
            });

            const status = res.status;
            const ok = status === 200 || status === 202;
            console.log(`  -> ${ep.name}: HTTP ${status} ${ok ? '✅ (ACCEPTED)' : '⚠️'}`);
        } catch (err) {
            console.warn(`  -> ${ep.name}: Failed (${err.message})`);
        }
    }
}

async function run() {
    console.log('==================================================');
    console.log('🚀 GUMSHOP.ONLINE AUTOMATED INDEXNOW BATCH INGESTION');
    console.log('==================================================');

    const urls = await fetchSitemapUrls();
    const totalBatches = Math.ceil(urls.length / BATCH_SIZE);

    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batch = urls.slice(i, i + BATCH_SIZE);
        const batchIndex = Math.floor(i / BATCH_SIZE);
        await submitBatch(batch, batchIndex, totalBatches);
        // Small pause between batches to avoid gateway throttling
        await new Promise(r => setTimeout(r, 600));
    }

    console.log('\n==================================================');
    console.log(`✅ Completed submission of ${urls.length} URLs across ${totalBatches} batches.`);
    console.log('==================================================\n');
}

run().catch(console.error);
