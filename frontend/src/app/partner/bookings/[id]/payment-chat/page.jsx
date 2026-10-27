import { PaymentChat } from "@/components/payment-chat";
import { PartnerPortalShell } from "@/components/partner-portal-shell";

export const metadata = { title: "Payment chat | RoomStay Partner" };

export default async function PartnerBookingPaymentChatPage({ params }) {
    const { id } = await params;
    return (<PartnerPortalShell activeSection="Payment">
      <PaymentChat bookingId={id} audience="partner"/>
    </PartnerPortalShell>);
}
