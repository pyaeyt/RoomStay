import { properties } from "@/mocks/properties";
// Fixed display data for the first screen; no geolocation or backend request.
export const homeLocation = { id: "ari", label: "Ari, Bangkok" };
export const popularProperties = properties.filter((property) => property.popular);
