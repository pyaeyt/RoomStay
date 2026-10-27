"use client";
import { useEffect, useState } from "react";
import { mockListingsChangedEvent } from "@/lib/mock-listings";
import { mockRoomStatusesChangedEvent, defaultRoomStatus, readMockRoomStatus, roomStatusLabel, } from "@/lib/mock-bookings";
export function PropertyAvailabilityBadge({ propertyId, availableNow }) {
    const [status, setStatus] = useState(() => defaultRoomStatus(availableNow));
    useEffect(() => {
        function loadStatus() {
            setStatus(readMockRoomStatus(propertyId, defaultRoomStatus(availableNow)));
        }
        const timeout = window.setTimeout(loadStatus, 0);
        window.addEventListener(mockRoomStatusesChangedEvent, loadStatus);
        window.addEventListener(mockListingsChangedEvent, loadStatus);
        window.addEventListener("storage", loadStatus);
        window.addEventListener("focus", loadStatus);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockRoomStatusesChangedEvent, loadStatus);
            window.removeEventListener(mockListingsChangedEvent, loadStatus);
            window.removeEventListener("storage", loadStatus);
            window.removeEventListener("focus", loadStatus);
        };
    }, [availableNow, propertyId]);
    const isAvailable = status === "AVAILABLE";
    const isReserved = status === "RESERVED";
    return (<span className={`inline-flex shrink-0 items-center rounded-full ring-1 ring-inset transition-colors duration-200 ${isReserved ? "gap-2 px-3.5 py-2 text-sm font-bold bg-primary-tint text-primary ring-primary/30" : `gap-1.5 px-3 py-1.5 text-xs font-semibold ${isAvailable ? "bg-primary-tint text-primary ring-primary/20" : "bg-canvas text-ink-secondary ring-line"}`}`}>
      <span aria-hidden="true" className={`shrink-0 rounded-full ${isReserved ? "size-2.5 bg-primary" : `size-1.5 ${isAvailable ? "bg-primary" : "bg-ink-secondary"}`}`}/>
      {roomStatusLabel(status)}
    </span>);
}
