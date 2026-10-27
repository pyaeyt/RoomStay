// Shared user-facing date display for bookings: "Sep 16, 2026".
// Stored values are never modified; only display formatting happens here.
export function formatBookingDate(value) {
    if (!value)
        return "Not provided";
    const trimmed = value.trim();
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    let date;
    if (dateOnly) {
        // Parse calendar dates as local time so "2026-09-16" never renders
        // as the previous day in timezones behind UTC.
        const year = Number(dateOnly[1]);
        const month = Number(dateOnly[2]);
        const day = Number(dateOnly[3]);
        date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year
            || date.getMonth() !== month - 1
            || date.getDate() !== day) {
            return value;
        }
    }
    else {
        date = new Date(trimmed);
    }
    if (Number.isNaN(date.getTime()))
        return value;
    return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
