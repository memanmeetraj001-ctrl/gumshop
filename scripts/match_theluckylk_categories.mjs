// scripts/match_theluckylk_categories.mjs
import { postgrest } from '../lib/db/client.js';

async function fetchTheLuckyLkData() {
    console.log('Fetching collections from theluckylk.com...');
    const colRes = await fetch('https://theluckylk.com/collections.json');
    const colData = await colRes.json();

    // Priority collection order from theluckylk.com (avoiding generic ones like 'other-toys', 'all', 'new-arrivals')
    // We want the specific categories
    const specificCollections = [
        { handle: 'sights-lasers-lights-3ddde8b6', title: 'Sights, Lasers & Lights' },
        { handle: 'tracers-muzzle-accessories-c89f3a36', title: 'Tracers & Muzzle Accessories' },
        { handle: 'magazines-batteries-parts-8cf94a92', title: 'Magazines, Batteries & Parts' },
        { handle: 'gel-balls-loading-gear-08674dd7', title: 'Gel Balls & Loading Gear' },
        { handle: 'targets-protective-gear-a40b1377', title: 'Targets & Protective Gear' },
        { handle: '3d-printed-products', title: '3D-Printed Gear' },
        { handle: 'water-gun', title: 'Water Guns' },
        { handle: 'nerf-toy-gun', title: 'Dart Blasters' },
        { handle: 'sniper-gel-blaster', title: 'Sniper Gel Blasters' },
        { handle: 'pistol-gel-blaster', title: 'Pistol Gel Blasters' },
        { handle: 'smg-pdw-gel-blasters', title: 'SMG & PDW Gel Blasters' },
        { handle: 'ak-gel-blasters', title: 'Rifle Gel Blasters' },
        { handle: 'm4-ar15-gel-blasters', title: 'Rifle Gel Blasters' },
        { handle: 'hk416-hk417-gel-blasters', title: 'Rifle Gel Blasters' },
        { handle: 'slr-gel-blasters', title: 'Rifle Gel Blasters' },
        { handle: 'rifle-gel-blasters', title: 'Rifle Gel Blasters' },
        { handle: 'toy-gun-attachments', title: 'Toy Gun Accessories' }
    ];

    const productToCategoryMap = new Map(); // normalized title -> category title

    for (const c of specificCollections) {
        try {
            const pRes = await fetch(`https://theluckylk.com/collections/${c.handle}/products.json?limit=250`);
            if (!pRes.ok) continue;
            const pData = await pRes.json();
            const prods = pData.products || [];
            console.log(`Fetched ${prods.length} products for "${c.title}" (${c.handle})`);
            for (const p of prods) {
                const normTitle = p.title.toLowerCase().trim();
                const normHandle = p.handle.toLowerCase().trim();
                // Store mapping if not already mapped or if more specific
                if (!productToCategoryMap.has(normTitle)) {
                    productToCategoryMap.set(normTitle, c.title);
                }
                if (!productToCategoryMap.has(normHandle)) {
                    productToCategoryMap.set(normHandle, c.title);
                }
            }
        } catch (err) {
            console.warn(`Error fetching collection ${c.handle}:`, err.message);
        }
    }

    return productToCategoryMap;
}

function normalizeStr(str) {
    return (str || '')
        .toLowerCase()
        .replace(/—.*$/, '') // remove trailing brand suffixes
        .replace(/lkcj.*$/, '')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function run() {
    const theLuckyLkMap = await fetchTheLuckyLkData();
    console.log(`\nBuilt title/handle map with ${theLuckyLkMap.size} entries from theluckylk.com.`);

    // Fetch our 174 products
    const sRes = await postgrest('stores?id=eq.store_rubber-couch-toys-official-store&select=data,name');
    const store = sRes.data?.[0];
    const ourProducts = store?.data?.products || [];
    console.log(`Loaded ${ourProducts.length} products from stores.data.products`);

    let exactMatch = 0;
    let partialMatch = 0;
    let fallbackRule = 0;

    const categorized = [];

    for (const p of ourProducts) {
        const rawTitle = p.name || p.title || '';
        const norm = normalizeStr(rawTitle);
        const slug = p.slug || '';

        let matchedCat = null;

        // 1. Try exact or handle match
        if (theLuckyLkMap.has(rawTitle.toLowerCase().trim())) {
            matchedCat = theLuckyLkMap.get(rawTitle.toLowerCase().trim());
            exactMatch++;
        } else if (slug && theLuckyLkMap.has(slug.toLowerCase().trim())) {
            matchedCat = theLuckyLkMap.get(slug.toLowerCase().trim());
            exactMatch++;
        } else {
            // 2. Try substring match against theLuckyLk titles
            for (const [key, cat] of theLuckyLkMap.entries()) {
                const cleanKey = normalizeStr(key);
                if (cleanKey.length > 8 && (norm.includes(cleanKey) || cleanKey.includes(norm))) {
                    matchedCat = cat;
                    partialMatch++;
                    break;
                }
            }
        }

        // 3. Fallback based on authentic keywords from theluckylk taxonomy
        if (!matchedCat) {
            fallbackRule++;
            const l = rawTitle.toLowerCase();
            if (l.includes('water gun') || l.includes('water blaster') || l.includes('water pistol')) {
                matchedCat = 'Water Guns';
            } else if (l.includes('dart') || l.includes('soft bullet') || l.includes('nerf')) {
                matchedCat = 'Dart Blasters';
            } else if (l.includes('sniper') || l.includes('awm') || l.includes('barrett') || l.includes('kar98')) {
                matchedCat = 'Sniper Gel Blasters';
            } else if (l.includes('smg') || l.includes('pdw') || l.includes('mp5') || l.includes('mp7') || l.includes('p90') || l.includes('kriss') || l.includes('vector') || l.includes('mac 10') || l.includes('arp9')) {
                matchedCat = 'SMG & PDW Gel Blasters';
            } else if (l.includes('pistol') || l.includes('glock') || l.includes('desert eagle') || l.includes('revolver') || l.includes('hi capa') || l.includes('1911') || l.includes('beretta')) {
                matchedCat = 'Pistol Gel Blasters';
            } else if (l.includes('magazine') || l.includes('battery') || l.includes('gearbox') || l.includes('motor') || l.includes('spring') || l.includes('drum')) {
                matchedCat = 'Magazines, Batteries & Parts';
            } else if (l.includes('sight') || l.includes('scope') || l.includes('laser') || l.includes('flashlight') || l.includes('red dot') || l.includes('holo')) {
                matchedCat = 'Sights, Lasers & Lights';
            } else if (l.includes('tracer') || l.includes('silencer') || l.includes('muzzle') || l.includes('suppressor') || l.includes('flash hider')) {
                matchedCat = 'Tracers & Muzzle Accessories';
            } else if (l.includes('balls') || l.includes('ammo') || l.includes('gel ball') || l.includes('bottle') || l.includes('grenade') || l.includes('hopper')) {
                matchedCat = 'Gel Balls & Loading Gear';
            } else if (l.includes('target') || l.includes('goggle') || l.includes('mask') || l.includes('vest') || l.includes('protective')) {
                matchedCat = 'Targets & Protective Gear';
            } else if (l.includes('3d') || l.includes('printed')) {
                matchedCat = '3D-Printed Gear';
            } else if (l.includes('attachment') || l.includes('grip') || l.includes('stock') || l.includes('rail') || l.includes('sling') || l.includes('strap') || l.includes('mount')) {
                matchedCat = 'Toy Gun Accessories';
            } else if (l.includes('rifle') || l.includes('m4') || l.includes('m16') || l.includes('ak') || l.includes('hk416') || l.includes('slr') || l.includes('scar') || l.includes('ar15') || l.includes('blaster')) {
                matchedCat = 'Rifle Gel Blasters';
            } else {
                matchedCat = 'Toy Gun Accessories';
            }
        }

        categorized.push({
            id: p.id,
            name: rawTitle,
            originalPrice: p.price,
            category: matchedCat
        });
    }

    console.log(`\nMatching stats:`);
    console.log(`- Exact matches: ${exactMatch}`);
    console.log(`- Partial matches: ${partialMatch}`);
    console.log(`- Rule-based keyword matches: ${fallbackRule}`);

    const counts = {};
    for (const item of categorized) {
        counts[item.category] = (counts[item.category] || 0) + 1;
    }

    console.log('\nFinal Category Distribution:');
    console.dir(counts, { depth: null });
}

run().catch(console.error);
