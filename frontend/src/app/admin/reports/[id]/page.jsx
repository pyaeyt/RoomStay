import { AdminReportDetails } from "@/components/admin-report-details";
import { AdminPortalShell } from "@/components/admin-portal-shell";
export const metadata = { title: "Report Details | RoomStay Admin" };
export default async function AdminReportPage({ params }) {
    const { id } = await params;
    return (<AdminPortalShell activeSection="Reports">
      <AdminReportDetails reportId={id}/>
    </AdminPortalShell>);
}
