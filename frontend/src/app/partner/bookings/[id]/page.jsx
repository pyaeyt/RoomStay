import { PartnerPortalShell } from "@/components/partner-portal-shell";
import { PartnerBookingReview } from "@/components/partner-booking-review";
export const metadata = { title: "Partner Booking Review | RoomStay" };
export default async function PartnerBookingReviewPage({ params }) {
    const { id } = await params;
    return (<PartnerPortalShell activeSection="Bookings">
      <PartnerBookingReview bookingId={id}/>
    </PartnerPortalShell>);
}
