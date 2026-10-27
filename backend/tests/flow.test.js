import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const futureDate = "2026-11-15";
const deadline = "2026-12-01T09:00:00.000Z";

async function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function api(server, method, pathname, { token, body } = {}) {
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  try {
    return { status: response.status, json: text ? JSON.parse(text) : null };
  } catch (error) {
    const wrapped = new Error(`Non-JSON ${response.status} ${pathname}: ${text.slice(0, 500)}`);
    wrapped.cause = error;
    throw wrapped;
  }
}

test("RoomStay API covers accounts, listings, viewings, bookings, deposits, reviews, and records", async (t) => {
  let server;
  let dataDir;
  let failed = false;
  try {
  dataDir = await mkdtemp(path.join(tmpdir(), "roomstay-"));
  const { ensureDatabase } = await import("../src/ensure-database.js");
  const database = await ensureDatabase({ forceEmbedded: true, dataDir, port: 0 });
  const { prisma } = await import("../src/db.js");
  const { seed } = await import("../prisma/seed.js");
  const { createApp } = await import("../src/app.js");
  await seed(prisma);
  server = await listen(createApp());

  t.after(() => {
    server?.closeAllConnections();
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
    // The embedded database keeps the event loop open after the API checks finish.
    setTimeout(() => process.exit(failed ? 1 : 0), 200);
  });
  const health = await api(server, "GET", "/api/health");
  assert.equal(health.status, 200);

  const catalog = await api(server, "GET", "/api/properties?q=Ari");
  assert.equal(catalog.status, 200);
  assert.ok(catalog.json.properties.some((property) => property.id === "cozy-condo" && property.roomStatus === "AVAILABLE"));
  assert.equal((await api(server, "POST", "/api/favorites/cozy-condo")).status, 401);

  const renter = await api(server, "POST", "/api/auth/login", { body: { email: "renter@roomstay.test", password: "password123" } });
  const partner = await api(server, "POST", "/api/auth/login", { body: { email: "partner@roomstay.test", password: "password123" } });
  const admin = await api(server, "POST", "/api/auth/login", { body: { email: "admin@roomstay.test", password: "password123" } });
  assert.equal(renter.json.user.isPartner, false);
  assert.equal(partner.json.user.isPartner, true);
  assert.equal(admin.json.user.role, "ADMIN");

  const unavailableViewing = await api(server, "POST", "/api/viewings", {
    token: renter.json.token,
    body: { propertyId: "modern-studio", viewingDate: futureDate, viewingTime: "10:00" },
  });
  assert.equal(unavailableViewing.status, 409);

  const viewing = await api(server, "POST", "/api/viewings", {
    token: renter.json.token,
    body: { propertyId: "cozy-condo", viewingDate: futureDate, viewingTime: "10:00", message: "Morning works" },
  });
  assert.equal(viewing.status, 201);
  const decided = await api(server, "POST", `/api/partner/viewings/${viewing.json.viewing.id}/decision`, {
    token: partner.json.token,
    body: { status: "APPROVED" },
  });
  assert.equal(decided.json.viewing.status, "APPROVED");
  const stillAvailable = await api(server, "GET", "/api/properties/cozy-condo");
  assert.equal(stillAvailable.json.property.roomStatus, "AVAILABLE");

  const saved = await api(server, "POST", "/api/favorites/cozy-condo", { token: renter.json.token });
  assert.equal(saved.json.saved, true);
  const message = await api(server, "POST", "/api/conversations", {
    token: renter.json.token,
    body: { propertyId: "cozy-condo", text: "Is the condo still open?" },
  });
  assert.equal(message.status, 201);

  const other = await api(server, "POST", "/api/auth/register", {
    body: { fullName: "Second Renter", email: "second@roomstay.test", password: "password123" },
  });
  const firstBooking = await api(server, "POST", "/api/bookings", {
    token: renter.json.token,
    body: { propertyId: "cozy-condo", requestedMoveInDate: futureDate, message: "Need it in November" },
  });
  const secondBooking = await api(server, "POST", "/api/bookings", {
    token: other.json.token,
    body: { propertyId: "cozy-condo", requestedMoveInDate: futureDate },
  });
  assert.equal(firstBooking.json.booking.status, "PENDING");
  assert.equal(secondBooking.json.booking.status, "PENDING");

  const approved = await api(server, "POST", `/api/partner/bookings/${firstBooking.json.booking.id}/approve`, {
    token: partner.json.token,
    body: { depositAmount: 10000, paymentDeadline: deadline },
  });
  assert.equal(approved.json.booking.status, "DEPOSIT_PENDING");
  assert.equal(approved.json.booking.roomStatus, "RESERVED");
  assert.match(approved.json.booking.deposit.paymentInstructions, /does not process the bank transfer/);
  const blocked = await api(server, "GET", `/api/bookings/${secondBooking.json.booking.id}`, { token: other.json.token });
  assert.equal(blocked.json.booking.status, "DECLINED");
  const third = await api(server, "POST", "/api/bookings", {
    token: other.json.token,
    body: { propertyId: "cozy-condo", requestedMoveInDate: futureDate },
  });
  assert.equal(third.status, 409);

  const evidence = await api(server, "POST", `/api/bookings/${firstBooking.json.booking.id}/evidence`, {
    token: renter.json.token,
    body: { fileName: "slip.png", fileType: "image/png", note: "Paid at the bank" },
  });
  assert.equal(evidence.json.booking.status, "VERIFICATION_PENDING");
  const verified = await api(server, "POST", `/api/partner/bookings/${firstBooking.json.booking.id}/verify-evidence`, {
    token: partner.json.token,
  });
  assert.equal(verified.json.booking.status, "CONFIRMED");
  assert.equal(verified.json.booking.roomStatus, "RESERVED");
  const started = await api(server, "POST", `/api/partner/bookings/${firstBooking.json.booking.id}/start`, { token: partner.json.token });
  assert.equal(started.json.booking.status, "ACTIVE");
  assert.equal(started.json.booking.roomStatus, "RENTED");
  const completed = await api(server, "POST", `/api/partner/bookings/${firstBooking.json.booking.id}/complete`, { token: partner.json.token });
  assert.equal(completed.json.booking.status, "COMPLETED");
  assert.equal(completed.json.booking.roomStatus, "AVAILABLE");
  const review = await api(server, "POST", `/api/bookings/${firstBooking.json.booking.id}/review`, {
    token: renter.json.token,
    body: { rating: 5, comment: "Quiet and clean." },
  });
  assert.equal(review.status, 201);
  assert.equal((await api(server, "POST", `/api/bookings/${firstBooking.json.booking.id}/review`, {
    token: renter.json.token,
    body: { rating: 4, comment: "Again" },
  })).status, 409);

  const report = await api(server, "POST", "/api/reports", {
    token: renter.json.token,
    body: { targetType: "PROPERTY", targetId: "cozy-condo", targetLabel: "Cozy Condo Near BTS", reason: "Incorrect photo", description: "The cover is outdated." },
  });
  const resolved = await api(server, "POST", `/api/admin/reports/${report.json.report.id}/review`, {
    token: admin.json.token,
    body: { status: "RESOLVED", resolutionNote: "Asked the partner to replace the photo." },
  });
  assert.equal(resolved.json.report.status, "RESOLVED");
  const logs = await api(server, "GET", "/api/admin/audit-logs", { token: admin.json.token });
  assert.ok(logs.json.auditLogs.some((entry) => entry.action === "RENTAL_COMPLETED"));

  const applicant = await api(server, "POST", "/api/auth/login", { body: { email: "applicant@roomstay.test", password: "password123" } });
  const granted = await api(server, "POST", "/api/admin/partner-applications/app-applicant/review", {
    token: admin.json.token,
    body: { status: "APPROVED" },
  });
  assert.equal(granted.json.application.status, "APPROVED");
  const freshApplicant = await api(server, "POST", "/api/auth/login", { body: { email: "applicant@roomstay.test", password: "password123" } });
  const listing = await api(server, "POST", "/api/partner/listings", {
    token: freshApplicant.json.token,
    body: {
      title: "River Apartment",
      propertyType: "Apartment",
      monthlyRent: 12000,
      area: "Bang Rak",
      province: "Bangkok",
      description: "A bright apartment near the river.",
      bedrooms: 1,
      bathrooms: 1,
      sizeSqm: 34,
      facilities: ["Wi-Fi"],
      photos: [{ name: "river.jpg", type: "image/jpeg" }],
    },
  });
  assert.equal(listing.json.listing.listingStatus, "DRAFT");
  assert.equal(listing.json.listing.location, "Bang Rak, Bangkok");
  await api(server, "POST", `/api/partner/listings/${listing.json.listing.id}/submit`, { token: freshApplicant.json.token });
  const published = await api(server, "POST", `/api/admin/listings/${listing.json.listing.id}/review`, {
    token: admin.json.token,
    body: { status: "PUBLISHED" },
  });
  assert.equal(published.json.listing.roomStatus, "AVAILABLE");
  const visible = await api(server, "GET", `/api/properties/${listing.json.listing.id}`);
  assert.equal(visible.status, 200);

  await api(server, "POST", `/api/admin/partners/${applicant.json.user.id}/suspend`, {
    token: admin.json.token,
    body: { reason: "Ownership document needs another look." },
  });
  assert.equal((await api(server, "GET", `/api/properties/${listing.json.listing.id}`)).status, 404);
  const hiddenAction = await api(server, "POST", "/api/partner/listings", {
    token: freshApplicant.json.token,
    body: listing.json.listing,
  });
  assert.equal(hiddenAction.status, 403);

  const expiring = await api(server, "POST", "/api/bookings", {
    token: renter.json.token,
    body: { propertyId: "cozy-condo", requestedMoveInDate: futureDate },
  });
  await api(server, "POST", `/api/partner/bookings/${expiring.json.booking.id}/approve`, {
    token: partner.json.token,
    body: { depositAmount: 2000, paymentDeadline: deadline },
  });
  await prisma.booking.update({
    where: { id: expiring.json.booking.id },
    data: { paymentDeadline: new Date("2026-10-01T00:00:00.000Z") },
  });
  const expired = await api(server, "GET", `/api/bookings/${expiring.json.booking.id}`, { token: renter.json.token });
  assert.equal(expired.json.booking.status, "EXPIRED");
  assert.equal(expired.json.booking.roomStatus, "AVAILABLE");
  } catch (error) {
    failed = true;
    console.error(error);
    throw error;
  }
});
