// Run with: node --test tests/user-profile.test.mjs
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
let auth;
let effects;
let redirects;
const cache = new Map();
function load(relative) {
  if (cache.has(relative)) return cache.get(relative).exports;
  const base = path.resolve(sourceDirectory, relative);
  const file = [".js", ".jsx", ".ts", ".tsx"].map((ext) => `${base}${ext}`).find((candidate) => existsSync(candidate));
  const compiledModule = { exports: {} };
  cache.set(relative, compiledModule);
  const source = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    module: compiledModule, exports: compiledModule.exports,
    require: (name) => {
      if (name === "react") return { ...React, useEffect: (callback) => effects.push(callback) };
      if (name === "next/navigation") return { useRouter: () => ({ replace: (url) => redirects.push(url) }) };
      if (name === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
      if (name === "@/lib/mock-auth") return { useMockAuth: () => auth };
      if (name === "@/lib/mock-notifications") return {};
      if (name === "@/lib/mock-partner-application") return {};
      if (name.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
      return name.startsWith("@/") ? load(name.slice(2)) : requireDependency(name);
    },
  }, { filename: file });
  return compiledModule.exports;
}
const { UserProfile } = load("components/user-profile");
const { SiteHeader } = load("components/site-header");
const user = { id: "renter-1", fullName: "Nicha Dee", email: "nicha@example.com", isPartner: false };
function renderProfile() {
  effects = [];
  return renderToStaticMarkup(React.createElement(UserProfile));
}
beforeEach(() => {
  auth = { user, isReady: true, partnerApplication: null, logout() {} };
  effects = []; redirects = [];
});

test("profile waits for auth, redirects logged-out users, and never renders their account details", () => {
  auth.isReady = false;
  assert.ok(!renderProfile().includes(user.email));
  effects.forEach((effect) => effect());
  assert.equal(redirects.length, 0);
  auth.isReady = true;
  auth.user = null;
  assert.ok(renderProfile().includes("Redirecting to login"));
  effects.forEach((effect) => effect());
  assert.deepEqual(redirects, ["/login?returnTo=/profile"]);
});

test("profile displays current account details and all renter links without edit controls", () => {
  const html = renderProfile();
  for (const text of [user.fullName, user.email, "Normal User", "Not provided", "Not applied"]) assert.ok(html.includes(text), text);
  for (const href of ["/bookings", "/viewings", "/favorites", "/messages", "/notifications", "/become-a-partner"]) assert.ok(html.includes(`href="${href}"`), href);
  assert.ok(!html.includes("<input") && !html.includes("<form"));
  auth.partnerApplication = { status: "PENDING", phone: "+66 81 111 2222" };
  assert.ok(renderProfile().includes("+66 81 111 2222"));
  auth.user = { ...user, phone: "+66 82 333 4444" };
  assert.ok(renderProfile().includes("+66 82 333 4444"));
  assert.ok(!renderProfile().includes("+66 81 111 2222"));
});

for (const [status, label] of [["PENDING", "Pending"], ["APPROVED", "Approved Partner"], ["REJECTED", "Rejected"], ["SUSPENDED", "Suspended"]]) {
  test(`${status}: Partner capability is separate from Normal User account type`, () => {
    auth.user = { ...user, isPartner: true }; // Suspension must take precedence over stale capability.
    auth.partnerApplication = { status, phone: "" };
    const html = renderProfile();
    assert.ok(html.includes(label));
    assert.ok(html.includes("Normal User"));
    assert.equal(html.includes('href="/partner"'), status === "APPROVED");
    assert.equal(html.includes('href="/partner-application"'), status !== "APPROVED");
    assert.equal(html.includes('href="/become-a-partner"'), status === "REJECTED");
    assert.ok(!html.includes("Restore Partner Access") && !html.includes("Suspend Partner"));
  });
}

test("desktop and mobile Profile navigation targets the new route without changing My Viewings", () => {
  for (const sessionUser of [user, null]) {
    auth.user = sessionUser;
    const html = renderToStaticMarkup(React.createElement(SiteHeader, { activePage: "Profile" }));
    const profileLinks = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].filter((match) => /(?:My Profile|<span>Profile<\/span>)/.test(match[2]));
    assert.ok(profileLinks.length >= 2);
    for (const match of profileLinks) {
      assert.ok(match[1].includes('href="/profile"'));
      assert.ok(match[1].includes('aria-current="page"'));
    }
    if (sessionUser) assert.ok(html.includes('href="/viewings"'));
  }
});
