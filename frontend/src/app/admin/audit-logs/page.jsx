import { AdminAuditLogs } from "@/components/admin-audit-logs";
import { AdminPortalShell } from "@/components/admin-portal-shell";
export const metadata = { title: "Audit Logs | RoomStay Admin" };
export default function AdminAuditLogsPage() {
    return <AdminPortalShell activeSection="Audit Logs"><AdminAuditLogs /></AdminPortalShell>;
}
