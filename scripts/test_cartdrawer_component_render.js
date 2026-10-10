/**
 * Empirical React Component Stress Test for CartDrawer.jsx
 * Uses React 19 renderToString with Redux Provider to empirically verify
 * that CartDrawer renders without exceptions across extreme edge cases:
 * - Broken image URLs
 * - Null/undefined images
 * - Missing images array
 * - Multiple variant composite keys
 * - Missing cartProducts
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assert from 'assert';
import cartReducer from '../lib/features/cart/cartSlice.js';
import productReducer from '../lib/features/product/productSlice.js';
import CartDrawer from '../components/CartDrawer.jsx';

console.log('================================================================');
console.log('🧪 EMPIRICAL REACT COMPONENT RENDER TEST: CartDrawer.jsx');
console.log('================================================================\n');

function createMockStore(preloadedCartState, preloadedProductList = []) {
    return configureStore({
        reducer: {
            cart: cartReducer,
            product: productReducer
        },
        preloadedState: {
            cart: {
                total: preloadedCartState.total || 0,
                cartItems: preloadedCartState.cartItems || {},
                cartProducts: preloadedCartState.cartProducts || {}
            },
            product: {
                list: preloadedProductList
            }
        }
    });
}

function testRender(name, store, expectedSubstrings = []) {
    try {
        const html = renderToString(
            React.createElement(
                Provider,
                { store },
                React.createElement(CartDrawer, { isOpen: true, onClose: () => {} })
            )
        );

        assert(html, 'Rendered HTML must not be empty');
        for (const str of expectedSubstrings) {
            assert(html.includes(str), `HTML missing expected substring: "${str}"`);
        }
        console.log(`✅ [PASS] ${name}`);
        return html;
    } catch (err) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Error: ${err.message}`);
        console.error(err.stack);
        throw err;
    }
}

// Case 1: Empty cart rendering
const emptyStore = createMockStore({ total: 0, cartItems: {}, cartProducts: {} });
testRender('Empty CartDrawer renders cleanly without errors', emptyStore, [
    'Your cart is empty',
    'Start Shopping'
]);

// Case 2: Broken image URL & missing images item
const brokenImageStore = createMockStore({
    total: 2,
    cartItems: {
        'prod_broken': 1,
        'prod_no_img': 1
    },
    cartProducts: {
        'prod_broken': {
            id: 'prod_broken',
            name: 'Broken Image Item',
            price: 52.99,
            image: 'http://broken-insecure.com/does-not-exist.jpg'
        },
        'prod_no_img': {
            id: 'prod_no_img',
            name: 'Item With No Image Key',
            price: 52.99
            // image and images omitted
        }
    }
});
const brokenHtml = testRender(
    'CartDrawer renders broken image URL (sanitized to HTTPS) and missing image fallback',
    brokenImageStore,
    [
        'w-16 h-16 rounded-xl object-cover',
        'Broken Image Item',
        'Item With No Image Key',
        'https://broken-insecure.com/does-not-exist.jpg',
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30'
    ]
);
assert(!brokenHtml.includes('size-18'), 'Rendered HTML must not contain invalid size-18');

// Case 3: Multiple variant combinations
const variantsStore = createMockStore({
    total: 3,
    cartItems: {
        'costume_1__Small': 1,
        'costume_1__Large': 2
    },
    cartProducts: {
        'costume_1__Small': {
            id: 'costume_1',
            name: 'Phantom Costume (Small)',
            price: 52.99,
            image: 'https://example.com/small.jpg'
        },
        'costume_1__Large': {
            id: 'costume_1',
            name: 'Phantom Costume (Large)',
            price: 52.99,
            image: 'https://example.com/large.jpg'
        }
    }
});
testRender('CartDrawer renders multiple variants with individual line items & prices', variantsStore, [
    'Phantom Costume (Small)',
    'Phantom Costume (Large)',
    'https://example.com/small.jpg',
    'https://example.com/large.jpg',
    '$52.99',
    '$105.98'
]);

// Case 4: Composite keys with EMPTY cartProducts, resolving to parent catalog
const catalogFallbackStore = createMockStore(
    {
        total: 2,
        cartItems: {
            'parent_item__Variant1': 1,
            'parent_item__Variant2': 1
        },
        cartProducts: {} // completely empty cartProducts
    },
    [
        {
            id: 'parent_item',
            name: 'Catalog Parent Product',
            price: 52.99,
            image: 'https://example.com/parent.jpg'
        }
    ]
);
testRender(
    'CartDrawer resolves composite keys to parent catalog product when cartProducts is empty',
    catalogFallbackStore,
    [
        'Catalog Parent Product',
        'https://example.com/parent.jpg',
        '$52.99'
    ]
);

console.log('\n================================================================');
console.log('🎉 ALL CartDrawer SSR COMPONENT TESTS PASSED!');
console.log('================================================================');
