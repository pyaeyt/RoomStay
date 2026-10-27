import { PartnerPortalShell } from "@/components/partner-portal-shell";
import { PartnerListingsList } from "@/components/partner-listings-list";
export const metadata = { title: "My Listings | Partner" };
export default function PartnerListingsPage() {
    return (<PartnerPortalShell activeSection="Listings">
      <PartnerListingsList />
    </PartnerPortalShell>);
}
