"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { readMockBookingRequests, statusLabel } from "@/lib/mock-bookings";
import { formatBookingDate } from "@/lib/format-date";
import { useMockAuth } from "@/lib/mock-auth";
import { usePublicProperties } from "@/lib/published-listings";
const rentFormatter = new Intl.NumberFormat("en-US");
// My Bookings badge tones: subtle semantic families with readable contrast.
// Labels come from statusLabel and are unchanged.
function bookingCardStatusTone(status) {
    if (status === "PENDING")
        return "bg-[#fff6e7] text-[#8a5a00] ring-[#eed9ae]";
    if (status === "DEPOSIT_PENDING" || status === "APPROVED")
        return "bg-[#efeaff] text-primary ring-primary/25";
    if (status === "VERIFICATION_PENDING")
        return "bg-[#fff0db] text-[#8a5a00] ring-[#f0d49a]";
    if (status === "CONFIRMED")
        return "bg-[#e8edff] text-[#3b4fd8] ring-[#d3dbff]";
    if (status === "ACTIVE")
        return "bg-[#e0f5f2] text-[#0b6e5f] ring-[#bfe6df]";
    if (status === "COMPLETED")
        return "bg-[#e7f6ee] text-[#1d7a3f] ring-[#c9e9d4]";
    if (status === "DECLINED" || status === "EXPIRED")
        return "bg-red-50 text-alert ring-red-100";
    return "bg-canvas text-ink-secondary ring-line";
}
function deadlineLabel(deadline) {
    if (!deadline)
        return null;
    const date = new Date(deadline);
    if (Number.isNaN(date.getTime()))
        return "Payment deadline unavailable";
    const difference = date.getTime() - Date.now();
    if (difference <= 0)
        return `Deadline passed ${formatBookingDate(deadline)}`;
    const minutes = Math.ceil(difference / 60000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    if (days > 0)
        return `Due ${formatBookingDate(deadline)} · ${days}d ${hours}h left`;
    if (hours > 0)
        return `Due ${formatBookingDate(deadline)} · ${hours}h left`;
    return `Due ${formatBookingDate(deadline)} · ${minutes}m left`;
}
export function BookingsList() {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const [bookings, setBookings] = useState(null);
    const { properties: publicProperties } = usePublicProperties();
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user) {
            router.replace(`/login?returnTo=${encodeURIComponent("/bookings")}`);
            return undefined;
        }
        if (user.role === "ADMIN" || user.isPartner) {
            router.replace(user.role === "ADMIN" ? "/admin" : "/partner");
            return undefined;
        }
        const timeout = window.setTimeout(() => {
            setBookings(readMockBookingRequests()
                .filter((booking) => booking.renterUserId === user.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }, 0);
        return () => window.clearTimeout(timeout);
    }, [isReady, router, user]);
    if (!isReady || bookings === null) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading bookings...
      </div>);
    }
    if (!user) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Redirecting to login...
      </div>);
    }
    if (bookings.length === 0) {
        return (<section className="rounded-xl border border-line bg-white px-5 py-14 text-center motion-safe:animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">No bookings yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
          Booking requests you submit will appear here while they wait for Partner review.
        </p>
        <Link href="/search" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">
          Browse Rooms
        </Link>
      </section>);
    }
    return (<section>
      <div className="mb-5">
        <p className="text-sm font-semibold text-primary">RoomStay renter dashboard</p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.035em] text-[#171044]">My Bookings</h1>
        <p className="mt-2 text-sm text-ink-secondary">Track your booking requests and their current status.</p>
      </div>

      <div className="grid gap-4">
        {bookings.map((booking) => {
            const property = publicProperties.find((item) => item.id === booking.propertyId);
            const image = property?.image ?? "/images/home/cozy-condo.jpg";
            const imageAlt = property?.imageAlt ?? booking.propertyTitle;
            const depositDeadline = booking.status === "DEPOSIT_PENDING" ? deadlineLabel(booking.paymentDeadline) : null;
            return (<article key={booking.id} className="grid gap-4 rounded-2xl border border-[#e6e1f2] bg-white p-4 shadow-sm shadow-[#20104a08] transition-all duration-200 hover:-translate-y-px hover:border-[#c8bbf5] hover:shadow-md hover:shadow-[#20104a14] md:grid-cols-[184px_minmax(0,1fr)_auto] md:items-center">
              <div className="relative aspect-[16/11] overflow-hidden rounded-xl bg-photo md:aspect-[4/3]">
                <Image src={image} alt={imageAlt} fill sizes="(min-width: 768px) 180px, calc(100vw - 76px)" className="object-cover"/>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="min-w-0 text-lg font-bold leading-6 tracking-[-0.025em] text-[#171044]">{booking.propertyTitle}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${bookingCardStatusTone(booking.status)}`}>{statusLabel(booking.status)}</span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-secondary">
                  <Icon name="location" size={15}/> {booking.propertyLocation}
                </p>
                <div className="mt-3 grid gap-2 text-sm text-ink-secondary sm:grid-cols-2 lg:grid-cols-3">
                  <p><span className="font-semibold text-ink">Move-in:</span> {formatBookingDate(booking.requestedMoveInDate)}</p>
                  <p><span className="font-semibold text-ink">Submitted:</span> {formatBookingDate(booking.createdAt)}</p>
                  {booking.monthlyRent > 0 && <p><span className="font-semibold text-ink">Rent:</span> ฿{rentFormatter.format(booking.monthlyRent)} / month</p>}
                </div>
                {booking.status === "PENDING" && (<p className="mt-3 text-sm leading-6 text-ink-secondary">Waiting for the partner. Bank details and the slip upload appear after approval.</p>)}
                {depositDeadline && (<p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#fff6e7] px-3 py-1 text-xs font-semibold text-[#8a5a00] ring-1 ring-inset ring-[#eed9ae]">
                    <Icon name="bell" size={14}/> {depositDeadline}
                  </p>)}
              </div>
              <Link href={`/bookings/${booking.id}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#dcd5f5] bg-white px-4 text-sm font-semibold text-primary shadow-sm shadow-[#20104a08] transition-colors hover:bg-[#f7f3ff] md:self-center">
                View Details <span aria-hidden="true">→</span>
              </Link>
            </article>);
        })}
      </div>
    </section>);
}
