"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBookingDate } from "@/lib/format-date";
import { liveModerateReview } from "@/lib/live-actions";
import { liveEnabled } from "@/lib/live-store";
import { mockReviewsChangedEvent, moderateMockReview } from "@/lib/mock-bookings";
import { readAdminReviews, reviewStatusLabels, reviewStatusTone } from "@/lib/mock-admin-reviews";
export function AdminReviewDetails({ reviewId }) {
    const [review, setReview] = useState(undefined);
    const [error, setError] = useState("");
    const [feedback, setFeedback] = useState("");
    useEffect(() => {
        function loadReview() { setReview(readAdminReviews().find((item) => item.id === reviewId) ?? null); }
        const timeout = window.setTimeout(loadReview, 0);
        window.addEventListener(mockReviewsChangedEvent, loadReview);
        window.addEventListener("storage", loadReview);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockReviewsChangedEvent, loadReview);
            window.removeEventListener("storage", loadReview);
        };
    }, [reviewId]);
    if (review === undefined)
        return <p className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">Loading review...</p>;
    if (!review)
        return (<section className="rounded-xl border border-line bg-white px-5 py-14 text-center">
      <h1 className="text-2xl font-semibold">Review not found</h1>
      <p className="mt-2 text-sm text-ink-secondary">This review does not exist in this browser.</p>
      <Link href="/admin/reviews" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">Back to Reviews</Link>
    </section>);
    async function moderate() {
        if (!review)
            return;
        setError("");
        setFeedback("");
        const status = review.status === "HIDDEN" ? "VISIBLE" : "HIDDEN";
        try {
            if (liveEnabled()) {
                await liveModerateReview(review.id, status);
                setFeedback(status === "HIDDEN" ? "Review hidden. The original review is preserved." : "Review restored and visible again.");
                return;
            }
            if (!moderateMockReview(review.id, status)) {
                setError("The review status has changed. Check the current status and try again.");
                return;
            }
            setFeedback(status === "HIDDEN" ? "Review hidden. The original review is preserved." : "Review restored and visible again.");
        }
        catch {
            setError("The review could not be saved. Check browser storage and try again.");
        }
    }
    return (<section>
      <Link href="/admin/reviews" className="inline-flex min-h-11 items-center text-sm font-medium text-primary">‹ Back to reviews</Link>
      <p className="mt-3 text-sm font-semibold text-primary">Admin Review</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="break-words text-2xl font-semibold tracking-[-0.025em]">Review of {review.propertyTitle}</h1>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${reviewStatusTone(review.status)}`}>{reviewStatusLabels[review.status]}</span>
      </div>
      <div className="mt-5 rounded-xl border border-line bg-white p-5 md:p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold">Reviewer</dt><dd className="mt-1 break-words text-ink-secondary">{review.reviewerName}</dd></div>
          <div><dt className="font-semibold">Property</dt><dd className="mt-1 break-words text-ink-secondary">{review.propertyTitle}</dd></div>
          <div><dt className="font-semibold">Rating</dt><dd className="mt-1 text-primary">{review.rating} / 5</dd></div>
          <div><dt className="font-semibold">Submitted</dt><dd className="mt-1 text-ink-secondary">{formatBookingDate(review.createdAt)}</dd></div>
          <div><dt className="font-semibold">Booking reference</dt><dd className="mt-1 break-all text-ink-secondary">{review.bookingId}</dd></div>
          <div><dt className="font-semibold">Review ID</dt><dd className="mt-1 break-all text-ink-secondary">{review.id}</dd></div>
          <div className="sm:col-span-2"><dt className="font-semibold">Full comment</dt><dd className="mt-2 whitespace-pre-wrap break-words leading-6 text-ink-secondary">{review.comment || "No comment"}</dd></div>
          {review.moderatedAt && <div className="sm:col-span-2"><dt className="font-semibold">Last moderated</dt><dd className="mt-1 text-ink-secondary">{formatBookingDate(review.moderatedAt)} · {review.moderatedBy ?? "Mock Admin"}</dd></div>}
        </dl>
        {review.propertyHref && <Link href={review.propertyHref} className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold btn-secondary">View Property</Link>}
      </div>
      <section className="mt-4 rounded-xl border border-line bg-white p-5 md:p-6">
        <h2 className="font-semibold">Moderation actions</h2>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">Hiding removes the review from public and Partner review displays. Its original content, submission date, and booking reference remain saved.</p>
        <button type="button" onClick={moderate} className={`mt-4 inline-flex min-h-11 items-center rounded-lg px-5 text-sm font-semibold text-white ${review.status === "HIDDEN" ? "bg-primary btn-primary" : "bg-alert"}`}>
          {review.status === "HIDDEN" ? "Restore Review" : "Hide Review"}
        </button>
        {error && <p role="alert" className="mt-3 text-sm text-alert">{error}</p>}
        {feedback && <p role="status" className="mt-3 text-sm text-primary">{feedback}</p>}
      </section>
    </section>);
}
