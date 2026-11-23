"use client";

import { LoginForm } from "@/components/login-form";
import { AuthHeader } from "@/components/banner/AuthHeader";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh w-full flex-col bg-background">

      {/* Background watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, hsl(var(--foreground)) 0px, hsl(var(--foreground)) 1px, transparent 1px, transparent 40px)",
        }}
      />

      {/* Full-width header */}
      <header className="sticky top-0 z-50 w-full">
        <AuthHeader />
      </header>

      {/* Login form */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </main>

    </div>
  );
}