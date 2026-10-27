// Run with: node --test tests/viewings.test.mjs
// Compile the existing TypeScript helpers in memory; no browser storage is touched.
import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const testDirectory = fileURLToPath(new URL(".", import.meta.url));
const requireDependency = createRequire(import.meta.url);

let storage;
let writes;
let blockedKey;
const browserWindow = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem(key, value) {
      if (key === blockedKey) throw new Error("Storage blocked");
      writes.push(key);
      storage.set(key, value);
    },
  },
  dispatchEvent() {},
};
function sourceFile(base) {
  const file = [".js", ".jsx", ".ts", ".tsx"].map((ext) => `${base}${ext}`).find((candidate) => existsSync(candidate));
  if (!file) throw new Error(`Cannot find ${base}`);
  return file;
}
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const compiledModule = { exports: {} };
  cache.set(file, compiledModule);
  const source = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  }).outputText;
  vm.runInNewContext(source, {
    module: compiledModule, exports: compiledModule.exports, window: browserWindow, Event, crypto,
    require: (name) => name.startsWith("@/") ? load(sourceFile(path.resolve(testDirectory, "../src", name.slice(2)))) : requireDependency(name),
  }, { filename: file });
  return compiledModule.exports;
}
const viewings = load(sourceFile(path.resolve(testDirectory, "../src/lib/mock-viewings")));
const notifications = load(sourceFile(path.resolve(testDirectory, "../src/lib/mock-notifications")));
const listings = load(sourceFile(path.resolve(testDirectory, "../src/lib/mock-listings")));
const { properties } = load(sourceFile(path.resolve(testDirectory, "../src/mocks/properties")));
const { formatViewingTime } = load(sourceFile(path.resolve(testDirectory, "../src/lib/viewing-time")));
const { formatBookingDate } = load(sourceFile(path.resolve(testDirectory, "../src/lib/format-date")));
const partner = { id: "partner-1", fullName: "Partner", email: "partner@example.test", isPartner: true };
const request = {
  id: "viewing-1", propertyId: "listing-1", propertyTitle: "Test Condo", renterId: "renter-1", renterName: "Renter",
  viewingDate: "2026-09-16", viewingTime: "13:00", message: "Hello", status: "REQUESTED", createdAt: "2026-09-14T10:00:00Z",
};
const listing = {
  id: "listing-1", partnerUserId: partner.id, title: "Test Condo", propertyType: "Condo", monthlyRent: 10000,
  location: "Bangkok", description: "Test", bedrooms: 1, bathrooms: 1, sizeSqm: 30, facilities: [], photos: [],
  listingStatus: "PUBLISHED", roomStatus: "AVAILABLE", createdAt: request.createdAt, updatedAt: request.createdAt,
};
function seedRequests(records) { storage.set(viewings.mockViewingRequestsKey, JSON.stringify(records)); }
beforeEach(() => {
  storage = new Map(); writes = []; blockedKey = undefined;
  storage.set(listings.mockListingsKey, JSON.stringify([listing]));
  seedRequests([request]);
  storage.set("roomstay.mockBookingRequests", JSON.stringify([{ id: "booking-1", status: "CONFIRMED" }]));
  storage.set("roomstay.mockRoomStatuses", JSON.stringify({ "listing-1": "RESERVED" }));
});

test("legacy records remain usable alongside malformed rows", () => {
  seedRequests([null, 42, {}, { ...request, status: "Requested", message: undefined }, { ...request, id: "missing-status", status: undefined }, { ...request, id: "invalid", status: "UNAVAILABLE" }]);
  const results = viewings.readMockViewingRequests();
  assert.equal(results.length, 2);
  assert.equal(results[0].status, "REQUESTED");
  assert.equal(results[0].message, "");
  assert.equal(results[1].status, "REQUESTED");
  storage.set(viewings.mockViewingRequestsKey, "broken JSON");
  assert.equal(viewings.readMockViewingRequests().length, 0);
});

test("ownership requires the matching listing owner and Partner capability", () => {
  assert.equal(viewings.partnerOwnsViewing(request, partner), true);
  for (const user of [{ ...partner, id: "other-partner" }, { ...partner, isPartner: false }]) {
    assert.equal(viewings.partnerOwnsViewing(request, user), false);
    assert.equal(viewings.reviewMockViewing(request.id, user, { status: "APPROVED" }), null);
  }
  assert.equal(viewings.partnerOwnsViewing({ ...request, propertyId: "missing" }, partner), false);
  const staticRequest = { ...request, propertyId: properties[0].id };
  storage.set(listings.mockListingsKey, JSON.stringify([{ ...listing, id: properties[0].id }]));
  assert.equal(viewings.partnerOwnsViewing(staticRequest, partner), false);
  assert.equal(writes.length, 0);
});

for (const decision of [
  { status: "APPROVED" },
  { status: "RESCHEDULE_REQUESTED", partnerSuggestedDate: "2026-09-20", partnerSuggestedTime: "15:00", partnerMessage: " Later works better. " },
  { status: "DECLINED", declineReason: " Schedule conflict. " },
]) {
  test(`${decision.status}: saves once, notifies only the renter, preserves other lifecycles`, () => {
    seedRequests([request, { ...request, id: "other-viewing", renterId: "renter-2" }]);
    const unrelated = [...storage.entries()].filter(([key]) => key !== viewings.mockViewingRequestsKey);
    const updated = viewings.reviewMockViewing(request.id, partner, decision);
    assert.equal(updated.status, decision.status);
    assert.ok(updated.updatedAt);
    assert.equal(updated.viewingDate, request.viewingDate);
    assert.equal(updated.viewingTime, request.viewingTime);
    if (decision.status === "DECLINED") assert.equal(updated.declineReason, "Schedule conflict.");
    if (decision.status === "RESCHEDULE_REQUESTED") {
      assert.equal(updated.partnerSuggestedDate, decision.partnerSuggestedDate);
      assert.equal(updated.partnerSuggestedTime, decision.partnerSuggestedTime);
      assert.equal(updated.partnerMessage, "Later works better.");
    }
    const alerts = notifications.readMockNotificationsForUser(request.renterId);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].type, "VIEWING_UPDATE");
    assert.equal(alerts[0].relatedViewingId, request.id);
    assert.equal(notifications.readMockNotificationsForUser("renter-2").length, 0);
    assert.equal(viewings.reviewMockViewing(request.id, partner, { status: "APPROVED" }), null);
    assert.equal(notifications.readMockNotifications().length, 1);
    for (const [key, value] of unrelated) assert.equal(storage.get(key), value);
    assert.ok(writes.every((key) => [viewings.mockViewingRequestsKey, notifications.mockNotificationsKey].includes(key)));
    assert.equal(viewings.readMockViewingRequests().find((item) => item.id === "other-viewing").status, "REQUESTED");
  });
}

test("invalid decisions do not write or notify", () => {
  for (const decision of [
    { status: "DECLINED", declineReason: "   " },
    { status: "RESCHEDULE_REQUESTED", partnerSuggestedDate: "", partnerSuggestedTime: "15:00" },
    { status: "RESCHEDULE_REQUESTED", partnerSuggestedDate: "2026-09-20", partnerSuggestedTime: "" },
    { status: "RESCHEDULE_REQUESTED", partnerSuggestedDate: "2026-02-30", partnerSuggestedTime: "15:00" },
    { status: "RESCHEDULE_REQUESTED", partnerSuggestedDate: "2026-09-20", partnerSuggestedTime: "25:00" },
  ]) assert.equal(viewings.reviewMockViewing(request.id, partner, decision), null);
  assert.equal(viewings.reviewMockViewing("missing", partner, { status: "APPROVED" }), null);
  assert.equal(writes.length, 0);
});

test("viewing write failure leaves the request unchanged and creates no notification", () => {
  blockedKey = viewings.mockViewingRequestsKey;
  assert.throws(() => viewings.reviewMockViewing(request.id, partner, { status: "APPROVED" }));
  assert.equal(viewings.readMockViewingRequests()[0].status, "REQUESTED");
  assert.equal(notifications.readMockNotifications().length, 0);
});

test("notification storage failure does not misreport the saved decision", () => {
  blockedKey = notifications.mockNotificationsKey;
  assert.equal(viewings.reviewMockViewing(request.id, partner, { status: "APPROVED" }).status, "APPROVED");
  assert.equal(viewings.readMockViewingRequests()[0].status, "APPROVED");
});

test("shared display helpers use readable dates and AM/PM", () => {
  assert.equal(formatBookingDate("2026-09-16"), "Sep 16, 2026");
  assert.equal(formatViewingTime("13:00"), "1:00 PM");
  assert.equal(formatViewingTime("00:30"), "12:30 AM");
  assert.equal(formatViewingTime("12:00"), "12:00 PM");
});
