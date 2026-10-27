"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBookingDate } from "@/lib/format-date";
import { useMockAuth } from "@/lib/mock-auth";
import { liveReloadAdminApplications } from "@/lib/live-actions";
import { liveEnabled } from "@/lib/live-store";
import { mockPartnerApplicationsChangedEvent, readMockPartnerApplications, } from "@/lib/mock-partner-application";
function applicationStatusTone(status) {
    if (status === "SUSPENDED")
        return "bg-amber-50 text-amber-800 ring-amber-200";
    if (status === "APPROVED")
        return "bg-[#e7f6ee] text-[#1d7a3f] ring-[#c9e9d4]";
    if (status === "REJECTED")
        return "bg-red-50 text-alert ring-red-100";
    return "bg-primary-tint text-primary ring-primary/25";
}
export function AdminPartnerApplicationsList() {
    const { isReady } = useMockAuth();
    const [applications, setApplications] = useState(null);
    useEffect(() => {
        if (!isReady)
            return undefined;
        let active = true;
        function loadApplications() {
            if (!active)
                return;
            setApplications(readMockPartnerApplications().sort((first, second) => new Date(second.submittedAt).getTime() - new Date(first.submittedAt).getTime()));
        }
        async function load() {
            if (liveEnabled()) {
                try {
                    await liveReloadAdminApplications();
                }
                catch {
                    // Show the applications already stored for this session.
                }
            }
            loadApplications();
        }
        void load();
        window.addEventListener(mockPartnerApplicationsChangedEvent, loadApplications);
        return () => {
            active = false;
            window.removeEventListener(mockPartnerApplicationsChangedEvent, loadApplications);
        };
    }, [isReady]);
    if (applications === null) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading applications...
      </div>);
    }
    return (<section>
      <div className="mb-5">
        <p className="text-sm font-semibold text-primary">Admin Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Partner Applications</h1>
        <p className="mt-2 text-sm text-ink-secondary">Review Partner applications submitted by renters. Newest first.</p>
      </div>

      {applications.length === 0 ? (<div className="rounded-xl border border-line bg-white px-5 py-14 text-center">
          <h2 className="text-lg font-semibold tracking-[-0.025em]">No applications yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
            Partner applications submitted through Become a Partner will appear here.
          </p>
        </div>) : (<ul className="grid gap-3">
          {applications.map((application) => (<li key={application.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold tracking-[-0.025em]">{application.fullName}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${applicationStatusTone(application.status)}`}>
                      {application.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-secondary">{application.email} · {application.phone}</p>
                  <p className="mt-1 text-xs text-ink-secondary">Submitted {formatBookingDate(application.submittedAt)}</p>
                </div>
                <Link href={`/admin/partner-applications/${encodeURIComponent(application.id)}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink btn-secondary">
                  View Details
                </Link>
              </div>
            </li>))}
        </ul>)}
    </section>);
}
