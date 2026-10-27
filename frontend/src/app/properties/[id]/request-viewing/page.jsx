import Link from "next/link";
import { PublishedRequestViewing } from "@/components/published-request-forms";
import { RequestViewingForm } from "@/components/request-viewing-form";
import { SiteHeader } from "@/components/site-header";
import { properties } from "@/mocks/properties";
export function generateStaticParams() {
    return properties.map((property) => ({ id: property.id }));
}
export async function generateMetadata({ params }) {
    const { id } = await params;
    const property = properties.find((item) => item.id === id);
    if (!property)
        return { title: "Request Viewing | RoomStay" };
    return { title: `Request Viewing | ${property.title} | RoomStay` };
}
export default async function RequestViewingPage({ params }) {
    const { id } = await params;
    const property = properties.find((item) => item.id === id);
    return (<div className="min-h-dvh w-full bg-transparent">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-white p-3 text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>

      <SiteHeader activePage="Details"/>

      <main id="main-content" className="mx-auto max-w-[1440px] px-[22px] pb-[calc(96px+env(safe-area-inset-bottom))] md:px-8 md:py-8 xl:px-12">
        {property ? (<>
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
          </>) : (<PublishedRequestViewing propertyId={id}/>)}
      </main>
    </div>);
}
