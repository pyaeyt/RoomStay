// Preset viewing slots. Values stay 24-hour "HH:MM" for storage
// compatibility; only the UI labels use 12-hour AM/PM format.
export const viewingTimeOptions = [
    { value: "07:00", label: "7:00 AM" },
    { value: "08:00", label: "8:00 AM" },
    { value: "09:00", label: "9:00 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "11:00", label: "11:00 AM" },
    { value: "12:00", label: "12:00 PM" },
    { value: "13:00", label: "1:00 PM" },
    { value: "14:00", label: "2:00 PM" },
    { value: "15:00", label: "3:00 PM" },
    { value: "16:00", label: "4:00 PM" },
    { value: "17:00", label: "5:00 PM" },
    { value: "18:00", label: "6:00 PM" },
    { value: "19:00", label: "7:00 PM" },
    { value: "20:00", label: "8:00 PM" },
    { value: "21:00", label: "9:00 PM" },
];
export function formatViewingTime(value) {
    if (!value)
        return "Not provided";
    const option = viewingTimeOptions.find((slot) => slot.value === value);
    if (option)
        return option.label;
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!match)
        return value;
    const hours = Number(match[1]);
    const minutes = match[2];
    if (!Number.isInteger(hours) || hours < 0 || hours > 23)
        return value;
    const period = hours < 12 ? "AM" : "PM";
    const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${twelveHour}:${minutes} ${period}`;
}
export function isAllowedViewingTime(value) {
    return viewingTimeOptions.some((slot) => slot.value === value);
}
// Legacy times are preserved in storage and still rendered in 12-hour
// AM/PM form via formatViewingTime; this only flags them for display.
export function isLegacyViewingTime(value) {
    return typeof value === "string" && value !== "" && !isAllowedViewingTime(value);
}
export function todayDateString() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
}
