import { configureStore } from '@reduxjs/toolkit'

import provider from './reducers/provider'
import tokens from './reducers/tokens'
import amm2 from './reducers/amm2'

export const store = configureStore({
    reducer: {
        provider,
        tokens,
        amm2
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: false
        })   
})
