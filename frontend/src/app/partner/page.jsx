import { PartnerDashboard } from "@/components/partner-dashboard";
import { PartnerPortalShell } from "@/components/partner-portal-shell";
export const metadata = { title: "Partner Dashboard | RoomStay" };
export default function PartnerDashboardPage() {
    return (<PartnerPortalShell activeSection="Dashboard">
      <PartnerDashboard />
    </PartnerPortalShell>);
}
