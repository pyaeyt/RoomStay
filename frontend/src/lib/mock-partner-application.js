import { liveEnabled, readLive } from "@/lib/live-store";
import { recordMockAuditLog } from "@/lib/mock-audit-logs";
import { notifyMockPartnerAccessChanged } from "@/lib/mock-notifications";
export const mockPartnerApplicationsKey = "roomstay.mockPartnerApplications";
export const mockPartnerApplicationsChangedEvent = "roomstay:partner-applications-changed";
function isApplicationStatus(value) {
    return value === "PENDING" || value === "APPROVED" || value === "REJECTED" || value === "SUSPENDED";
}
function normalizeApplication(value) {
    if (!value || typeof value !== "object")
        return null;
    const application = value;
    if (typeof application.id !== "string"
        || typeof application.userId !== "string"
        || typeof application.fullName !== "string"
        || typeof application.email !== "string"
        || typeof application.phone !== "string"
        || typeof application.idDocumentName !== "string"
        || typeof application.idDocumentType !== "string"
        || typeof application.ownershipDocumentName !== "string"
        || typeof application.ownershipDocumentType !== "string"
        || typeof application.note !== "string"
        || !isApplicationStatus(application.status)
        || typeof application.submittedAt !== "string") {
        return null;
    }
    return {
        id: application.id,
        userId: application.userId,
        fullName: application.fullName,
        email: application.email,
        phone: application.phone,
        idDocumentName: application.idDocumentName,
        idDocumentType: application.idDocumentType,
        ownershipDocumentName: application.ownershipDocumentName,
        ownershipDocumentType: application.ownershipDocumentType,
        note: application.note,
        status: application.status,
        submittedAt: application.submittedAt,
        reviewedAt: typeof application.reviewedAt === "string" ? application.reviewedAt : undefined,
        suspendedAt: typeof application.suspendedAt === "string" ? application.suspendedAt : undefined,
        suspensionReason: typeof application.suspensionReason === "string" ? application.suspensionReason : undefined,
        suspendedBy: typeof application.suspendedBy === "string" ? application.suspendedBy : undefined,
        unsuspendedAt: typeof application.unsuspendedAt === "string" ? application.unsuspendedAt : undefined,
        rejectionReason: typeof application.rejectionReason === "string" ? application.rejectionReason : undefined,
    };
}
export function readMockPartnerApplications() {
    if (liveEnabled())
        return readLive("applications");
    if (typeof window === "undefined")
        return [];
    try {
        const stored = window.localStorage.getItem(mockPartnerApplicationsKey);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed)
            ? parsed.map(normalizeApplication).filter((application) => Boolean(application))
            : [];
    }
    catch {
        return [];
    }
}
function writeMockPartnerApplications(applications) {
    window.localStorage.setItem(mockPartnerApplicationsKey, JSON.stringify(applications));
    window.dispatchEvent(new Event(mockPartnerApplicationsChangedEvent));
}
export function readMockPartnerApplicationsForUser(userId) {
    return readMockPartnerApplications()
        .filter((application) => application.userId === userId)
        .sort((first, second) => new Date(second.submittedAt).getTime() - new Date(first.submittedAt).getTime());
}
// A PENDING, APPROVED, or SUSPENDED application blocks a new submission. A REJECTED
// application does not, so the user can re-apply.
export function findBlockingMockPartnerApplication(userId) {
    return readMockPartnerApplicationsForUser(userId).find((application) => application.status !== "REJECTED") ?? null;
}
export function saveMockPartnerApplication(application) {
    writeMockPartnerApplications([...readMockPartnerApplications(), application]);
}
export function findMockPartnerApplicationById(id) {
    return readMockPartnerApplications().find((application) => application.id === id) ?? null;
}
// Applies an Admin decision. Only PENDING applications can transition;
// returns the updated application, or null when no transition happened.
export function reviewMockPartnerApplication(id, decision) {
    const applications = readMockPartnerApplications();
    const existing = applications.find((application) => application.id === id);
    if (!existing || existing.status !== "PENDING")
        return null;
    const updated = {
        ...existing,
        status: decision.status,
        reviewedAt: new Date().toISOString(),
        rejectionReason: decision.status === "REJECTED" ? decision.rejectionReason : undefined,
    };
    writeMockPartnerApplications(applications.map((application) => application.id === id ? updated : application));
    recordMockAuditLog({
        action: decision.status === "APPROVED" ? "PARTNER_APPLICATION_APPROVED" : "PARTNER_APPLICATION_REJECTED",
        targetType: "PARTNER_APPLICATION", targetId: updated.id, targetName: updated.fullName,
        details: `PENDING → ${updated.status}.${updated.rejectionReason ? ` Reason: ${updated.rejectionReason}` : ""}`,
    });
    return updated;
}
export function createMockPartnerApplicationId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return `mock-partner-application-${crypto.randomUUID()}`;
    }
    return `mock-partner-application-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}
// Suspension takes precedence over a stale cached capability or older approval.
export function findMockPartnerCapability(userId) {
    const applications = readMockPartnerApplicationsForUser(userId);
    return applications.find((application) => application.status === "SUSPENDED") ?? applications[0] ?? null;
}
export function hasMockPartnerAccess(user) {
    const application = findMockPartnerCapability(user.id);
    return application ? application.status === "APPROVED" : user.isPartner === true;
}
// Only toggles an existing approved capability; application review and all
// related records remain intact. Repeated/stale actions are no-ops.
export function changeMockPartnerAccess(id, decision) {
    const applications = readMockPartnerApplications();
    const existing = applications.find((application) => application.id === id);
    if (!existing || (decision.status === "SUSPENDED"
        ? existing.status !== "APPROVED" || !decision.reason.trim()
        : existing.status !== "SUSPENDED"))
        return null;
    const now = new Date().toISOString();
    const updated = decision.status === "SUSPENDED"
        ? { ...existing, status: "SUSPENDED", suspendedAt: now, suspensionReason: decision.reason.trim(), suspendedBy: decision.suspendedBy }
        : { ...existing, status: "APPROVED", unsuspendedAt: now };
    writeMockPartnerApplications(applications.map((application) => application.id === id ? updated : application));
    recordMockAuditLog({
        action: decision.status === "SUSPENDED" ? "PARTNER_SUSPENDED" : "PARTNER_ACCESS_RESTORED",
        actorLabel: decision.status === "SUSPENDED" ? decision.suspendedBy : undefined,
        targetType: "PARTNER", targetId: updated.userId, targetName: updated.fullName,
        details: `${existing.status} → ${updated.status}.${decision.status === "SUSPENDED" ? ` Reason: ${updated.suspensionReason}` : " Normal User account and Partner records preserved."}`,
    });
    try {
        notifyMockPartnerAccessChanged(updated.userId, decision.status, updated.suspensionReason);
    }
    catch {
        // A notification failure must not undo or misreport a saved access change.
    }
    return updated;
}
