// scripts/challenge_m2_cart_images_empirical.js
// EMPIRICAL CHALLENGER 1 STRESS HARNESS & ORACLE
// Milestone 2: Add-to-Cart Image & Metadata Integrity

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import cartReducer, { addToCart, removeFromCart, deleteItemFromCart, setCart, clearCart } from '../lib/features/cart/cartSlice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('======================================================================');
console.log('⚔️  CHALLENGER 1: EMPIRICAL VERIFICATION & STRESS HARNESS (MILESTONE 2)');
console.log('    Milestone: Add-to-Cart Image & Metadata Integrity');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✅ [PASS] ${testName}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${testName}`);
        console.error(`     Reason: ${err.message}`);
        failedTests++;
    }
}

async function runAsyncTest(testName, fn) {
    totalTests++;
    try {
        await fn();
        console.log(`  ✅ [PASS] ${testName}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${testName}`);
        console.error(`     Reason: ${err.message}`);
        failedTests++;
    }
}

// =========================================================================
// SUITE 1: Global Purge of Non-Standard `size-18` across Entire Codebase
// =========================================================================
console.log('--- SUITE 1: Global Purge of non-standard "size-18" ---');

runTest('Filesystem search: Zero occurrences of "size-18" across entire repository', () => {
    function searchDir(dir) {
        let matches = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            // Skip non-source/temporary directories and test scripts that test for size-18
            if (
                entry.name === 'node_modules' ||
                entry.name === '.next' ||
                entry.name === '.git' ||
                entry.name === '.agents' ||
                entry.name === 'verify_m2_cart_images.js' ||
                entry.name === 'challenge_m2_cart_images_empirical.js' ||
                entry.name === 'test_cartdrawer_component_render.js'
            ) {
                continue;
            }
            if (entry.isDirectory()) {
                matches = matches.concat(searchDir(fullPath));
            } else if (/\.(jsx?|tsx?|css|html|json|md)$/.test(entry.name)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes('size-18')) {
                    matches.push({ file: path.relative(PROJECT_ROOT, fullPath), count: (content.match(/size-18/g) || []).length });
                }
            }
        }
        return matches;
    }

    const matches = searchDir(PROJECT_ROOT);
    assert.strictEqual(
        matches.length,
        0,
        `Found ${matches.length} files containing "size-18": ${JSON.stringify(matches, null, 2)}`
    );
});

runTest('Git grep search: Exactly 0 tracked lines contain "size-18"', () => {
    let output = '';
    let exitCode = 0;
    try {
        output = execSync('git grep "size-18"', { cwd: PROJECT_ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (err) {
        exitCode = err.status;
        output = err.stdout || '';
    }
    // git grep returns exit code 1 when no matches are found
    assert.strictEqual(exitCode, 1, `git grep should return exit code 1 (no matches), got ${exitCode} with output:\n${output}`);
    assert.strictEqual(output.trim(), '', 'git grep output must be completely empty');
});

runTest('Explicit check: Historical culprits CartDrawer, WishlistDrawer, cart/page, creator/page have 0 "size-18"', () => {
    const files = [
        'components/CartDrawer.jsx',
        'components/WishlistDrawer.jsx',
        'app/(public)/cart/page.jsx',
        'app/(public)/creator/[username]/page.jsx'
    ];
    for (const f of files) {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, f), 'utf8');
        assert(!content.includes('size-18'), `${f} must NOT contain "size-18"`);
    }
});


// =========================================================================
// SUITE 2: CartDrawer Thumbnail Styling & Fallback Elements
// =========================================================================
console.log('\n--- SUITE 2: CartDrawer Thumbnail CSS & Fallback Elements ---');

runTest('CartDrawer.jsx thumbnail image has valid CSS classes w-16 h-16 object-cover', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'components/CartDrawer.jsx'), 'utf8');
    const imgRegex = /<img[\s\S]*?className=["']([^"']+)["'][\s\S]*?\/>/g;
    let match;
    let foundThumbnail = false;

    while ((match = imgRegex.exec(content)) !== null) {
        const classes = match[1];
        if (classes.includes('w-16') && classes.includes('h-16') && classes.includes('object-cover')) {
            foundThumbnail = true;
            assert(classes.includes('rounded-xl'), 'Thumbnail should have rounded-xl');
            assert(classes.includes('border'), 'Thumbnail should have border');
            assert(classes.includes('shrink-0'), 'Thumbnail should have shrink-0');
        }
    }
    assert(foundThumbnail, 'CartDrawer.jsx must contain an <img> with classes "w-16 h-16 object-cover"');
});

runTest('CartDrawer.jsx thumbnail image uses getSafeImageUrl and handleImageError fallback', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'components/CartDrawer.jsx'), 'utf8');
    assert(content.includes('getSafeImageUrl(item.image)'), 'CartDrawer must use getSafeImageUrl(item.image)');
    assert(content.includes("onError={(e) => handleImageError(e, 'product')}"), 'CartDrawer must specify handleImageError');
});

runTest('WishlistDrawer.jsx, cart page, and creator page thumbnail styling consistency', () => {
    const wishlist = fs.readFileSync(path.join(PROJECT_ROOT, 'components/WishlistDrawer.jsx'), 'utf8');
    assert(wishlist.includes('w-16 h-16 rounded-xl object-cover'), 'WishlistDrawer must use w-16 h-16 rounded-xl object-cover');

    const cartPage = fs.readFileSync(path.join(PROJECT_ROOT, 'app/(public)/cart/page.jsx'), 'utf8');
    assert(cartPage.includes('w-16 h-16 object-cover'), 'cart/page.jsx must use w-16 h-16 object-cover');

    const creatorPage = fs.readFileSync(path.join(PROJECT_ROOT, 'app/(public)/creator/[username]/page.jsx'), 'utf8');
    assert(creatorPage.includes('sm:w-16 sm:h-16 object-cover'), 'creator page must use sm:w-16 sm:h-16 object-cover');
});


// =========================================================================
// SUITE 3: CartDrawer Composite Key Resolution Oracle (prod_xyz__Large)
// =========================================================================
console.log('\n--- SUITE 3: CartDrawer Composite Key Resolution Oracles ---');

// Replicate the exact resolution algorithm from CartDrawer.jsx lines 30-64
function simulateCartDrawerResolution(cartItems, cartProducts, products = [], mockLocalStorage = {}) {
    const items = [];
    let subtotal = 0;

    for (const [key, qty] of Object.entries(cartItems)) {
        if (!qty || qty <= 0) continue;
        const baseId = key.includes('__') ? key.split('__')[0] : key;
        let product = cartProducts[key] || cartProducts[baseId] || Object.values(cartProducts).find(p => p?.id === key || p?.id === baseId) || (products || []).find(p => p.id === key || p.id === baseId);

        if (!product) {
            for (const [lsKey, lsVal] of Object.entries(mockLocalStorage)) {
                if (lsKey && (lsKey.startsWith('cloned_store_') || lsKey.startsWith('store_') || lsKey.startsWith('gumshop_db_products/'))) {
                    try {
                        const parsed = typeof lsVal === 'string' ? JSON.parse(lsVal) : lsVal;
                        if (parsed.id === key || parsed.id === baseId) { product = parsed; break; }
                        if (parsed.products) {
                            const match = parsed.products.find(p => p.id === key || p.id === baseId);
                            if (match) { product = match; break; }
                        }
                    } catch {}
                }
            }
        }

        const price = parseFloat(product?.price !== undefined && product?.price !== null ? product.price : 0);
        const name = product?.name || 'Featured Item';
        const image = product?.image || product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';

        items.push({
            id: key,
            name,
            price,
            image,
            quantity: qty,
            storeId: product?.storeId || 'store_default'
        });
        subtotal += price * qty;
    }

    return { items, subtotal };
}

runTest('Composite key "prod_xyz__Large" resolves product name, price, and image when in cartProducts', () => {
    const key = 'prod_xyz__Large';
    const cartItems = { [key]: 1 };
    const cartProducts = {
        [key]: {
            id: 'prod_xyz',
            name: 'Headless Horseman Costume (Large)',
            price: 52.99,
            image: 'https://cdn.example.com/costume-large.jpg'
        }
    };

    const { items, subtotal } = simulateCartDrawerResolution(cartItems, cartProducts);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].id, 'prod_xyz__Large');
    assert.strictEqual(items[0].name, 'Headless Horseman Costume (Large)');
    assert.notStrictEqual(items[0].name, 'Featured Item', 'Must not fall back to Featured Item');
    assert.strictEqual(items[0].price, 52.99);
    assert.notStrictEqual(items[0].price, 0, 'Must not fall back to 0');
    assert.strictEqual(items[0].image, 'https://cdn.example.com/costume-large.jpg');
    assert.strictEqual(subtotal, 52.99);
});

runTest('Composite key "prod_xyz__Large" resolves via baseId fallback when cartProducts only has "prod_xyz"', () => {
    const key = 'prod_xyz__Large';
    const cartItems = { [key]: 2 };
    const cartProducts = {
        'prod_xyz': {
            id: 'prod_xyz',
            name: 'Headless Horseman Costume',
            price: 52.99,
            image: 'https://cdn.example.com/base-costume.jpg'
        }
    };

    const { items, subtotal } = simulateCartDrawerResolution(cartItems, cartProducts);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].name, 'Headless Horseman Costume');
    assert.notStrictEqual(items[0].name, 'Featured Item');
    assert.strictEqual(items[0].price, 52.99);
    assert.notStrictEqual(items[0].price, 0);
    assert.strictEqual(items[0].image, 'https://cdn.example.com/base-costume.jpg');
    assert.strictEqual(subtotal, 105.98);
});

runTest('Composite key "prod_xyz__Large" resolves via global products list when cartProducts is empty', () => {
    const key = 'prod_xyz__Large';
    const cartItems = { [key]: 1 };
    const cartProducts = {}; // Empty / not hydrated
    const globalProducts = [
        {
            id: 'prod_xyz',
            name: 'Ghost Rider Costume',
            price: 52.99,
            images: ['https://cdn.example.com/ghost.png']
        }
    ];

    const { items, subtotal } = simulateCartDrawerResolution(cartItems, cartProducts, globalProducts);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].name, 'Ghost Rider Costume');
    assert.notStrictEqual(items[0].name, 'Featured Item');
    assert.strictEqual(items[0].price, 52.99);
    assert.notStrictEqual(items[0].price, 0);
    assert.strictEqual(items[0].image, 'https://cdn.example.com/ghost.png');
    assert.strictEqual(subtotal, 52.99);
});

runTest('Composite key "prod_xyz__Large" resolves via localStorage cache when state is empty', () => {
    const key = 'prod_xyz__Large';
    const cartItems = { [key]: 1 };
    const cartProducts = {};
    const globalProducts = [];
    const mockLocalStorage = {
        'cloned_store_halloween': JSON.stringify({
            id: 'store_halloween',
            products: [
                {
                    id: 'prod_xyz',
                    name: 'Spooky Dog Harness',
                    price: 52.99,
                    image: 'https://cdn.example.com/harness.jpg'
                }
            ]
        })
    };

    const { items } = simulateCartDrawerResolution(cartItems, cartProducts, globalProducts, mockLocalStorage);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].name, 'Spooky Dog Harness');
    assert.strictEqual(items[0].price, 52.99);
    assert.strictEqual(items[0].image, 'https://cdn.example.com/harness.jpg');
});

runTest('Adversarial multi-delimiter composite key "prod_xyz__Size-L__Color-Black" decomposes baseId correctly', () => {
    const key = 'prod_xyz__Size-L__Color-Black';
    const cartItems = { [key]: 1 };
    const cartProducts = {
        'prod_xyz': {
            id: 'prod_xyz',
            name: 'Multi-Variant Costume',
            price: 52.99,
            image: 'https://cdn.example.com/multi.jpg'
        }
    };

    const { items } = simulateCartDrawerResolution(cartItems, cartProducts);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].name, 'Multi-Variant Costume');
    assert.strictEqual(items[0].price, 52.99);
    assert.strictEqual(items[0].image, 'https://cdn.example.com/multi.jpg');
});


// =========================================================================
// SUITE 4: cartSlice Defensive Image Normalization Oracles
// =========================================================================
console.log('\n--- SUITE 4: cartSlice Defensive Image Normalization Oracles ---');

runTest('cartSlice: Product with only images: ["url1", "url2"] populates item.image as "url1"', () => {
    const initialState = { total: 0, cartItems: {}, cartProducts: {} };
    const action = addToCart({
        productId: 'prod_multi_img',
        product: {
            id: 'prod_multi_img',
            name: 'Costume Multi Image',
            price: 52.99,
            images: ['https://example.com/url1.jpg', 'https://example.com/url2.jpg']
        }
    });

    const state = cartReducer(initialState, action);
    assert.strictEqual(state.cartItems['prod_multi_img'], 1);
    assert(state.cartProducts['prod_multi_img'], 'cartProducts entry must exist');
    assert.strictEqual(
        state.cartProducts['prod_multi_img'].image,
        'https://example.com/url1.jpg',
        'cartSlice must extract images[0] into image property'
    );
});

runTest('cartSlice: Composite key itemKey with images: ["url1", "url2"] populates item.image as "url1"', () => {
    const initialState = { total: 0, cartItems: {}, cartProducts: {} };
    const action = addToCart({
        productId: 'prod_xyz',
        itemKey: 'prod_xyz__Large',
        product: {
            id: 'prod_xyz',
            name: 'Phantom Paws (Large)',
            price: 52.99,
            variant: 'Large',
            images: ['https://example.com/url1.jpg', 'https://example.com/url2.jpg']
        }
    });

    const state = cartReducer(initialState, action);
    assert.strictEqual(state.cartItems['prod_xyz__Large'], 1);
    assert(state.cartProducts['prod_xyz__Large'], 'cartProducts entry under composite key must exist');
    assert.strictEqual(
        state.cartProducts['prod_xyz__Large'].image,
        'https://example.com/url1.jpg',
        'Composite key product must have normalized image = url1'
    );
});

runTest('cartSlice: Preserves pre-existing product.image when images array is also present', () => {
    const initialState = { total: 0, cartItems: {}, cartProducts: {} };
    const action = addToCart({
        productId: 'prod_explicit',
        product: {
            id: 'prod_explicit',
            name: 'Explicit Image Product',
            price: 52.99,
            image: 'https://example.com/primary.jpg',
            images: ['https://example.com/gallery1.jpg', 'https://example.com/gallery2.jpg']
        }
    });

    const state = cartReducer(initialState, action);
    assert.strictEqual(state.cartProducts['prod_explicit'].image, 'https://example.com/primary.jpg');
});

runTest('cartSlice: setCart normalizes images array for batch hydration', () => {
    const initialState = { total: 0, cartItems: {}, cartProducts: {} };
    const action = setCart({
        cartItems: { 'p1': 1, 'p2__XL': 2 },
        cartProducts: {
            'p1': { id: 'p1', name: 'Item 1', images: ['https://img.com/1.jpg'] },
            'p2__XL': { id: 'p2', name: 'Item 2', images: ['https://img.com/2.jpg', 'https://img.com/3.jpg'] }
        }
    });

    const state = cartReducer(initialState, action);
    assert.strictEqual(state.cartProducts['p1'].image, 'https://img.com/1.jpg');
    assert.strictEqual(state.cartProducts['p2__XL'].image, 'https://img.com/2.jpg');
});

runTest('cartSlice: Stress test - handles edge cases gracefully (empty images array, null, undefined)', () => {
    const initialState = { total: 0, cartItems: {}, cartProducts: {} };
    
    // Empty images array
    const state1 = cartReducer(initialState, addToCart({
        productId: 'edge_1',
        product: { id: 'edge_1', name: 'Empty Images', images: [] }
    }));
    assert.strictEqual(state1.cartItems['edge_1'], 1);

    // Non-array images property (e.g. string or null)
    const state2 = cartReducer(state1, addToCart({
        productId: 'edge_2',
        product: { id: 'edge_2', name: 'Null Images', images: null, image: 'https://img.com/valid.jpg' }
    }));
    assert.strictEqual(state2.cartProducts['edge_2'].image, 'https://img.com/valid.jpg');

    // Missing product payload entirely
    const state3 = cartReducer(state2, addToCart({ productId: 'edge_3' }));
    assert.strictEqual(state3.cartItems['edge_3'], 1);
});

runTest('cartSlice: Quantity increment, decrement, and delete with composite key itemKey', () => {
    let state = { total: 0, cartItems: {}, cartProducts: {} };
    
    // Add 1
    state = cartReducer(state, addToCart({
        productId: 'prod_comp',
        itemKey: 'prod_comp__Medium',
        product: { id: 'prod_comp', name: 'Comp Item', price: 52.99, images: ['https://img.com/comp.jpg'] }
    }));
    assert.strictEqual(state.cartItems['prod_comp__Medium'], 1);
    assert.strictEqual(state.total, 1);

    // Add again (increment)
    state = cartReducer(state, addToCart({
        productId: 'prod_comp',
        itemKey: 'prod_comp__Medium',
        product: state.cartProducts['prod_comp__Medium']
    }));
    assert.strictEqual(state.cartItems['prod_comp__Medium'], 2);
    assert.strictEqual(state.total, 2);

    // Decrement
    state = cartReducer(state, removeFromCart({
        productId: 'prod_comp',
        itemKey: 'prod_comp__Medium'
    }));
    assert.strictEqual(state.cartItems['prod_comp__Medium'], 1);
    assert.strictEqual(state.total, 1);

    // Delete
    state = cartReducer(state, deleteItemFromCart({
        productId: 'prod_comp',
        itemKey: 'prod_comp__Medium'
    }));
    assert.strictEqual(state.cartItems['prod_comp__Medium'], undefined);
    assert.strictEqual(state.cartProducts['prod_comp__Medium'], undefined);
    assert.strictEqual(state.total, 0);
});


// =========================================================================
// SUITE 5: ProductDetails.jsx Image & Add-to-Cart Logic Oracle
// =========================================================================
console.log('\n--- SUITE 5: ProductDetails.jsx Image & Add-to-Cart Logic ---');

runTest('ProductDetails.jsx source code explicitly resolves images and passes image: images[0]', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'components/ProductDetails.jsx'), 'utf8');

    // Verify images array fallback definition
    assert(
        content.includes('(product.images && product.images.length > 0) \n        ? product.images \n        : [product.image') ||
        content.includes('(product.images && product.images.length > 0)') ||
        content.includes('product.images.length > 0'),
        'ProductDetails must define images array from product.images or product.image'
    );

    // Verify handleAddToCart passes image: images[0]
    assert(
        content.includes('image: images[0]'),
        'handleAddToCart must dispatch product with image: images[0]'
    );

    // Verify itemKey composition
    assert(
        content.includes("const itemKey = activeVariantLabel ? `${productId}__${activeVariantLabel}` : productId;"),
        'handleAddToCart must compose itemKey with activeVariantLabel'
    );
});

runTest('Simulated ProductDetails -> cartSlice -> CartDrawer pipeline preserves image and metadata', () => {
    // 1. Raw product originating with only images array
    const rawProduct = {
        id: 'prod_headless_99',
        name: 'Headless Horseman Dog Costume',
        price: 52.99,
        images: ['https://cdn.store.com/headless-main.jpg', 'https://cdn.store.com/headless-back.jpg'],
        sizes: [{ name: 'Large', priceDelta: 0 }],
        colors: [{ name: 'Spooky Black' }],
        storeId: 'store_phantompaws'
    };

    // 2. Simulate ProductDetails.jsx logic:
    const images = (rawProduct.images && rawProduct.images.length > 0)
        ? rawProduct.images
        : [rawProduct.image || 'https://default.com/img.jpg'];
    const activeVariantLabel = `${rawProduct.colors[0].name} • ${rawProduct.sizes[0].name}`;
    const itemKey = `${rawProduct.id}__${activeVariantLabel}`;
    
    const dispatchedProduct = {
        ...rawProduct,
        name: `${rawProduct.name} (${activeVariantLabel})`,
        image: images[0],
        price: 52.99,
        variant: activeVariantLabel,
        storeId: rawProduct.storeId
    };

    // 3. Dispatch to cartSlice
    let cartState = { total: 0, cartItems: {}, cartProducts: {} };
    cartState = cartReducer(cartState, addToCart({
        productId: rawProduct.id,
        itemKey,
        product: dispatchedProduct
    }));

    // 4. Feed into CartDrawer item resolution
    const { items, subtotal } = simulateCartDrawerResolution(cartState.cartItems, cartState.cartProducts);

    // 5. Assertions
    assert.strictEqual(items.length, 1);
    const item = items[0];
    assert.strictEqual(item.id, itemKey);
    assert.strictEqual(item.name, 'Headless Horseman Dog Costume (Spooky Black • Large)');
    assert.notStrictEqual(item.name, 'Featured Item');
    assert.strictEqual(item.price, 52.99);
    assert.notStrictEqual(item.price, 0);
    assert.strictEqual(item.image, 'https://cdn.store.com/headless-main.jpg');
    assert.strictEqual(subtotal, 52.99);
});


// =========================================================================
// SUITE 6: Database Layer Preservation Oracles
// =========================================================================
console.log('\n--- SUITE 6: Database Layer Product Metadata Preservation ---');

await runAsyncTest('lib/supabase.js dbGetProducts preserves image, images, compareAtPrice, customBundles', async () => {
    const { dbGetProducts } = await import('../lib/supabase.js');
    const prods = await dbGetProducts();
    assert(Array.isArray(prods), 'dbGetProducts must return an array');
    assert(prods.length > 0, 'dbGetProducts should return products');
    
    const p = prods[0];
    assert(p.image !== undefined, 'Product must have image property');
    assert(Array.isArray(p.images), 'Product must have images array property');
    assert.strictEqual(typeof p.price, 'number', 'Product price must be number');
    assert.strictEqual(typeof p.compareAtPrice, 'number', 'Product compareAtPrice must be number');
    assert(Array.isArray(p.customBundles), 'Product must have customBundles array');
});

await runAsyncTest('lib/serverDb.js serverGetProducts preserves image, images, compareAtPrice, customBundles', async () => {
    const { serverGetProducts } = await import('../lib/serverDb.js');
    const prods = await serverGetProducts('store_phantompaws');
    assert(Array.isArray(prods), 'serverGetProducts must return an array');
    if (prods.length > 0) {
        const p = prods[0];
        assert(p.image !== undefined, 'Product must have image property');
        assert(Array.isArray(p.images), 'Product must have images array property');
        assert.strictEqual(typeof p.price, 'number', 'Product price must be number');
        assert.strictEqual(typeof p.compareAtPrice, 'number', 'Product compareAtPrice must be number');
        assert(Array.isArray(p.customBundles), 'Product must have customBundles array');
    }
});


// =========================================================================
// FINAL EMPIRICAL SUMMARY
// =========================================================================
console.log('\n======================================================================');
console.log(`📊 EMPIRICAL CHALLENGER TEST RESULTS: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('======================================================================\n');

if (failedTests > 0) {
    console.error(`💥 FAILURE: ${failedTests} challenge test(s) failed!`);
    process.exit(1);
} else {
    console.log('🎉 SUCCESS: All Milestone 2 empirical challenge tests PASSED 100%!');
    process.exit(0);
}
