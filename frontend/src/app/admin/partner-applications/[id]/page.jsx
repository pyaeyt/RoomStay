import { AdminPartnerApplicationReview } from "@/components/admin-partner-application-review";
import { AdminPortalShell } from "@/components/admin-portal-shell";
export const metadata = { title: "Application Review | RoomStay Admin" };
export default async function AdminPartnerApplicationPage({ params }) {
    const { id } = await params;
    return (<AdminPortalShell activeSection="Partner Applications">
      <AdminPartnerApplicationReview applicationId={id}/>
    </AdminPortalShell>);
}
