"use client";

import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { PAGE_META } from "./data";
import type { TabKey } from "./types";

interface TopBarProps {
  tab: TabKey;
  onPayNow: () => void;
}

export function TopBar({ tab, onPayNow }: TopBarProps) {
  return (
    <header className="h-16 shrink-0 sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 backdrop-blur-md border-b">
      <div>
        <h2 className="font-semibold text-[15px] leading-tight galii-serif">
          {PAGE_META[tab].title}
        </h2>
        <p className="text-[11px] text-[var(--galii-text-muted)] leading-tight mt-0.5">
          {PAGE_META[tab].sub}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="hidden sm:flex border-[var(--galii-border)] text-[var(--galii-text-muted)]"
        >
          <Search className="h-4 w-4" />
        </Button>

        <ThemeToggle />

        <Button
          size="sm"
          className="bg-[var(--galii-gold)] text-[var(--galii-primary-dark)] hover:bg-[var(--galii-gold-light)] font-semibold galii-tap"
          onClick={onPayNow}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Pay now
        </Button>
      </div>
    </header>
  );
}