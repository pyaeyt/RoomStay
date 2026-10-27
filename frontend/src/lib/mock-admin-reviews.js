import { readMockBookingRequests, readMockReviews } from "@/lib/mock-bookings";
import { findMockListingById } from "@/lib/mock-listings";
import { properties } from "@/mocks/properties";
export const reviewStatusLabels = {
    VISIBLE: "Visible", REPORTED: "Reported", HIDDEN: "Hidden",
};
export function reviewStatusTone(status) {
    if (status === "VISIBLE")
        return "bg-[#e7f6ee] text-[#1d7a3f] ring-[#c9e9d4]";
    if (status === "REPORTED")
        return "bg-amber-50 text-amber-800 ring-amber-200";
    return "bg-canvas text-ink-secondary ring-line";
}
// Read-only join over existing stores. Missing bookings do not hide reviews
// from moderation; their stored renter and booking references remain available.
export function readAdminReviews() {
    const bookings = new Map(readMockBookingRequests().map((booking) => [booking.id, booking]));
    return readMockReviews().map((review) => {
        const booking = bookings.get(review.bookingId);
        const property = booking && properties.find((item) => item.id === booking.propertyId);
        const listing = booking && !property ? findMockListingById(booking.propertyId) : null;
        return {
            ...review,
            status: review.status ?? "VISIBLE",
            reviewerName: booking?.renterUserId === review.renterUserId ? booking.renterName : review.renterUserId,
            propertyTitle: booking?.propertyTitle ?? "Property unavailable",
            propertyHref: property ? `/properties/${encodeURIComponent(property.id)}`
                : listing ? `/admin/listings/${encodeURIComponent(listing.id)}` : undefined,
        };
    }).reverse().sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
}
export function filterAdminReviews(reviews, query, status) {
    const search = query.trim().toLowerCase();
    return reviews.filter((review) => (status === "ALL" || review.status === status)
        && (!search || review.reviewerName.toLowerCase().includes(search) || review.propertyTitle.toLowerCase().includes(search)));
}
