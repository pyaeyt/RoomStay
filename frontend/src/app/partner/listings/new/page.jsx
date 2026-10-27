import { PartnerPortalShell } from "@/components/partner-portal-shell";
import { PartnerListingForm } from "@/components/partner-listing-form";
export const metadata = { title: "New Listing | Partner" };
export default async function NewPartnerListingPage({ searchParams, }) {
    const params = await searchParams;
    const editId = typeof params.edit === "string" ? params.edit : undefined;
    return (<PartnerPortalShell activeSection="Create">
      <PartnerListingForm listingId={editId}/>
    </PartnerPortalShell>);
}
