"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useMockAuth } from "@/lib/mock-auth";
import { readMockBookingRequestsForPartner, readMockPaymentEvidence, statusLabel } from "@/lib/mock-bookings";
import { listingStatusLabel, listingStatusTone, mockListingsChangedEvent, readMockListingsForPartner } from "@/lib/mock-listings";
import { formatBookingDate } from "@/lib/format-date";
const emptyStats = {
    totalListings: 0,
    pendingBookings: 0,
    activeRentals: 0,
    evidenceAwaitingVerification: 0,
};
function statCards(stats) {
    return [
        { label: "Total Listings", value: stats.totalListings, icon: "apartment" },
        { label: "Pending Booking Requests", value: stats.pendingBookings, icon: "room" },
        { label: "Evidence Awaiting Verification", value: stats.evidenceAwaitingVerification, icon: "bell" },
        { label: "Active Rentals", value: stats.activeRentals, icon: "homeFilled" },
    ];
}
export function PartnerDashboard() {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const [data, setData] = useState(null);
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user) {
            router.replace(`/login?returnTo=${encodeURIComponent("/partner")}`);
            return undefined;
        }
        if (!user.isPartner)
            return undefined;
        const currentUser = user;
        function loadData() {
            const bookings = readMockBookingRequestsForPartner(currentUser);
            const listings = readMockListingsForPartner(currentUser.id);
            const ownedBookingIds = new Set(bookings.map((booking) => booking.id));
            const evidence = readMockPaymentEvidence().filter((item) => ownedBookingIds.has(item.bookingId));
            setData({
                stats: {
                    totalListings: listings.length,
                    pendingBookings: bookings.filter((booking) => booking.status === "PENDING").length,
                    activeRentals: bookings.filter((booking) => booking.status === "ACTIVE").length,
                    evidenceAwaitingVerification: evidence.filter((item) => item.status === "PENDING_VERIFICATION").length,
                },
                recentBookings: bookings.slice(0, 3),
                recentListings: listings.slice(0, 3),
            });
        }
        const timeout = window.setTimeout(loadData, 0);
        window.addEventListener(mockListingsChangedEvent, loadData);
        window.addEventListener("storage", loadData);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockListingsChangedEvent, loadData);
            window.removeEventListener("storage", loadData);
        };
    }, [isReady, router, user]);
    if (!isReady)
        return <div className="rounded-2xl border border-line bg-white p-5 text-sm text-ink-secondary">Loading dashboard...</div>;
    if (!user)
        return <div className="rounded-2xl border border-line bg-white p-5 text-sm text-ink-secondary">Redirecting to login...</div>;
    if (!user.isPartner) {
        return (<section className="rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-sm shadow-ink/5">
        <p className="text-sm font-semibold text-primary">Partner access required</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Dashboard is for approved Partners</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">Apply and wait for approval before using the Partner Portal.</p>
        <Link href="/become-a-partner" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">Become a Partner</Link>
      </section>);
    }
    const currentData = data ?? { stats: emptyStats, recentBookings: [], recentListings: [] };
    return (<section>
      <div className="rounded-3xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-7">
        <p className="text-sm font-semibold text-primary">Partner Portal</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink">Dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">Manage your RoomStay listings, booking requests, and rental progress.</p>
          </div>
          <Link href="/partner/listings/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">Create New Listing</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards(currentData.stats).map((card) => (<article key={card.label} className="rounded-2xl border border-line bg-white p-5 shadow-sm shadow-ink/5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary-tint text-primary"><Icon name={card.icon} size={22}/></span>
              <span className="text-3xl font-semibold tracking-[-0.04em] text-ink">{card.value}</span>
            </div>
            <p className="mt-4 text-sm font-semibold text-ink">{card.label}</p>
          </article>))}
      </div>

      <section className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-7">
        <h2 className="text-xl font-semibold tracking-[-0.025em] text-ink">Quick actions</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Link href="/partner/listings/new" className="rounded-2xl border border-line bg-canvas/40 p-4 text-sm font-semibold text-ink btn-secondary">Create New Listing</Link>
          <Link href="/partner/bookings" className="rounded-2xl border border-line bg-canvas/40 p-4 text-sm font-semibold text-ink btn-secondary">Review Booking Requests</Link>
          <Link href="/partner/listings" className="rounded-2xl border border-line bg-canvas/40 p-4 text-sm font-semibold text-ink btn-secondary">View My Listings</Link>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-[-0.025em] text-ink">Recent Booking Requests</h2>
            <Link href="/partner/bookings" className="text-sm font-semibold text-primary hover:underline">View all</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {currentData.recentBookings.length === 0 ? (<p className="rounded-xl border border-dashed border-line bg-canvas/40 p-4 text-sm text-ink-secondary">No booking requests yet.</p>) : currentData.recentBookings.map((booking) => (<Link key={booking.id} href={`/partner/bookings/${booking.id}`} className="rounded-xl border border-line bg-canvas/40 p-4 btn-secondary">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{booking.propertyTitle}</p>
                  <span className="rounded-full bg-primary-tint px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">{statusLabel(booking.status)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-secondary">Renter: {booking.renterName}</p>
                <p className="mt-1 text-xs text-ink-secondary">Submitted {formatBookingDate(booking.createdAt)}</p>
              </Link>))}
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-[-0.025em] text-ink">Recent Listings</h2>
            <Link href="/partner/listings" className="text-sm font-semibold text-primary hover:underline">View all</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {currentData.recentListings.length === 0 ? (<p className="rounded-xl border border-dashed border-line bg-canvas/40 p-4 text-sm text-ink-secondary">No listings yet.</p>) : currentData.recentListings.map((listing) => (<div key={listing.id} className="rounded-xl border border-line bg-canvas/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{listing.title}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${listingStatusTone(listing.listingStatus)}`}>{listingStatusLabel(listing.listingStatus)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-secondary">{listing.location}</p>
                <p className="mt-1 text-xs text-ink-secondary">Created {formatBookingDate(listing.createdAt)}</p>
              </div>))}
          </div>
        </section>
      </div>
    </section>);
}
