// scripts/verify_live_speed_and_dashboard.mjs
const endpoints = [
    { name: 'Homepage (/)', url: 'https://www.gumshop.online/' },
    { name: 'Storefront (/shop/...)', url: 'https://www.gumshop.online/shop/rubber-couch-toys-official-store' },
    { name: 'Creator Bio (/creator/...)', url: 'https://www.gumshop.online/creator/rubber-couch-toys-official-store' },
    { name: 'Store Dashboard (/store?store=...)', url: 'https://www.gumshop.online/store?store=rubber-couch-toys-official-store' },
    { name: 'Store Data API', url: 'https://www.gumshop.online/api/store/data?slug=rubber-couch-toys-official-store' }
];

async function benchmark() {
    console.log('⚡ Running Live Cloudflare Performance & Responsiveness Benchmark...\n');
    
    for (const ep of endpoints) {
        try {
            const start = performance.now();
            const res = await fetch(ep.url, {
                headers: { 'User-Agent': 'SpeedBenchmark/2.0' }
            });
            const text = await res.text();
            const latency = Math.round(performance.now() - start);
            const sizeKb = (Buffer.byteLength(text, 'utf8') / 1024).toFixed(1);
            const cacheControl = res.headers.get('cache-control') || 'none';
            const cfRay = res.headers.get('cf-ray') || 'none';

            console.log(`[${res.status} ${res.statusText}] ${ep.name}`);
            console.log(`   ⏱️  Latency: ${latency}ms`);
            console.log(`   📦 Payload: ${sizeKb} KB`);
            console.log(`   🛡️  Cache-Control: ${cacheControl}`);
            console.log(`   🌐 CF-Ray: ${cfRay}\n`);
        } catch (err) {
            console.error(`❌ Failed ${ep.name}:`, err.message);
        }
    }
}

benchmark();
