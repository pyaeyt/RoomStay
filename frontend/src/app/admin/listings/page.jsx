import { AdminListingsList } from "@/components/admin-listings-list";
import { AdminPortalShell } from "@/components/admin-portal-shell";
export const metadata = { title: "Listing Review | RoomStay Admin" };
export default function AdminListingsPage() {
    return (<AdminPortalShell activeSection="Listings">
      <AdminListingsList />
    </AdminPortalShell>);
}
