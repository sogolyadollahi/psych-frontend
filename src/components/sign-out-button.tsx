"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function SignOutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  function handleSignOut() {
    logout();
    router.replace("/login");
  }

  return (
    <button className="nav-item muted sign-out-button" type="button" onClick={handleSignOut}>
      <LogOut size={18} />
      <span>Sign out</span>
    </button>
  );
}
