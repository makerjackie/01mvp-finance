import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 md:p-8">
      {/* Background Grid */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

      <div className="w-full max-w-[400px] space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg transition-opacity hover:opacity-80"
          >
            <LogoMark size={36} className="shadow-lg shadow-primary/20" priority />
          </Link>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl shadow-xl shadow-black/5">
          {children}
        </div>
      </div>
    </div>
  );
}
