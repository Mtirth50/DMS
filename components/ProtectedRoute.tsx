"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Make sure this is a default export
export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (adminOnly && !user.isAdmin) {
      router.push("/unauthorized");
    }
  }, [user, router, adminOnly]);

  if (!user || (adminOnly && !user.isAdmin)) {
    return null; // or return a loading spinner
  }

  return <>{children}</>;
}