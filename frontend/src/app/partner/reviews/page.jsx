import { PartnerReviews } from "@/components/partner-reviews";
import { PartnerPortalShell } from "@/components/partner-portal-shell";
export const metadata = { title: "Reviews | RoomStay" };
export default function Page() {
    return (<PartnerPortalShell activeSection="Reviews"><PartnerReviews /></PartnerPortalShell>);
}
