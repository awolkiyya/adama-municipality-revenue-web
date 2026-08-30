"use client";

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
            {children}
          </main>
    </AuthProvider>
  );
}
