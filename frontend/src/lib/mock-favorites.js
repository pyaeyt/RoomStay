import { liveEnabled, readLive } from "@/lib/live-store";
export const mockFavoritesKey = "roomstay.mockFavorites";
export const mockFavoritesChangedEvent = "roomstay:favorites-changed";
function normalizeFavorite(value) {
    if (!value || typeof value !== "object")
        return null;
    const favorite = value;
    if (typeof favorite.renterUserId !== "string"
        || typeof favorite.propertyId !== "string"
        || typeof favorite.createdAt !== "string") {
        return null;
    }
    return {
        renterUserId: favorite.renterUserId,
        propertyId: favorite.propertyId,
        createdAt: favorite.createdAt,
    };
}
export function readMockFavorites() {
    if (liveEnabled())
        return readLive("favorites");
    if (typeof window === "undefined")
        return [];
    try {
        const stored = window.localStorage.getItem(mockFavoritesKey);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed.map(normalizeFavorite).filter((favorite) => Boolean(favorite)) : [];
    }
    catch {
        return [];
    }
}
function writeMockFavorites(favorites) {
    window.localStorage.setItem(mockFavoritesKey, JSON.stringify(favorites));
    window.dispatchEvent(new Event(mockFavoritesChangedEvent));
}
export function isMockFavorite(renterUserId, propertyId) {
    return readMockFavorites().some((favorite) => favorite.renterUserId === renterUserId && favorite.propertyId === propertyId);
}
export function toggleMockFavorite(renterUserId, propertyId) {
    const favorites = readMockFavorites();
    const exists = favorites.some((favorite) => favorite.renterUserId === renterUserId && favorite.propertyId === propertyId);
    if (exists) {
        writeMockFavorites(favorites.filter((favorite) => !(favorite.renterUserId === renterUserId && favorite.propertyId === propertyId)));
        return false;
    }
    writeMockFavorites([
        ...favorites,
        {
            renterUserId,
            propertyId,
            createdAt: new Date().toISOString(),
        },
    ]);
    return true;
}
export function readMockFavoritesForUser(renterUserId) {
    return readMockFavorites()
        .filter((favorite) => favorite.renterUserId === renterUserId)
        .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
}
