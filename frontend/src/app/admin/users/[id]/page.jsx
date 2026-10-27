import { AdminUserDetails } from "@/components/admin-user-details";
import { AdminPortalShell } from "@/components/admin-portal-shell";
export const metadata = { title: "User Details | RoomStay Admin" };
export default async function AdminUserPage({ params }) {
    const { id } = await params;
    return (<AdminPortalShell activeSection="Users">
      <AdminUserDetails userId={id}/>
    </AdminPortalShell>);
}
