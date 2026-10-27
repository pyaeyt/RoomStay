"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { PropertyCard } from "@/components/property-card";
import { useMockAuth } from "@/lib/mock-auth";
import { mockFavoritesChangedEvent, readMockFavoritesForUser } from "@/lib/mock-favorites";
import { mockListingsChangedEvent } from "@/lib/mock-listings";
import { findPublicProperty } from "@/lib/published-listings";
export function FavoritesList() {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const [favorites, setFavorites] = useState(null);
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user) {
            router.replace(`/login?returnTo=${encodeURIComponent("/favorites")}`);
            return undefined;
        }
        if (user.role === "ADMIN" || user.isPartner) {
            router.replace(user.role === "ADMIN" ? "/admin" : "/partner");
            return undefined;
        }
        const currentUser = user;
        function loadFavorites() {
            const favoriteRecords = readMockFavoritesForUser(currentUser.id);
            setFavorites(favoriteRecords
                .map((favorite) => findPublicProperty(favorite.propertyId))
                .filter((property) => Boolean(property)));
        }
        const timeout = window.setTimeout(loadFavorites, 0);
        window.addEventListener(mockFavoritesChangedEvent, loadFavorites);
        window.addEventListener(mockListingsChangedEvent, loadFavorites);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockFavoritesChangedEvent, loadFavorites);
            window.removeEventListener(mockListingsChangedEvent, loadFavorites);
        };
    }, [isReady, router, user]);
    if (!isReady || favorites === null) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading favorites...
      </div>);
    }
    if (!user) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Redirecting to login...
      </div>);
    }
    if (favorites.length === 0) {
        return (<section className="rounded-xl border border-line bg-white px-5 py-14 text-center motion-safe:animate-fade-up">
        <Icon name="heart" size={32} className="mx-auto text-primary"/>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.025em]">No favorites yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
          Save rooms you like so you can find them again quickly.
        </p>
        <Link href="/search" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">
          Browse Rooms
        </Link>
      </section>);
    }
    return (<section>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">My Favorites</h1>
        <p className="mt-2 text-sm text-ink-secondary">Your saved RoomStay properties.</p>
      </div>
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favorites.map((property, index) => <PropertyCard key={property.id} property={property} preload={index === 0}/>)}
      </div>
    </section>);
}
