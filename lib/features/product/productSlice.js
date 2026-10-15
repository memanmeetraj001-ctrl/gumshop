import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Async thunk: always fetch from /api/products (Supabase-backed) so Redux
// holds authoritative prices — never stale localStorage or storePresets data.
export const fetchProducts = createAsyncThunk('product/fetchProducts', async () => {
    try {
        const res = await fetch('/api/products');
        if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.products)) {
                return data.products;
            }
        }
    } catch (e) {
        console.warn('fetchProducts error:', e);
    }
    return [];
});

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: [],
        status: 'idle',
    },
    reducers: {
        setProduct: (state, action) => {
            state.list = Array.isArray(action.payload) ? action.payload : []
        },
        clearProduct: (state) => {
            state.list = []
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading'
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.list = Array.isArray(action.payload) ? action.payload : []
                state.status = 'succeeded'
            })
            .addCase(fetchProducts.rejected, (state) => {
                state.status = 'failed'
            })
    }
})

export const { setProduct, clearProduct } = productSlice.actions

export default productSlice.reducer