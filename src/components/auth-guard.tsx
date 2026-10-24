"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isReady, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace("/login");
  }, [isReady, isAuthenticated, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <main className="auth-loading">
        <span className="auth-spinner" />
        <p>Checking your session…</p>
      </main>
    );
  }

  return children;
}
