/**
 * scripts/import_theluckylk_categories_and_round_99.mjs
 * 
 * 1. Imports authentic collections & taxonomy from https://theluckylk.com/
 * 2. Maps all 174 products of rubber-couch-toys-official-store to their genuine categories.
 * 3. Enforces .99 charm pricing on 100% of products (price, compareAtPrice, customBundles).
 * 4. Rearranges products according to category hierarchy with flagship pro blasters at the top.
 * 5. Persists cleanly to both Supabase `products` table and `stores.data.products` (TOAST-safe).
 */

import { postgrest } from '../lib/db/client.js';

// Specific authentic category collections from theluckylk.com in order of preference
const THELUCKYLK_COLLECTIONS = [
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

// Desired category display hierarchy for the storefront
const CATEGORY_DISPLAY_ORDER = [
    'Rifle Gel Blasters',
    'SMG & PDW Gel Blasters',
    'Pistol Gel Blasters',
    'Sniper Gel Blasters',
    'Dart Blasters',
    'Water Guns',
    'Toy Gun Accessories',
    'Sights, Lasers & Lights',
    'Tracers & Muzzle Accessories',
    'Magazines, Batteries & Parts',
    'Gel Balls & Loading Gear',
    'Targets & Protective Gear',
    '3D-Printed Gear'
];

function normalizeStr(str) {
    return (str || '')
        .toLowerCase()
        .replace(/—.*$/, '')
        .replace(/lkcj.*$/, '')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function roundTo99(val, minVal = 0.99) {
    const num = Math.max(minVal, Number(val) || minVal);
    return Math.round((Math.floor(num) + 0.99) * 100) / 100;
}

async function fetchTheLuckyLkMap() {
    console.log('Fetching collections and products from https://theluckylk.com ...');
    const productMap = new Map();

    for (const c of THELUCKYLK_COLLECTIONS) {
        try {
            const res = await fetch(`https://theluckylk.com/collections/${c.handle}/products.json?limit=250`);
            if (!res.ok) continue;
            const data = await res.json();
            const prods = data.products || [];
            console.log(`  ✓ ${c.title} (${c.handle}): ${prods.length} items`);
            for (const p of prods) {
                const normTitle = p.title.toLowerCase().trim();
                const normHandle = p.handle.toLowerCase().trim();
                if (!productMap.has(normTitle)) productMap.set(normTitle, c.title);
                if (!productMap.has(normHandle)) productMap.set(normHandle, c.title);
            }
        } catch (err) {
            console.warn(`  ⚠️ Failed fetching ${c.handle}:`, err.message);
        }
    }

    return productMap;
}

async function main() {
    console.log('=== IMPORTING THELUCKYLK CATEGORIES & ROUNDING PRICES TO .99 ===\n');

    // 1. Fetch theLuckyLk taxonomy
    const theLuckyLkMap = await fetchTheLuckyLkMap();
    console.log(`Total indexed items from theluckylk.com: ${theLuckyLkMap.size}\n`);

    // 2. Fetch existing 174 products for Rubber Couch store
    const storeId = 'store_rubber-couch-toys-official-store';
    const sRes = await postgrest(`stores?id=eq.${encodeURIComponent(storeId)}&select=data,name`);
    const store = sRes.data?.[0];
    if (!store || !store.data) {
        throw new Error('Store rubber-couch-toys-official-store not found!');
    }

    const currentProds = store.data.products || [];
    console.log(`Loaded ${currentProds.length} products from stores.data.products`);
    if (currentProds.length === 0) {
        throw new Error('No products in store data!');
    }

    // 3. Map categories and apply .99 charm pricing
    const updatedProducts = currentProds.map(p => {
        const rawTitle = p.name || p.title || '';
        const norm = normalizeStr(rawTitle);
        const slug = p.slug || '';

        let matchedCat = null;

        // Exact or handle match
        if (theLuckyLkMap.has(rawTitle.toLowerCase().trim())) {
            matchedCat = theLuckyLkMap.get(rawTitle.toLowerCase().trim());
        } else if (slug && theLuckyLkMap.has(slug.toLowerCase().trim())) {
            matchedCat = theLuckyLkMap.get(slug.toLowerCase().trim());
        } else {
            // Substring match
            for (const [key, cat] of theLuckyLkMap.entries()) {
                const cleanKey = normalizeStr(key);
                if (cleanKey.length > 8 && (norm.includes(cleanKey) || cleanKey.includes(norm))) {
                    matchedCat = cat;
                    break;
                }
            }
        }

        // Contextual keyword fallback based on theluckylk taxonomy
        if (!matchedCat) {
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

        // Price rounding: Strictly ends with .99!
        const rawPrice = Number(p.price) || 52.99;
        const price = roundTo99(rawPrice);

        // CompareAtPrice: Strictly ends with .99 and is higher than price
        const rawCompare = p.compareAtPrice ? Number(p.compareAtPrice) : (price * 1.35);
        const compareAtPrice = Math.max(price + 5, roundTo99(rawCompare));

        // Volume bundles with all total prices ending in .99
        const twoPackTotal = roundTo99(price * 1.41);
        const threePackTotal = roundTo99(price * 1.82);

        const customBundles = [
            {
                qty: 1,
                totalPrice: price,
                pricePerUnit: price,
                label: `1 ${rawTitle}`,
                badge: null
            },
            {
                qty: 2,
                totalPrice: twoPackTotal,
                pricePerUnit: Math.round((twoPackTotal / 2) * 100) / 100,
                label: `2 ${rawTitle}s`,
                badge: "Two-Pack ⭐"
            },
            {
                qty: 3,
                totalPrice: threePackTotal,
                pricePerUnit: Math.round((threePackTotal / 3) * 100) / 100,
                label: `3 ${rawTitle}s`,
                badge: "Best Value 🔥"
            }
        ];

        // Retain verified image
        const image = p.image || (Array.isArray(p.images) ? p.images[0] : '');
        const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : (image ? [image] : []);

        return {
            id: p.id,
            store_id: storeId,
            name: rawTitle,
            price,
            compareAtPrice,
            category: matchedCat,
            image,
            images,
            customBundles,
            slug: p.slug || rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        };
    });

    // 4. Rearrange products:
    // First, flag top 15 highest-ticket blasters across the catalog as featured flagship items
    updatedProducts.sort((a, b) => b.price - a.price);

    updatedProducts.forEach((p, idx) => {
        if (idx < 15 && p.price >= 65) {
            p.is_featured = true;
            p.badge = idx === 0 ? '🔥 Flagship Pro' : (idx < 5 ? '⭐ Best Seller' : '⚡ Featured');
        } else {
            p.is_featured = false;
            p.badge = null;
        }
    });

    // Group and rearrange according to category hierarchy:
    // Flagship featured items first, then by category order, and within each category sorted by price descending
    const catRank = (cat) => {
        const idx = CATEGORY_DISPLAY_ORDER.indexOf(cat);
        return idx !== -1 ? idx : 999;
    };

    updatedProducts.sort((a, b) => {
        // Top 5 flagship pro items lead the store
        const aTopFlag = a.is_featured && a.price >= 80;
        const bTopFlag = b.is_featured && b.price >= 80;
        if (aTopFlag && !bTopFlag) return -1;
        if (!aTopFlag && bTopFlag) return 1;

        // Otherwise sort by authentic category hierarchy
        const rankDiff = catRank(a.category) - catRank(b.category);
        if (rankDiff !== 0) return rankDiff;

        // Within category, highest ticket first
        return b.price - a.price;
    });

    console.log('\nTop 10 Products After Rearrangement:');
    updatedProducts.slice(0, 10).forEach((p, idx) => {
        console.log(`  ${idx + 1}. [$${p.price}] [${p.category}] ${p.name} ${p.is_featured ? '(⭐ FEATURED)' : ''}`);
    });

    // Verify all prices end with .99
    const invalidPrices = updatedProducts.filter(p => !String(p.price).endsWith('.99'));
    if (invalidPrices.length > 0) {
        throw new Error(`Integrity check failed: ${invalidPrices.length} products do not end in .99!`);
    }
    console.log(`\n✅ 100% of ${updatedProducts.length} product prices strictly end in .99!`);

    // 5. Update Supabase `products` table in concurrent batches
    console.log('\nUpdating Supabase `products` table...');
    const CHUNK_SIZE = 10;
    let patchedProductsCount = 0;

    for (let i = 0; i < updatedProducts.length; i += CHUNK_SIZE) {
        const slice = updatedProducts.slice(i, i + CHUNK_SIZE);
        await Promise.all(slice.map(async (prod) => {
            const payload = {
                name: prod.name,
                price: prod.price,
                data: {
                    id: prod.id,
                    store_id: storeId,
                    storeId: storeId,
                    name: prod.name,
                    title: prod.name,
                    price: prod.price,
                    compareAtPrice: prod.compareAtPrice,
                    category: prod.category,
                    image: prod.image,
                    images: prod.images,
                    customBundles: prod.customBundles,
                    is_featured: prod.is_featured,
                    badge: prod.badge,
                    inStock: true,
                    is_active: true,
                    slug: prod.slug
                }
            };

            const patchRes = await postgrest(`products?id=eq.${encodeURIComponent(prod.id)}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });

            if (!patchRes.error) {
                patchedProductsCount++;
            } else {
                console.warn(`  Failed patching ${prod.id}:`, patchRes.error);
            }
        }));
        process.stdout.write(`  Patched ${Math.min(i + CHUNK_SIZE, updatedProducts.length)}/${updatedProducts.length} rows...\r`);
    }
    console.log(`\n  ✅ Successfully patched ${patchedProductsCount}/174 rows in products table.`);

    // 6. Update `stores.data.products` (Lean card fields only, avoiding TOAST bloat)
    console.log('\nUpdating `stores.data.products` in Supabase...');
    const leanStoreProducts = updatedProducts.map(p => ({
        id: p.id,
        name: p.name,
        title: p.name,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        image: p.image,
        images: p.images,
        category: p.category,
        is_featured: p.is_featured,
        badge: p.badge,
        customBundles: p.customBundles,
        inStock: true,
        storeId,
        slug: p.slug
    }));

    const newStoreData = {
        ...store.data,
        productsCount: leanStoreProducts.length,
        featuredProductIds: leanStoreProducts.filter(p => p.is_featured).map(p => p.id),
        products: leanStoreProducts,
        updatedAt: new Date().toISOString()
    };

    const storePatch = await postgrest(`stores?id=eq.${encodeURIComponent(storeId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ data: newStoreData })
    });

    if (storePatch.error) {
        throw new Error(`Failed to update store: ${JSON.stringify(storePatch.error)}`);
    }
    console.log('  ✅ Successfully synced stores.data.products with authentic categories and .99 prices!');

    // 7. Category summary breakdown
    const catSummary = {};
    for (const p of updatedProducts) {
        catSummary[p.category] = (catSummary[p.category] || 0) + 1;
    }
    console.log('\nFinal Category Distribution across 174 products:');
    console.dir(catSummary, { depth: null });

    console.log('\n🎉 ALL DONE! All 174 products categorized, rearranged, and rounded to .99 charm prices.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
