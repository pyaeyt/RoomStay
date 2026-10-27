import { readMockBookingRequests, saveMockBookingRequest } from "@/lib/mock-bookings";
import { readMockListings, saveMockListing } from "@/lib/mock-listings";
import { readMockPartnerApplications, saveMockPartnerApplication } from "@/lib/mock-partner-application";
import { readMockReports, saveMockReport } from "@/lib/mock-reports";
// Small, coherent demo records so the Admin Portal is demonstrable on a
// fresh browser. All ids use the stable "demo-" prefix. Records link
// consistently: applications -> users, listings -> partner, booking ->
// listing + renter, report -> listing + reporter.
//
// Idempotency: each collection is seeded only when that collection is
// empty, and every save helper skips stable ids that already exist. Real
// or user-created records are never overwritten or duplicated.
const demoApplications = [
    {
        id: "demo-app-ariya",
        userId: "demo-user-ariya",
        fullName: "Ariya Phong",
        email: "ariya.phong@example.com",
        phone: "+66 81 234 5678",
        idDocumentName: "ariya-id.png",
        idDocumentType: "image/png",
        ownershipDocumentName: "ariya-ownership.png",
        ownershipDocumentType: "image/png",
        note: "Condo owner near the river, applying to list two rooms.",
        status: "APPROVED",
        submittedAt: "2026-08-18T09:00:00Z",
        reviewedAt: "2026-08-20T09:00:00Z",
    },
    {
        id: "demo-app-krit",
        userId: "demo-user-krit",
        fullName: "Krit Sombat",
        email: "krit.sombat@example.com",
        phone: "+66 82 345 6789",
        idDocumentName: "krit-id.png",
        idDocumentType: "image/png",
        ownershipDocumentName: "krit-ownership.png",
        ownershipDocumentType: "image/png",
        note: "Shophouse owner applying to list an apartment.",
        status: "PENDING",
        submittedAt: "2026-09-06T09:00:00Z",
    },
];
const demoListings = [
    {
        id: "demo-listing-riverside",
        partnerUserId: "demo-user-ariya",
        title: "Riverside Corner Condo",
        propertyType: "Condo",
        monthlyRent: 14500,
        location: "Charoen Nakhon, Bangkok",
        description: "A bright corner condo with river views, fully furnished with air conditioning and building security.",
        bedrooms: 1,
        bathrooms: 1,
        sizeSqm: 32,
        facilities: ["Wi-Fi", "Air Conditioner", "Furnished", "Elevator", "Security / CCTV"],
        photos: [{ name: "riverside-living.jpg", type: "image/jpeg" }],
        listingStatus: "PUBLISHED",
        roomStatus: "AVAILABLE",
        createdAt: "2026-08-22T09:00:00Z",
        updatedAt: "2026-08-25T09:00:00Z",
        submittedAt: "2026-08-22T09:00:00Z",
        reviewedAt: "2026-08-25T09:00:00Z",
    },
    {
        id: "demo-listing-oldtown",
        partnerUserId: "demo-user-ariya",
        title: "Old Town Shophouse Apartment",
        propertyType: "Apartment",
        monthlyRent: 9800,
        location: "Sam Phraeng, Bangkok",
        description: "A renovated apartment above a shophouse in the old town, close to cafés and the river ferry.",
        bedrooms: 1,
        bathrooms: 1,
        sizeSqm: 28,
        facilities: ["Wi-Fi", "Air Conditioner", "Furnished"],
        photos: [{ name: "oldtown-room.jpg", type: "image/jpeg" }],
        listingStatus: "PENDING_REVIEW",
        roomStatus: "AVAILABLE",
        createdAt: "2026-09-06T09:00:00Z",
        updatedAt: "2026-09-06T09:00:00Z",
        submittedAt: "2026-09-06T09:00:00Z",
    },
];
const demoBookings = [
    {
        id: "demo-booking-active",
        propertyId: "demo-listing-riverside",
        propertyTitle: "Riverside Corner Condo",
        propertyLocation: "Charoen Nakhon, Bangkok",
        monthlyRent: 14500,
        renterUserId: "demo-user-nicha",
        renterName: "Nicha Dee",
        requestedMoveInDate: "2026-09-01",
        message: "Moving for a new job nearby, hoping to move in at the start of the month.",
        status: "ACTIVE",
        createdAt: "2026-08-28T09:00:00Z",
        approvedAt: "2026-08-29T09:00:00Z",
        rentalStartedAt: "2026-09-08T09:00:00Z",
    },
];
const demoReports = [
    {
        id: "demo-report-open",
        reporterUserId: "demo-user-nicha",
        reporterName: "Nicha Dee",
        targetType: "PROPERTY",
        targetId: "demo-listing-riverside",
        targetLabel: "Riverside Corner Condo",
        reason: "Suspected incorrect photos",
        description: "The balcony in the photos does not look like the actual room I visited.",
        status: "OPEN",
        createdAt: "2026-09-11T09:00:00Z",
    },
];
export function ensureMockDemoSeed() {
    if (typeof window === "undefined")
        return;
    try {
        if (readMockPartnerApplications().length === 0)
            demoApplications.forEach(saveMockPartnerApplication);
        if (readMockListings().length === 0)
            demoListings.forEach(saveMockListing);
        if (readMockBookingRequests().length === 0)
            demoBookings.forEach(saveMockBookingRequest);
        if (readMockReports().length === 0)
            demoReports.forEach(saveMockReport);
    }
    catch {
        // Private browsing may block localStorage; the portal still works empty.
    }
}
