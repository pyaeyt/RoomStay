import { AdminReportsList } from "@/components/admin-reports-list";
import { AdminPortalShell } from "@/components/admin-portal-shell";
export const metadata = { title: "Reports | RoomStay Admin" };
export default function AdminReportsPage() {
    return (<AdminPortalShell activeSection="Reports">
      <AdminReportsList />
    </AdminPortalShell>);
}
