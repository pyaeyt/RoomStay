import { PartnerConversationView } from "@/components/partner-conversation-view";
import { PartnerPortalShell } from "@/components/partner-portal-shell";
export const metadata = { title: "Conversation | RoomStay" };
export default async function Page({ params }) {
    const { conversationId } = await params;
    return (<PartnerPortalShell activeSection="Messages"><PartnerConversationView conversationId={conversationId}/></PartnerPortalShell>);
}
