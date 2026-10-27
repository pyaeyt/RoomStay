import { PartnerPortalShell } from "@/components/partner-portal-shell";
import { PartnerBookings } from "@/components/partner-bookings";
export const metadata = { title: "Partner Bookings | RoomStay" };
export default function PartnerBookingsPage() {
    return (<PartnerPortalShell activeSection="Bookings">
      <PartnerBookings />
    </PartnerPortalShell>);
}
