import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminPortalShell } from "@/components/admin-portal-shell";
export const metadata = { title: "Admin Dashboard | RoomStay" };
export default function AdminDashboardPage() {
    return (<AdminPortalShell activeSection="Dashboard">
      <AdminDashboard />
    </AdminPortalShell>);
}
