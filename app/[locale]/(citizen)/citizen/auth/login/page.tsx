"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Landmark } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Locale } from "next-intl";
import { AuthHeader } from "@/components/banner/AuthHeader";


export default function LoginPage() {

  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      {/* Faint ledger-line watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, hsl(var(--foreground)) 0px, hsl(var(--foreground)) 1px, transparent 1px, transparent 40px)",
        }}
      />

      {/* Sticky blurred header */}
      <AuthHeader/>

      {/* Centered form — original layout preserved, just sitting below the header */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}