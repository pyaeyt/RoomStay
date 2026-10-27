import { liveEnabled, readLive } from "@/lib/live-store";
export const mockAuditLogsKey = "roomstay.mockAuditLogs";
export const mockAuditLogsChangedEvent = "roomstay:audit-logs-changed";
export const auditActionLabels = {
    PARTNER_APPLICATION_APPROVED: "Partner application approved",
    PARTNER_APPLICATION_REJECTED: "Partner application rejected",
    PARTNER_SUSPENDED: "Partner suspended",
    PARTNER_ACCESS_RESTORED: "Partner access restored",
    LISTING_PUBLISHED: "Listing approved / published",
    LISTING_REJECTED: "Listing rejected",
    REPORT_UNDER_REVIEW: "Report marked under review",
    REPORT_RESOLVED: "Report resolved",
    REPORT_DISMISSED: "Report dismissed",
    REVIEW_HIDDEN: "Review hidden",
    REVIEW_RESTORED: "Review restored",
};
function isAuditLog(value) {
    if (!value || typeof value !== "object")
        return false;
    const entry = value;
    return typeof entry.id === "string"
        && typeof entry.timestamp === "string"
        && Number.isFinite(Date.parse(entry.timestamp))
        && typeof entry.actorLabel === "string"
        && typeof entry.action === "string" && Object.hasOwn(auditActionLabels, entry.action)
        && ["PARTNER_APPLICATION", "PARTNER", "LISTING", "REPORT", "REVIEW"].includes(entry.targetType ?? "")
        && typeof entry.targetId === "string"
        && typeof entry.targetName === "string"
        && typeof entry.details === "string";
}
export function readMockAuditLogs() {
    if (liveEnabled())
        return readLive("audits");
    if (typeof window === "undefined")
        return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(mockAuditLogsKey) ?? "[]");
        // Reverse first so entries appended in the same millisecond stay newest first.
        return Array.isArray(parsed) ? parsed.filter(isAuditLog).reverse()
            .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)) : [];
    }
    catch {
        return [];
    }
}
// Append-only mock activity, called after a successful Admin transition.
// Never invent historical events or let an audit write failure undo an action.
export function recordMockAuditLog(entry) {
    if (typeof window === "undefined")
        return;
    try {
        const parsed = JSON.parse(window.localStorage.getItem(mockAuditLogsKey) ?? "[]");
        if (!Array.isArray(parsed))
            return;
        const created = {
            ...entry,
            details: entry.details.length > 500 ? `${entry.details.slice(0, 497)}...` : entry.details,
            actorLabel: entry.actorLabel?.trim() || "Mock Admin",
            id: `mock-audit-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`,
            timestamp: new Date().toISOString(),
        };
        window.localStorage.setItem(mockAuditLogsKey, JSON.stringify([...parsed, created]));
        window.dispatchEvent(new Event(mockAuditLogsChangedEvent));
    }
    catch {
        // Browser storage can be unavailable. The primary action is already saved.
    }
}
