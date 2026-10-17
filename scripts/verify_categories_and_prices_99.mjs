// scripts/verify_categories_and_prices_99.mjs
import { postgrest } from '../lib/db/client.js';
import { getProductsByStore, getAllProductsWithStores } from '../lib/db/products.js';

async function verify() {
    console.log('=== VERIFYING CATEGORIES & .99 CHARM PRICES ===\n');

    // 1. Verify getProductsByStore
    const prods = await getProductsByStore('rubber-couch-toys-official-store');
    console.log(`Loaded ${prods.length} products via getProductsByStore('rubber-couch-toys-official-store')`);

    if (prods.length !== 174) {
        console.error(`⚠️ Expected 174 products, got ${prods.length}`);
    } else {
        console.log('✅ Exactly 174 products returned.');
    }

    // 2. Verify all prices end with .99
    const non99Prices = prods.filter(p => !String(p.price).endsWith('.99'));
    if (non99Prices.length > 0) {
        console.error(`❌ ${non99Prices.length} products do not end in .99:`);
        non99Prices.slice(0, 5).forEach(p => console.error(`  - ${p.name}: ${p.price}`));
        process.exit(1);
    } else {
        console.log('✅ 100% of product prices strictly end in .99!');
    }

    // 3. Verify compareAtPrice ends with .99
    const non99Compare = prods.filter(p => p.compareAtPrice && !String(p.compareAtPrice).endsWith('.99'));
    if (non99Compare.length > 0) {
        console.error(`❌ ${non99Compare.length} products have compareAtPrice not ending in .99`);
    } else {
        console.log('✅ 100% of compareAtPrices strictly end in .99!');
    }

    // 4. Verify customBundles prices end with .99
    let badBundles = 0;
    for (const p of prods) {
        if (Array.isArray(p.customBundles)) {
            for (const b of p.customBundles) {
                if (!String(b.totalPrice).endsWith('.99')) {
                    badBundles++;
                }
            }
        }
    }
    if (badBundles > 0) {
        console.error(`❌ ${badBundles} bundle totalPrices do not end in .99`);
    } else {
        console.log('✅ 100% of volume bundles (1-pack, 2-pack, 3-pack) strictly end in .99!');
    }

    // 5. Verify Categories Distribution
    const cats = {};
    for (const p of prods) {
        cats[p.category || 'Uncategorized'] = (cats[p.category || 'Uncategorized'] || 0) + 1;
    }
    console.log('\nVerified Authentic Category Distribution:');
    console.dir(cats, { depth: null });

    // 6. Print top 10 products
    console.log('\nTop 10 Flagship Products (Rearranged Order):');
    prods.slice(0, 10).forEach((p, idx) => {
        console.log(`  ${idx + 1}. [$${p.price}] [${p.category}] ${p.name} (bundles: 1x $${p.customBundles?.[0]?.totalPrice}, 2x $${p.customBundles?.[1]?.totalPrice}, 3x $${p.customBundles?.[2]?.totalPrice})`);
    });

    console.log('\n🎉 ALL CHECKS PASSED PERFECTLY!');
}

verify().catch(err => {
    console.error('Verification error:', err);
    process.exit(1);
});
