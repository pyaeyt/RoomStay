"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useMockAuth } from "@/lib/mock-auth";
import { findMockPartnerCapability, mockPartnerApplicationsChangedEvent } from "@/lib/mock-partner-application";
export function HomePartnerCta() {
    const { user, isReady } = useMockAuth();
    const [application, setApplication] = useState(null);
    const [checked, setChecked] = useState(false);
    useEffect(() => {
        function sync() {
            setApplication(user && isReady ? findMockPartnerCapability(user.id) : null);
            setChecked(true);
        }
        const timeout = window.setTimeout(sync, 0);
        window.addEventListener(mockPartnerApplicationsChangedEvent, sync);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockPartnerApplicationsChangedEvent, sync);
        };
    }, [isReady, user]);
    if (!isReady || !checked || user?.role === "ADMIN")
        return null;
    const pending = application && application.status !== "REJECTED" ? application : null;
    const href = pending?.status === "APPROVED" ? "/partner" : pending ? "/partner-application" : "/become-a-partner";
    const label = pending?.status === "APPROVED"
        ? "Open Partner Portal"
        : pending?.status === "SUSPENDED"
            ? "View suspension"
            : pending
                ? "View application status"
                : "Become a Partner";
    const title = pending?.status === "APPROVED"
        ? "Your Partner Portal is ready"
        : pending?.status === "SUSPENDED"
            ? "Partner access is suspended"
            : pending
                ? "Your partner application is in review"
                : "List your property with RoomStay";
    const text = pending?.status === "APPROVED"
        ? "Create listings, review viewing and booking requests, and track rental progress from the Partner Portal."
        : pending?.status === "SUSPENDED"
            ? "Published listings stay hidden until an admin restores partner access. Past bookings remain on record."
            : pending
                ? "You already submitted an application. RoomStay will show the decision on your application status page."
                : "Create listings, review viewing and booking requests, and track rental progress from the Partner Portal.";
    return (<section aria-labelledby="partner-heading" className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-deep via-primary to-primary p-4 shadow-sm shadow-ink/5 md:p-6">
      <div className="flex flex-col items-start justify-center gap-4 md:min-h-32 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            <Icon name="brand" size={18}/> For property owners
          </p>
          <h2 id="partner-heading" className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white md:text-[1.7rem]">
            {title}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-white/85">{text}</p>
        </div>
        <Link href={href} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:brightness-[1.05] active:translate-y-0">
          {label}
        </Link>
      </div>
    </section>);
}
