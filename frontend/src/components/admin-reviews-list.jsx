"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBookingDate } from "@/lib/format-date";
import { mockReviewsChangedEvent } from "@/lib/mock-bookings";
import { filterAdminReviews, readAdminReviews, reviewStatusLabels, reviewStatusTone } from "@/lib/mock-admin-reviews";
export function AdminReviewsList() {
    const [reviews, setReviews] = useState(null);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("ALL");
    useEffect(() => {
        function loadReviews() { setReviews(readAdminReviews()); }
        const timeout = window.setTimeout(loadReviews, 0);
        window.addEventListener(mockReviewsChangedEvent, loadReviews);
        window.addEventListener("storage", loadReviews);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockReviewsChangedEvent, loadReviews);
            window.removeEventListener("storage", loadReviews);
        };
    }, []);
    if (reviews === null)
        return <p className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">Loading reviews...</p>;
    const visibleReviews = filterAdminReviews(reviews, query, filter);
    return (<section>
      <p className="text-sm font-semibold text-primary">Admin Portal</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Reviews</h1>
      <p className="mt-2 text-sm text-ink-secondary">Moderate renter reviews. Hidden reviews are preserved and can be restored.</p>
      <div className="mt-5 rounded-xl border border-line bg-white p-4">
        <label htmlFor="review-search" className="text-sm font-semibold">Search reviews</label>
        <input id="review-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Property title or reviewer name" className="mt-2 min-h-11 w-full rounded-lg border border-line px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"/>
        <div role="group" aria-label="Filter reviews by status" className="mt-3 flex flex-wrap gap-2">
          {["ALL", "VISIBLE", "REPORTED", "HIDDEN"].map((status) => (<button key={status} type="button" aria-pressed={filter === status} onClick={() => setFilter(status)} className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${filter === status ? "bg-primary text-white" : "bg-canvas text-ink-secondary hover:bg-primary-tint"}`}>
              {status === "ALL" ? "All" : reviewStatusLabels[status]}
            </button>))}
        </div>
      </div>
      {visibleReviews.length === 0 ? (<div className="mt-4 rounded-xl border border-line bg-white px-5 py-14 text-center">
          <h2 className="text-lg font-semibold">{reviews.length === 0 ? "No reviews yet" : "No matching reviews"}</h2>
          <p className="mt-2 text-sm text-ink-secondary">{reviews.length === 0 ? "Reviews submitted after completed rentals will appear here." : "Try another search or status filter."}</p>
        </div>) : (<>
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-line bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas/60 text-ink-secondary"><tr>{["Reviewer", "Property", "Rating", "Comment", "Status", "Submitted", "Action"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
              <tbody>{visibleReviews.map((review) => (<tr key={review.id} className="border-t border-line align-top">
                  <td className="max-w-48 break-words px-4 py-3 font-semibold">{review.reviewerName}</td>
                  <td className="max-w-56 break-words px-4 py-3">{review.propertyTitle}</td>
                  <td className="whitespace-nowrap px-4 py-3">{review.rating} / 5</td>
                  <td className="max-w-64 px-4 py-3 text-ink-secondary"><p className="line-clamp-2 break-words">{review.comment || "No comment"}</p></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${reviewStatusTone(review.status)}`}>{reviewStatusLabels[review.status]}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-secondary">{formatBookingDate(review.createdAt)}</td>
                  <td className="px-4 py-3"><Link href={`/admin/reviews/${encodeURIComponent(review.id)}`} aria-label={`View review by ${review.reviewerName} for ${review.propertyTitle}`} className="inline-flex min-h-9 items-center rounded-lg border border-line px-3 font-semibold btn-secondary">View</Link></td>
                </tr>))}</tbody>
            </table>
          </div>
          <ul className="mt-4 grid gap-3 md:hidden">{visibleReviews.map((review) => (<li key={review.id} className="min-w-0 rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="break-words font-semibold">{review.reviewerName}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${reviewStatusTone(review.status)}`}>{reviewStatusLabels[review.status]}</span>
              </div>
              <p className="mt-2 break-words text-sm font-medium">{review.propertyTitle}</p>
              <p className="mt-2 text-sm text-primary">Rating: {review.rating} / 5</p>
              <p className="mt-2 line-clamp-2 break-words text-sm text-ink-secondary">{review.comment || "No comment"}</p>
              <p className="mt-2 text-xs text-ink-secondary">Submitted {formatBookingDate(review.createdAt)}</p>
              <Link href={`/admin/reviews/${encodeURIComponent(review.id)}`} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line px-4 text-sm font-semibold btn-secondary">View Review</Link>
            </li>))}</ul>
        </>)}
    </section>);
}
