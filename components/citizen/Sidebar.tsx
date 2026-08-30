"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NAV_ITEMS, CURRENT_CITIZEN } from "./data";
import { getInitials } from "./utils";
import type { TabKey } from "./types";

interface SidebarContentProps {
  activeTab: TabKey;
  onNavigate: (key: TabKey) => void;
  unreadNotifications: number;
}

export function SidebarContent({ activeTab, onNavigate, unreadNotifications }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* BRAND */}
      <div className="flex items-center gap-2.5 px-1 pb-5">
        <div className="w-9 h-9 rounded-[10px] bg-[var(--galii-gold)] text-[var(--galii-primary-dark)] flex items-center justify-center font-bold text-base shrink-0 galii-serif">
          ገ
        </div>
        <div>
          <div className="font-bold text-[15px] leading-tight galii-serif">Galii Kiyya</div>
          <div className="text-[9px] tracking-[0.14em] text-white/60 font-semibold mt-0.5">
            CITIZEN PORTAL
          </div>
        </div>
      </div>

      <div
        className="h-[2px] mb-5 rounded-full opacity-70"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--galii-gold) 0 8px, transparent 8px 16px)",
        }}
      />

      <div className="text-[10px] font-bold tracking-[0.12em] text-white/40 px-2.5 mb-2 uppercase">
        Menu
      </div>

      <div className="space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;

          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`galii-nav-btn relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[11px] text-[13.5px] text-left ${
                active
                  ? "bg-white/15 text-white font-semibold"
                  : "text-white/75 hover:bg-white/5 hover:text-white font-medium"
              }`}
            >
              {active && (
                <span className="absolute -left-5 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-[3px] bg-[var(--galii-gold)]" />
              )}

              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{label}</span>

              {key === "notifications" && unreadNotifications > 0 && (
                <span className="min-w-5 h-5 px-1 rounded-full bg-[var(--galii-danger)] text-white text-[9px] flex items-center justify-center font-bold">
                  {unreadNotifications}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <Avatar className="h-8 w-8 ring-2 ring-[var(--galii-gold)]/60 ring-offset-2 ring-offset-[var(--galii-primary-dark)]">
            <AvatarFallback className="bg-[var(--galii-gold)] text-[var(--galii-primary-dark)] font-bold text-[12px]">
              {getInitials(CURRENT_CITIZEN.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-white truncate">
              {CURRENT_CITIZEN.full_name}
            </div>
            <div className="text-[10px] text-white/55 galii-mono truncate">
              {CURRENT_CITIZEN.citizen_uid}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
