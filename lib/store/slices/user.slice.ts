import { AuthUser } from "@/types/user"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // 🔥 IMPORTANT
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{ user: AuthUser; token: string }>
    ) => {
      state.user = action.payload.user
      state.isAuthenticated = true
      state.isLoading = false
    },

    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.isLoading = false
    },

    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
    },

    // 🔥 NEW: call this before /auth/me resolves
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
})

export const { setAuth, logout, setUser, setLoading } = authSlice.actions
export default authSlice.reducer