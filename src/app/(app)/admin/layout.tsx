import { headers } from "next/headers";
import type { User } from "better-auth";
import { auth } from "@/server/lib/auth";
import { getAdminMobileTabs } from "@/lib/config/admin-tabs";
import { MobileAdminSubtabs } from "@/components/mobile-admin-subtabs";

type AppUser = User & { role?: string | null };

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error("[admin/layout] failed to get session", error);
  }

  const tabs = getAdminMobileTabs(session?.user as AppUser | undefined);

  return (
    <>
      <MobileAdminSubtabs tabs={tabs} />
      <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
    </>
  );
}
