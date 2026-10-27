import { liveEnabled, readLive } from "@/lib/live-store";
import { recordMockAuditLog } from "@/lib/mock-audit-logs";
import { notifyMockReportUpdated } from "@/lib/mock-notifications";
export const mockReportsKey = "roomstay.mockReports";
export const mockReportsChangedEvent = "roomstay:reports-changed";
export const reportTargetTypes = ["PROPERTY", "USER", "PARTNER"];
export const reportStatuses = ["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"];
function isTargetType(value) {
    return value === "PROPERTY" || value === "USER" || value === "PARTNER";
}
function isReportStatus(value) {
    return value === "OPEN" || value === "UNDER_REVIEW" || value === "RESOLVED" || value === "DISMISSED";
}
function normalizeReport(value) {
    if (!value || typeof value !== "object")
        return null;
    const report = value;
    if (typeof report.id !== "string"
        || typeof report.reporterUserId !== "string"
        || typeof report.reporterName !== "string"
        || !isTargetType(report.targetType)
        || typeof report.targetId !== "string"
        || typeof report.targetLabel !== "string"
        || typeof report.reason !== "string"
        || typeof report.description !== "string"
        || !isReportStatus(report.status)
        || typeof report.createdAt !== "string") {
        return null;
    }
    return {
        id: report.id,
        reporterUserId: report.reporterUserId,
        reporterName: report.reporterName,
        targetType: report.targetType,
        targetId: report.targetId,
        targetLabel: report.targetLabel,
        reason: report.reason,
        description: report.description,
        status: report.status,
        createdAt: report.createdAt,
        reviewedAt: typeof report.reviewedAt === "string" ? report.reviewedAt : undefined,
        resolutionNote: typeof report.resolutionNote === "string" ? report.resolutionNote : undefined,
    };
}
export function readMockReports() {
    if (liveEnabled())
        return readLive("reports");
    if (typeof window === "undefined")
        return [];
    try {
        const stored = window.localStorage.getItem(mockReportsKey);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed)
            ? parsed.map(normalizeReport).filter((report) => Boolean(report))
            : [];
    }
    catch {
        return [];
    }
}
function writeMockReports(reports) {
    window.localStorage.setItem(mockReportsKey, JSON.stringify(reports));
    window.dispatchEvent(new Event(mockReportsChangedEvent));
}
export function findMockReportById(id) {
    return readMockReports().find((report) => report.id === id) ?? null;
}
export function saveMockReport(report) {
    const reports = readMockReports();
    if (reports.some((item) => item.id === report.id))
        return;
    writeMockReports([...reports, report]);
}
export function reportStatusLabel(status) {
    if (status === "OPEN")
        return "Open";
    if (status === "UNDER_REVIEW")
        return "Under Review";
    if (status === "RESOLVED")
        return "Resolved";
    return "Dismissed";
}
export function reportStatusTone(status) {
    if (status === "OPEN")
        return "bg-red-50 text-alert ring-red-100";
    if (status === "UNDER_REVIEW")
        return "bg-primary-tint text-primary ring-primary/25";
    if (status === "RESOLVED")
        return "bg-[#e7f6ee] text-[#1d7a3f] ring-[#c9e9d4]";
    return "bg-canvas text-ink-secondary ring-line";
}
export function reportTargetTypeLabel(targetType) {
    if (targetType === "PROPERTY")
        return "Property";
    if (targetType === "USER")
        return "User";
    return "Partner";
}
// Applies an Admin decision. Only OPEN reports can move to UNDER_REVIEW;
// only OPEN or UNDER_REVIEW reports can be RESOLVED or DISMISSED. Resolve
// requires a note. Returns the updated report, or null when no transition
// happened. No account or property deletion happens here.
export function reviewMockReport(id, decision) {
    const reports = readMockReports();
    const existing = reports.find((report) => report.id === id);
    if (!existing)
        return null;
    if (decision.status === "UNDER_REVIEW" && existing.status !== "OPEN")
        return null;
    if ((decision.status === "RESOLVED" || decision.status === "DISMISSED")
        && existing.status !== "OPEN" && existing.status !== "UNDER_REVIEW")
        return null;
    if (decision.status === "RESOLVED" && !decision.resolutionNote.trim())
        return null;
    const note = decision.status === "UNDER_REVIEW" ? undefined : decision.resolutionNote?.trim() || undefined;
    const updated = {
        ...existing,
        status: decision.status,
        reviewedAt: new Date().toISOString(),
        resolutionNote: note,
    };
    writeMockReports(reports.map((report) => report.id === id ? updated : report));
    recordMockAuditLog({
        action: decision.status === "UNDER_REVIEW" ? "REPORT_UNDER_REVIEW" : decision.status === "RESOLVED" ? "REPORT_RESOLVED" : "REPORT_DISMISSED",
        targetType: "REPORT", targetId: updated.id, targetName: updated.targetLabel,
        details: `${existing.status} → ${updated.status}.${note ? ` Note: ${note}` : ""}`,
    });
    try {
        notifyMockReportUpdated(updated);
    }
    catch {
        // A notification failure must not undo or misreport a saved decision.
    }
    return updated;
}
