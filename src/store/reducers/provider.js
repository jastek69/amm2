import { createSlice } from '@reduxjs/toolkit'

export const provider = createSlice({ // creates the actions
    name: 'provider',
    initialState: {
        connection: null,
        chainId: null,
        account: null
    },
    reducers: {
    // trigger an action, action will have a function argument and that argument will update the state
        setProvider: (state, action) => {
            state.connection = action.payload
        },
        setNetwork: (state, action) => {
            state.chainId = action.payload
        },
        setAccount: (state, action) => { // tells Redux what happens whenever we set an account
            state.account = action.payload
        }
    }
})

export const { setProvider, setNetwork, setAccount } = provider.actions;

export default provider.reducer;
