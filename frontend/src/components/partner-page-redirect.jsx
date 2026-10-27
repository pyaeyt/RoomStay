"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
// These aliases reuse existing user pages. The Partner layout checks access
// before this component mounts, so suspended users see the suspension notice.
export function PartnerPageRedirect({ href }) {
    const router = useRouter();
    useEffect(() => { router.replace(href); }, [href, router]);
    return <p className="p-6 text-sm text-ink-secondary">Opening your account page...</p>;
}
