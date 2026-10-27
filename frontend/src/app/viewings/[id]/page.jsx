import { ViewingDetails } from "@/components/viewing-management";
import { SiteHeader } from "@/components/site-header";
export const metadata = { title: "Viewing Details | RoomStay" };
export default async function Page({ params }) {
    const { id } = await params;
    return (<div className="min-h-dvh bg-transparent">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-white p-3 text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2">Skip to content</a>
      <SiteHeader activePage="Viewings"/>
      <main id="main-content" className="mx-auto max-w-[1440px] px-[22px] pt-5 pb-[calc(96px+env(safe-area-inset-bottom))] md:px-8 md:py-8 xl:px-12"><ViewingDetails viewingId={id}/></main>
    </div>);
}
