// providers/theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      // ✅ Tells next-themes to use a <template> tag instead of <script>
      nonce=""
    >
      {children}
    </NextThemesProvider>
  );
}