"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { liveToggleFavorite } from "@/lib/live-actions";
import { liveEnabled } from "@/lib/live-store";
import { isMockFavorite, mockFavoritesChangedEvent, toggleMockFavorite } from "@/lib/mock-favorites";
import { useMockAuth } from "@/lib/mock-auth";
export function FavoriteButton({ propertyId, propertyTitle, returnTo, variant = "floating", onChange, }) {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const [favorited, setFavorited] = useState(false);
    useEffect(() => {
        function syncFavorite() {
            setFavorited(Boolean(isReady && user && isMockFavorite(user.id, propertyId)));
        }
        const timeout = window.setTimeout(syncFavorite, 0);
        window.addEventListener(mockFavoritesChangedEvent, syncFavorite);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockFavoritesChangedEvent, syncFavorite);
        };
    }, [isReady, propertyId, user]);
    async function toggle(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!user) {
            router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
            return;
        }
        if (liveEnabled()) {
            const nextFavorited = await liveToggleFavorite(user.id, propertyId);
            setFavorited(nextFavorited);
            onChange?.(nextFavorited);
            return;
        }
        const nextFavorited = toggleMockFavorite(user.id, propertyId);
        setFavorited(nextFavorited);
        onChange?.(nextFavorited);
    }
    if (user?.role === "ADMIN" || user?.isPartner)
        return null;
    const label = favorited ? `Remove ${propertyTitle} from favorites` : `Save ${propertyTitle} to favorites`;
    const className = variant === "floating"
        ? "absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/95 text-primary shadow-sm ring-1 ring-line transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
        : "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink transition-all duration-200 hover:border-primary/40 active:scale-[0.98]";
    return (<button type="button" onClick={toggle} disabled={!isReady} aria-pressed={favorited} aria-label={label} className={`${className} disabled:cursor-wait disabled:opacity-70 ${favorited ? "text-primary" : "text-ink-secondary"}`}>
      <Icon name="heart" size={variant === "floating" ? 21 : 18} className={`transition-transform duration-200 ${favorited ? "fill-current scale-110" : ""}`}/>
      {variant === "inline" && <span>{favorited ? "Saved" : "Save"}</span>}
    </button>);
}
