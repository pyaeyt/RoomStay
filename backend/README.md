# RoomStay API

Express REST API for the RoomStay rental system. It uses Prisma and a Supabase Postgres database, and follows the same processes as the JavaScript Next.js frontend:

1. Accounts and partner applications
2. Listings and moderation
3. Browse, search, and favorites
4. Messaging
5. Optional viewing appointments
6. Bookings and room status
7. Reservation deposit evidence
8. Reviews, reports, notifications, and audit records

Payment happens outside RoomStay. The API stores the deposit amount, deadline, payment instructions, uploaded evidence, and verification result. It does not process a bank transfer.

The website in `../frontend` is JavaScript and calls this API.

## Run

Create a Supabase project and set `DATABASE_URL` in `.env` to its Postgres connection string (direct connection or session pooler, port 5432).

```sh
cd backend
cp .env.example .env
npm ci
npm start
```

The API listens on http://localhost:4000 and creates the RoomStay tables in Supabase. If `DATABASE_URL` is not set, it starts a local PostgreSQL-compatible database instead, creates the schema, and seeds demo data.

Demo password for every account: `password123`

| Role | Email |
| --- | --- |
| Renter | renter@roomstay.test |
| Partner | partner@roomstay.test |
| Applicant | applicant@roomstay.test |
| Admin | admin@roomstay.test |

To use Docker Postgres instead of Supabase, start the database and set `DATABASE_URL` in `.env` to `postgresql://roomstay:roomstay@localhost:5432/roomstay`.

```sh
docker compose up -d
npm start
```

## Checks

```sh
npm test
```

## Main behavior

- Public signup creates a Normal User. Admin accounts are seeded, not registered.
- A user becomes a Partner only after an admin approves the application. Suspension hides published listings and blocks new partner activity. Existing bookings and history stay.
- Guests can search and open published properties. Favorites, messages, viewings, bookings, reviews, reports, and partner applications require login.
- A viewing decision never changes a booking or a room. Unavailable rooms cannot be viewed.
- A booking request stays `PENDING` and does not reserve the room. Partner approval requires a deposit amount and a future deadline, sets the room to `RESERVED`, and declines other pending requests for that room.
- The renter uploads evidence before the deadline. Partner verification sets the booking to `CONFIRMED` and leaves the room reserved. Rejection before the deadline returns the booking to `DEPOSIT_PENDING`. Rejection after the deadline, or a missed deadline, expires the booking and returns the room to `AVAILABLE` when nothing else holds it.
- Starting the rental sets the booking to `ACTIVE` and the room to `RENTED`. Completing it sets the booking to `COMPLETED` and returns the room to `AVAILABLE`. One review is allowed after completion.
- A partner can record a refund only after cancellation. The refund record does not move money.
