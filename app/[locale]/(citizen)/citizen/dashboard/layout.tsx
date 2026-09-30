"use client";

import { TaxpayerLayout } from "@/components/taxpayer/layout/TaxpayerLayout";
import { AuthProvider } from "@/providers/AuthProvider";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>

          {/* PAGE CONTENT */}
          <main className="flex-1 bg-muted/20">
          <TaxpayerLayout>

            {children}

            </TaxpayerLayout>

          </main>
    </AuthProvider>
  );
}
