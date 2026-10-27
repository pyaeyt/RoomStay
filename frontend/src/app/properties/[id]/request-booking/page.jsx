import { PublishedRequestBooking } from "@/components/published-request-forms";
import { SiteHeader } from "@/components/site-header";
import { properties } from "@/mocks/properties";
export function generateStaticParams() {
    return properties.map((property) => ({ id: property.id }));
}
export async function generateMetadata({ params }) {
    const { id } = await params;
    const property = properties.find((item) => item.id === id);
    if (!property)
        return { title: "Request Booking | RoomStay" };
    return { title: `Request Booking | ${property.title} | RoomStay` };
}
export default async function RequestBookingPage({ params }) {
    const { id } = await params;
    return (<div className="min-h-dvh w-full bg-transparent">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-white p-3 text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>

      <SiteHeader activePage="Details"/>

      <main id="main-content" className="mx-auto max-w-[1440px] px-[22px] pb-[calc(96px+env(safe-area-inset-bottom))] md:px-8 md:py-8 xl:px-12">
        <PublishedRequestBooking propertyId={id}/>
      </main>
    </div>);
}
