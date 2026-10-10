import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
        cartProducts: {},
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId, product, itemKey: customKey } = action.payload;
            const key = customKey || (product?.variant ? `${productId}__${product.variant}` : productId);
            if (state.cartItems[key]) {
                state.cartItems[key]++;
            } else {
                state.cartItems[key] = 1;
            }
            if (product) {
                const normalizedImage = product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null);
                state.cartProducts[key] = {
                    ...product,
                    ...(normalizedImage ? { image: normalizedImage } : {})
                };
            }
            state.total += 1;
        },
        removeFromCart: (state, action) => {
            const key = action.payload.itemKey || action.payload.productId;
            if (state.cartItems[key]) {
                state.cartItems[key]--;
                state.total = Math.max(0, state.total - 1);
                if (state.cartItems[key] <= 0) {
                    delete state.cartItems[key];
                    delete state.cartProducts[key];
                }
            }
        },
        deleteItemFromCart: (state, action) => {
            const key = action.payload.itemKey || action.payload.productId;
            const count = state.cartItems[key] || 0;
            state.total = Math.max(0, state.total - count);
            delete state.cartItems[key];
            delete state.cartProducts[key];
        },
        clearCart: (state) => {
            state.cartItems = {};
            state.cartProducts = {};
            state.total = 0;
        },
        setCart: (state, action) => {
            state.cartItems = action.payload.cartItems || {};
            const rawProducts = action.payload.cartProducts || {};
            const normalizedProducts = {};
            for (const [k, p] of Object.entries(rawProducts)) {
                if (p) {
                    const normalizedImage = p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null);
                    normalizedProducts[k] = {
                        ...p,
                        ...(normalizedImage ? { image: normalizedImage } : {})
                    };
                }
            }
            state.cartProducts = normalizedProducts;
            const count = Object.values(state.cartItems).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
            state.total = count;
        },
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart, setCart } = cartSlice.actions

export default cartSlice.reducer
