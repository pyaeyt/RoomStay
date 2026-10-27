import { PartnerAccessGuard } from "@/components/partner-access-guard";
export default function PartnerLayout({ children }) {
    return <PartnerAccessGuard>{children}</PartnerAccessGuard>;
}
