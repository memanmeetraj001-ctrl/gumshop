// scripts/inspect_current_rubber_couch_products.cjs
const { getProductsByStore } = require('./lib/db/products.js');

async function run() {
    const prods = await getProductsByStore('rubber-couch-toys-official-store');
    console.log(`Found ${prods.length} products in DB for rubber-couch-toys-official-store\n`);

    const cats = {};
    let non99Count = 0;
    const sampleNon99 = [];

    prods.forEach(p => {
        cats[p.category || 'Uncategorized'] = (cats[p.category || 'Uncategorized'] || 0) + 1;
        const priceStr = String(p.price || '');
        if (!priceStr.endsWith('.99')) {
            non99Count++;
            if (sampleNon99.length < 5) sampleNon99.push({ name: p.name, price: p.price });
        }
    });

    console.log('Current categories distribution:');
    console.dir(cats, { depth: null });

    console.log(`\nProducts with prices NOT ending in .99: ${non99Count} / ${prods.length}`);
    if (sampleNon99.length > 0) {
        console.log('Sample non-.99 products:', sampleNon99);
    }
}

run();
