"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, UserX, Lock } from "lucide-react";
import { DotField } from "@/components/design/DotField";

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();

  const reason = searchParams.get("reason");
  const role = searchParams.get("role");
  const path = searchParams.get("path");

  const getMessage = () => {
    switch (reason) {
      case "not_authenticated":
        return "You must be logged in to access this system.";
      case "invalid_role":
        return "Your account role is not recognized by the system.";
      case "access_denied":
        return "You do not have permission to access this resource.";
      default:
        return "Access to this page is restricted.";
    }
  };

  const getIcon = () => {
    switch (reason) {
      case "not_authenticated":
        return <Lock className="h-10 w-10 text-red-500" />;
      case "invalid_role":
        return <UserX className="h-10 w-10 text-red-500" />;
      default:
        return <ShieldAlert className="h-10 w-10 text-red-500" />;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <DotField/>

      <div className="text-center max-w-md space-y-6 animate-fade-in">

        {/* ICON */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 border">
          {getIcon()}
        </div>

        {/* TITLE */}
        <h1 className="text-3xl font-bold tracking-tight">
          Access Restricted
        </h1>

        {/* MESSAGE */}
        <p className="text-sm text-muted-foreground">
          {getMessage()}
        </p>

        {/* DEBUG INFO (useful for admin system) */}
        {(role || path) && (
          <div className="text-xs text-muted-foreground space-y-1 border rounded-lg p-3 bg-muted/30">
            {role && <p>Role: <b>{role}</b></p>}
            {path && <p>Path: <b>{path}</b></p>}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>

          <Link href="/dashboard">
            <Button className="gap-2">
              Go to Dashboard
            </Button>
          </Link>

        </div>

        {/* FOOTER */}
        <div className="pt-6 border-t text-xs text-muted-foreground">
          Adama City Commercial Enforcement System
        </div>

      </div>
    </div>
  );
}