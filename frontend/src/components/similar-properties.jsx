"use client";
import { PropertyCard } from "@/components/property-card";
import { usePublicProperties } from "@/lib/published-listings";
function locationArea(location) {
    return location.split(",")[0]?.trim().toLowerCase() ?? location.toLowerCase();
}
function priceSimilarityScore(currentPrice, otherPrice) {
    if (currentPrice <= 0)
        return 0;
    const differenceRatio = Math.abs(currentPrice - otherPrice) / currentPrice;
    return Math.max(0, 25 - differenceRatio * 25);
}
function scoreProperty(current, candidate) {
    let score = 0;
    if (candidate.propertyType === current.propertyType)
        score += 60;
    if (candidate.location === current.location)
        score += 35;
    else if (locationArea(candidate.location) === locationArea(current.location))
        score += 25;
    score += priceSimilarityScore(current.price, candidate.price);
    return score;
}
export function SimilarProperties({ currentProperty }) {
    const { properties } = usePublicProperties();
    const similar = properties
        .filter((property) => property.id !== currentProperty.id)
        .map((property) => ({ property, score: scoreProperty(currentProperty, property) }))
        .sort((first, second) => {
        if (second.score !== first.score)
            return second.score - first.score;
        return Math.abs(currentProperty.price - first.property.price) - Math.abs(currentProperty.price - second.property.price);
    })
        .slice(0, 4)
        .map((item) => item.property);
    if (similar.length === 0)
        return null;
    return (<section aria-labelledby="similar-properties-heading" className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">More options</p>
          <h2 id="similar-properties-heading" className="mt-1 text-xl font-semibold tracking-[-0.025em] text-ink">
            Similar Properties
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-ink-secondary">
          Related rooms based on property type, location, and monthly rent.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {similar.map((property) => (<PropertyCard key={property.id} property={property}/>))}
      </div>
    </section>);
}
