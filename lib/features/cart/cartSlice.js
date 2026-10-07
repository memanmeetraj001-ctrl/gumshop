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
            const { productId, product } = action.payload;
            if (state.cartItems[productId]) {
                state.cartItems[productId]++;
            } else {
                state.cartItems[productId] = 1;
            }
            if (product) {
                state.cartProducts[productId] = product;
            }
            state.total += 1;
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload;
            if (state.cartItems[productId]) {
                state.cartItems[productId]--;
                state.total = Math.max(0, state.total - 1);
                if (state.cartItems[productId] <= 0) {
                    delete state.cartItems[productId];
                    delete state.cartProducts[productId];
                }
            }
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload;
            const count = state.cartItems[productId] || 0;
            state.total = Math.max(0, state.total - count);
            delete state.cartItems[productId];
            delete state.cartProducts[productId];
        },
        clearCart: (state) => {
            state.cartItems = {};
            state.cartProducts = {};
            state.total = 0;
        },
        setCart: (state, action) => {
            state.cartItems = action.payload.cartItems || {};
            state.cartProducts = action.payload.cartProducts || {};
            const count = Object.values(state.cartItems).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
            state.total = count;
        },
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart, setCart } = cartSlice.actions

export default cartSlice.reducer
