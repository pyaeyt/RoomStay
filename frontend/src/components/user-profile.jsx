"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icon } from "@/components/icon";
import { useMockAuth } from "@/lib/mock-auth";
const partnerLabels = {
    NONE: "Not applied",
    PENDING: "Pending",
    APPROVED: "Approved Partner",
    REJECTED: "Rejected",
    SUSPENDED: "Suspended",
};
const quickLinks = [
    { label: "My Bookings", href: "/bookings", icon: "room" },
    { label: "My Viewings", href: "/viewings", icon: "home" },
    { label: "Favorites", href: "/favorites", icon: "heart" },
    { label: "Messages", href: "/messages", icon: "messages" },
    { label: "Notifications", href: "/notifications", icon: "bell" },
];
export function UserProfile() {
    const router = useRouter();
    const { user, isReady, partnerApplication } = useMockAuth();
    useEffect(() => {
        if (isReady && !user)
            router.replace("/login?returnTo=/profile");
    }, [isReady, router, user]);
    if (!isReady || !user) {
        return <p role="status" className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">{isReady ? "Redirecting to login..." : "Loading your profile..."}</p>;
    }
    const phone = user.phone?.trim() || partnerApplication?.phone.trim();
    const partnerStatus = partnerApplication?.status ?? (user.isPartner ? "APPROVED" : "NONE");
    const statusTone = partnerStatus === "APPROVED" ? "bg-[#e7f6ee] text-[#1d7a3f] ring-[#c9e9d4]"
        : partnerStatus === "SUSPENDED" ? "bg-amber-50 text-amber-800 ring-amber-200"
            : partnerStatus === "REJECTED" ? "bg-red-50 text-alert ring-red-100"
                : "bg-primary-tint text-primary ring-primary/20";
    return (<div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold text-primary">Your RoomStay account</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink">My Profile</h1>
      <p className="mt-2 text-sm leading-6 text-ink-secondary">Your account details and a quick way to get back to your rental activity.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section aria-labelledby="profile-information-heading" className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-6">
          <h2 id="profile-information-heading" className="flex items-center gap-2 text-lg font-semibold"><Icon name="user" size={20} className="text-primary"/>Profile information</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <div><dt className="font-medium text-ink-secondary">Full name</dt><dd className="mt-1 break-words font-semibold text-ink">{user.fullName}</dd></div>
            <div><dt className="font-medium text-ink-secondary">Email</dt><dd className="mt-1 break-all text-ink">{user.email}</dd></div>
            <div><dt className="font-medium text-ink-secondary">Phone number</dt><dd className="mt-1 break-words text-ink">{phone || "Not provided"}</dd></div>
            <div><dt className="font-medium text-ink-secondary">Account type</dt><dd className="mt-1 font-semibold text-ink">Normal User</dd></div>
          </dl>
        </section>

        <section aria-labelledby="profile-partner-heading" className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-6">
          <h2 id="profile-partner-heading" className="text-lg font-semibold">Partner access</h2>
          <span className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusTone}`}>{partnerLabels[partnerStatus]}</span>
          <p className="mt-3 text-sm leading-6 text-ink-secondary">Partner access is an additional capability on your Normal User account.</p>
          {partnerStatus === "SUSPENDED" && <p className="mt-3 text-sm font-medium text-ink">Partner access suspended. Your Normal User account and renter features remain available.</p>}
          {partnerStatus === "PENDING" && <p className="mt-3 text-sm text-ink-secondary">Your Partner application is under review.</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            {partnerStatus === "APPROVED" ? (<Link href="/partner" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white btn-primary">Partner Portal</Link>) : partnerStatus !== "NONE" ? (<Link href="/partner-application" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-semibold text-ink btn-secondary">Partner Application Status</Link>) : null}
            {(partnerStatus === "NONE" || partnerStatus === "REJECTED") && (<Link href="/become-a-partner" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white btn-primary">Become a Partner</Link>)}
          </div>
        </section>
      </div>

      <section aria-labelledby="profile-quick-links-heading" className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-6">
        <h2 id="profile-quick-links-heading" className="text-lg font-semibold">Quick links</h2>
        <nav aria-label="Your rental activity" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.filter((link) => {
            const staff = user.role === "ADMIN" || user.isPartner;
            if (!staff) return true;
            return link.href !== "/bookings" && link.href !== "/favorites" && link.href !== "/viewings";
          }).map((link) => (<Link key={link.href} href={link.href === "/messages" && user.isPartner ? "/partner/messages" : link.href === "/messages" && user.role === "ADMIN" ? "/admin/payment-chats" : link.href} className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-primary-tint/40 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-primary-tint">
              <Icon name={link.icon} size={20} className="text-primary"/>{link.label}
            </Link>))}
        </nav>
      </section>
    </div>);
}
