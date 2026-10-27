"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PartnerSuspensionNotice } from "@/components/partner-suspension-notice";
import { useMockAuth } from "@/lib/mock-auth";
// This layout guard covers every Partner page, including nested detail routes.
export function PartnerAccessGuard({ children }) {
    const { user, isReady, partnerApplication } = useMockAuth();
    const pathname = usePathname();
    if (!isReady)
        return <p className="p-6 text-sm text-ink-secondary">Loading Partner access...</p>;
    if (user && partnerApplication?.status === "SUSPENDED") {
        return <main className="min-h-dvh bg-canvas p-6"><PartnerSuspensionNotice application={partnerApplication}/></main>;
    }
    if (!user || !user.isPartner) {
        return (<main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-semibold">{user ? "Approved Partner access required" : "Log in to the Partner Portal"}</h1>
        <p className="mt-3 text-sm text-ink-secondary">Partner access is an additional capability on your Normal User account.</p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-primary">
          <Link href={user ? "/partner-application" : `/login?returnTo=${encodeURIComponent(pathname)}`}>{user ? "View Application Status" : "Log In"}</Link>
          <Link href="/">Back to RoomStay Home</Link>
        </div>
      </main>);
    }
    return children;
}
