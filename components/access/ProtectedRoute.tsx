"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { PermissionAction } from "@/types/user";

interface ProtectedRouteProps {
  children: ReactNode;

  resource?: string;

  action?: PermissionAction;

  roles?: string[];
}

export default function ProtectedRoute({
  children,
  resource,
  action,
  roles,
}: ProtectedRouteProps) {
  const router = useRouter();

  const {
    can,
    hasAnyRole,
  } = usePermission();

  const {
    user,
    isAuthenticated,
    isLoading,
  } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (isLoading) return;

    /*
    |--------------------------------------------------------------------------
    | Authentication Check
    |--------------------------------------------------------------------------
    */

    if (!user || !isAuthenticated) {
      router.replace("/login");
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Permission Check
    |--------------------------------------------------------------------------
    */

    if (
      resource &&
      action &&
      !can(resource, action)
    ) {
      router.replace("/unauthorized");
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Role Check
    |--------------------------------------------------------------------------
    */

    if (
      roles &&
      roles.length > 0 &&
      !hasAnyRole(roles)
    ) {
      router.replace("/unauthorized");
      return;
    }
  }, [
    user,
    isAuthenticated,
    isLoading,
    resource,
    action,
    roles,
    can,
    hasAnyRole,
    router,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-5 animate-in fade-in duration-500">
          {/* Layered spinner */}
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-4 border-muted/40" />

            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin" />

            <div
              className="absolute inset-2 rounded-full border-2 border-transparent border-t-primary/40 animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.2s",
              }}
            />
          </div>

          {/* Text */}
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground tracking-tight">
              Preparing your workspace
            </p>

            <p className="text-xs text-muted-foreground max-w-[220px]">
              This will only take a moment
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return children;
}
