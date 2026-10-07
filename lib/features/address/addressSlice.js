import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAddressesByUser } from '@/lib/firebaseDb'

export const fetchAddresses = createAsyncThunk('address/fetchAddresses', async (userId) => {
    return await getAddressesByUser(userId)
})

const addressSlice = createSlice({
    name: 'address',
    initialState: {
        list: [],
    },
    reducers: {
        addAddress: (state, action) => {
            if (action.payload) {
                state.list.push(action.payload)
            }
        },
        setAddresses: (state, action) => {
            state.list = Array.isArray(action.payload) ? action.payload : []
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchAddresses.fulfilled, (state, action) => {
            state.list = Array.isArray(action.payload) ? action.payload : []
        })
    }
})

export const { addAddress, setAddresses } = addressSlice.actions

export default addressSlice.reducer