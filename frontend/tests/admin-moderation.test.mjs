// Run with: node --test tests/admin-moderation.test.mjs
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const sourceDirectory = fileURLToPath(new URL("../src/", import.meta.url));
const requireDependency = createRequire(import.meta.url);
const storage = new Map();
const events = [];
let blockedKey;
const browserWindow = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => {
      if (key === blockedKey) throw new Error("Storage blocked");
      storage.set(key, value);
    },
  },
  dispatchEvent: (event) => events.push(event.type),
};
const cache = new Map();
function load(relative) {
  const base = path.resolve(sourceDirectory, relative);
  const file = [".js", ".jsx", ".ts", ".tsx"].map((ext) => `${base}${ext}`).find((candidate) => existsSync(candidate));
  if (cache.has(file)) return cache.get(file).exports;
  const compiledModule = { exports: {} };
  cache.set(file, compiledModule);
  const source = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  }).outputText;
  vm.runInNewContext(source, {
    module: compiledModule, exports: compiledModule.exports, window: browserWindow, Event, crypto,
    require: (name) => name.startsWith("@/") ? load(name.slice(2)) : requireDependency(name),
  }, { filename: file });
  return compiledModule.exports;
}
const audit = load("lib/mock-audit-logs");
const reviews = load("lib/mock-bookings");
const admin = load("lib/mock-admin-reviews");
const applications = load("lib/mock-partner-application");
const listings = load("lib/mock-listings");
const reports = load("lib/mock-reports");
const { ensureMockDemoSeed } = load("lib/mock-demo-seed");
const { properties } = load("mocks/properties");
const legacyReview = {
  id: "review-1", bookingId: "demo-booking-active", renterUserId: "demo-user-nicha",
  rating: 4, comment: "Original comment\nwith a second line.", createdAt: "2026-09-15T09:00:00Z",
};

beforeEach(() => {
  storage.clear(); events.length = 0; blockedKey = undefined;
  ensureMockDemoSeed();
  const booking = reviews.findMockBookingRequest(legacyReview.bookingId);
  reviews.updateMockBookingRequest({ ...booking, status: "COMPLETED" });
  storage.set(reviews.mockReviewsKey, JSON.stringify([legacyReview]));
});

test("legacy reviews default to visible; reported and hidden statuses survive reads and subsequent saves", () => {
  storage.set(reviews.mockReviewsKey, JSON.stringify([
    legacyReview,
    { ...legacyReview, id: "reported", bookingId: "reported-booking", status: "REPORTED" },
    { ...legacyReview, id: "hidden", bookingId: "hidden-booking", status: "HIDDEN", moderatedAt: "2026-09-16T00:00:00Z", moderatedBy: "Mock Admin" },
    null, {},
  ]));
  assert.equal(reviews.readMockReviews().length, 3);
  assert.equal(reviews.readMockReviews()[0].status, "VISIBLE");
  reviews.saveMockReview({ ...legacyReview, id: "new", bookingId: "new-booking" });
  assert.equal(reviews.readMockReviews().find((review) => review.id === "reported").status, "REPORTED");
  assert.equal(reviews.readMockReviews().find((review) => review.id === "hidden").moderatedBy, "Mock Admin");
  assert.equal(reviews.readVisibleMockReviews().length, 3);
  assert.ok(events.includes(reviews.mockReviewsChangedEvent));
  assert.equal(audit.readMockAuditLogs().length, 0);
});

test("hide/restore preserves review content, renter history, duplicate protection, and unrelated records", () => {
  const before = new Map(storage);
  const hidden = reviews.moderateMockReview(legacyReview.id, "HIDDEN");
  assert.equal(hidden.status, "HIDDEN");
  for (const [key, value] of Object.entries(legacyReview)) assert.equal(hidden[key], value);
  assert.equal(reviews.readVisibleMockReviews().length, 0);
  assert.equal(reviews.findMockReviewForBooking(legacyReview.bookingId).id, legacyReview.id);
  reviews.saveMockReview({ ...legacyReview, id: "duplicate" });
  assert.equal(reviews.readMockReviews().length, 1);
  assert.equal(reviews.moderateMockReview(legacyReview.id, "HIDDEN"), null);
  const restored = reviews.moderateMockReview(legacyReview.id, "VISIBLE");
  assert.equal(restored.status, "VISIBLE");
  for (const [key, value] of Object.entries(legacyReview)) assert.equal(restored[key], value);
  assert.equal(reviews.readVisibleMockReviews().length, 1);
  assert.equal(reviews.moderateMockReview(legacyReview.id, "VISIBLE"), null);
  for (const [key, value] of before) if (key !== reviews.mockReviewsKey) assert.equal(storage.get(key), value, key);
  const history = audit.readMockAuditLogs();
  assert.equal(history.length, 2);
  assert.equal(history[0].action, "REVIEW_RESTORED");
  assert.equal(history[1].action, "REVIEW_HIDDEN");
  assert.equal(history[0].targetName, "Review of Riverside Corner Condo");
});

test("reported review can be hidden, and restoration returns it to visible", () => {
  storage.set(reviews.mockReviewsKey, JSON.stringify([{ ...legacyReview, status: "REPORTED" }]));
  assert.equal(reviews.readVisibleMockReviews().length, 1);
  assert.equal(reviews.moderateMockReview(legacyReview.id, "HIDDEN").status, "HIDDEN");
  assert.equal(reviews.moderateMockReview(legacyReview.id, "VISIBLE").status, "VISIBLE");
  assert.ok(audit.readMockAuditLogs()[1].details.includes("REPORTED → HIDDEN"));
});

test("Admin join supports newest-first search and filters, real property links, and orphaned review moderation", () => {
  reviews.saveMockReview({ ...legacyReview, id: "orphan", bookingId: "missing-booking", createdAt: "2026-09-16T10:00:00Z", status: "REPORTED" });
  const rows = admin.readAdminReviews();
  assert.equal(rows[0].id, "orphan");
  assert.equal(rows[0].reviewerName, legacyReview.renterUserId);
  assert.equal(rows[0].propertyHref, undefined);
  assert.equal(rows[1].propertyHref, "/admin/listings/demo-listing-riverside");
  assert.equal(admin.filterAdminReviews(rows, " nIcHa ", "VISIBLE").length, 1);
  assert.equal(admin.filterAdminReviews(rows, "riverside", "ALL").length, 1);
  assert.equal(admin.filterAdminReviews(rows, "riverside", "REPORTED").length, 0);
  assert.equal(admin.filterAdminReviews(rows, "", "REPORTED").length, 1);
  assert.equal(reviews.moderateMockReview("orphan", "HIDDEN").status, "HIDDEN");
  const booking = reviews.findMockBookingRequest(legacyReview.bookingId);
  reviews.updateMockBookingRequest({ ...booking, propertyId: properties[0].id });
  assert.equal(admin.readAdminReviews().find((row) => row.id === legacyReview.id).propertyHref, `/properties/${properties[0].id}`);
});

test("all eleven Admin actions append actor, target, timestamp and details only after successful changes", () => {
  assert.equal(audit.readMockAuditLogs().length, 0); // Demo seed does not fabricate activity.
  const pending = applications.findMockPartnerApplicationById("demo-app-krit");
  applications.saveMockPartnerApplication({ ...pending, id: "app-reject", userId: "other-user" });
  applications.reviewMockPartnerApplication(pending.id, { status: "APPROVED" });
  applications.reviewMockPartnerApplication("app-reject", { status: "REJECTED", rejectionReason: "Missing document" });
  applications.changeMockPartnerAccess(pending.id, { status: "SUSPENDED", reason: "Listing issue", suspendedBy: "Mock Admin" });
  applications.changeMockPartnerAccess(pending.id, { status: "APPROVED" });
  const pendingListing = listings.findMockListingById("demo-listing-oldtown");
  listings.saveMockListing({ ...pendingListing, id: "listing-reject" });
  listings.reviewMockListing(pendingListing.id, { status: "PUBLISHED" });
  listings.reviewMockListing("listing-reject", { status: "REJECTED", rejectionReason: "Incomplete photos" });
  const report = reports.findMockReportById("demo-report-open");
  reports.saveMockReport({ ...report, id: "report-dismiss" });
  reports.reviewMockReport(report.id, { status: "UNDER_REVIEW" });
  reports.reviewMockReport(report.id, { status: "RESOLVED", resolutionNote: "Corrected photos" });
  reports.reviewMockReport("report-dismiss", { status: "DISMISSED", resolutionNote: "No issue" });
  reviews.moderateMockReview(legacyReview.id, "HIDDEN");
  reviews.moderateMockReview(legacyReview.id, "VISIBLE");
  const entries = audit.readMockAuditLogs();
  assert.equal(entries.length, 11);
  assert.deepEqual(new Set(entries.map((entry) => entry.action)), new Set(Object.keys(audit.auditActionLabels)));
  for (const entry of entries) {
    assert.equal(entry.actorLabel, "Mock Admin");
    assert.ok(Number.isFinite(Date.parse(entry.timestamp)));
    assert.ok(entry.targetType && entry.targetId && entry.targetName && entry.details);
  }
  assert.equal(new Set(entries.map((entry) => entry.id)).size, 11);
  assert.ok(entries.find((entry) => entry.action === "PARTNER_APPLICATION_REJECTED").details.includes("Missing document"));
  assert.ok(entries.find((entry) => entry.action === "REPORT_RESOLVED").details.includes("Corrected photos"));
  assert.equal(applications.reviewMockPartnerApplication(pending.id, { status: "APPROVED" }), null);
  assert.equal(applications.changeMockPartnerAccess(pending.id, { status: "APPROVED" }), null);
  assert.equal(listings.reviewMockListing(pendingListing.id, { status: "PUBLISHED" }), null);
  assert.equal(reports.reviewMockReport(report.id, { status: "UNDER_REVIEW" }), null);
  assert.equal(reviews.moderateMockReview(legacyReview.id, "VISIBLE"), null);
  assert.equal(reviews.moderateMockReview("missing-review", "HIDDEN"), null);
  assert.equal(audit.readMockAuditLogs().length, 11);
});

test("failed primary writes never emit success logs; audit failure does not misreport a saved review change", () => {
  blockedKey = reviews.mockReviewsKey;
  assert.throws(() => reviews.moderateMockReview(legacyReview.id, "HIDDEN"), /Storage blocked/);
  assert.equal(reviews.findMockReviewForBooking(legacyReview.bookingId).status, "VISIBLE");
  assert.equal(audit.readMockAuditLogs().length, 0);
  blockedKey = applications.mockPartnerApplicationsKey;
  assert.throws(() => applications.reviewMockPartnerApplication("demo-app-krit", { status: "APPROVED" }), /Storage blocked/);
  assert.equal(audit.readMockAuditLogs().length, 0);
  blockedKey = listings.mockListingsKey;
  assert.throws(() => listings.reviewMockListing("demo-listing-oldtown", { status: "PUBLISHED" }), /Storage blocked/);
  assert.equal(audit.readMockAuditLogs().length, 0);
  blockedKey = reports.mockReportsKey;
  assert.throws(() => reports.reviewMockReport("demo-report-open", { status: "UNDER_REVIEW" }), /Storage blocked/);
  assert.equal(audit.readMockAuditLogs().length, 0);
  blockedKey = audit.mockAuditLogsKey;
  assert.equal(reviews.moderateMockReview(legacyReview.id, "HIDDEN").status, "HIDDEN");
  assert.equal(audit.readMockAuditLogs().length, 0);
});

test("audit reader tolerates malformed rows, sorts timestamps, and append preserves existing activity", () => {
  const entry = { id: "old", timestamp: "2026-09-01T00:00:00Z", actorLabel: "Mock Admin", action: "REVIEW_HIDDEN", targetType: "REVIEW", targetId: "old-review", targetName: "Old review", details: "Old action" };
  storage.set(audit.mockAuditLogsKey, JSON.stringify([{ ...entry, id: "newer", timestamp: "2026-09-02T00:00:00Z" }, entry, {}, null, { ...entry, action: "toString" }]));
  assert.equal(audit.readMockAuditLogs().length, 2);
  assert.equal(audit.readMockAuditLogs()[0].id, "newer");
  reviews.moderateMockReview(legacyReview.id, "HIDDEN");
  assert.equal(audit.readMockAuditLogs().length, 3);
  assert.equal(audit.readMockAuditLogs()[2].id, "old");
  storage.set(audit.mockAuditLogsKey, "broken JSON");
  assert.equal(audit.readMockAuditLogs().length, 0);
  reviews.moderateMockReview(legacyReview.id, "VISIBLE");
  assert.equal(storage.get(audit.mockAuditLogsKey), "broken JSON");
});
