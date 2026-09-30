"use client";

import { ReactNode } from "react";
import { TaxpayerSidebar } from "./TaxpayerSidebar";
import { TaxpayerTopBar } from "./TaxpayerTopBar";
import { TaxpayerBottomNav } from "./TaxpayerBottomNav";

interface TaxpayerLayoutProps {
  children: ReactNode;
}

export function TaxpayerLayout({
  children,
}: TaxpayerLayoutProps) {
  return (
    <div className="galii-root flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <TaxpayerSidebar />

      {/* Main Application Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <TaxpayerTopBar />

        {/* Page Content */}
        <main className="min-w-0 flex-1 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <TaxpayerBottomNav />
    </div>
  );
}