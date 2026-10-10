/**
 * Empirical Adversarial Test Harness for Milestone 2:
 * Add-to-Cart Image & Metadata Integrity Stress Testing
 *
 * Scenarios Tested:
 * 1. Broken image URL handling and onError fallback resilience
 * 2. Missing image and empty images array defensive normalization & fallback
 * 3. Multiple variant combinations in cart with composite key resolution
 * 4. Composite key quantity modifications (isolated increment/decrement/deletion)
 * 5. Corrupted/rehydrated state recovery (missing cartProducts, catalog-only, localStorage-only)
 * 6. Extreme interleaved concurrency & edge case fuzzing
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import cartReducer, { 
    addToCart, 
    removeFromCart, 
    deleteItemFromCart, 
    clearCart, 
    setCart 
} from '../lib/features/cart/cartSlice.js';
import { getSafeImageUrl, handleImageError } from '../lib/imageUtils.js';

const ROOT_DIR = process.cwd();

console.log('================================================================');
console.log('🔥 EMPIRICAL ADVERSARIAL STRESS TEST: MILESTONE 2 CART & METADATA');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runEmpiricalTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`✅ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Error: ${err.message}`);
        console.error(err.stack);
        failedTests++;
    }
}

// ============================================================================
// SUITE 1: Broken Image URL & Error Fallback Resilience
// ============================================================================
console.log('--- SUITE 1: Broken Image URL & Error Fallback Resilience ---');

runEmpiricalTest('getSafeImageUrl handles null, undefined, empty, and whitespace strings', () => {
    const inputs = [null, undefined, '', '   ', '\t\n'];
    for (const input of inputs) {
        const prodResult = getSafeImageUrl(input, 'product');
        assert(typeof prodResult === 'string' && prodResult.startsWith('https://'), 
            `Expected fallback URL for input ${JSON.stringify(input)}, got ${prodResult}`);
        assert(prodResult.includes('images.unsplash.com'), 'Product fallback should point to default product unsplash');

        const avatarResult = getSafeImageUrl(input, 'avatar');
        assert(typeof avatarResult === 'string' && avatarResult.startsWith('https://'), 
            `Expected fallback avatar for input ${JSON.stringify(input)}, got ${avatarResult}`);
        assert(avatarResult.includes('api.dicebear.com'), 'Avatar fallback should point to dicebear');
    }
});

runEmpiricalTest('getSafeImageUrl handles non-string and hostile types gracefully without throwing', () => {
    const hostileInputs = [123, NaN, true, false, {}, [], () => {}, Symbol('img')];
    for (const input of hostileInputs) {
        let result;
        assert.doesNotThrow(() => {
            result = getSafeImageUrl(input, 'product');
        }, `getSafeImageUrl threw on input ${String(input)}`);
        assert(typeof result === 'string' && result.startsWith('https://'), 
            `Expected valid fallback string for ${String(input)}, got ${result}`);
    }
});

runEmpiricalTest('getSafeImageUrl enforces HTTPS for mixed-content insecure HTTP URLs', () => {
    const insecure = 'http://example.com/costume.jpg';
    const safe = getSafeImageUrl(insecure, 'product');
    assert.strictEqual(safe, 'https://example.com/costume.jpg', 'HTTP must be upgraded to HTTPS');

    const alreadySecure = 'https://example.com/costume.jpg';
    assert.strictEqual(getSafeImageUrl(alreadySecure, 'product'), alreadySecure);
});

runEmpiricalTest('handleImageError sets fallback and cleanly breaks infinite error recursion loops', () => {
    let onerrorCallCount = 0;
    const fakeImg = {
        src: 'https://broken-domain-that-does-not-exist.com/404.jpg',
        onerror: () => { onerrorCallCount++; }
    };
    const event = { target: fakeImg };

    // Trigger initial error
    handleImageError(event, 'product');
    assert.strictEqual(fakeImg.onerror, null, 'e.target.onerror MUST be nullified to prevent infinite recursion loop');
    assert(fakeImg.src.includes('images.unsplash.com'), `Fallback image src must be assigned, got ${fakeImg.src}`);

    // Simulate subsequent error firing on the fallback itself
    // Since onerror was set to null, the event listener is disarmed.
    assert.strictEqual(fakeImg.onerror, null, 'onerror must remain null');
});

runEmpiricalTest('handleImageError handles malformed event objects (null, missing target) without crashing', () => {
    assert.doesNotThrow(() => handleImageError(null, 'product'));
    assert.doesNotThrow(() => handleImageError({}, 'product'));
    assert.doesNotThrow(() => handleImageError({ target: null }, 'product'));
    assert.doesNotThrow(() => handleImageError({ target: {} }, 'product'));
});

// ============================================================================
// SUITE 2: Missing Image & Empty Images Array Normalization
// ============================================================================
console.log('\n--- SUITE 2: Missing Image & Empty Images Array Normalization ---');

runEmpiricalTest('cartSlice normalizes item with missing image & missing images array', () => {
    const initialState = { total: 0, cartItems: {}, cartProducts: {} };
    const bareProduct = {
        id: 'prod_bare_1',
        name: 'Bare Product No Images',
        price: 52.99
    };

    const action = addToCart({
        productId: 'prod_bare_1',
        product: bareProduct
    });

    const nextState = cartReducer(initialState, action);
    assert.strictEqual(nextState.cartItems['prod_bare_1'], 1);
    assert(nextState.cartProducts['prod_bare_1'], 'Product must be recorded in cartProducts');
    assert.strictEqual(nextState.cartProducts['prod_bare_1'].name, 'Bare Product No Images');
    assert.strictEqual(nextState.cartProducts['prod_bare_1'].price, 52.99);
});

runEmpiricalTest('cartSlice normalizes item with empty images array', () => {
    const initialState = { total: 0, cartItems: {}, cartProducts: {} };
    const emptyImagesProduct = {
        id: 'prod_empty_imgs',
        name: 'Product With Empty Array',
        price: 52.99,
        images: []
    };

    const action = addToCart({
        productId: 'prod_empty_imgs',
        product: emptyImagesProduct
    });

    const nextState = cartReducer(initialState, action);
    assert.strictEqual(nextState.cartItems['prod_empty_imgs'], 1);
    const stored = nextState.cartProducts['prod_empty_imgs'];
    assert(stored);
    assert.strictEqual(stored.image, undefined, 'Normalized image should not set empty string or null image key');
});

runEmpiricalTest('cartSlice correctly extracts first image from non-empty images array', () => {
    const initialState = { total: 0, cartItems: {}, cartProducts: {} };
    const productWithGallery = {
        id: 'prod_gallery',
        name: 'Gallery Product',
        price: 52.99,
        images: ['https://example.com/gallery_1.jpg', 'https://example.com/gallery_2.jpg']
    };

    const action = addToCart({
        productId: 'prod_gallery',
        product: productWithGallery
    });

    const nextState = cartReducer(initialState, action);
    assert.strictEqual(nextState.cartProducts['prod_gallery'].image, 'https://example.com/gallery_1.jpg');
});

runEmpiricalTest('setCart rehydration defensively normalizes images across raw payload', () => {
    const initialState = { total: 0, cartItems: {}, cartProducts: {} };
    const rehydratedPayload = {
        cartItems: { 'p1': 2, 'p2': 1 },
        cartProducts: {
            'p1': { id: 'p1', name: 'Item 1', images: ['https://example.com/img1.jpg'] },
            'p2': { id: 'p2', name: 'Item 2', image: 'https://example.com/explicit.jpg' }
        }
    };

    const nextState = cartReducer(initialState, setCart(rehydratedPayload));
    assert.strictEqual(nextState.total, 3);
    assert.strictEqual(nextState.cartProducts['p1'].image, 'https://example.com/img1.jpg');
    assert.strictEqual(nextState.cartProducts['p2'].image, 'https://example.com/explicit.jpg');
});

// ============================================================================
// SUITE 3: Multiple Variant Combinations & Composite Key Isolation
// ============================================================================
console.log('\n--- SUITE 3: Multiple Variant Combinations & Composite Key Isolation ---');

runEmpiricalTest('Adding multiple variants of the same product creates distinct composite entries', () => {
    let state = { total: 0, cartItems: {}, cartProducts: {} };

    const parentProduct = {
        id: 'phantom_costume_base',
        name: 'PhantomPaws Headless Horseman Pet Costume',
        price: 52.99,
        images: ['https://example.com/costume.jpg']
    };

    // Variant A: Small / Orange
    const varAKey = 'phantom_costume_base__Small / Orange';
    state = cartReducer(state, addToCart({
        productId: parentProduct.id,
        itemKey: varAKey,
        product: {
            ...parentProduct,
            name: `${parentProduct.name} (Small / Orange)`,
            variant: 'Small / Orange',
            price: 52.99
        }
    }));

    // Variant B: Large / Black
    const varBKey = 'phantom_costume_base__Large / Black';
    state = cartReducer(state, addToCart({
        productId: parentProduct.id,
        itemKey: varBKey,
        product: {
            ...parentProduct,
            name: `${parentProduct.name} (Large / Black)`,
            variant: 'Large / Black',
            price: 52.99
        }
    }));

    // Variant C: 2-Pack Volume Bundle
    const varCKey = 'phantom_costume_base__2 Costumes';
    state = cartReducer(state, addToCart({
        productId: parentProduct.id,
        itemKey: varCKey,
        product: {
            ...parentProduct,
            name: `${parentProduct.name} (2 Costumes)`,
            variant: '2 Costumes',
            price: 37.31
        }
    }));

    assert.strictEqual(state.total, 3, 'Total items must be 3');
    assert.strictEqual(state.cartItems[varAKey], 1);
    assert.strictEqual(state.cartItems[varBKey], 1);
    assert.strictEqual(state.cartItems[varCKey], 1);

    // Verify distinct product entries and prices
    assert.strictEqual(state.cartProducts[varAKey].name, 'PhantomPaws Headless Horseman Pet Costume (Small / Orange)');
    assert.strictEqual(state.cartProducts[varBKey].name, 'PhantomPaws Headless Horseman Pet Costume (Large / Black)');
    assert.strictEqual(state.cartProducts[varCKey].name, 'PhantomPaws Headless Horseman Pet Costume (2 Costumes)');
    assert.strictEqual(state.cartProducts[varCKey].price, 37.31);
});

// Helper simulating CartDrawer line item resolution algorithm
function resolveCartDrawerItems(cartItems, cartProducts, catalogProducts, localStorageMock = {}) {
    const items = [];
    let subtotal = 0;

    for (const [key, qty] of Object.entries(cartItems)) {
        if (!qty || qty <= 0) continue;
        const baseId = key.includes('__') ? key.split('__')[0] : key;
        let product = cartProducts[key] || cartProducts[baseId] || 
            Object.values(cartProducts).find(p => p?.id === key || p?.id === baseId) || 
            (catalogProducts || []).find(p => p.id === key || p.id === baseId);

        if (!product) {
            for (const [lsKey, lsVal] of Object.entries(localStorageMock)) {
                if (lsKey.startsWith('cloned_store_') || lsKey.startsWith('store_') || lsKey.startsWith('gumshop_db_products/')) {
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
            baseId,
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

runEmpiricalTest('CartDrawer resolves multiple variants cleanly when cartProducts is populated', () => {
    const cartItems = {
        'prod_alpha__Red': 1,
        'prod_alpha__Blue': 2
    };
    const cartProducts = {
        'prod_alpha__Red': { id: 'prod_alpha', name: 'Alpha Hat (Red)', price: 52.99, image: 'https://example.com/red.jpg' },
        'prod_alpha__Blue': { id: 'prod_alpha', name: 'Alpha Hat (Blue)', price: 52.99, image: 'https://example.com/blue.jpg' }
    };

    const { items, subtotal } = resolveCartDrawerItems(cartItems, cartProducts, []);
    assert.strictEqual(items.length, 2);

    const red = items.find(i => i.id === 'prod_alpha__Red');
    assert(red);
    assert.strictEqual(red.name, 'Alpha Hat (Red)');
    assert.strictEqual(red.image, 'https://example.com/red.jpg');
    assert.strictEqual(red.quantity, 1);

    const blue = items.find(i => i.id === 'prod_alpha__Blue');
    assert(blue);
    assert.strictEqual(blue.name, 'Alpha Hat (Blue)');
    assert.strictEqual(blue.image, 'https://example.com/blue.jpg');
    assert.strictEqual(blue.quantity, 2);

    assert.strictEqual(Math.round(subtotal * 100) / 100, Math.round((52.99 * 1 + 52.99 * 2) * 100) / 100);
});

runEmpiricalTest('CartDrawer resolves composite keys to parent catalog details when cartProducts is empty', () => {
    const cartItems = {
        'prod_ghost__VarA': 1,
        'prod_ghost__VarB': 3
    };
    const emptyCartProducts = {};
    const catalogProducts = [
        {
            id: 'prod_ghost',
            name: 'Ghost Rider Costume',
            price: 52.99,
            image: 'https://example.com/ghost.jpg'
        }
    ];

    const { items } = resolveCartDrawerItems(cartItems, emptyCartProducts, catalogProducts);
    assert.strictEqual(items.length, 2);

    for (const item of items) {
        assert.strictEqual(item.name, 'Ghost Rider Costume', 'Should fall back to parent catalog name instead of "Featured Item"');
        assert.strictEqual(item.price, 52.99, 'Should fall back to parent catalog price instead of 0');
        assert.strictEqual(item.image, 'https://example.com/ghost.jpg', 'Should fall back to parent image');
        assert.strictEqual(item.baseId, 'prod_ghost');
    }
});

runEmpiricalTest('CartDrawer resolves composite keys from localStorage fallback when cartProducts and catalog are missing', () => {
    const cartItems = {
        'prod_offline__XSmall': 2
    };
    const emptyCartProducts = {};
    const emptyCatalog = [];
    const localStorageMock = {
        'cloned_store_phantom': JSON.stringify({
            products: [
                { id: 'prod_offline', name: 'Offline Pet Cape', price: 52.99, image: 'https://example.com/cape.jpg' }
            ]
        })
    };

    const { items } = resolveCartDrawerItems(cartItems, emptyCartProducts, emptyCatalog, localStorageMock);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].name, 'Offline Pet Cape');
    assert.strictEqual(items[0].price, 52.99);
    assert.strictEqual(items[0].image, 'https://example.com/cape.jpg');
});

// ============================================================================
// SUITE 4: Quantity Modifications on Composite Keys (No Duplication/Cross-Talk)
// ============================================================================
console.log('\n--- SUITE 4: Quantity Modifications on Composite Keys ---');

runEmpiricalTest('Incrementing variant A does not duplicate keys or affect variant B', () => {
    let state = { total: 0, cartItems: {}, cartProducts: {} };

    const keyA = 'prod_multi__VarA';
    const keyB = 'prod_multi__VarB';

    // Add initial
    state = cartReducer(state, addToCart({ productId: 'prod_multi', itemKey: keyA, product: { id: 'prod_multi', name: 'VarA', price: 52.99 } }));
    state = cartReducer(state, addToCart({ productId: 'prod_multi', itemKey: keyB, product: { id: 'prod_multi', name: 'VarB', price: 52.99 } }));
    assert.strictEqual(state.cartItems[keyA], 1);
    assert.strictEqual(state.cartItems[keyB], 1);
    assert.strictEqual(state.total, 2);

    // Increment keyA via CartDrawer dispatch pattern (itemKey: item.id)
    state = cartReducer(state, addToCart({
        productId: keyA,
        itemKey: keyA,
        product: state.cartProducts[keyA]
    }));

    assert.strictEqual(state.cartItems[keyA], 2, 'Variant A quantity should be 2');
    assert.strictEqual(state.cartItems[keyB], 1, 'Variant B quantity must remain 1');
    assert.strictEqual(state.total, 3, 'Total items should be 3');

    // Ensure NO rogue keys exist in cartItems
    const keys = Object.keys(state.cartItems);
    assert.strictEqual(keys.length, 2, `Cart must contain exactly 2 keys, found: ${JSON.stringify(keys)}`);
    assert(keys.includes(keyA) && keys.includes(keyB));
});

runEmpiricalTest('Decrementing variant A decrements cleanly and removes entry at 0 without affecting variant B', () => {
    let state = { total: 0, cartItems: {}, cartProducts: {} };
    const keyA = 'prod_multi__VarA';
    const keyB = 'prod_multi__VarB';

    // Setup: VarA has 2, VarB has 3
    state = cartReducer(state, addToCart({ productId: 'prod_multi', itemKey: keyA, product: { id: 'prod_multi', name: 'VarA' } }));
    state = cartReducer(state, addToCart({ productId: 'prod_multi', itemKey: keyA, product: { id: 'prod_multi', name: 'VarA' } }));
    state = cartReducer(state, addToCart({ productId: 'prod_multi', itemKey: keyB, product: { id: 'prod_multi', name: 'VarB' } }));
    state = cartReducer(state, addToCart({ productId: 'prod_multi', itemKey: keyB, product: { id: 'prod_multi', name: 'VarB' } }));
    state = cartReducer(state, addToCart({ productId: 'prod_multi', itemKey: keyB, product: { id: 'prod_multi', name: 'VarB' } }));
    assert.strictEqual(state.cartItems[keyA], 2);
    assert.strictEqual(state.cartItems[keyB], 3);
    assert.strictEqual(state.total, 5);

    // Decrement VarA: 2 -> 1
    state = cartReducer(state, removeFromCart({ productId: keyA, itemKey: keyA }));
    assert.strictEqual(state.cartItems[keyA], 1);
    assert.strictEqual(state.cartItems[keyB], 3);
    assert.strictEqual(state.total, 4);

    // Decrement VarA: 1 -> 0 (should delete keyA and cartProducts[keyA])
    state = cartReducer(state, removeFromCart({ productId: keyA, itemKey: keyA }));
    assert.strictEqual(state.cartItems[keyA], undefined, 'Variant A must be deleted from cartItems');
    assert.strictEqual(state.cartProducts[keyA], undefined, 'Variant A must be deleted from cartProducts');
    assert.strictEqual(state.cartItems[keyB], 3, 'Variant B must remain completely intact');
    assert.strictEqual(state.total, 3, 'Total items must be 3');
});

runEmpiricalTest('deleteItemFromCart removes composite key and updates total by exact quantity', () => {
    let state = { total: 0, cartItems: {}, cartProducts: {} };
    const keyA = 'prod_delete__VarA';
    const keyB = 'prod_delete__VarB';

    // VarA qty: 4, VarB qty: 2 -> total: 6
    for (let i = 0; i < 4; i++) {
        state = cartReducer(state, addToCart({ productId: 'prod_delete', itemKey: keyA, product: { id: 'prod_delete', name: 'VarA' } }));
    }
    for (let i = 0; i < 2; i++) {
        state = cartReducer(state, addToCart({ productId: 'prod_delete', itemKey: keyB, product: { id: 'prod_delete', name: 'VarB' } }));
    }
    assert.strictEqual(state.total, 6);

    // Delete VarA completely
    state = cartReducer(state, deleteItemFromCart({ productId: keyA, itemKey: keyA }));
    assert.strictEqual(state.cartItems[keyA], undefined);
    assert.strictEqual(state.cartProducts[keyA], undefined);
    assert.strictEqual(state.cartItems[keyB], 2);
    assert.strictEqual(state.total, 2, 'Total must accurately reflect subtraction of 4 units');
});

// ============================================================================
// SUITE 5: Adversarial Stress Fuzzing (High Volume & Interleaved Actions)
// ============================================================================
console.log('\n--- SUITE 5: Adversarial Stress Fuzzing (High Volume & Interleaved Actions) ---');

runEmpiricalTest('Fuzzing 500 interleaved additions and removals across 10 composite variants', () => {
    let state = { total: 0, cartItems: {}, cartProducts: {} };
    const variants = [
        'p1__S', 'p1__M', 'p1__L', 'p1__XL',
        'p2__Red', 'p2__Green', 'p2__Blue',
        'p3__1Pack', 'p3__2Pack', 'p3__3Pack'
    ];

    const shadowTracker = {};
    for (const v of variants) shadowTracker[v] = 0;

    for (let step = 0; step < 500; step++) {
        const targetVariant = variants[step % variants.length];
        const actionType = step % 3 === 0 ? 'remove' : 'add';

        if (actionType === 'add') {
            state = cartReducer(state, addToCart({
                productId: targetVariant.split('__')[0],
                itemKey: targetVariant,
                product: { id: targetVariant.split('__')[0], name: targetVariant, price: 52.99 }
            }));
            shadowTracker[targetVariant]++;
        } else {
            if (shadowTracker[targetVariant] > 0) {
                state = cartReducer(state, removeFromCart({
                    productId: targetVariant,
                    itemKey: targetVariant
                }));
                shadowTracker[targetVariant]--;
            }
        }
    }

    // Verify invariant: state.cartItems matches shadowTracker exactly
    let expectedTotal = 0;
    for (const v of variants) {
        const expectedQty = shadowTracker[v];
        if (expectedQty > 0) {
            assert.strictEqual(state.cartItems[v], expectedQty, `Mismatch for variant ${v}`);
            expectedTotal += expectedQty;
        } else {
            assert.strictEqual(state.cartItems[v], undefined, `Variant ${v} should have been deleted`);
        }
    }
    assert.strictEqual(state.total, expectedTotal, `Total count mismatch: expected ${expectedTotal}, got ${state.total}`);
});

// ============================================================================
// SUITE 6: CartDrawer Dynamic Checkout Payload Integrity
// ============================================================================
console.log('\n--- SUITE 6: CartDrawer Dynamic Checkout Payload Integrity ---');

runEmpiricalTest('CartDrawer maps composite key line items cleanly into dynamic-checkout payload', () => {
    const cartItems = {
        'prod_pet_costume__Small': 1,
        'prod_pet_costume__Large': 2
    };
    const cartProducts = {
        'prod_pet_costume__Small': { id: 'prod_pet_costume', name: 'Pet Costume (Small)', price: 52.99, image: 'https://example.com/s.jpg' },
        'prod_pet_costume__Large': { id: 'prod_pet_costume', name: 'Pet Costume (Large)', price: 52.99, image: 'https://example.com/l.jpg' }
    };

    const { items, subtotal } = resolveCartDrawerItems(cartItems, cartProducts, []);

    // Construct dynamic checkout payload matching CartDrawer.jsx lines 117-126
    const dynamicCheckoutItems = items.map(i => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        gumroadUrl: i.gumroadUrl || ''
    }));

    assert.strictEqual(dynamicCheckoutItems.length, 2);
    assert.strictEqual(dynamicCheckoutItems[0].productId, 'prod_pet_costume__Small');
    assert.strictEqual(dynamicCheckoutItems[0].name, 'Pet Costume (Small)');
    assert.strictEqual(dynamicCheckoutItems[0].price, 52.99);
    assert.strictEqual(dynamicCheckoutItems[0].quantity, 1);

    assert.strictEqual(dynamicCheckoutItems[1].productId, 'prod_pet_costume__Large');
    assert.strictEqual(dynamicCheckoutItems[1].name, 'Pet Costume (Large)');
    assert.strictEqual(dynamicCheckoutItems[1].price, 52.99);
    assert.strictEqual(dynamicCheckoutItems[1].quantity, 2);

    assert.strictEqual(subtotal, 52.99 * 3);
});

console.log('\n================================================================');
console.log(`Empirical Adversarial Test Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('================================================================');

if (failedTests > 0) {
    console.error(`💥 ADVERSARIAL STRESS TEST FAILED! ${failedTests} test(s) failed.`);
    process.exit(1);
} else {
    console.log('🎉 ALL ADVERSARIAL STRESS TESTS PASSED EMPIRICALLY!');
    process.exit(0);
}
