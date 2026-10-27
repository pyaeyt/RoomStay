"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { formatBookingDate } from "@/lib/format-date";
import { useMockAuth } from "@/lib/mock-auth";
import { mockListingsChangedEvent } from "@/lib/mock-listings";
import { mockPartnerApplicationsChangedEvent } from "@/lib/mock-partner-application";
import { readMockUserDirectory } from "@/lib/mock-users";
const filters = [
    { label: "All", value: "ALL" },
    { label: "Normal Users", value: "NORMAL" },
    { label: "Approved Partners", value: "APPROVED" },
    { label: "Suspended Partners", value: "SUSPENDED" },
    { label: "Pending Applications", value: "PENDING" },
];
// Every account signs up as a Normal User. Partner access is an additional
// capability tracked separately, so the two columns never contradict.
function partnerBadge(state) {
    if (state === "SUSPENDED")
        return { label: "Suspended", tone: "bg-amber-50 text-amber-800 ring-amber-200" };
    if (state === "APPROVED")
        return { label: "Approved", tone: "bg-[#e7f6ee] text-[#1d7a3f] ring-[#c9e9d4]" };
    if (state === "PENDING")
        return { label: "Pending", tone: "bg-primary-tint text-primary ring-primary/25" };
    if (state === "REJECTED")
        return { label: "Rejected", tone: "bg-red-50 text-alert ring-red-100" };
    return { label: "Not Applied", tone: "bg-canvas text-ink-secondary ring-line" };
}
function matchesFilter(user, filter) {
    if (filter === "ALL")
        return true;
    if (filter === "SUSPENDED")
        return user.partnerState === "SUSPENDED";
    if (filter === "APPROVED")
        return user.partnerState === "APPROVED";
    if (filter === "PENDING")
        return user.partnerState === "PENDING";
    // Rejected applicants remain Normal Users and may re-apply.
    return user.partnerState === "NONE" || user.partnerState === "REJECTED";
}
export function AdminUsersList() {
    const { user: sessionUser } = useMockAuth();
    const [users, setUsers] = useState(null);
    const [query, setQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("ALL");
    useEffect(() => {
        const currentUser = sessionUser;
        function loadUsers() {
            setUsers(readMockUserDirectory(currentUser ? { id: currentUser.id, fullName: currentUser.fullName, email: currentUser.email } : null));
        }
        const timeout = window.setTimeout(loadUsers, 0);
        window.addEventListener(mockPartnerApplicationsChangedEvent, loadUsers);
        window.addEventListener(mockListingsChangedEvent, loadUsers);
        window.addEventListener("storage", loadUsers);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockPartnerApplicationsChangedEvent, loadUsers);
            window.removeEventListener(mockListingsChangedEvent, loadUsers);
            window.removeEventListener("storage", loadUsers);
        };
    }, [sessionUser]);
    if (users === null) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading users...
      </div>);
    }
    const normalizedQuery = query.trim().toLowerCase();
    const visibleUsers = users.filter((user) => {
        if (!matchesFilter(user, activeFilter))
            return false;
        if (!normalizedQuery)
            return true;
        return user.fullName.toLowerCase().includes(normalizedQuery)
            || (user.email ?? "").toLowerCase().includes(normalizedQuery);
    });
    return (<section>
      <div className="mb-5">
        <p className="text-sm font-semibold text-primary">Admin Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Users</h1>
        <p className="mt-2 text-sm text-ink-secondary">Every account signs up as a Normal User. Partner access is an additional capability granted through an approved Partner application.</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm shadow-ink/5 md:grid-cols-[minmax(0,1fr)_auto] md:p-4">
        <div role="search" className="flex h-11 min-w-0 items-center gap-2.5 rounded-lg border border-line px-3 text-ink-secondary focus-within:ring-2 focus-within:ring-primary">
          <Icon name="search" size={18}/>
          <label htmlFor="admin-user-search" className="sr-only">Search users by name or email</label>
          <input id="admin-user-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-secondary focus-visible:outline-none"/>
          {query && (<button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-primary-tint">
              <Icon name="close" size={15}/>
            </button>)}
        </div>
        <div role="group" aria-label="Filter users by type" className="flex flex-wrap gap-1">
          {filters.map((filter) => {
            const active = activeFilter === filter.value;
            return (<button key={filter.value} type="button" aria-pressed={active} onClick={() => setActiveFilter(filter.value)} className={`min-h-11 rounded-xl px-3 text-sm font-semibold whitespace-nowrap ${active ? "bg-primary text-white" : "text-ink-secondary hover:bg-primary-tint hover:text-primary"}`}>
                {filter.label}
              </button>);
        })}
        </div>
      </div>

      <p role="status" aria-live="polite" className="mt-4 text-sm text-ink-secondary">
        {visibleUsers.length} {visibleUsers.length === 1 ? "user" : "users"} shown
      </p>

      {users.length === 0 ? (<div className="mt-3 rounded-xl border border-line bg-white px-5 py-14 text-center">
          <h2 className="text-lg font-semibold tracking-[-0.025em]">No users yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
            Accounts will appear here once renters sign up, apply, book, or message in this browser.
          </p>
        </div>) : visibleUsers.length === 0 ? (<div className="mt-3 rounded-xl border border-line bg-white px-5 py-14 text-center">
          <h2 className="text-lg font-semibold tracking-[-0.025em]">No users match this search</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
            Try another name, email, or filter.
          </p>
        </div>) : (<>
          <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-line bg-white shadow-sm shadow-ink/5 md:block">
            <table className="w-full min-w-3xl text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-ink-secondary">
                  <th scope="col" className="px-4 py-3 font-semibold">User</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Account Type</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Partner Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Joined</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => {
                const badge = partnerBadge(user.partnerState);
                return (<tr key={user.id} className="border-b border-line align-top last:border-0">
                      <td className="px-4 py-3 font-semibold text-ink">{user.fullName}</td>
                      <td className="px-4 py-3 break-all text-ink-secondary">{user.email ?? "—"}</td>
                      <td className="px-4 py-3 text-ink-secondary">Normal User</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badge.tone}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink-secondary">
                        {user.firstSeenAt ? formatBookingDate(user.firstSeenAt) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/users/${encodeURIComponent(user.id)}`} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink btn-secondary">
                          View
                        </Link>
                      </td>
                    </tr>);
            })}
              </tbody>
            </table>
          </div>

          <ul className="mt-3 grid gap-3 md:hidden">
            {visibleUsers.map((user) => {
                const badge = partnerBadge(user.partnerState);
                return (<li key={user.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm shadow-ink/5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold tracking-[-0.025em]">{user.fullName}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badge.tone}`}>
                      {badge.label}
                    </span>
                  </div>
                  <dl className="mt-2 grid gap-1 text-sm text-ink-secondary">
                    <div className="flex justify-between gap-3">
                      <dt className="font-medium">Email</dt>
                      <dd className="min-w-0 break-all text-right">{user.email ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="font-medium">Account Type</dt>
                      <dd>Normal User</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="font-medium">Partner Status</dt>
                      <dd>{badge.label}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="font-medium">Joined</dt>
                      <dd>{user.firstSeenAt ? formatBookingDate(user.firstSeenAt) : "—"}</dd>
                    </div>
                  </dl>
                  <Link href={`/admin/users/${encodeURIComponent(user.id)}`} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink btn-secondary">
                    View Details
                  </Link>
                </li>);
            })}
          </ul>
        </>)}
    </section>);
}
