import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAllProducts } from '@/lib/firebaseDb'

// Async thunk to fetch products from database
export const fetchProducts = createAsyncThunk('product/fetchProducts', async () => {
    try {
        const products = await getAllProducts();
        if (products && Array.isArray(products)) {
            return products;
        }
    } catch (e) {
        console.warn('Database products fetch notice:', e);
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