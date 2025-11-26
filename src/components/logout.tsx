"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import type { ReactNode } from "react";

export default function SignOutButton({ className, children }: { className?: string; children?: ReactNode }) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <Button onClick={handleSignOut} className={className}>
      {children || "退出登录"}
    </Button>
  );
}
