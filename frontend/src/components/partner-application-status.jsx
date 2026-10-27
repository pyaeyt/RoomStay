"use client";
import Link from "next/link";
import { PartnerSuspensionNotice } from "@/components/partner-suspension-notice";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useMockAuth } from "@/lib/mock-auth";
import { mockPartnerApplicationsChangedEvent, readMockPartnerApplicationsForUser, } from "@/lib/mock-partner-application";
import { formatBookingDate } from "@/lib/format-date";
function DocumentSummary({ application }) {
    return (<dl className="mt-5 grid gap-3 text-sm text-ink-secondary sm:grid-cols-2">
      <div><dt className="font-medium text-ink">Applicant</dt><dd className="mt-1">{application.fullName}</dd></div>
      <div><dt className="font-medium text-ink">Email</dt><dd className="mt-1">{application.email}</dd></div>
      <div><dt className="font-medium text-ink">Phone</dt><dd className="mt-1">{application.phone}</dd></div>
      <div><dt className="font-medium text-ink">Submitted</dt><dd className="mt-1">{formatBookingDate(application.submittedAt)}</dd></div>
      <div><dt className="font-medium text-ink">Identity document</dt><dd className="mt-1">{application.idDocumentName}</dd></div>
      <div><dt className="font-medium text-ink">Ownership document</dt><dd className="mt-1">{application.ownershipDocumentName}</dd></div>
      {application.note && <div className="sm:col-span-2"><dt className="font-medium text-ink">Note</dt><dd className="mt-1 leading-6">{application.note}</dd></div>}
    </dl>);
}
export function PartnerApplicationStatus() {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const [application, setApplication] = useState(undefined);
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user) {
            router.replace(`/login?returnTo=${encodeURIComponent("/partner-application")}`);
            return undefined;
        }
        const currentUser = user;
        function loadApplication() {
            const applications = readMockPartnerApplicationsForUser(currentUser.id);
            setApplication(applications.length > 0 ? applications[0] : null);
        }
        const timeout = window.setTimeout(loadApplication, 0);
        window.addEventListener(mockPartnerApplicationsChangedEvent, loadApplication);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockPartnerApplicationsChangedEvent, loadApplication);
        };
    }, [isReady, router, user]);
    if (!isReady || application === undefined) {
        return <div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">Loading application status...</div>;
    }
    if (!user) {
        return <div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">Redirecting to login...</div>;
    }
    if (!application) {
        return (<section className="mx-auto max-w-2xl rounded-xl border border-line bg-white px-5 py-14 text-center shadow-sm shadow-ink/5">
        <p className="text-sm font-semibold text-primary">Partner application</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">No application yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">You have not submitted a Partner application.</p>
        <Link href="/become-a-partner" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">Become a Partner</Link>
      </section>);
    }
    return (<section className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">Partner Application Status</h1>
        <p className="mt-2 text-sm text-ink-secondary">Current status of your Partner application.</p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-7">
        {application.status === "SUSPENDED" && <PartnerSuspensionNotice application={application}/>}

        {application.status === "PENDING" && (<div className="rounded-2xl bg-primary-tint p-5 text-center">
            <Icon name="bell" size={36} className="mx-auto text-primary"/>
            <p className="mt-3 text-sm font-semibold text-primary">Under Review</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-ink">Your application is being reviewed</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">Submitted on {formatBookingDate(application.submittedAt)}. The review result will appear here once an Admin decision is made.</p>
            <Link href="/" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-5 text-sm font-semibold text-ink btn-secondary">Back to Home</Link>
          </div>)}

        {application.status === "APPROVED" && (<div className="rounded-2xl bg-primary-tint p-5 text-center">
            <Icon name="homeFilled" size={38} className="mx-auto text-primary"/>
            <p className="mt-3 text-sm font-semibold text-primary">Approved Partner</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-ink">Partner access is available</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">You can now create listings and manage Partner booking activity from the Partner Portal.</p>
            <Link href="/partner" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">Go to Partner Portal</Link>
          </div>)}

        {application.status === "REJECTED" && (<div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-center">
            <Icon name="close" size={36} className="mx-auto text-alert"/>
            <p className="mt-3 text-sm font-semibold text-alert">Application Rejected</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-ink">Please update and reapply</h2>
            {application.rejectionReason && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary"><span className="font-medium text-ink">Reason:</span> {application.rejectionReason}</p>}
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/become-a-partner" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">Edit & Reapply</Link>
              <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-5 text-sm font-semibold text-ink btn-secondary">Back to Home</Link>
            </div>
          </div>)}

        <DocumentSummary application={application}/>
      </div>
    </section>);
}
