import { liveEnabled, readLive } from "@/lib/live-store";
import { readMockBookingRequests, readMockReviews } from "@/lib/mock-bookings";
import { readMockConversations } from "@/lib/mock-messages";
import { readMockListings } from "@/lib/mock-listings";
import { findMockPartnerCapability, readMockPartnerApplications } from "@/lib/mock-partner-application";
import { readMockViewingRequests } from "@/lib/mock-viewings";
// Read-only aggregation over existing mock stores. No new storage keys,
// no writes, no schema changes. Only ids observed in stored records (plus
// the current session user passed in by the caller) appear.
export function readMockUserDirectory(sessionUser) {
    if (liveEnabled())
        return readLive("users");
    if (typeof window === "undefined")
        return [];
    const drafts = new Map();
    function draftFor(id) {
        let draft = drafts.get(id);
        if (!draft) {
            draft = { names: [], bookingCount: 0, reviewCount: 0, listingCount: 0, dates: [] };
            drafts.set(id, draft);
        }
        return draft;
    }
    for (const application of readMockPartnerApplications()) {
        const draft = draftFor(application.userId);
        draft.names.unshift(application.fullName);
        draft.email ??= application.email;
        draft.phone ??= application.phone;
        draft.application = findMockPartnerCapability(application.userId) ?? application;
        draft.dates.push(application.submittedAt);
    }
    for (const booking of readMockBookingRequests()) {
        const draft = draftFor(booking.renterUserId);
        draft.names.push(booking.renterName);
        draft.bookingCount += 1;
        draft.dates.push(booking.createdAt);
    }
    for (const review of readMockReviews()) {
        draftFor(review.renterUserId).reviewCount += 1;
    }
    for (const listing of readMockListings()) {
        draftFor(listing.partnerUserId).listingCount += 1;
    }
    for (const viewing of readMockViewingRequests()) {
        draftFor(viewing.renterId).names.push(viewing.renterName);
    }
    for (const conversation of readMockConversations()) {
        if (conversation.renterName)
            draftFor(conversation.renterUserId).names.push(conversation.renterName);
        else
            draftFor(conversation.renterUserId);
    }
    if (sessionUser) {
        const draft = draftFor(sessionUser.id);
        draft.names.unshift(sessionUser.fullName);
        draft.email ??= sessionUser.email;
    }
    const users = [];
    for (const [id, draft] of drafts) {
        const dated = draft.dates.filter((value) => !Number.isNaN(new Date(value).getTime())).sort();
        users.push({
            id,
            fullName: draft.names.find((name) => name.trim() !== "") ?? "RoomStay user",
            email: draft.email,
            phone: draft.phone,
            partnerState: draft.application?.status ?? "NONE",
            application: draft.application,
            bookingCount: draft.bookingCount,
            reviewCount: draft.reviewCount,
            listingCount: draft.listingCount,
            firstSeenAt: dated[0],
        });
    }
    return users.sort((first, second) => first.fullName.localeCompare(second.fullName) || first.id.localeCompare(second.id));
}
export function findMockDirectoryUser(id, sessionUser) {
    return readMockUserDirectory(sessionUser).find((user) => user.id === id) ?? null;
}
