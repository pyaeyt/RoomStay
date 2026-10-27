import { ViewingsList } from "@/components/viewing-management";
import { PartnerPortalShell } from "@/components/partner-portal-shell";
export const metadata = { title: "Viewing Requests | RoomStay" };
export default function Page() {
    return (<PartnerPortalShell activeSection="Viewings"><ViewingsList partner/></PartnerPortalShell>);
}
