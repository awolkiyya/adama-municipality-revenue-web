
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const isThemeResolved = resolvedTheme !== undefined;

  return (
    <Button
      variant="outline"
      size="icon"
      className="border-[var(--galii-border)] text-[var(--galii-text-muted)]"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={
        isDark ? "Switch to light theme" : "Switch to dark theme"
      }
      suppressHydrationWarning
    >
      {isThemeResolved && isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
