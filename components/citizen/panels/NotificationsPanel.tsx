"use client";

import { Bell, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { IconTile, SectionCard } from "../primitives";
import { NOTIFICATIONS } from "../data";

export function NotificationsPanel() {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <SectionCard
      title="Notifications"
      action={<span className="text-[11px] text-[var(--galii-text-muted)]">{unread} unread</span>}
    >
      <div className="space-y-2.5">
        {NOTIFICATIONS.map((notification) => {
          const warning = notification.kind === "WARNING";
          const success = notification.kind === "SUCCESS";

          return (
            <Card
              key={notification.id}
              className={`rounded-[14px] border-[var(--galii-border)] ${
                notification.unread ? "bg-[var(--galii-surface-muted)]" : ""
              }`}
            >
              <CardContent className="p-3.5 flex items-center gap-3">
                <IconTile
                  icon={warning ? Clock : success ? CheckCircle2 : Bell}
                  tone={warning ? "danger" : success ? "success" : "primary"}
                  size={10}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold">{notification.title}</p>
                    {notification.unread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--galii-primary)] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--galii-text-muted)] mt-0.5">{notification.message}</p>
                  <p className="text-[10.5px] text-[var(--galii-text-faint)] mt-1">{notification.time}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </SectionCard>
  );
}
