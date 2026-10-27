# RoomStay frontend

RoomStay's website is this Next.js App Router app, written in JavaScript with React and Tailwind CSS. It calls the API in `../backend`. The database is Supabase Postgres.

## Implemented frontend areas

- Home / Search landing page at `/`
- Search Results at `/search`
- Property Details at `/properties/[id]`
- Login and Register with mock Normal User signup only
- Mock auth state, protected renter actions, and mock logout
- Favorites at `/favorites`
- Mock renter messages at `/messages` and `/messages/[conversationId]`
- Mock notifications at `/notifications`
- Request Viewing at `/properties/[id]/request-viewing`
- My Viewings at `/viewings` and viewing details at `/viewings/[id]`
- Partner viewing requests and review at `/partner/viewings` and `/partner/viewings/[id]`
- Request Booking at `/properties/[id]/request-booking`
- My Bookings at `/bookings`
- Booking Details at `/bookings/[id]`
- Deposit pending display, external payment instructions, and payment evidence upload at `/bookings/[id]/upload-evidence`
- Partner booking review at `/partner/bookings` and `/partner/bookings/[id]`
- Booking lifecycle through deposit pending, verification pending, confirmed, active rental, completed rental, expired, declined, and review eligibility
- Review form at `/bookings/[id]/review`
- Partner application and status flow
- Partner listing draft/submission/edit flow
- Mock Admin review pages for Partner applications and listings
- Published Partner listings merging into renter search/detail/favorites views

All implemented behavior is frontend-only and intended for UI/business-flow prototyping.

## Current mock data

The shared public property source starts with 12 properties in `src/mocks/properties.js`. Published Partner listings stored in `localStorage` are merged into renter-facing property views at runtime.

Mock browser storage includes:

- `roomstay.mockUser`
- `roomstay.pendingAction`
- `roomstay.mockBookingRequests`
- `roomstay.mockRoomStatuses`
- `roomstay.mockPaymentEvidence`
- `roomstay.mockReviews`
- `roomstay.mockFavorites`
- `roomstay.mockViewingRequests`
- `roomstay.mockConversations`
- `roomstay.mockNotifications`
- `roomstay.mockPartnerApplications`
- `roomstay.mockListings`

File inputs store metadata only. Uploaded files, payment evidence images, listing photos, and application documents are not uploaded to a server.

## Business-flow notes

Booking request submission creates a `PENDING` booking and does not reserve the room. Partner approval moves the booking to `DEPOSIT_PENDING`, stores the deposit amount and payment deadline, and marks the property as `RESERVED`. Evidence upload moves the booking to `VERIFICATION_PENDING`. Partner verification moves it to `CONFIRMED` while the room remains `RESERVED`. Starting the rental moves the booking to `ACTIVE` and the room to `RENTED`. Completing the rental moves the booking to `COMPLETED` and the room back to `AVAILABLE`.

Payment is external. RoomStay only records mock payment instructions and evidence metadata. Reviews are allowed only once per completed booking and derive the property through the booking record.

Partner listing review is separate from room availability. Listing statuses include draft, pending review, published, rejected, and suspended. Only published listings are visible in renter-facing search/detail flows.

## Responsive design

RoomStay is treated as a desktop web application with responsive tablet and mobile layouts.

- Below 768px: one-column mobile layout with mobile navigation where appropriate.
- From 768px: tablet layouts use wider spacing and two-column grids where suitable.
- From 1024px: desktop navigation and wider grids are used.
- From 1280px: large desktop grids may expand to four columns.
- Main content is generally capped at 1440px and centered.

The visual reference is the final UI screenshots in the project documents.

## Run locally

Use Node.js 20.9 or newer.

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000. If another app is using port 3000, run:

```sh
npm run dev -- --port 3001
```

## Verification

```sh
npm run lint
npm run build
node --test tests/*.mjs
```

## Project structure

- `src/app/`: App Router routes, layouts, and global CSS
- `src/components/`: Shared UI and route-level client components
- `src/mocks/`: Shared mock property records
- `src/types/`: Shared listing options used by search and listing forms
- `src/lib/`: Mock storage helpers, filters, formatting, and frontend utilities
- `public/`: Local images, fonts, and static assets

The `@/*` import alias points to `src/*`.

## Source-of-truth priority

1. Final project requirements provided by the project owner
2. Final ERD
3. Final booking flowchart
4. Final partner onboarding flowchart
5. Final UI screenshots
6. `docs/` for the ERD, flowcharts, and architecture notes

## Mock viewing management

Viewing requests share the existing `roomstay.mockViewingRequests` store. New requests use `REQUESTED`; legacy `Requested` records (or records without a status) are normalized on read. The supported statuses are `REQUESTED`, `APPROVED`, `RESCHEDULE_REQUESTED`, and `DECLINED`. Viewing is optional and viewing decisions never update bookings, payments, listings, or room status. Existing request eligibility remains unchanged: `UNAVAILABLE` blocks viewing requests; the existing form permits `AVAILABLE`, `RESERVED`, and `RENTED`.

Logged-in accounts can open **Profile → My Viewings** and see only their own requests. Both lists include status filters. Renter details show the original request and any Partner suggestion or decline reason. There is no renter accept/reject reschedule action. Partners may approve, suggest a required date/time with an optional message, or decline with a required reason, only while a request is `REQUESTED`. Responses create `VIEWING_UPDATE` notifications in the existing notification store with links to renter viewing details.

Ownership uses `MockListing.partnerUserId` and the existing `MockUser.isPartner` capability, including on direct review routes and decision writes. The original static properties have display-only owners without account IDs; their viewing requests remain visible to the renter but cannot be reviewed in the Partner portal. No ownership is inferred from names, and static property IDs take precedence over colliding listing IDs. Published listings use the existing fallback property photo because listing uploads store metadata only. Existing requests without a location use the current property/listing location where available.

All access checks and notifications are browser-local mock behavior, not server authorization. To exercise the full flow, publish a Partner-owned mock listing, request a viewing as a renter in the same browser, then sign in with that listing's Partner account to review it. Repeated decisions are blocked, and same-tab and cross-tab storage updates refresh the lists/details. Notification write failures do not undo a saved viewing response.
