"use client";
import { PropertyCard } from "@/components/property-card";
import { usePublicProperties } from "@/lib/published-listings";
import { popularProperties } from "@/mocks/home";
export function HomeListings() {
    const { properties: publicProperties, isReady } = usePublicProperties();
    const source = isReady ? publicProperties : popularProperties;
    const listings = source.filter((property) => property.popular).slice(0, 8);
    const visible = listings.length > 0 ? listings : source.slice(0, 8);
    return (<>
      {visible.map((property, index) => (<div key={property.id} className="min-w-0 rounded-xl border border-[#e6e1f2] bg-white p-1.5 pb-3 shadow-md shadow-[#20104a0d] transition-shadow duration-200 hover:shadow-lg hover:shadow-[#20104a14]">
          <PropertyCard property={property} preload={index === 0} showDetailsButton showMeta/>
        </div>))}
    </>);
}
