import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

console.log('======================================================================');
console.log('🚀 TEST SUITE: PRICE PERSISTENCE & SEO METADATA VERIFICATION');
console.log('======================================================================\n');

let passed = 0;
let failed = 0;

function it(title, fn) {
    try {
        fn();
        console.log(`  ✅ [PASS] ${title}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${title}: ${err.message}`);
        failed++;
    }
}

async function itAsync(title, fn) {
    try {
        await fn();
        console.log(`  ✅ [PASS] ${title}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${title}: ${err.message}`);
        failed++;
    }
}

// 1. Check SEO Metadata in app/layout.jsx
it('SEO title & description highlight The Best E-Commerce Store for Best Deals & Viral Products', () => {
    const layoutCode = fs.readFileSync(path.join(ROOT, 'app/layout.jsx'), 'utf-8');
    assert.ok(layoutCode.includes('The Best E-Commerce Store for Best Deals & Viral Products'), 'Missing updated title in layout.jsx');
    assert.ok(layoutCode.includes('The Best E-Commerce Store for Best Deals and Viral Products'), 'Missing updated description in layout.jsx');
    assert.ok(layoutCode.includes('wholesale rates dropshipping'), 'Missing wholesale rates keyword');
    assert.ok(layoutCode.includes('1 click clone to gumroad store'), 'Missing 1 click clone keyword');
});

// 2. Check manifest.json
it('public/manifest.json reflects The Best E-Commerce Store for Best Deals & Viral Products branding', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/manifest.json'), 'utf-8'));
    assert.ok(manifest.name.includes('The Best E-Commerce Store for Best Deals & Viral Products'), 'Manifest name mismatch');
    assert.ok(manifest.description.includes('The Best E-Commerce Store for Best Deals and Viral Products'), 'Manifest description mismatch');
});

// 3. Check updateProduct in lib/firebaseDb.js
it('lib/firebaseDb.js updateProduct PATCHes /api/products to Supabase and dispatches event without storage caching', () => {
    const fbDbCode = fs.readFileSync(path.join(ROOT, 'lib/firebaseDb.js'), 'utf-8');
    assert.ok(fbDbCode.includes('/api/products'), 'updateProduct must PATCH /api/products');
    assert.ok(fbDbCode.includes('products_updated'), 'updateProduct must dispatch products_updated event');
    assert.ok(!fbDbCode.includes('localStorage.setItem(prodKey'), 'updateProduct must not cache products to localStorage');
});

// 4. Check dbUpdateProduct in lib/supabase.js
it('lib/supabase.js dbUpdateProduct syncs both products table and parent store in stores table', () => {
    const supabaseCode = fs.readFileSync(path.join(ROOT, 'lib/supabase.js'), 'utf-8');
    assert.ok(supabaseCode.includes('stores?or='), 'dbUpdateProduct must synchronize parent store in stores table');
    assert.ok(supabaseCode.includes('sData.products = sData.products.map'), 'dbUpdateProduct must update embedded products array');
});

// 5. Check serverSaveProducts in lib/serverDb.js
it('lib/serverDb.js serverSaveProducts synchronizes parent store record in stores table', () => {
    const serverDbCode = fs.readFileSync(path.join(ROOT, 'lib/serverDb.js'), 'utf-8');
    assert.ok(serverDbCode.includes('stores?or='), 'serverSaveProducts must synchronize parent store record');
    assert.ok(serverDbCode.includes('products: mergedList'), 'serverSaveProducts must write mergedList into stores data');
});

// 6. Check manage-product handleUpdateRetailPrice
it('app/store/manage-product/page.jsx handleUpdateRetailPrice updates bundles and compareAtPrice', () => {
    const manageCode = fs.readFileSync(path.join(ROOT, 'app/store/manage-product/page.jsx'), 'utf-8');
    assert.ok(manageCode.includes('generateContextualBundles'), 'handleUpdateRetailPrice must generate contextual bundles');
    assert.ok(manageCode.includes('updatedCompare'), 'handleUpdateRetailPrice must compute updated compareAt price');
});

// 7. Verify in-memory and storage persistence with serverDb
await itAsync('serverSaveStore and serverSaveProducts preserve updated prices without reverting', async () => {
    const { serverSaveStore, serverGetStore, serverSaveProducts, serverGetProducts } = await import('../lib/serverDb.js');

    const testSlug = 'price_test_store_' + Date.now();
    const testStoreId = 'store_' + testSlug;

    // 1. Create store with initial imported product ($20)
    await serverSaveStore({
        id: testStoreId,
        username: testSlug,
        name: 'Price Test Store',
        products: [{
            id: 'prod_test_initial',
            name: 'Imported Widget',
            price: 20.00,
            compareAtPrice: 29.99
        }]
    });

    // 2. Verify initial price
    let store = await serverGetStore(testSlug);
    assert.strictEqual(store.products[0].price, 20.00, 'Initial imported price must be 20.00');

    // 3. User edits price to $49.99
    await serverSaveProducts(testStoreId, [{
        id: 'prod_test_initial',
        name: 'Imported Widget',
        price: 49.99,
        compareAtPrice: 69.99
    }]);

    // 4. Verify that serverGetProducts returns the updated $49.99
    const prods = await serverGetProducts(testStoreId);
    const updatedProd = prods.find(p => p.id === 'prod_test_initial');
    assert.ok(updatedProd, 'Product must exist in store');
    assert.strictEqual(updatedProd.price, 49.99, 'Product price must stay permanently updated at 49.99');

    // 5. Verify that serverGetStore also reflects the updated $49.99
    store = await serverGetStore(testSlug);
    const storeProd = (store.products || []).find(p => p.id === 'prod_test_initial');
    assert.ok(storeProd, 'Product must exist in parent store record');
    assert.strictEqual(storeProd.price, 49.99, 'Parent store products array must stay permanently updated at 49.99');
});

console.log('\n======================================================================');
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`);
console.log('======================================================================');

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
