import { AdminUsersList } from "@/components/admin-users-list";
import { AdminPortalShell } from "@/components/admin-portal-shell";
export const metadata = { title: "Users | RoomStay Admin" };
export default function AdminUsersPage() {
    return (<AdminPortalShell activeSection="Users">
      <AdminUsersList />
    </AdminPortalShell>);
}
