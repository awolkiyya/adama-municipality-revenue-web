"use client";

import React from "react";
import {
  Construction,
  FileUp,
  List,
  Sparkles,
  UserPlus,
} from "lucide-react";

import Link from "next/link";

import { useSelector } from "react-redux";

import { RootState } from "@/lib/store/store";

import ProtectedRoute from "@/components/access/ProtectedRoute";
import Can from "@/components/access/Can";

import { Button } from "@/components/ui/button";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function DashboardContent() {
  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 text-center">
      <div className="relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">

        {/* Greeting */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-sidebar-border bg-sidebar-accent/40 px-3 py-1 mb-6">
          <Sparkles className="size-3.5 text-primary" />

          <span className="text-xs font-medium text-sidebar-foreground/70">
            {getGreeting()}
            {user?.name ? `, ${user.name}` : ""}
          </span>
        </div>

        {/* Icon */}
        <div className="relative flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-sidebar-accent/70 to-sidebar-accent/20 border border-sidebar-border shadow-sm">
          <Construction
            className="size-9 text-sidebar-foreground/70"
            strokeWidth={1.5}
          />
        </div>

        {/* Heading */}
        <h2 className="mt-6 text-xl font-semibold tracking-tight text-sidebar-foreground">
          {user?.role
            ? `${user.role.label} Dashboard`
            : "Dashboard"}
        </h2>

        {/* Status */}
        <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5">
          <span className="size-1.5 rounded-full bg-primary" />

          <span className="text-xs font-medium text-primary">
            In development
          </span>
        </div>

        {/* Description */}
        <p className="mt-4 text-sm text-sidebar-foreground/60 max-w-sm leading-relaxed">
          We&apos;re building something great for you.
          This space will be ready soon — check back
          shortly for updates.
        </p>

        {/* Taxpayer Actions */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">

          {/* View Taxpayers */}
          <Can
            resource="citizens"
            action="read"
          >
            <Button asChild>
              <Link href="/citizens">
                <List className="mr-2 size-4" />
                View Taxpayers
              </Link>
            </Button>
          </Can>

          {/* Register Taxpayer */}
          <Can
            resource="citizens"
            action="create"
          >
            <Button
              asChild
              variant="outline"
            >
              <Link href="/citizens/create">
                <UserPlus className="mr-2 size-4" />
                Register Taxpayer
              </Link>
            </Button>
          </Can>

          {/* Import Taxpayers */}
          <Can
            resource="citizens"
            action="import"
          >
            <Button
              asChild
              variant="outline"
            >
              <Link href="/citizens/import">
                <FileUp className="mr-2 size-4" />
                Import Taxpayers
              </Link>
            </Button>
          </Can>

        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute
      resource="dashboard"
      action="view"
    >
      <DashboardContent />
    </ProtectedRoute>
  );
}
