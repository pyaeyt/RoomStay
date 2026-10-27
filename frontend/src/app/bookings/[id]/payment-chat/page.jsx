import { PaymentChat } from "@/components/payment-chat";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Payment chat | RoomStay" };

export default async function PaymentChatPage({ params }) {
    const { id } = await params;
    return (<div className="min-h-dvh bg-transparent">
      <SiteHeader activePage="Bookings"/>
      <main className="mx-auto max-w-3xl px-[22px] py-8">
        <PaymentChat bookingId={id}/>
      </main>
    </div>);
}
