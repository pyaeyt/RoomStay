import { AdminListingReview } from "@/components/admin-listings-review";
import { AdminPortalShell } from "@/components/admin-portal-shell";
export const metadata = { title: "Listing Details | RoomStay Admin" };
export default async function AdminListingPage({ params }) {
    const { id } = await params;
    return (<AdminPortalShell activeSection="Listings">
      <AdminListingReview listingId={id}/>
    </AdminPortalShell>);
}
