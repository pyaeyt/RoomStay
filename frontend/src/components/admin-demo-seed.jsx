"use client";
import { useEffect } from "react";
import { liveEnabled } from "@/lib/live-store";
import { ensureMockDemoSeed } from "@/lib/mock-demo-seed";
// Runs the idempotent demo seed once per Admin Portal visit. Seeding only
// fills empty collections and dispatches the usual change events, so every
// Admin list picks the records up through its existing subscriptions.
export function AdminDemoSeed() {
    useEffect(() => {
        if (!liveEnabled())
            ensureMockDemoSeed();
    }, []);
    return null;
}
