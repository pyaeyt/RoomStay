import { AdminPartnerApplicationsList } from "@/components/admin-partner-applications-list";
import { AdminPortalShell } from "@/components/admin-portal-shell";
export const metadata = { title: "Partner Applications | RoomStay Admin" };
export default function AdminPartnerApplicationsPage() {
    return (<AdminPortalShell activeSection="Partner Applications">
      <AdminPartnerApplicationsList />
    </AdminPortalShell>);
}
