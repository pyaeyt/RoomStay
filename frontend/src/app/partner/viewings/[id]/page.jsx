import { ViewingDetails } from "@/components/viewing-management";
import { PartnerPortalShell } from "@/components/partner-portal-shell";
export const metadata = { title: "Review Viewing | RoomStay" };
export default async function Page({ params }) {
    const { id } = await params;
    return (<PartnerPortalShell activeSection="Viewings"><ViewingDetails viewingId={id} partner/></PartnerPortalShell>);
}
