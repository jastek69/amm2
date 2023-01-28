import { createSlice } from '@reduxjs/toolkit'

export const tokens = createSlice({ // creates the actions
    name: 'tokens',
    initialState: {
        contracts: [],
        symbols: [],
        balances: [0, 0]
    },
    reducers: {
    // trigger an action, action will have a function argument and that argument will update the state
        setContracts: (state, action) => {
            state.contracts = action.payload
        },
        setSymbols: (state, action) => {
            state.symbols = action.payload
        },
        balancesLoaded: (state, action) => {
            state.balances = action.payload
        }
    }
})

export const { setContracts, setSymbols, balancesLoaded } = tokens.actions;

export default tokens.reducer;
