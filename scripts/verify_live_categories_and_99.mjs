// scripts/verify_live_categories_and_99.mjs
async function testLive() {
    console.log('=== VERIFYING LIVE PRODUCTION (https://www.gumshop.online) ===\n');

    const urls = [
        'https://www.gumshop.online/shop/rubber-couch-toys-official-store',
        'https://www.gumshop.online/creator/rubber-couch-toys-official-store',
        'https://www.gumshop.online/api/store/data?slug=rubber-couch-toys-official-store'
    ];

    for (const url of urls) {
        const start = Date.now();
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 LiveVerifier/1.0' } });
        const latency = Date.now() - start;
        console.log(`URL: ${url}`);
        console.log(`  Status: ${res.status} (${res.statusText})`);
        console.log(`  Latency: ${latency}ms`);

        if (url.includes('/api/store/data')) {
            const json = await res.json();
            const prods = json.products || [];
            console.log(`  Returned Products: ${prods.length}`);
            const non99 = prods.filter(p => !String(p.price).endsWith('.99'));
            console.log(`  Products NOT ending in .99: ${non99.length}`);
            
            const cats = {};
            prods.forEach(p => {
                cats[p.category || 'Uncategorized'] = (cats[p.category || 'Uncategorized'] || 0) + 1;
            });
            console.log('  Live Category Breakdown:');
            console.dir(cats, { depth: null });
            
            console.log('  Top 5 Flagship Live Items:');
            prods.slice(0, 5).forEach((p, i) => {
                console.log(`    ${i + 1}. [$${p.price}] [${p.category}] ${p.name}`);
            });
        }
        console.log('');
    }
}

testLive().catch(console.error);
