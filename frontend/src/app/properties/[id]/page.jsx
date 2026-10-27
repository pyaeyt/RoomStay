import Link from "next/link";
import { PublishedPropertyDetails } from "@/components/published-property-details";
import { SiteHeader } from "@/components/site-header";
import { properties } from "@/mocks/properties";
const rentFormatter = new Intl.NumberFormat("en-US");
export function generateStaticParams() {
    return properties.map((property) => ({ id: property.id }));
}
export async function generateMetadata({ params }) {
    const { id } = await params;
    const property = properties.find((item) => item.id === id);
    if (!property)
        return { title: "Property not found | RoomStay" };
    return { title: `${property.title} | RoomStay`, description: `${property.title} in ${property.location} for ฿${rentFormatter.format(property.price)} per month.` };
}
export default async function PropertyDetailsPage({ params }) {
    const { id } = await params;
    return (<div className="min-h-dvh w-full bg-transparent">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-white p-3 text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>

      <SiteHeader activePage="Details"/>

      <main id="main-content" className="mx-auto max-w-[1440px] px-[22px] pb-[calc(96px+env(safe-area-inset-bottom))] md:px-8 md:py-8 xl:px-12">
        <Link href="/search" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-medium text-primary">
          <span aria-hidden="true">‹</span> Back to search results
        </Link>

        <PublishedPropertyDetails propertyId={id}/>
      </main>
    </div>);
}
