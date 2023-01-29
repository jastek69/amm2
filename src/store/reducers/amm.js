import { createSlice } from '@reduxjs/toolkit'

export const amm = createSlice({ // creates the actions
    name: 'amm',
    initialState: {
        contract: null,
        shares: 0,
        swaps: []
        },
    reducers: {
    // trigger an action, action will have a function argument and that argument will update the state
        setContract: (state, action) => {
            state.contract = action.payload
        },
        sharesLoaded: (state, action) => {
            state.shares = action.payload
        }   
    }
})

export const { setContract, sharesLoaded } = amm.actions;

export default amm.reducer;
