import { PartnerMessagesList } from "@/components/partner-messages-list";
import { PartnerPortalShell } from "@/components/partner-portal-shell";
export const metadata = { title: "Messages | RoomStay" };
export default function Page() {
    return (<PartnerPortalShell activeSection="Messages"><PartnerMessagesList /></PartnerPortalShell>);
}
