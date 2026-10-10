// scripts/verify_m1_price_sync.js
// Verification suite for Milestone 1: Authoritative Price Sync & Database Updates

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🧪 RUNNING MILESTONE 1 VERIFICATION SUITE');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function check(title, condition, extraInfo = '') {
    if (condition) {
        console.log(`  ✅ [PASS] ${title} ${extraInfo}`);
        passed++;
    } else {
        console.error(`  ❌ [FAIL] ${title} ${extraInfo}`);
        failed++;
    }
}

// ----------------------------------------------------
// SECTION 1: lib/supabase.js Verification
// ----------------------------------------------------
console.log('--- SECTION 1: lib/supabase.js ---');
const supabaseCode = fs.readFileSync(path.join(PROJECT_ROOT, 'lib/supabase.js'), 'utf8');
check('dbGetProducts returns spread ...d', supabaseCode.includes('...d,') && supabaseCode.includes('export async function dbGetProducts'));
check('dbGetProducts defaults price to 52.99', supabaseCode.includes('row.price || d.price || 52.99'));
check('dbGetProducts defaults compareAtPrice to 69.99 when price is 52.99', supabaseCode.includes('price === 52.99 ? 69.99 :'));
check('dbGetProducts preserves customBundles and image', supabaseCode.includes('customBundles,') && supabaseCode.includes('image,') && supabaseCode.includes('images,'));
check('dbGetProducts includes self-heal logic for phantompaws', supabaseCode.includes('isPhantom') && supabaseCode.includes('52.99'));
check('dbCreateProduct preserves compareAtPrice and customBundles', supabaseCode.includes('compareAtPrice,') && supabaseCode.includes('customBundles: productData.customBundles || []'));

// ----------------------------------------------------
// SECTION 2: lib/serverDb.js Verification
// ----------------------------------------------------
console.log('\n--- SECTION 2: lib/serverDb.js ---');
const serverDbCode = fs.readFileSync(path.join(PROJECT_ROOT, 'lib/serverDb.js'), 'utf8');
check('serverGetProducts authoritative price precedence', serverDbCode.includes('r.price || (r.data && r.data.price) || 52.99'));
check('serverGetProducts preserves compareAtPrice and customBundles', serverDbCode.includes('compareAtPrice,') && serverDbCode.includes('customBundles,'));
check('serverGetProducts preserves image and images', serverDbCode.includes('image,') && serverDbCode.includes('images,'));
check('serverGetStoreBySlug includes self-heal for phantom store products', serverDbCode.includes('isPhantomStore') && serverDbCode.includes('price: 52.99'));

// ----------------------------------------------------
// SECTION 3: lib/storePresets.js Verification
// ----------------------------------------------------
console.log('\n--- SECTION 3: lib/storePresets.js ---');
const storePresetsCode = fs.readFileSync(path.join(PROJECT_ROOT, 'lib/storePresets.js'), 'utf8');
check('DEFAULT_DEMO_CREATOR prod_demo_3d_icons price is 52.99', storePresetsCode.includes('id: "prod_demo_3d_icons"') && storePresetsCode.includes('price: 52.99,') && storePresetsCode.includes('compareAtPrice: 69.99,'));
check('Normalization in getStoreAndCatalog defaults price to 52.99 and compareAt to 69.99', storePresetsCode.includes('price === 52.99 ? 69.99 :'));

// ----------------------------------------------------
// SECTION 4: lib/db.js Verification
// ----------------------------------------------------
console.log('\n--- SECTION 4: lib/db.js ---');
const dbCode = fs.readFileSync(path.join(PROJECT_ROOT, 'lib/db.js'), 'utf8');
check('lib/db.js fallback price is 52.99 in saveProduct', dbCode.includes('productData.price || 52.99'));
check('lib/db.js compareAtPrice resolves to 69.99 when price is 52.99 in getProductsByStore', dbCode.includes('price === 52.99 ? 69.99 :'));
check('lib/db.js compareAtPrice resolves to 69.99 when price is 52.99 in saveProduct', dbCode.includes('(price === 52.99 ? 69.99 :'));

// ----------------------------------------------------
// SECTION 5: components/Hero.jsx Verification
// ----------------------------------------------------
console.log('\n--- SECTION 5: components/Hero.jsx ---');
const heroCode = fs.readFileSync(path.join(PROJECT_ROOT, 'components/Hero.jsx'), 'utf8');
check('Hero displays $52.99 and line-through $69.99', heroCode.includes('$52.99') && heroCode.includes('$69.99'));
check('Hero Buy Now button shows $52.99', heroCode.includes('⚡ Buy Now ($52.99)'));
check('Hero contains 0 references to $29.99', !heroCode.includes('$29.99') && !heroCode.includes('29.99'));

// ----------------------------------------------------
// SECTION 6: components/ProductCard.jsx & ProductQuickView.jsx & ProductDetails.jsx
// ----------------------------------------------------
console.log('\n--- SECTION 6: Components Compare-At Formulas ---');
const cardCode = fs.readFileSync(path.join(PROJECT_ROOT, 'components/ProductCard.jsx'), 'utf8');
check('ProductCard compare-at resolves to 69.99 when price is 52.99', cardCode.includes('price === 52.99 ? 69.99 :'));

const qvCode = fs.readFileSync(path.join(PROJECT_ROOT, 'components/ProductQuickView.jsx'), 'utf8');
check('ProductQuickView compare-at resolves to 69.99 when price is 52.99', qvCode.includes('price === 52.99 ? 69.99 :'));

const pdCode = fs.readFileSync(path.join(PROJECT_ROOT, 'components/ProductDetails.jsx'), 'utf8');
check('ProductDetails compare-at resolves to 69.99 when unitPrice is 52.99', pdCode.includes('unitPrice === 52.99 ? 69.99 :'));
check('ProductDetails quantity tiers have authentic badges', pdCode.includes('Two-Pet Household ⭐') && pdCode.includes('Costume Party Pack 🔥'));

// ----------------------------------------------------
// SECTION 7: app/(public)/cart/page.jsx & app/(public)/creator/[username]/page.jsx
// ----------------------------------------------------
console.log('\n--- SECTION 7: Cart Page & Creator Page ---');
const cartCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app/(public)/cart/page.jsx'), 'utf8');
check('Cart page fallback price is 52.99', cartCode.includes('price: 52.99,') && cartCode.includes('product.price || 52.99'));
check('Cart page contains 0 references to 29.99', !cartCode.includes('29.99'));

const creatorCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app/(public)/creator/[username]/page.jsx'), 'utf8');
check('Creator page heroPrice defaults to 52.99', creatorCode.includes('heroPrice = parseFloat(heroItem.price !== undefined && heroItem.price !== null && heroItem.price !== \'\' ? heroItem.price : 52.99)'));
check('Creator page heroCompare resolves to 69.99 when heroPrice is 52.99', creatorCode.includes('heroPrice === 52.99 ? 69.99 :'));
check('Creator page fallback badges match ProductDetails exactly', creatorCode.includes('Two-Pet Household ⭐') && creatorCode.includes('Costume Party Pack 🔥'));
check('Creator page sticky bottom bar heroPrice defaults to 52.99', creatorCode.includes('heroPrice = parseFloat(heroItem?.price !== undefined && heroItem?.price !== null && heroItem?.price !== \'\' ? heroItem.price : 52.99)'));

console.log('\n====================================================');
console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) {
    process.exit(1);
}
