"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useMockAuth } from "@/lib/mock-auth";
import { mockReviewsChangedEvent, readMockBookingRequests, readVisibleMockReviews } from "@/lib/mock-bookings";
import { findMockListingById } from "@/lib/mock-listings";
import { formatBookingDate } from "@/lib/format-date";
const filters = [
    { label: "All", value: "ALL" },
    { label: "5 stars", value: 5 },
    { label: "4 stars", value: 4 },
    { label: "3 stars", value: 3 },
    { label: "2 stars", value: 2 },
    { label: "1 star", value: 1 },
];
function Stars({ rating }) {
    return (<span className="text-base font-semibold text-primary" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>);
}
export function PartnerReviews() {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const [reviews, setReviews] = useState(null);
    const [activeFilter, setActiveFilter] = useState("ALL");
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user) {
            router.replace(`/login?returnTo=${encodeURIComponent("/partner/reviews")}`);
            return undefined;
        }
        if (!user.isPartner)
            return undefined;
        const currentUser = user;
        function loadReviews() {
            const bookings = readMockBookingRequests();
            // Read-only join over the existing mock stores: review -> booking ->
            // listing ownership. Reviews for static catalog properties (no listing
            // owner) or missing bookings are excluded.
            const owned = bookings.filter((booking) => booking.status === "COMPLETED" && findMockListingById(booking.propertyId)?.partnerUserId === currentUser.id);
            const byBookingId = new Map(owned.map((booking) => [booking.id, booking]));
            setReviews(readVisibleMockReviews()
                .map((review) => {
                const booking = byBookingId.get(review.bookingId);
                return booking ? { review, booking } : null;
            })
                .filter((item) => Boolean(item))
                .sort((first, second) => new Date(second.review.createdAt).getTime() - new Date(first.review.createdAt).getTime()));
        }
        const timeout = window.setTimeout(loadReviews, 0);
        window.addEventListener(mockReviewsChangedEvent, loadReviews);
        window.addEventListener("storage", loadReviews);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockReviewsChangedEvent, loadReviews);
            window.removeEventListener("storage", loadReviews);
        };
    }, [isReady, router, user]);
    if (!isReady) {
        return (<div className="rounded-2xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading reviews...
      </div>);
    }
    if (!user) {
        return (<div className="rounded-2xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Redirecting to login...
      </div>);
    }
    if (!user.isPartner) {
        return (<section className="rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-sm shadow-ink/5">
        <p className="text-sm font-semibold text-primary">Partner access required</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Reviews are for approved Partners</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">Apply and wait for approval before using the Partner Portal.</p>
        <Link href="/become-a-partner" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">Become a Partner</Link>
      </section>);
    }
    if (reviews === null) {
        return (<div className="rounded-2xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading reviews...
      </div>);
    }
    const totalReviews = reviews.length;
    const averageRating = totalReviews === 0 ? 0 : Math.round((reviews.reduce((sum, item) => sum + item.review.rating, 0) / totalReviews) * 10) / 10;
    const visibleReviews = activeFilter === "ALL" ? reviews : reviews.filter((item) => item.review.rating === activeFilter);
    return (<section>
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-7">
        <p className="text-sm font-semibold text-primary">Partner Portal</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Reviews</h1>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">See what renters said about completed rentals at your properties.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex min-w-36 flex-1 items-center gap-3 rounded-2xl border border-line bg-canvas/40 p-4">
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-xl bg-primary-tint text-primary"><Icon name="star" size={22}/></span>
            <span>
              <span className="block text-2xl font-semibold tracking-[-0.025em] text-ink">{totalReviews}</span>
              <span className="block text-xs font-semibold text-ink-secondary">Total reviews</span>
            </span>
          </div>
          <div className="flex min-w-36 flex-1 items-center gap-3 rounded-2xl border border-line bg-canvas/40 p-4">
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-xl bg-primary-tint text-base font-semibold text-primary">
              {totalReviews === 0 ? "–" : averageRating.toFixed(1)}
            </span>
            <span>
              <span className="block text-2xl font-semibold tracking-[-0.025em] text-ink">{totalReviews === 0 ? "No rating" : `${averageRating.toFixed(1)} / 5`}</span>
              <span className="block text-xs font-semibold text-ink-secondary">Average rating</span>
            </span>
          </div>
        </div>
      </div>

      {totalReviews > 0 && (<div role="group" aria-label="Filter reviews by rating" className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white p-2 shadow-sm shadow-ink/5">
          <div className="flex min-w-max gap-1">
            {filters.map((filter) => {
                const active = activeFilter === filter.value;
                return (<button key={filter.label} type="button" aria-pressed={active} onClick={() => setActiveFilter(filter.value)} className={`min-h-11 rounded-xl px-4 text-sm font-semibold whitespace-nowrap ${active ? "bg-primary text-white" : "text-ink-secondary hover:bg-primary-tint hover:text-primary"}`}>
                  {filter.label}
                </button>);
            })}
          </div>
        </div>)}

      {totalReviews === 0 ? (<div className="mt-4 rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-sm shadow-ink/5">
          <Icon name="star" size={32} className="mx-auto text-primary"/>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.025em]">No reviews yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
            When renters leave reviews for completed rentals at your properties, they will appear here.
          </p>
          <Link href="/partner/listings" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">
            View My Listings
          </Link>
        </div>) : visibleReviews.length === 0 ? (<div className="mt-4 rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-sm shadow-ink/5">
          <h2 className="text-xl font-semibold tracking-[-0.025em]">No reviews with this rating yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">Choose another rating to see more reviews.</p>
        </div>) : (<ul className="mt-4 grid gap-4 md:grid-cols-2">
          {visibleReviews.map(({ review, booking }) => (<li key={review.id} className="flex min-w-0 flex-col rounded-2xl border border-line bg-white p-5 shadow-sm shadow-ink/5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{booking.propertyTitle}</p>
                  <p className="mt-0.5 text-xs text-ink-secondary">Renter: {booking.renterName}</p>
                </div>
                <Stars rating={review.rating}/>
              </div>
              <p className="mt-3 text-sm leading-6 break-words text-ink-secondary">{review.comment}</p>
              <dl className="mt-4 grid gap-2 border-t border-line pt-3 text-xs text-ink-secondary">
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="font-semibold">Reviewed</dt>
                  <dd>{formatBookingDate(review.createdAt)}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="font-semibold">Booking reference</dt>
                  <dd className="break-all">{booking.id}</dd>
                </div>
                {booking.completedAt && (<div className="flex flex-wrap justify-between gap-2">
                    <dt className="font-semibold">Rental completed</dt>
                    <dd>{formatBookingDate(booking.completedAt)}</dd>
                  </div>)}
              </dl>
            </li>))}
        </ul>)}
    </section>);
}
