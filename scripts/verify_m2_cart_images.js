/**
 * Verification Script for Milestone 2: Add-to-Cart Image & Metadata Integrity
 *
 * Checks:
 * 1. Global purge of invalid `size-18` across codebase (0 occurrences).
 * 2. `CartDrawer.jsx` thumbnail CSS and composite key resolution.
 * 3. `ProductDetails.jsx` image passing in `handleAddToCart`.
 * 4. `cartSlice.js` defensive image normalization in Redux.
 * 5. Functional test of cartSlice reducer and CartDrawer key decomposition logic.
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import cartReducer, { addToCart, removeFromCart, deleteItemFromCart, setCart } from '../lib/features/cart/cartSlice.js';

const ROOT_DIR = process.cwd();

console.log('====================================================');
console.log('🧪 Verifying Milestone 2: Add-to-Cart Image Integrity');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`✅ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Error: ${err.message}`);
    }
}

// 1. Global purge of non-standard `size-18`
runTest('Zero occurrences of "size-18" exist in the entire codebase', () => {
    function searchDir(dir) {
        let matches = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git' || entry.name === '.agents' || entry.name === 'scripts' || entry.name === 'verify_m2_cart_images.js') {
                continue;
            }
            if (entry.isDirectory()) {
                matches = matches.concat(searchDir(fullPath));
            } else if (/\.(jsx?|tsx?|css|html|json)$/.test(entry.name)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes('size-18')) {
                    matches.push({ file: fullPath, count: (content.match(/size-18/g) || []).length });
                }
            }
        }
        return matches;
    }

    const matches = searchDir(ROOT_DIR);
    assert.strictEqual(
        matches.length,
        0,
        `Found ${matches.length} files containing "size-18": ${JSON.stringify(matches, null, 2)}`
    );
});

// 2. CartDrawer.jsx assertions
runTest('CartDrawer.jsx uses responsive w-16 h-16 thumbnail styling and onError fallback', () => {
    const filePath = path.join(ROOT_DIR, 'components', 'CartDrawer.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert(
        content.includes('w-16 h-16 rounded-xl object-cover bg-white border border-slate-200 shrink-0'),
        'CartDrawer.jsx must contain "w-16 h-16 rounded-xl object-cover bg-white border border-slate-200 shrink-0"'
    );
    assert(
        !content.includes('size-18'),
        'CartDrawer.jsx must not contain "size-18"'
    );
    assert(
        content.includes("onError={(e) => handleImageError(e, 'product')}"),
        'CartDrawer.jsx must include handleImageError fallback'
    );
});

runTest('CartDrawer.jsx decomposes composite keys and matches baseId', () => {
    const filePath = path.join(ROOT_DIR, 'components', 'CartDrawer.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert(
        content.includes("baseId = key.includes('__') ? key.split('__')[0] : key") || content.includes("baseId = key.split('__')[0]"),
        'CartDrawer.jsx must decompose composite keys with baseId'
    );
    assert(
        content.includes('p.id === key || p.id === baseId'),
        'CartDrawer.jsx must match p.id === key || p.id === baseId'
    );
    assert(
        content.includes('itemKey: item.id'),
        'CartDrawer.jsx must pass itemKey: item.id when incrementing quantity'
    );
});

// 3. ProductDetails.jsx assertions
runTest('ProductDetails.jsx passes image: images[0] in handleAddToCart', () => {
    const filePath = path.join(ROOT_DIR, 'components', 'ProductDetails.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert(
        content.includes('image: images[0]'),
        'ProductDetails.jsx must explicitly pass image: images[0] inside product payload'
    );
});

// 4. WishlistDrawer.jsx and cart page assertions
runTest('WishlistDrawer.jsx, cart page, and creator page use standard sizing', () => {
    const wishlist = fs.readFileSync(path.join(ROOT_DIR, 'components', 'WishlistDrawer.jsx'), 'utf8');
    assert(wishlist.includes('w-16 h-16 rounded-xl object-cover'), 'WishlistDrawer must use w-16 h-16');

    const cartPage = fs.readFileSync(path.join(ROOT_DIR, 'app', '(public)', 'cart', 'page.jsx'), 'utf8');
    assert(cartPage.includes('w-16 h-16 object-cover'), 'cart/page.jsx must use w-16 h-16 object-cover');

    const creatorPage = fs.readFileSync(path.join(ROOT_DIR, 'app', '(public)', 'creator', '[username]', 'page.jsx'), 'utf8');
    assert(creatorPage.includes('sm:w-16 sm:h-16 object-cover'), 'creator page must use sm:w-16 sm:h-16 object-cover');
});

// 5. cartSlice.js unit tests
runTest('cartSlice normalizes image when product only has images array', () => {
    const initialState = { total: 0, cartItems: {}, cartProducts: {} };
    const action = addToCart({
        productId: 'prod_99',
        product: {
            id: 'prod_99',
            name: 'Mystery Box',
            price: 52.99,
            images: ['https://example.com/box-thumbnail.jpg', 'https://example.com/box-2.jpg']
        }
    });

    const nextState = cartReducer(initialState, action);
    assert.strictEqual(nextState.cartItems['prod_99'], 1);
    assert.strictEqual(
        nextState.cartProducts['prod_99'].image,
        'https://example.com/box-thumbnail.jpg',
        'Should derive product.image from product.images[0]'
    );
});

runTest('cartSlice preserves explicit image when provided', () => {
    const initialState = { total: 0, cartItems: {}, cartProducts: {} };
    const action = addToCart({
        productId: 'prod_100',
        product: {
            id: 'prod_100',
            name: 'Deluxe Costume',
            image: 'https://example.com/explicit-image.jpg',
            images: ['https://example.com/gallery-1.jpg']
        }
    });

    const nextState = cartReducer(initialState, action);
    assert.strictEqual(
        nextState.cartProducts['prod_100'].image,
        'https://example.com/explicit-image.jpg',
        'Should preserve existing product.image'
    );
});

runTest('cartSlice handles composite key itemKey with image normalization', () => {
    const initialState = { total: 0, cartItems: {}, cartProducts: {} };
    const action = addToCart({
        productId: 'prod_101',
        itemKey: 'prod_101__Party Pack',
        product: {
            id: 'prod_101',
            name: 'Party Pack Item',
            variant: 'Party Pack',
            images: ['https://example.com/party-pack.jpg']
        }
    });

    const nextState = cartReducer(initialState, action);
    assert.strictEqual(nextState.cartItems['prod_101__Party Pack'], 1);
    assert(nextState.cartProducts['prod_101__Party Pack'], 'Item must exist under composite key');
    assert.strictEqual(
        nextState.cartProducts['prod_101__Party Pack'].image,
        'https://example.com/party-pack.jpg',
        'Composite key product must have normalized image'
    );

    // Increment with itemKey
    const incrementAction = addToCart({
        productId: 'prod_101__Party Pack',
        itemKey: 'prod_101__Party Pack',
        product: nextState.cartProducts['prod_101__Party Pack']
    });
    const stateAfterInc = cartReducer(nextState, incrementAction);
    assert.strictEqual(stateAfterInc.cartItems['prod_101__Party Pack'], 2);
    assert.strictEqual(stateAfterInc.total, 2);
});

runTest('CartDrawer composite key resolution resolves baseId product correctly', () => {
    const cartItems = { 'prod_505__Large Pack': 2 };
    const cartProducts = {}; // Simulates missing or rehydrated cartProducts
    const products = [
        {
            id: 'prod_505',
            name: 'French Bulldog Costume',
            price: 52.99,
            image: 'https://example.com/frenchie.jpg'
        }
    ];

    // Simulate CartDrawer.jsx resolution
    const key = 'prod_505__Large Pack';
    const baseId = key.includes('__') ? key.split('__')[0] : key;
    const resolvedProduct = cartProducts[key] || cartProducts[baseId] || (products || []).find(p => p.id === key || p.id === baseId);

    assert(resolvedProduct, 'Should resolve product using baseId fallback');
    assert.strictEqual(resolvedProduct.name, 'French Bulldog Costume');
    assert.strictEqual(resolvedProduct.price, 52.99);
    assert.strictEqual(resolvedProduct.image, 'https://example.com/frenchie.jpg');
});

console.log('\n====================================================');
console.log(`Results: ${passedTests}/${totalTests} tests passed.`);
console.log('====================================================');

if (passedTests === totalTests) {
    console.log('🎉 All Milestone 2 verification checks PASSED!');
    process.exit(0);
} else {
    console.error(`💥 ${totalTests - passedTests} tests FAILED!`);
    process.exit(1);
}
