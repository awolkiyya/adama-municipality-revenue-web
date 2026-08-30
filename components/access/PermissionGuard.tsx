"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import { PermissionAction } from "@/types/user";

interface PermissionGuardProps {
  resource: string;
  action: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGuard({
  resource,
  action,
  children,
  fallback,
}: PermissionGuardProps) {
  const router = useRouter();

  const { can } = usePermission();

  if (!can(resource, action)) {
    if (fallback) {
      return fallback;
    }

    router.replace("/unauthorized");

    return null;
  }

  return children;
}

