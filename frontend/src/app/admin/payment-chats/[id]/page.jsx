import { PaymentChat } from "@/components/payment-chat";
import { AdminPortalShell } from "@/components/admin-portal-shell";

export const metadata = { title: "Payment chat | RoomStay Admin" };

export default async function AdminPaymentChatPage({ params }) {
    const { id } = await params;
    return (<AdminPortalShell activeSection="Payment chats">
      <PaymentChat inquiryId={id} audience="admin"/>
    </AdminPortalShell>);
}
