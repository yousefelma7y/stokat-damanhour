"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ProtectedPageProps {
  children: ReactNode;
  page: string;
}

export default function ProtectedPage({ children, page }: ProtectedPageProps) {
  const { canAccessPage, loading, role } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role) {
      if (!canAccessPage(page)) {
        router.push("/dashboard");
      }
    } else if (!loading && !role) {
      router.push("/signin");
    }
  }, [loading, role, page, canAccessPage, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!role || !canAccessPage(page)) {
    return null; // Don't show content while redirecting
  }

  return <>{children}</>;
}
