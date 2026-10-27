"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBookingDate } from "@/lib/format-date";
import { roomStatusLabel } from "@/lib/mock-bookings";
import { listingStatusLabel, listingStatusTone, mockListingsChangedEvent, readMockListings, } from "@/lib/mock-listings";
const rentFormatter = new Intl.NumberFormat("en-US");
const statusFilterOptions = [
    "",
    "PENDING_REVIEW",
    "DRAFT",
    "PUBLISHED",
    "REJECTED",
    "SUSPENDED",
];
export function AdminListingsList() {
    const [listings, setListings] = useState(null);
    const [statusFilter, setStatusFilter] = useState("PENDING_REVIEW");
    useEffect(() => {
        function loadListings() {
            setListings(readMockListings().sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()));
        }
        const timeout = window.setTimeout(loadListings, 0);
        window.addEventListener(mockListingsChangedEvent, loadListings);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockListingsChangedEvent, loadListings);
        };
    }, []);
    if (listings === null) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading listings...
      </div>);
    }
    const visibleListings = statusFilter === ""
        ? listings
        : listings.filter((listing) => listing.listingStatus === statusFilter);
    return (<section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">Admin Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Listing Review</h1>
          <p className="mt-2 text-sm text-ink-secondary">Review Partner listings submitted for publication. Newest first.</p>
        </div>
        <label className="min-w-44 text-sm font-medium text-ink">
          <span className="sr-only">Filter by listing status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink">
            <option value="">All statuses</option>
            {statusFilterOptions.filter((option) => option !== "").map((option) => (<option key={option} value={option}>{listingStatusLabel(option)}</option>))}
          </select>
        </label>
      </div>

      {visibleListings.length === 0 ? (<div className="rounded-xl border border-line bg-white px-5 py-14 text-center">
          <h2 className="text-lg font-semibold tracking-[-0.025em]">No listings found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
            {statusFilter === ""
                ? "Partner listings submitted for review will appear here."
                : `There are no listings with status ${listingStatusLabel(statusFilter)}.`}
          </p>
        </div>) : (<ul className="grid gap-3">
          {visibleListings.map((listing) => (<li key={listing.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold tracking-[-0.025em]">{listing.title}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${listingStatusTone(listing.listingStatus)}`}>
                      {listingStatusLabel(listing.listingStatus)}
                    </span>
                    <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-secondary ring-1 ring-inset ring-line">
                      Room: {roomStatusLabel(listing.roomStatus)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-secondary">{listing.location} · {listing.propertyType}</p>
                  <p className="mt-1 text-sm text-ink-secondary">
                    <span className="font-medium text-ink">฿{rentFormatter.format(listing.monthlyRent)}</span> / month
                  </p>
                  <p className="mt-1 text-xs text-ink-secondary">
                    Partner ID: {listing.partnerUserId} · Submitted {formatBookingDate(listing.submittedAt ?? listing.createdAt)}
                  </p>
                </div>
                <Link href={`/admin/listings/${encodeURIComponent(listing.id)}`} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink btn-secondary">
                  View Details
                </Link>
              </div>
            </li>))}
        </ul>)}
    </section>);
}
