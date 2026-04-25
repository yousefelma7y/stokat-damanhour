"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { ReactNode } from "react";

interface WholesalePriceGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function WholesalePriceGuard({
  children,
  fallback = null,
}: WholesalePriceGuardProps) {
  const { canViewWholesalePrice, loading } = usePermissions();

  if (loading) return null; // or a skeleton

  if (canViewWholesalePrice()) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
