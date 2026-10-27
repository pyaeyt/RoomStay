// Run with: node --test tests/listing-location.test.mjs
import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const sourceDirectory = fileURLToPath(new URL("../src/", import.meta.url));
const requireDependency = createRequire(import.meta.url);
const storage = new Map();
const browserWindow = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
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
    require: (name) => name.startsWith("@/") ? load(sourceFile(path.resolve(sourceDirectory, name.slice(2)))) : requireDependency(name),
  }, { filename: file });
  return compiledModule.exports;
}

const listings = load(sourceFile(path.resolve(sourceDirectory, "lib/mock-listings")));
const published = load(sourceFile(path.resolve(sourceDirectory, "lib/published-listings")));
const search = load(sourceFile(path.resolve(sourceDirectory, "lib/search")));
const legacy = {
  id: "legacy-listing", partnerUserId: "partner-1", title: "Cozy Condo Near BTS", propertyType: "Condo",
  monthlyRent: 8500, location: "Ari, Bangkok", description: "An existing listing", bedrooms: 1, bathrooms: 1,
  sizeSqm: 30, facilities: [], photos: [{ name: "room.jpg", type: "image/jpeg" }],
  listingStatus: "DRAFT", roomStatus: "AVAILABLE", createdAt: "2026-09-16T00:00:00Z", updatedAt: "2026-09-16T00:00:00Z",
};
const identity = {
  buildingName: "Atmoz Kanaal Rangsit",
  fullAddress: "117 Rangsit-Pathum Thani Rd, Prachathipat, Mueang Pathum Thani, Pathum Thani 12000",
  area: "Rangsit",
  province: "Pathum Thani",
};

beforeEach(() => storage.clear());

test("structured identity survives saves, edits, review, and public conversion", () => {
  listings.saveMockListing({ ...legacy, ...identity });
  // Saving another row must not strip fields when existing rows are normalized.
  listings.saveMockListing({ ...legacy, id: "another-listing" });
  let saved = listings.findMockListingById(legacy.id);
  for (const [field, value] of Object.entries(identity)) assert.equal(saved[field], value);
  assert.equal(saved.location, "Rangsit, Pathum Thani");
  assert.equal(saved.title, legacy.title);
  assert.equal(saved.monthlyRent, 8500);

  listings.updateMockListing({ ...saved, buildingName: "Bundit Apartment", listingStatus: "PENDING_REVIEW" });
  listings.reviewMockListing(legacy.id, { status: "PUBLISHED" });
  saved = listings.findMockListingById(legacy.id);
  assert.equal(saved.roomStatus, "AVAILABLE");
  const property = published.mockListingToProperty(saved);
  for (const [field, value] of Object.entries({ ...identity, buildingName: "Bundit Apartment" })) assert.equal(property[field], value);
  assert.equal(property.location, "Rangsit, Pathum Thani");

  for (const query of ["Bundit Apartment", "Rangsit Pathum Thani", "Prachathipat", legacy.title]) {
    const results = search.filterProperties([property], search.initialSearchFilters({ q: query }));
    assert.equal(results.length, 1, query);
  }
  assert.equal(search.filterProperties([property], search.initialSearchFilters({ location: "Rangsit, Pathum Thani" })).length, 1);
});

test("legacy listings remain readable and searchable with their original location", () => {
  listings.saveMockListing({ ...legacy, listingStatus: "PUBLISHED" });
  const saved = listings.findMockListingById(legacy.id);
  assert.equal(saved.location, "Ari, Bangkok");
  assert.equal(saved.buildingName, undefined);
  assert.equal(saved.fullAddress, undefined);
  const property = published.mockListingToProperty(saved);
  assert.equal(property.location, "Ari, Bangkok");
  assert.equal(search.filterProperties([property], search.initialSearchFilters({ q: "Ari Bangkok" })).length, 1);
});

test("malformed optional identity fields do not discard a valid legacy listing", () => {
  storage.set(listings.mockListingsKey, JSON.stringify([
    { ...legacy, buildingName: 42, fullAddress: {}, area: [], province: null },
    { ...legacy, id: "trimmed", ...identity, area: "  Rangsit  ", province: " Pathum Thani ", buildingName: "  " },
  ]));
  assert.equal(listings.readMockListings().length, 2);
  const saved = listings.findMockListingById(legacy.id);
  assert.equal(saved.location, legacy.location);
  for (const field of Object.keys(identity)) assert.equal(saved[field], undefined);
  const trimmed = listings.findMockListingById("trimmed");
  assert.equal(trimmed.location, "Rangsit, Pathum Thani");
  assert.equal(trimmed.buildingName, undefined);
});
