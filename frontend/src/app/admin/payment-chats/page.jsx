import { AdminPaymentChatList } from "@/components/payment-chat";
import { AdminPortalShell } from "@/components/admin-portal-shell";

export const metadata = { title: "Payment chats | RoomStay Admin" };

export default function AdminPaymentChatsPage() {
    return (<AdminPortalShell activeSection="Payment chats">
      <AdminPaymentChatList />
    </AdminPortalShell>);
}
