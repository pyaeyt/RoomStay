import { visiblePartnerIds } from "./shared.js";

export async function searchProperties(db, query) {
  const partnerIds = await visiblePartnerIds(db);
  const properties = await db.property.findMany({
    where: { listingStatus: "PUBLISHED", partnerUserId: { in: partnerIds } },
    include: { photos: { orderBy: { sortOrder: "asc" } }, partner: true },
    orderBy: { createdAt: "desc" },
  });
  const words = (query.q ?? "").toLowerCase().trim().split(/[\s,]+/).filter(Boolean);
  const facilities = String(query.facilities ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  let results = properties.filter((property) => {
    const text = `${property.title} ${property.location} ${property.propertyType} ${property.buildingName ?? ""} ${property.fullAddress ?? ""}`.toLowerCase();
    const bedroomsOk = !query.bedrooms || (query.bedrooms === "3+" ? property.bedrooms >= 3 : property.bedrooms === Number(query.bedrooms));
    return words.every((word) => text.includes(word))
      && (!query.location || property.location === query.location)
      && (!query.type || property.propertyType === query.type)
      && (!query.min || property.monthlyRent >= Number(query.min))
      && (!query.max || property.monthlyRent <= Number(query.max))
      && bedroomsOk
      && facilities.every((facility) => property.facilities.includes(facility))
      && (query.availableOnly !== "true" || property.roomStatus === "AVAILABLE");
  });
  if (query.sort === "price-asc") results.sort((a, b) => a.monthlyRent - b.monthlyRent);
  if (query.sort === "price-desc") results.sort((a, b) => b.monthlyRent - a.monthlyRent);
  else results.sort((a, b) => Number(b.popular) - Number(a.popular) || b.createdAt - a.createdAt);
  return results;
}

export async function toggleFavorite(db, userId, propertyId) {
  const { assertVisibleProperty } = await import("./shared.js");
  await assertVisibleProperty(db, propertyId);
  const existing = await db.favorite.findUnique({ where: { userId_propertyId: { userId, propertyId } } });
  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return { saved: false };
  }
  await db.favorite.create({ data: { userId, propertyId } });
  return { saved: true };
}
