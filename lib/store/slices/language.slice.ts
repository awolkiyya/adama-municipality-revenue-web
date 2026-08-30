import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type LanguageCode = "en" | "am" | "or";

interface LanguageState {
  current: LanguageCode;
}

// -----------------------------
// Hydration from localStorage
// -----------------------------
const getInitialLanguage = (): LanguageCode => {
  if (typeof window === "undefined") return "en";

  const saved = localStorage.getItem("language");
  if (saved === "en" || saved === "am" || saved === "or") {
    return saved;
  }

  return "en";
};

const initialState: LanguageState = {
  current: getInitialLanguage(),
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<LanguageCode>) {
      state.current = action.payload;

      // persist
      if (typeof window !== "undefined") {
        localStorage.setItem("language", action.payload);
      }
    },

    resetLanguage(state) {
      state.current = "en";

      if (typeof window !== "undefined") {
        localStorage.removeItem("language");
      }
    },
  },
});

export const { setLanguage, resetLanguage } = languageSlice.actions;
export default languageSlice.reducer;