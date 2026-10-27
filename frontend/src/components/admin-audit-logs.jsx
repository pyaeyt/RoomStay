"use client";
import { useEffect, useState } from "react";
import { auditActionLabels, mockAuditLogsChangedEvent, readMockAuditLogs } from "@/lib/mock-audit-logs";
const targetLabels = {
    PARTNER_APPLICATION: "Partner application", PARTNER: "Partner", LISTING: "Listing", REPORT: "Report", REVIEW: "Review",
};
const actions = Object.keys(auditActionLabels);
function timestampLabel(timestamp) {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(timestamp));
}
export function AdminAuditLogs() {
    const [entries, setEntries] = useState(null);
    const [filter, setFilter] = useState("ALL");
    useEffect(() => {
        function loadEntries() { setEntries(readMockAuditLogs()); }
        const timeout = window.setTimeout(loadEntries, 0);
        window.addEventListener(mockAuditLogsChangedEvent, loadEntries);
        window.addEventListener("storage", loadEntries);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockAuditLogsChangedEvent, loadEntries);
            window.removeEventListener("storage", loadEntries);
        };
    }, []);
    if (entries === null)
        return <p className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">Loading audit logs...</p>;
    const visibleEntries = filter === "ALL" ? entries : entries.filter((entry) => entry.action === filter);
    return (<section>
      <p className="text-sm font-semibold text-primary">Admin Portal</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Audit Logs</h1>
      <p className="mt-2 text-sm text-ink-secondary">Read-only activity for Admin actions recorded in this browser. Newest first; times are shown in your local timezone.</p>
      <div className="mt-5 rounded-xl border border-line bg-white p-4">
        <label htmlFor="audit-action-filter" className="text-sm font-semibold">Filter by action</label>
        <select id="audit-action-filter" value={filter} onChange={(event) => setFilter(event.target.value)} className="mt-2 block min-h-11 w-full rounded-lg border border-line bg-white px-3 text-sm sm:max-w-sm">
          <option value="ALL">All actions</option>
          {actions.map((action) => <option key={action} value={action}>{auditActionLabels[action]}</option>)}
        </select>
      </div>
      {visibleEntries.length === 0 ? (<div className="mt-4 rounded-xl border border-line bg-white px-5 py-14 text-center">
          <h2 className="text-lg font-semibold">{entries.length === 0 ? "No activity recorded yet" : "No matching activity"}</h2>
          <p className="mt-2 text-sm text-ink-secondary">{entries.length === 0 ? "Future Admin decisions will appear here. Earlier actions are not reconstructed." : "Choose another action type to see more activity."}</p>
        </div>) : (<>
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-line bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas/60 text-ink-secondary"><tr>{["Timestamp", "Actor", "Action", "Target type", "Target", "Details"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
              <tbody>{visibleEntries.map((entry) => (<tr key={entry.id} className="border-t border-line align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-secondary"><time dateTime={entry.timestamp}>{timestampLabel(entry.timestamp)}</time></td>
                  <td className="px-4 py-3 break-words">{entry.actorLabel}</td>
                  <td className="px-4 py-3 font-semibold">{auditActionLabels[entry.action]}</td>
                  <td className="px-4 py-3 text-ink-secondary">{targetLabels[entry.targetType]}</td>
                  <td className="max-w-60 px-4 py-3"><p className="break-words font-medium">{entry.targetName}</p><p className="mt-1 break-all text-xs text-ink-secondary">{entry.targetId}</p></td>
                  <td className="max-w-80 px-4 py-3 break-words text-ink-secondary">{entry.details}</td>
                </tr>))}</tbody>
            </table>
          </div>
          <ul className="mt-4 grid gap-3 md:hidden">{visibleEntries.map((entry) => (<li key={entry.id} className="min-w-0 rounded-xl border border-line bg-white p-4">
              <h2 className="font-semibold">{auditActionLabels[entry.action]}</h2>
              <time dateTime={entry.timestamp} className="mt-1 block text-xs text-ink-secondary">{timestampLabel(entry.timestamp)}</time>
              <dl className="mt-3 grid gap-2 text-sm">
                <div><dt className="font-medium">Actor</dt><dd className="break-words text-ink-secondary">{entry.actorLabel}</dd></div>
                <div><dt className="font-medium">Target type</dt><dd className="text-ink-secondary">{targetLabels[entry.targetType]}</dd></div>
                <div><dt className="font-medium">Target</dt><dd className="break-words text-ink-secondary">{entry.targetName}<span className="mt-1 block break-all text-xs">{entry.targetId}</span></dd></div>
                <div><dt className="font-medium">Details</dt><dd className="break-words leading-6 text-ink-secondary">{entry.details}</dd></div>
              </dl>
            </li>))}</ul>
        </>)}
    </section>);
}
