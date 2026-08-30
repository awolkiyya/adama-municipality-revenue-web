"use client";

import { ReactNode } from "react";

import { usePermission } from "@/hooks/usePermission";
import { PermissionAction } from "@/types/user";

interface CanProps {
  resource: string;
  action: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function Can({
  resource,
  action,
  children,
  fallback = null,
}: CanProps) {
  const { can } = usePermission();

  if (!can(resource, action)) {
    return fallback;
  }

  return children;
}