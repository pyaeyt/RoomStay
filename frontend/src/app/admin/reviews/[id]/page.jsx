import { AdminReviewDetails } from "@/components/admin-review-details";
import { AdminPortalShell } from "@/components/admin-portal-shell";
export const metadata = { title: "Review Details | RoomStay Admin" };
export default async function AdminReviewPage({ params }) {
    const { id } = await params;
    return <AdminPortalShell activeSection="Reviews"><AdminReviewDetails reviewId={id}/></AdminPortalShell>;
}
