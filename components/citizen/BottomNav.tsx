"use client";

import { NAV_ITEMS } from "./data";
import type { TabKey } from "./types";

interface BottomNavProps {
  tab: TabKey;
  onNavigate: (key: TabKey) => void;
  unreadNotifications: number;
}

export function BottomNav({ tab, onNavigate, unreadNotifications }: BottomNavProps) {
  const activeIndex = NAV_ITEMS.findIndex((item) => item.key === tab);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-[68px] pb-2 bg-white/95 backdrop-blur-md border-t border-[var(--galii-border)] flex z-30">
      <div
        className="absolute top-1.5 h-[3px] w-[20%] rounded-full bg-[var(--galii-primary)] transition-all duration-300 ease-out"
        style={{ left: `${activeIndex * 20}%` }}
      />

      {NAV_ITEMS.map(({ key, short, icon: Icon }) => {
        const active = tab === key;

        return (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={`galii-nav-btn relative flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${
              active ? "text-[var(--galii-primary)]" : "text-[var(--galii-text-faint)]"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />

            {key === "notifications" && unreadNotifications > 0 && (
              <span className="absolute top-2 right-1/2 translate-x-4 w-4 h-4 rounded-full bg-[var(--galii-danger)] text-white text-[9px] flex items-center justify-center font-bold">
                {unreadNotifications}
              </span>
            )}

            {short}
          </button>
        );
      })}
    </nav>
  );
}
