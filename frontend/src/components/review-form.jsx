"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { findMockBookingRequest, findMockReviewForBooking, saveMockReview, } from "@/lib/mock-bookings";
import { ApiError } from "@/lib/api";
import { liveLeaveReview } from "@/lib/live-actions";
import { liveEnabled } from "@/lib/live-store";
import { useMockAuth } from "@/lib/mock-auth";
import { usePublicProperties } from "@/lib/published-listings";
function formatDateTime(value) {
    if (!value)
        return "Not provided";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}
export function ReviewForm({ bookingId }) {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const [booking, setBooking] = useState(undefined);
    const [review, setReview] = useState(null);
    const [rating, setRating] = useState("");
    const [comment, setComment] = useState("");
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const { properties: publicProperties } = usePublicProperties();
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user) {
            router.replace(`/login?returnTo=${encodeURIComponent(`/bookings/${bookingId}/review`)}`);
            return undefined;
        }
        const timeout = window.setTimeout(() => {
            const found = findMockBookingRequest(bookingId);
            setBooking(found && found.renterUserId === user.id ? found : null);
            setReview(findMockReviewForBooking(bookingId));
        }, 0);
        return () => window.clearTimeout(timeout);
    }, [bookingId, isReady, router, user]);
    async function submit(event) {
        event.preventDefault();
        if (!booking || !user || booking.status !== "COMPLETED" || review)
            return;
        const nextErrors = {};
        const numericRating = Number(rating);
        if (!rating)
            nextErrors.rating = "Rating is required.";
        else if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5)
            nextErrors.rating = "Rating must be from 1 to 5.";
        if (!comment.trim())
            nextErrors.comment = "Review comment is required.";
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0)
            return;
        if (liveEnabled()) {
            try {
                setReview(await liveLeaveReview(booking.id, { rating: numericRating, comment: comment.trim() }));
                setSubmitted(true);
            }
            catch (error) {
                setErrors({ comment: error instanceof ApiError ? error.message : "The review could not be saved." });
            }
            return;
        }
        const nextReview = {
            id: `review-${booking.id}-${Date.now()}`,
            bookingId: booking.id,
            renterUserId: user.id,
            rating: numericRating,
            comment: comment.trim(),
            createdAt: new Date().toISOString(),
        };
        saveMockReview(nextReview);
        setReview(nextReview);
        setSubmitted(true);
    }
    if (!isReady || booking === undefined) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading review page...
      </div>);
    }
    if (!user) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Redirecting to login...
      </div>);
    }
    if (!booking) {
        return (<section className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-5 text-center md:p-7">
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">Booking not found</h1>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">This booking may belong to another user or may no longer exist.</p>
        <Link href="/bookings" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white">
          Back to My Bookings
        </Link>
      </section>);
    }
    const property = publicProperties.find((item) => item.id === booking.propertyId);
    const image = property?.image ?? "/images/home/cozy-condo.jpg";
    const imageAlt = property?.imageAlt ?? booking.propertyTitle;
    if (booking.status !== "COMPLETED") {
        return (<section className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-5 text-center md:p-7">
        <p className="text-sm font-semibold text-primary">Booking ID {booking.id}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Review unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">Reviews can only be submitted after a rental is completed.</p>
        <Link href={`/bookings/${booking.id}`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white">
          Back to Booking Details
        </Link>
      </section>);
    }
    if (review || submitted) {
        return (<section className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-5 md:p-7">
        <p className="text-sm font-semibold text-primary">Booking ID {booking.id}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Review submitted</h1>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">You have already left a review for this completed booking.</p>
        {review && (<div className="mt-5 rounded-xl bg-primary-tint p-4 text-sm text-ink-secondary">
            <p className="text-base font-semibold text-primary">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
            <p className="mt-2 leading-6">{review.comment}</p>
            <p className="mt-2 text-xs">Reviewed on {formatDateTime(review.createdAt)}</p>
          </div>)}
        <Link href={`/bookings/${booking.id}`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white">
          Back to Booking Details
        </Link>
      </section>);
    }
    return (<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-xl border border-line bg-white p-5 md:p-7">
        <p className="text-sm font-semibold text-primary">Booking ID {booking.id}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Leave a Review</h1>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          Share your experience for this completed rental. One review is allowed per completed booking.
        </p>

        <form onSubmit={submit} noValidate className="mt-6 grid gap-5">
          <label className="text-sm font-medium">
            Rating
            <select value={rating} onChange={(event) => setRating(event.target.value)} aria-invalid={Boolean(errors.rating)} className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:ring-2 focus:ring-primary focus:outline-none">
              <option value="">Select rating</option>
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Okay</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Very poor</option>
            </select>
            {errors.rating && <span className="mt-1.5 block text-xs text-alert">{errors.rating}</span>}
          </label>

          <label className="text-sm font-medium">
            Review comment
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={6} maxLength={500} placeholder="Write a short review about your rental experience." aria-invalid={Boolean(errors.comment)} className="mt-2 w-full resize-none rounded-lg border border-line bg-white px-3 py-3 text-sm text-ink placeholder:text-ink-secondary focus:ring-2 focus:ring-primary focus:outline-none"/>
            <span className="mt-1.5 block text-right text-xs text-ink-secondary">{comment.length}/500</span>
            {errors.comment && <span className="mt-1.5 block text-xs text-alert">{errors.comment}</span>}
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <Link href={`/bookings/${booking.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink">
              Cancel
            </Link>
            <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white btn-primary">
              Submit Review
            </button>
          </div>
        </form>
      </section>

      <aside className="rounded-xl border border-line bg-white p-4 md:p-5 lg:sticky lg:top-8">
        <div className="relative aspect-[5/3] overflow-hidden rounded-lg bg-photo">
          <Image src={image} alt={imageAlt} fill sizes="(min-width: 1024px) 348px, calc(100vw - 44px)" className="object-cover"/>
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-[-0.025em]">{booking.propertyTitle}</h2>
        <p className="mt-1 text-sm text-ink-secondary">{booking.propertyLocation}</p>
        <dl className="mt-3 grid gap-2 text-sm text-ink-secondary">
          <div>
            <dt className="font-medium text-ink">Rental started</dt>
            <dd>{formatDateTime(booking.rentalStartedAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Completed</dt>
            <dd>{formatDateTime(booking.completedAt)}</dd>
          </div>
        </dl>
      </aside>
    </div>);
}
