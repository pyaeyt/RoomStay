// Run with: node --test tests/partner-suspension.test.mjs
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const sourceDirectory = fileURLToPath(new URL("../src/", import.meta.url));
const requireDependency = createRequire(import.meta.url);
const storage = new Map();
const events = [];
let auth;
let pathname;
const browserWindow = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    module: compiledModule, exports: compiledModule.exports, window: browserWindow, Event, crypto,
    require: (name) => {
      if (name === "@/lib/mock-auth") return { useMockAuth: () => auth };
      if (name === "next/navigation") return { usePathname: () => pathname };
      if (name === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
      return name.startsWith("@/") ? load(name.slice(2)) : requireDependency(name);
    },
  }, { filename: file });
  return compiledModule.exports;
}

const applications = load("lib/mock-partner-application");
const listings = load("lib/mock-listings");
const published = load("lib/published-listings");
const notifications = load("lib/mock-notifications");
const users = load("lib/mock-users");
const bookings = load("lib/mock-bookings");
const viewings = load("lib/mock-viewings");
const { PartnerAccessGuard } = load("components/partner-access-guard");
const approved = {
  id: "application-1", userId: "partner-1", fullName: "Partner One", email: "partner@example.com", phone: "123",
  idDocumentName: "id.pdf", idDocumentType: "application/pdf", ownershipDocumentName: "ownership.pdf",
  ownershipDocumentType: "application/pdf", note: "Original note", status: "APPROVED",
  submittedAt: "2026-09-01T00:00:00Z", reviewedAt: "2026-09-02T00:00:00Z",
};
const listing = {
  id: "partner-listing", partnerUserId: "partner-1", title: "Partner condo", propertyType: "Condo",
  monthlyRent: 8500, location: "Ari, Bangkok", description: "An existing listing", bedrooms: 1, bathrooms: 1,
  sizeSqm: 30, facilities: [], photos: [], listingStatus: "PUBLISHED", roomStatus: "AVAILABLE",
  createdAt: "2026-09-03T00:00:00Z", updatedAt: "2026-09-03T00:00:00Z",
};
const cachedUser = { id: "partner-1", fullName: "Partner One", email: "partner@example.com", isPartner: true };
const suspend = (reason = "Repeated listing issues") => applications.changeMockPartnerAccess(approved.id, { status: "SUSPENDED", reason, suspendedBy: "Mock Admin" });

beforeEach(() => {
  storage.clear();
  events.length = 0;
  applications.saveMockPartnerApplication({ ...approved, id: "old-rejection", status: "REJECTED", submittedAt: "2026-08-01T00:00:00Z", rejectionReason: "Missing document" });
  applications.saveMockPartnerApplication(approved);
  listings.saveMockListing(listing);
  auth = { user: cachedUser, isReady: true, partnerApplication: approved };
  pathname = "/partner";
});

test("suspend and restore only the approved capability, preserving account, application history and related stores", () => {
  const protectedKeys = ["roomstay.mockUser", "roomstay.mockBookingRequests", "roomstay.mockReviews", "roomstay.mockMessages", "roomstay.mockConversations", "roomstay.mockViewingRequests"];
  for (const key of protectedKeys) storage.set(key, JSON.stringify({ preserved: key }));
  storage.set("roomstay.mockUser", JSON.stringify(cachedUser));
  const before = new Map(storage);
  const suspended = suspend("  Repeated listing issues  ");
  assert.equal(suspended.status, "SUSPENDED");
  assert.equal(suspended.suspensionReason, "Repeated listing issues");
  assert.equal(suspended.suspendedBy, "Mock Admin");
  assert.ok(Number.isFinite(Date.parse(suspended.suspendedAt)));
  assert.equal(suspended.reviewedAt, approved.reviewedAt);
  assert.equal(suspended.note, approved.note);
  assert.equal(applications.hasMockPartnerAccess(cachedUser), false);
  assert.equal(applications.findBlockingMockPartnerApplication(cachedUser.id).status, "SUSPENDED");
  assert.equal(users.findMockDirectoryUser(cachedUser.id).partnerState, "SUSPENDED");
  assert.equal(published.findPublicProperty(listing.id), undefined);
  assert.equal(bookings.partnerOwnsBooking({ propertyId: listing.id }, cachedUser), false);
  assert.equal(viewings.partnerOwnsViewing({ propertyId: listing.id }, cachedUser), false);
  for (const key of [...protectedKeys, listings.mockListingsKey]) assert.equal(storage.get(key), before.get(key), key);

  const restored = applications.changeMockPartnerAccess(approved.id, { status: "APPROVED" });
  assert.equal(restored.status, "APPROVED");
  assert.ok(Number.isFinite(Date.parse(restored.unsuspendedAt)));
  assert.equal(restored.suspendedAt, suspended.suspendedAt);
  assert.equal(restored.suspensionReason, suspended.suspensionReason);
  assert.equal(restored.reviewedAt, approved.reviewedAt);
  assert.equal(applications.hasMockPartnerAccess({ ...cachedUser, isPartner: false }), true);
  assert.equal(users.findMockDirectoryUser(cachedUser.id).partnerState, "APPROVED");
  assert.equal(published.findPublicProperty(listing.id).id, listing.id);
  assert.equal(bookings.partnerOwnsBooking({ propertyId: listing.id }, cachedUser), true);
  for (const key of [...protectedKeys, listings.mockListingsKey]) assert.equal(storage.get(key), before.get(key), key);
  assert.equal(applications.readMockPartnerApplications().length, 2);
  assert.equal(applications.findMockPartnerApplicationById("old-rejection").rejectionReason, "Missing document");
});

test("requires a nonblank reason and valid transitions; each successful event adds one user notification", () => {
  assert.equal(suspend(" \n "), null);
  assert.equal(applications.changeMockPartnerAccess("old-rejection", { status: "SUSPENDED", reason: "test" }), null);
  assert.equal(applications.changeMockPartnerAccess(approved.id, { status: "APPROVED" }), null);
  assert.equal(notifications.readMockNotifications().length, 0);
  suspend();
  assert.equal(suspend(), null);
  applications.changeMockPartnerAccess(approved.id, { status: "APPROVED" });
  assert.equal(applications.changeMockPartnerAccess(approved.id, { status: "APPROVED" }), null);
  suspend("Second suspension");
  const items = notifications.readMockNotificationsForUser(cachedUser.id);
  assert.equal(items.length, 3);
  assert.equal(items.filter((item) => item.title === "Partner access suspended").length, 2);
  assert.equal(items.filter((item) => item.title === "Partner access restored").length, 1);
  assert.ok(items.some((item) => item.message.includes("Second suspension")));
  assert.ok(events.includes(applications.mockPartnerApplicationsChangedEvent));
});

test("legacy pending/rejected applications and malformed optional metadata remain readable", () => {
  applications.saveMockPartnerApplication({ ...approved, id: "pending", userId: "pending-user", status: "PENDING" });
  assert.equal(applications.changeMockPartnerAccess("pending", { status: "SUSPENDED", reason: "test" }), null);
  assert.equal(applications.reviewMockPartnerApplication("pending", { status: "REJECTED", rejectionReason: "Incomplete" }).status, "REJECTED");
  assert.equal(applications.findBlockingMockPartnerApplication("pending-user"), null);
  storage.set(applications.mockPartnerApplicationsKey, JSON.stringify([{ ...approved, status: "SUSPENDED", suspendedAt: 42, suspensionReason: {} }]));
  assert.equal(applications.findMockPartnerCapability(cachedUser.id).status, "SUSPENDED");
  assert.equal(applications.findMockPartnerCapability(cachedUser.id).suspensionReason, undefined);
  assert.equal(applications.hasMockPartnerAccess(cachedUser), false);
});

test("every Partner URL displays suspension details instead of protected content, even with stale cached access", () => {
  auth.partnerApplication = suspend();
  for (const route of ["", "/listings", "/listings/new", "/listings/example/edit", "/bookings", "/bookings/example", "/viewings", "/viewings/example", "/messages", "/messages/example", "/reviews", "/profile", "/notifications"]) {
    pathname = `/partner${route}`;
    const html = renderToStaticMarkup(React.createElement(PartnerAccessGuard, null, "PROTECTED_CONTENT"));
    assert.ok(html.includes("Partner access is currently suspended."), pathname);
    assert.ok(html.includes("Repeated listing issues"), pathname);
    assert.ok(html.includes('href="/"'), pathname);
    assert.ok(!html.includes("PROTECTED_CONTENT"), pathname);
    assert.ok(!html.includes("Log In"), pathname);
  }
  auth.partnerApplication = applications.changeMockPartnerAccess(approved.id, { status: "APPROVED" });
  assert.equal(renderToStaticMarkup(React.createElement(PartnerAccessGuard, null, "PROTECTED_CONTENT")), "PROTECTED_CONTENT");
  auth.isReady = false;
  assert.ok(!renderToStaticMarkup(React.createElement(PartnerAccessGuard, null, "PROTECTED_CONTENT")).includes("PROTECTED_CONTENT"));
});

test("application storage failure cannot change access; notification failure does not misreport saved suspension", () => {
  const originalWrite = browserWindow.localStorage.setItem;
  try {
    browserWindow.localStorage.setItem = () => { throw new Error("Storage unavailable"); };
    assert.throws(() => suspend(), /Storage unavailable/);
    assert.equal(applications.hasMockPartnerAccess(cachedUser), true);
    assert.equal(notifications.readMockNotifications().length, 0);
    browserWindow.localStorage.setItem = (key, value) => {
      if (key === notifications.mockNotificationsKey) throw new Error("Notification storage unavailable");
      originalWrite(key, value);
    };
    assert.equal(suspend().status, "SUSPENDED");
    assert.equal(applications.hasMockPartnerAccess(cachedUser), false);
  } finally {
    browserWindow.localStorage.setItem = originalWrite;
  }
});
