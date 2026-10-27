import { SearchResults } from "@/components/search-results";
import { SiteHeader } from "@/components/site-header";
import { initialSearchFilters } from "@/lib/search";
export const metadata = { title: "Search Results | RoomStay" };
export default async function SearchPage({ searchParams, }) {
    const initialFilters = initialSearchFilters(await searchParams);
    return (<div className="min-h-dvh bg-transparent">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-white p-3 text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2">Skip to content</a>
      <SiteHeader activePage="Search"/>
      <main id="main-content" className="mx-auto max-w-[1440px] px-[22px] pt-7 pb-[calc(96px+env(safe-area-inset-bottom))] md:px-8 md:pt-8 md:pb-10 xl:px-12">
        <div className="mb-5">
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-[#171044] md:text-4xl">Search Results</h1>
          <p className="mt-1.5 text-sm font-medium text-ink-secondary md:text-base">Find your ideal place from our available properties</p>
        </div>
        <SearchResults key={JSON.stringify(initialFilters)} initialFilters={initialFilters}/>
      </main>
    </div>);
}
