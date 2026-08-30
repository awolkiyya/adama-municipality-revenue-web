// themeSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  compact: boolean;
}

const initialState: ThemeState = {
  mode: "light",
  compact: false,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },

    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },

    toggleCompact: (state) => {
      state.compact = !state.compact;
    },
  },
});

export const { setThemeMode, toggleTheme, toggleCompact } = themeSlice.actions;
export default themeSlice.reducer;