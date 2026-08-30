"use client";

import { useState } from "react";
import { SidebarContent } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { HomePanel } from "./panels/HomePanel";
import { InvoicesPanel } from "./panels/InvoicesPanel";
import { PaymentsPanel } from "./panels/PaymentsPanel";
import { NotificationsPanel } from "./panels/NotificationsPanel";
import { ProfilePanel } from "./panels/ProfilePanel";
import { INVOICES, NOTIFICATIONS } from "./data";
import type { TabKey } from "./types";

// Design tokens are imported once globally in app/globals.css.
// If you're not using the app/ files from this package, uncomment:
// import "../../styles/citizen-tokens.css";

export default function CitizenDashboard() {
  const [tab, setTab] = useState<TabKey>("home");

  const goTo = (key: TabKey) => {
    setTab(key);
  };

  const unpaidInvoices = INVOICES.filter((i) => i.status === "OVERDUE");
  const paidInvoices = INVOICES.filter((i) => i.status === "PAID");
  const totalOutstanding = unpaidInvoices.reduce((total, i) => total + i.paid_amount, 0);
  const unreadNotifications = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className="galii-root flex min-h-screen">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:sticky md:top-0 md:h-screen shrink-0 bg-gradient-to-b from-[var(--galii-primary)] to-[var(--galii-primary-dark)] galii-seal-texture text-white p-5">
        <SidebarContent activeTab={tab} onNavigate={goTo} unreadNotifications={unreadNotifications} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar tab={tab} onPayNow={() => goTo("invoices")} />

        <main className="flex-1  pb-24 md:pb-6 space-y-6 galii-scrollbar p-4 md:p-12" key={tab}>
          {tab === "home" && (
            <HomePanel
              onNavigate={goTo}
              totalOutstanding={totalOutstanding}
              unpaidCount={unpaidInvoices.length}
              paidCount={paidInvoices.length}
              totalInvoiceCount={INVOICES.length}
            />
          )}
          {tab === "invoices" && <InvoicesPanel />}
          {tab === "payments" && <PaymentsPanel />}
          {tab === "notifications" && <NotificationsPanel />}
          {tab === "profile" && <ProfilePanel />}
        </main>
      </div>

      <BottomNav tab={tab} onNavigate={goTo} unreadNotifications={unreadNotifications} />
    </div>
  );
}