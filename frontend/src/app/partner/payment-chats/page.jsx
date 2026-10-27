import { PartnerPaymentChatList } from "@/components/payment-chat";
import { PartnerPortalShell } from "@/components/partner-portal-shell";

export const metadata = { title: "Payment chat | RoomStay Partner" };

export default function PartnerPaymentChatsPage() {
    return (<PartnerPortalShell activeSection="Payment">
      <PartnerPaymentChatList />
    </PartnerPortalShell>);
}
