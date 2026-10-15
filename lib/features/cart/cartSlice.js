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
            if (!action || !action.payload) return;
            const { productId, product, itemKey: customKey, quantity = 1 } = action.payload;
            const pid = productId || product?.id;
            if (!pid) return;
            if (!state.cartItems || typeof state.cartItems !== 'object') state.cartItems = {};
            if (!state.cartProducts || typeof state.cartProducts !== 'object') state.cartProducts = {};

            const key = customKey || (product?.variant ? `${pid}__${product.variant}` : pid);
            const addQty = Math.max(1, parseInt(quantity || 1) || 1);
            if (state.cartItems[key]) {
                state.cartItems[key] += addQty;
            } else {
                state.cartItems[key] = addQty;
            }
            if (product) {
                const normalizedImage = product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null);
                state.cartProducts[key] = {
                    ...product,
                    id: pid,
                    price: parseFloat(product.price !== undefined && product.price !== null ? product.price : 0) || 0,
                    ...(normalizedImage ? { image: normalizedImage } : {})
                };
            }
            state.total = Object.values(state.cartItems).reduce((sum, q) => sum + (Number(q) || 0), 0);
        },
        removeFromCart: (state, action) => {
            if (!action || !action.payload) return;
            if (!state.cartItems || typeof state.cartItems !== 'object') state.cartItems = {};
            if (!state.cartProducts || typeof state.cartProducts !== 'object') state.cartProducts = {};

            const key = action.payload.itemKey || action.payload.productId;
            if (key && state.cartItems[key]) {
                state.cartItems[key]--;
                if (state.cartItems[key] <= 0) {
                    delete state.cartItems[key];
                    delete state.cartProducts[key];
                }
            }
            state.total = Object.values(state.cartItems).reduce((sum, q) => sum + (Number(q) || 0), 0);
        },
        deleteItemFromCart: (state, action) => {
            if (!action || !action.payload) return;
            if (!state.cartItems || typeof state.cartItems !== 'object') state.cartItems = {};
            if (!state.cartProducts || typeof state.cartProducts !== 'object') state.cartProducts = {};

            const key = action.payload.itemKey || action.payload.productId;
            if (key) {
                delete state.cartItems[key];
                delete state.cartProducts[key];
            }
            state.total = Object.values(state.cartItems).reduce((sum, q) => sum + (Number(q) || 0), 0);
        },
        clearCart: (state) => {
            state.cartItems = {};
            state.cartProducts = {};
            state.total = 0;
        },
        setCart: (state, action) => {
            if (!action || !action.payload) return;
            state.cartItems = (action.payload.cartItems && typeof action.payload.cartItems === 'object') ? action.payload.cartItems : {};
            const rawProducts = (action.payload.cartProducts && typeof action.payload.cartProducts === 'object') ? action.payload.cartProducts : {};
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
            state.total = Object.values(state.cartItems).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
        },
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart, setCart } = cartSlice.actions

export default cartSlice.reducer
