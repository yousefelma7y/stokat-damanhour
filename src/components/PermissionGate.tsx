"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { ReactNode } from "react";

interface PermissionGateProps {
  children: ReactNode;
  page: string;
  action: "view" | "create" | "edit" | "delete";
  fallback?: ReactNode;
}

export default function PermissionGate({
  children,
  page,
  action,
  fallback = null,
}: PermissionGateProps) {
  const { canPerformAction, loading, role } = usePermissions();

  if (loading) return null;
  // If no role logic is set yet, maybe hide or show? Assuming secure by default: hide
  if (!role) return <>{fallback}</>;

  if (canPerformAction(page, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
