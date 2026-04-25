"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  UserRole,
  getPermissions,
  canAccessPage,
  canPerformAction,
  canViewWholesalePrice,
  PagePermission,
} from "@/lib/permissions";

export function usePermissions() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app you might validate this with an API call or check expiration
    // but for now we trust the cookie or default to empty
    const userRole = Cookies.get("role") as UserRole;
    setRole(userRole || null);
    setLoading(false);
  }, []);

  const permissions = role ? getPermissions(role) : null;

  return {
    role,
    loading,
    permissions,
    canAccessPage: (page: string) => (role ? canAccessPage(role, page) : false),
    canPerformAction: (
      page: string,
      action: "view" | "create" | "edit" | "delete",
    ) => (role ? canPerformAction(role, page, action) : false),
    canViewWholesalePrice: () => (role ? canViewWholesalePrice(role) : false),
    getPagePermissions: (page: string): PagePermission | null =>
      permissions?.pages[page] || null,
  };
}
