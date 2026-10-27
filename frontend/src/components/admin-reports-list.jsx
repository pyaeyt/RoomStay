"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { formatBookingDate } from "@/lib/format-date";
import { mockReportsChangedEvent, readMockReports, reportStatusLabel, reportStatusTone, reportTargetTypeLabel, } from "@/lib/mock-reports";
const filters = [
    { label: "All", value: "ALL" },
    { label: "Open", value: "OPEN" },
    { label: "Under Review", value: "UNDER_REVIEW" },
    { label: "Resolved", value: "RESOLVED" },
    { label: "Dismissed", value: "DISMISSED" },
];
export function AdminReportsList() {
    const [reports, setReports] = useState(null);
    const [query, setQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("ALL");
    useEffect(() => {
        function loadReports() {
            setReports(readMockReports().sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()));
        }
        const timeout = window.setTimeout(loadReports, 0);
        window.addEventListener(mockReportsChangedEvent, loadReports);
        window.addEventListener("storage", loadReports);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockReportsChangedEvent, loadReports);
            window.removeEventListener("storage", loadReports);
        };
    }, []);
    if (reports === null) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading reports...
      </div>);
    }
    const normalizedQuery = query.trim().toLowerCase();
    const visibleReports = reports.filter((report) => {
        if (activeFilter !== "ALL" && report.status !== activeFilter)
            return false;
        if (!normalizedQuery)
            return true;
        return report.targetLabel.toLowerCase().includes(normalizedQuery)
            || report.reporterName.toLowerCase().includes(normalizedQuery)
            || report.reason.toLowerCase().includes(normalizedQuery);
    });
    return (<section>
      <div className="mb-5">
        <p className="text-sm font-semibold text-primary">Admin Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Reports</h1>
        <p className="mt-2 text-sm text-ink-secondary">Review user-submitted reports about properties, users, and Partners. Newest first.</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm shadow-ink/5 md:p-4">
        <div role="search" className="flex h-11 min-w-0 items-center gap-2.5 rounded-lg border border-line px-3 text-ink-secondary focus-within:ring-2 focus-within:ring-primary">
          <Icon name="search" size={18}/>
          <label htmlFor="admin-report-search" className="sr-only">Search reports by target, reporter, or reason</label>
          <input id="admin-report-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by target, reporter, or reason" className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-secondary focus-visible:outline-none"/>
          {query && (<button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-primary-tint">
              <Icon name="close" size={15}/>
            </button>)}
        </div>
        <div role="group" aria-label="Filter reports by status" className="flex flex-wrap gap-1">
          {filters.map((filter) => {
            const active = activeFilter === filter.value;
            return (<button key={filter.value} type="button" aria-pressed={active} onClick={() => setActiveFilter(filter.value)} className={`min-h-11 rounded-xl px-3 text-sm font-semibold whitespace-nowrap ${active ? "bg-primary text-white" : "text-ink-secondary hover:bg-primary-tint hover:text-primary"}`}>
                {filter.label}
              </button>);
        })}
        </div>
      </div>

      <p role="status" aria-live="polite" className="mt-4 text-sm text-ink-secondary">
        {visibleReports.length} {visibleReports.length === 1 ? "report" : "reports"} shown
      </p>

      {reports.length === 0 ? (<div className="mt-3 rounded-xl border border-line bg-white px-5 py-14 text-center">
          <h2 className="text-lg font-semibold tracking-[-0.025em]">No reports yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
            User-submitted reports will appear here for review.
          </p>
        </div>) : visibleReports.length === 0 ? (<div className="mt-3 rounded-xl border border-line bg-white px-5 py-14 text-center">
          <h2 className="text-lg font-semibold tracking-[-0.025em]">No reports match this search</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
            Try another keyword or status filter.
          </p>
        </div>) : (<>
          <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-line bg-white shadow-sm shadow-ink/5 md:block">
            <table className="w-full min-w-3xl text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-ink-secondary">
                  <th scope="col" className="px-4 py-3 font-semibold">Target</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Reporter</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Reason</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Submitted</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleReports.map((report) => (<tr key={report.id} className="border-b border-line align-top last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-ink">{report.targetLabel}</span>
                      <span className="block text-xs text-ink-secondary">{reportTargetTypeLabel(report.targetType)}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">{report.reporterName}</td>
                    <td className="max-w-56 truncate px-4 py-3 text-ink-secondary">{report.reason}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-secondary">{formatBookingDate(report.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${reportStatusTone(report.status)}`}>
                        {reportStatusLabel(report.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/reports/${encodeURIComponent(report.id)}`} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink btn-secondary">
                        Review
                      </Link>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>

          <ul className="mt-3 grid gap-3 md:hidden">
            {visibleReports.map((report) => (<li key={report.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm shadow-ink/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold tracking-[-0.025em]">{report.targetLabel}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${reportStatusTone(report.status)}`}>
                    {reportStatusLabel(report.status)}
                  </span>
                </div>
                <dl className="mt-2 grid gap-1 text-sm text-ink-secondary">
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium">Type</dt>
                    <dd>{reportTargetTypeLabel(report.targetType)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium">Reporter</dt>
                    <dd className="min-w-0 truncate">{report.reporterName}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium">Reason</dt>
                    <dd className="min-w-0 truncate">{report.reason}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium">Submitted</dt>
                    <dd>{formatBookingDate(report.createdAt)}</dd>
                  </div>
                </dl>
                <Link href={`/admin/reports/${encodeURIComponent(report.id)}`} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink btn-secondary">
                  Review
                </Link>
              </li>))}
          </ul>
        </>)}
    </section>);
}
