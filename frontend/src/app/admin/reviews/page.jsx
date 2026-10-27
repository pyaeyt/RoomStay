import { AdminReviewsList } from "@/components/admin-reviews-list";
import { AdminPortalShell } from "@/components/admin-portal-shell";
export const metadata = { title: "Reviews | RoomStay Admin" };
export default function AdminReviewsPage() {
    return <AdminPortalShell activeSection="Reviews"><AdminReviewsList /></AdminPortalShell>;
}
