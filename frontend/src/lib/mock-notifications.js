import { api } from "@/lib/api";
import { liveEnabled, readLive, writeLive } from "@/lib/live-store";
export const mockNotificationsKey = "roomstay.mockNotifications";
export const mockNotificationsChangedEvent = "roomstay:notifications-changed";
function createId(prefix) {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}
function isNotificationType(value) {
    return (value === "BOOKING_APPROVED"
        || value === "BOOKING_DECLINED"
        || value === "PAYMENT_VERIFIED"
        || value === "PAYMENT_REJECTED"
        || value === "VIEWING_UPDATE"
        || value === "NEW_MESSAGE"
        || value === "REPORT_UPDATE"
        || value === "PARTNER_SUSPENDED"
        || value === "PARTNER_RESTORED");
}
function normalizeNotification(value) {
    if (!value || typeof value !== "object")
        return null;
    const notification = value;
    if (typeof notification.id !== "string"
        || typeof notification.renterUserId !== "string"
        || !isNotificationType(notification.type)
        || typeof notification.title !== "string"
        || typeof notification.message !== "string"
        || typeof notification.createdAt !== "string") {
        return null;
    }
    return {
        id: notification.id,
        renterUserId: notification.renterUserId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedViewingId: typeof notification.relatedViewingId === "string" ? notification.relatedViewingId : undefined,
        relatedBookingId: typeof notification.relatedBookingId === "string" ? notification.relatedBookingId : undefined,
        relatedPropertyId: typeof notification.relatedPropertyId === "string" ? notification.relatedPropertyId : undefined,
        relatedEvidenceId: typeof notification.relatedEvidenceId === "string" ? notification.relatedEvidenceId : undefined,
        relatedReportId: typeof notification.relatedReportId === "string" ? notification.relatedReportId : undefined,
        createdAt: notification.createdAt,
        read: notification.read === true,
    };
}
export function readMockNotifications() {
    if (liveEnabled())
        return readLive("notifications");
    if (typeof window === "undefined")
        return [];
    try {
        const stored = window.localStorage.getItem(mockNotificationsKey);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed)
            ? parsed.map(normalizeNotification).filter((notification) => Boolean(notification))
            : [];
    }
    catch {
        return [];
    }
}
function writeMockNotifications(notifications) {
    window.localStorage.setItem(mockNotificationsKey, JSON.stringify(notifications));
    window.dispatchEvent(new Event(mockNotificationsChangedEvent));
}
export function readMockNotificationsForUser(renterUserId) {
    return readMockNotifications()
        .filter((notification) => notification.renterUserId === renterUserId)
        .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
}
export function readMockUnreadNotificationCount(renterUserId) {
    return readMockNotifications().filter((notification) => notification.renterUserId === renterUserId && !notification.read).length;
}
export function markMockNotificationRead(notificationId, renterUserId) {
    if (liveEnabled()) {
        writeLive("notifications", readMockNotifications().map((notification) => notification.id === notificationId ? { ...notification, read: true } : notification));
        void api(`/api/notifications/${notificationId}/read`, { method: "POST" }).catch(() => undefined);
        window.dispatchEvent(new Event(mockNotificationsChangedEvent));
        return;
    }
    const notifications = readMockNotifications();
    if (!notifications.some((notification) => notification.id === notificationId && notification.renterUserId === renterUserId)) {
        return;
    }
    writeMockNotifications(notifications.map((notification) => notification.id === notificationId ? { ...notification, read: true } : notification));
}
export function markAllMockNotificationsRead(renterUserId) {
    if (liveEnabled()) {
        const notifications = readMockNotifications();
        for (const notification of notifications) {
            if (notification.renterUserId === renterUserId && !notification.read) {
                void api(`/api/notifications/${notification.id}/read`, { method: "POST" }).catch(() => undefined);
            }
        }
        writeLive("notifications", notifications.map((notification) => notification.renterUserId === renterUserId ? { ...notification, read: true } : notification));
        window.dispatchEvent(new Event(mockNotificationsChangedEvent));
        return;
    }
    const notifications = readMockNotifications();
    if (!notifications.some((notification) => notification.renterUserId === renterUserId && !notification.read)) {
        return;
    }
    writeMockNotifications(notifications.map((notification) => notification.renterUserId === renterUserId ? { ...notification, read: true } : notification));
}
function addMockNotification(notification) {
    const created = {
        ...notification,
        id: createId("mock-notification"),
        createdAt: new Date().toISOString(),
        read: false,
    };
    writeMockNotifications([...readMockNotifications(), created]);
    return created;
}
// Notifications are only created from events that already exist in the mock
// flows. Each helper guards against recording the same event twice.
// Partner approved a booking (PENDING -> DEPOSIT_PENDING).
export function notifyMockBookingApproved(booking) {
    const exists = readMockNotifications().some((notification) => notification.type === "BOOKING_APPROVED" && notification.relatedBookingId === booking.id);
    if (exists)
        return;
    addMockNotification({
        renterUserId: booking.renterUserId,
        type: "BOOKING_APPROVED",
        title: "Booking approved",
        message: `${booking.propertyTitle}: your booking request was approved. Please upload your deposit payment before the deadline.`,
        relatedBookingId: booking.id,
        relatedPropertyId: booking.propertyId,
    });
}
// Partner declined a booking (PENDING -> DECLINED).
export function notifyMockBookingDeclined(booking) {
    const exists = readMockNotifications().some((notification) => notification.type === "BOOKING_DECLINED" && notification.relatedBookingId === booking.id);
    if (exists)
        return;
    addMockNotification({
        renterUserId: booking.renterUserId,
        type: "BOOKING_DECLINED",
        title: "Booking declined",
        message: `${booking.propertyTitle}: your booking request was declined.${booking.declineReason ? ` Reason: ${booking.declineReason}` : ""}`,
        relatedBookingId: booking.id,
        relatedPropertyId: booking.propertyId,
    });
}
// Partner verified payment evidence (VERIFICATION_PENDING -> CONFIRMED).
export function notifyMockPaymentVerified(booking) {
    const exists = readMockNotifications().some((notification) => notification.type === "PAYMENT_VERIFIED" && notification.relatedBookingId === booking.id);
    if (exists)
        return;
    addMockNotification({
        renterUserId: booking.renterUserId,
        type: "PAYMENT_VERIFIED",
        title: "Payment verified",
        message: `${booking.propertyTitle}: your payment evidence was verified. Your booking is now confirmed.`,
        relatedBookingId: booking.id,
        relatedPropertyId: booking.propertyId,
    });
}
// Partner rejected payment evidence. Rejection can happen more than once per
// booking (the renter may upload new evidence), so duplicates are guarded per
// evidence record instead of per booking.
export function notifyMockPaymentRejected(booking, evidence) {
    const exists = readMockNotifications().some((notification) => notification.type === "PAYMENT_REJECTED"
        && notification.relatedBookingId === booking.id
        && notification.relatedEvidenceId === evidence.id);
    if (exists)
        return;
    const canReupload = booking.status === "DEPOSIT_PENDING";
    addMockNotification({
        renterUserId: booking.renterUserId,
        type: "PAYMENT_REJECTED",
        title: "Payment rejected",
        message: `${booking.propertyTitle}: your payment evidence was rejected.${evidence.rejectionReason ? ` Reason: ${evidence.rejectionReason}` : ""}${canReupload ? " You can upload new evidence before the deadline." : " The booking expired and the room is available again."}`,
        relatedBookingId: booking.id,
        relatedPropertyId: booking.propertyId,
        relatedEvidenceId: evidence.id,
    });
}
// Viewing decisions reuse the existing notification store and update type.
export function notifyMockViewingUpdated(viewing) {
    if (viewing.status === "REQUESTED")
        return;
    if (readMockNotifications().some((notification) => notification.type === "VIEWING_UPDATE" && notification.relatedViewingId === viewing.id))
        return;
    const title = viewing.status === "APPROVED" ? "Viewing approved"
        : viewing.status === "DECLINED" ? "Viewing declined" : "Viewing reschedule requested";
    addMockNotification({
        renterUserId: viewing.renterId,
        type: "VIEWING_UPDATE",
        title,
        message: `${viewing.propertyTitle}: ${title.toLowerCase()}. Open your viewing for details.`,
        relatedViewingId: viewing.id,
        relatedPropertyId: viewing.propertyId,
    });
}
// Admin report decisions notify the reporter through the same store.
// Guarded per report and status so a status change is recorded only once.
export function notifyMockReportUpdated(report) {
    if (report.status === "OPEN")
        return;
    if (readMockNotifications().some((notification) => notification.type === "REPORT_UPDATE"
        && notification.relatedReportId === report.id
        && notification.title === `Report ${report.status === "UNDER_REVIEW" ? "under review" : report.status.toLowerCase()}`))
        return;
    const statusLabel = report.status === "UNDER_REVIEW" ? "under review" : report.status.toLowerCase();
    addMockNotification({
        renterUserId: report.reporterUserId,
        type: "REPORT_UPDATE",
        title: `Report ${statusLabel}`,
        message: `Your report about ${report.targetLabel} is now ${statusLabel}.${report.resolutionNote ? ` Note: ${report.resolutionNote}` : ""}`,
        relatedPropertyId: report.targetType === "PROPERTY" ? report.targetId : undefined,
        relatedReportId: report.id,
    });
}
// Called only after a successful capability transition, so repeated actions
// cannot duplicate notifications. A later suspension/restoration is a new event.
export function notifyMockPartnerAccessChanged(userId, status, reason) {
    addMockNotification({
        renterUserId: userId,
        type: status === "SUSPENDED" ? "PARTNER_SUSPENDED" : "PARTNER_RESTORED",
        title: status === "SUSPENDED" ? "Partner access suspended" : "Partner access restored",
        message: status === "SUSPENDED"
            ? `Your Partner access is currently suspended.${reason ? ` Reason: ${reason}` : ""} You can still use your Normal User account and renter features.`
            : "Your Partner access has been restored. You can use the Partner Portal again.",
    });
}
