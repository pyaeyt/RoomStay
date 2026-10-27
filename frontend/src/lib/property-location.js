export function formatPropertyLocation(property) {
    return [property.area?.trim(), property.province?.trim()].filter(Boolean).join(", ")
        || property.location;
}
