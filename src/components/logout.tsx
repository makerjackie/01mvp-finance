"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import type { ComponentProps, ReactNode } from "react";

type SignOutButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  children?: ReactNode;
};

export default function SignOutButton({ className, children, ...props }: SignOutButtonProps) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <Button onClick={handleSignOut} className={className} {...props}>
      {children || "退出登录"}
    </Button>
  );
}
