"use client";
import { notFound } from "next/navigation";
import { PropertyDetailsView } from "@/components/property-details-view";
import { usePublicProperty } from "@/lib/published-listings";
// Renders a published Partner listing with the same renter-facing details
// UI as static properties. Non-published or unknown IDs still 404.
export function PublishedPropertyDetails({ propertyId }) {
    const property = usePublicProperty(propertyId);
    if (property === undefined) {
        return (<div className="mt-3 rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading property details...
      </div>);
    }
    if (property === null)
        notFound();
    return <PropertyDetailsView property={property}/>;
}
