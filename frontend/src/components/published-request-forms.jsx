"use client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RequestBookingForm } from "@/components/request-booking-form";
import { RequestViewingForm } from "@/components/request-viewing-form";
import { usePublicProperty } from "@/lib/published-listings";
function LoadingState({ label }) {
    return (<div className="mt-3 rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
      {label}
    </div>);
}
export function PublishedRequestBooking({ propertyId }) {
    const property = usePublicProperty(propertyId);
    if (property === undefined)
        return <LoadingState label="Loading booking request..."/>;
    if (property === null)
        notFound();
    return (<>
      <Link href={`/properties/${property.id}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-medium text-primary">
        <span aria-hidden="true">‹</span> Back to Property
      </Link>
      <div className="mt-3">
        <RequestBookingForm property={{
            id: property.id,
            title: property.title,
            location: property.location,
            price: property.price,
            image: property.image,
            imageAlt: property.imageAlt,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            size: property.size,
            availableNow: property.availableNow,
            partnerUserId: property.partnerUserId,
            roomStatus: property.roomStatus,
        }}/>
      </div>
    </>);
}
export function PublishedRequestViewing({ propertyId }) {
    const property = usePublicProperty(propertyId);
    if (property === undefined)
        return <LoadingState label="Loading viewing request..."/>;
    if (property === null)
        notFound();
    return (<>
      <Link href={`/properties/${property.id}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-medium text-primary">
        <span aria-hidden="true">‹</span> Back to Property
      </Link>
      <div className="mt-3">
        <RequestViewingForm property={{
            id: property.id,
            title: property.title,
            location: property.location,
            price: property.price,
            image: property.image,
            imageAlt: property.imageAlt,
            availableNow: property.availableNow,
        }}/>
      </div>
    </>);
}
