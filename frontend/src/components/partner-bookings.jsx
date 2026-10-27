"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readMockBookingRequestsForPartner, statusLabel } from "@/lib/mock-bookings";
import { useMockAuth } from "@/lib/mock-auth";
import { formatBookingDate } from "@/lib/format-date";
import { properties } from "@/mocks/properties";
const filters = [
    { label: "All", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Deposit Pending", value: "DEPOSIT_PENDING" },
    { label: "Verification Pending", value: "VERIFICATION_PENDING" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Active", value: "ACTIVE" },
    { label: "Completed", value: "COMPLETED" },
];
function statusTone(status) {
    if (status === "PENDING" || status === "DEPOSIT_PENDING" || status === "VERIFICATION_PENDING")
        return "bg-primary-tint text-primary ring-primary/20";
    if (status === "CONFIRMED" || status === "ACTIVE" || status === "COMPLETED")
        return "bg-[#e7f6ee] text-[#1d7a3f] ring-[#c9e9d4]";
    if (status === "DECLINED" || status === "CANCELLED" || status === "EXPIRED")
        return "bg-red-50 text-alert ring-red-100";
    return "bg-canvas text-ink-secondary ring-line";
}
export function PartnerBookings() {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const [bookings, setBookings] = useState(null);
    const [activeFilter, setActiveFilter] = useState("ALL");
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user) {
            router.replace(`/login?returnTo=${encodeURIComponent("/partner/bookings")}`);
            return undefined;
        }
        if (!user.isPartner)
            return undefined;
        const currentUser = user;
        const timeout = window.setTimeout(() => {
            setBookings(readMockBookingRequestsForPartner(currentUser));
        }, 0);
        return () => window.clearTimeout(timeout);
    }, [isReady, router, user]);
    if (!isReady) {
        return (<section className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading bookings...
      </section>);
    }
    if (!user) {
        return (<section className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Redirecting to login...
      </section>);
    }
    if (!user.isPartner) {
        return (<section className="rounded-xl border border-line bg-white px-5 py-14 text-center">
        <p className="text-sm font-semibold text-primary">Partner access required</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Booking review is for approved Partners</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
          Apply and wait for approval before managing renter booking requests.
        </p>
        <Link href="/become-a-partner" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">
          Become a Partner
        </Link>
      </section>);
    }
    if (bookings === null) {
        return (<section className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading bookings...
      </section>);
    }
    if (bookings.length === 0) {
        return (<section className="rounded-xl border border-line bg-white px-5 py-14 text-center">
        <p className="text-sm font-semibold text-primary">Booking Requests</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">No booking requests yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
          Renter booking requests saved in this browser will appear here.
        </p>
      </section>);
    }
    const visibleBookings = activeFilter === "ALL" ? bookings : bookings.filter((booking) => booking.status === activeFilter);
    return (<section>
      <div className="rounded-3xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-7">
        <p className="text-sm font-semibold text-primary">Partner Portal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">Booking Requests</h1>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">Review renter requests, deposit stages, verification, and rental progress.</p>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white p-2 shadow-sm shadow-ink/5">
        <div className="flex min-w-max gap-1">
          {filters.map((filter) => {
            const active = activeFilter === filter.value;
            return (<button key={filter.value} type="button" onClick={() => setActiveFilter(filter.value)} className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${active ? "bg-primary text-white" : "text-ink-secondary hover:bg-primary-tint hover:text-primary"}`}>
                {filter.label}
              </button>);
        })}
        </div>
      </div>

      {visibleBookings.length === 0 ? (<div className="mt-5 rounded-2xl border border-line bg-white px-5 py-12 text-center shadow-sm shadow-ink/5">
          <h2 className="text-lg font-semibold tracking-[-0.025em]">No bookings in this status</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">Choose another status tab to review available booking requests.</p>
        </div>) : (<div className="mt-5 grid gap-4">
        {visibleBookings.map((booking) => {
                const property = properties.find((item) => item.id === booking.propertyId);
                return (<article key={booking.id} className="grid gap-4 rounded-xl border border-line bg-white p-4 transition-shadow duration-200 hover:shadow-md hover:shadow-ink/5 md:grid-cols-[160px_minmax(0,1fr)_auto] md:items-center">
              <div className="relative aspect-[5/3] overflow-hidden rounded-lg bg-photo md:aspect-[4/3]">
                <Image src={property?.image ?? "/images/home/cozy-condo.jpg"} alt={property?.imageAlt ?? booking.propertyTitle} fill sizes="(min-width: 768px) 160px, calc(100vw - 76px)" className="object-cover"/>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-[-0.025em]">{booking.propertyTitle}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusTone(booking.status)}`}>{statusLabel(booking.status)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-secondary">{booking.propertyLocation}</p>
                <p className="mt-2 text-sm text-ink-secondary">Renter: {booking.renterName}</p>
                <p className="mt-1 text-sm text-ink-secondary">Move-in: {formatBookingDate(booking.requestedMoveInDate)}</p>
                <p className="mt-1 text-sm text-ink-secondary">Submitted: {formatBookingDate(booking.createdAt)}</p>
              </div>
              <Link href={`/partner/bookings/${booking.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white btn-primary">
                Review
              </Link>
            </article>);
            })}
        </div>)}
    </section>);
}
