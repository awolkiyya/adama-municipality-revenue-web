import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/user.slice"
import languageReducer from "./slices/language.slice"


export const store = configureStore({
  reducer: {
    auth: authReducer,
    language:languageReducer
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch