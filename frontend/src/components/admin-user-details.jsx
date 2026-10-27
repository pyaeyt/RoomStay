"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBookingDate } from "@/lib/format-date";
import { useMockAuth } from "@/lib/mock-auth";
import { mockListingsChangedEvent } from "@/lib/mock-listings";
import { liveChangePartnerAccess } from "@/lib/live-actions";
import { liveEnabled } from "@/lib/live-store";
import { changeMockPartnerAccess, mockPartnerApplicationsChangedEvent } from "@/lib/mock-partner-application";
import { findMockDirectoryUser } from "@/lib/mock-users";
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
export function AdminUserDetails({ userId }) {
    const { user: sessionUser } = useMockAuth();
    const [user, setUser] = useState(undefined);
    const [reason, setReason] = useState("");
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");
    useEffect(() => {
        const currentUser = sessionUser;
        function loadUser() {
            setUser(findMockDirectoryUser(userId, currentUser ? { id: currentUser.id, fullName: currentUser.fullName, email: currentUser.email } : null));
        }
        const timeout = window.setTimeout(loadUser, 0);
        window.addEventListener(mockPartnerApplicationsChangedEvent, loadUser);
        window.addEventListener(mockListingsChangedEvent, loadUser);
        window.addEventListener("storage", loadUser);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockPartnerApplicationsChangedEvent, loadUser);
            window.removeEventListener(mockListingsChangedEvent, loadUser);
            window.removeEventListener("storage", loadUser);
        };
    }, [sessionUser, userId]);
    if (user === undefined) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading user...
      </div>);
    }
    if (!user) {
        return (<section className="rounded-xl border border-line bg-white px-5 py-14 text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">User not found</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
          This user does not exist in the stored mock data in this browser.
        </p>
        <Link href="/admin/users" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">
          Back to Users
        </Link>
      </section>);
    }
    async function changeAccess() {
        if (!user?.application)
            return;
        setError("");
        setFeedback("");
        const suspending = user.partnerState === "APPROVED";
        if (suspending && !reason.trim()) {
            setError("Enter a reason to suspend Partner access.");
            return;
        }
        try {
            if (liveEnabled()) {
                await liveChangePartnerAccess(user.id, suspending
                    ? { status: "SUSPENDED", reason: reason.trim() }
                    : { status: "APPROVED" });
                setReason("");
                setFeedback(suspending ? "Partner access suspended. The Normal User account remains active." : "Partner access restored.");
                return;
            }
            const updated = changeMockPartnerAccess(user.application.id, suspending
                ? { status: "SUSPENDED", reason, suspendedBy: "Mock Admin" }
                : { status: "APPROVED" });
            if (!updated) {
                setError("Partner access has changed. Review the current status and try again.");
                return;
            }
            setReason("");
            setFeedback(suspending ? "Partner access suspended. The Normal User account remains active." : "Partner access restored.");
        }
        catch {
            setError("The update could not be fully saved. Check the current status and browser storage before retrying.");
        }
    }
    const badge = partnerBadge(user.partnerState);
    const activity = [
        { label: "Bookings", value: user.bookingCount },
        { label: "Reviews", value: user.reviewCount },
        { label: "Listings", value: user.listingCount },
    ];
    return (<section>
      <Link href="/admin/users" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-medium text-primary">
        <span aria-hidden="true">‹</span> Back to users
      </Link>

      <div className="mt-3">
        <p className="text-sm font-semibold text-primary">Admin Portal</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-[-0.025em]">{user.fullName}</h1>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badge.tone}`}>
            {badge.label}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-white p-5 md:p-6">
          <h2 className="text-base font-semibold tracking-[-0.025em]">Profile</h2>
          <dl className="mt-4 grid gap-3 text-sm text-ink-secondary">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-medium text-ink">Email</dt>
              <dd className="break-all">{user.email ?? "Not available"}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-medium text-ink">Phone</dt>
              <dd>{user.phone ?? "Not available"}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-medium text-ink">Account type</dt>
              <dd>Normal User</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-medium text-ink">Partner Access</dt>
              <dd>{badge.label}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-medium text-ink">Joined</dt>
              <dd>{user.firstSeenAt ? formatBookingDate(user.firstSeenAt) : "Not available"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-line bg-white p-5 md:p-6">
          <h2 className="text-base font-semibold tracking-[-0.025em]">Partner application</h2>
          {user.application ? (<div className="mt-4 grid gap-3 text-sm text-ink-secondary">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-ink">Status</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badge.tone}`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium text-ink">Submitted</span>
                <span>{formatBookingDate(user.application.submittedAt)}</span>
              </div>
              {user.application.reviewedAt && (<div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-ink">Reviewed</span>
                  <span>{formatBookingDate(user.application.reviewedAt)}</span>
                </div>)}
              <Link href={`/admin/partner-applications/${encodeURIComponent(user.application.id)}`} className="mt-1 inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink btn-secondary">
                View Application
              </Link>
            </div>) : (<p className="mt-4 text-sm leading-6 text-ink-secondary">This user has not submitted a Partner application.</p>)}
        </section>
      </div>

      {(user.partnerState === "APPROVED" || user.partnerState === "SUSPENDED") && (<section className="mt-4 rounded-xl border border-line bg-white p-5 md:p-6" aria-labelledby="partner-access-heading">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="partner-access-heading" className="text-base font-semibold">Partner Access</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badge.tone}`}>{badge.label}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-secondary">Suspension temporarily blocks Partner Portal access and hides published listings from public browsing. The Normal User account, listing statuses, bookings, and history are preserved.</p>
          {user.partnerState === "SUSPENDED" ? (<div className="mt-4 grid gap-3 text-sm">
              <p className="whitespace-pre-wrap break-words"><strong>Suspension reason:</strong> {user.application?.suspensionReason ?? "Not recorded"}</p>
              <p><strong>Suspended date:</strong> {user.application?.suspendedAt ? formatBookingDate(user.application.suspendedAt) : "Not recorded"}</p>
              {user.application?.suspendedBy && <p><strong>Suspended by:</strong> {user.application.suspendedBy}</p>}
              <button type="button" onClick={changeAccess} className="min-h-11 justify-self-start rounded-lg bg-primary px-5 font-semibold text-white btn-primary">Restore Partner Access</button>
            </div>) : (<form className="mt-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); changeAccess(); }}>
              {user.application?.unsuspendedAt && <p className="text-sm text-ink-secondary">Access restored on {formatBookingDate(user.application.unsuspendedAt)}</p>}
              <label htmlFor="suspension-reason" className="text-sm font-semibold">Suspension reason (required)</label>
              <textarea id="suspension-reason" required value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="w-full rounded-lg border border-line p-3 text-sm"/>
              <button type="submit" className="min-h-11 justify-self-start rounded-lg bg-alert px-5 text-sm font-semibold text-white">Suspend Partner</button>
            </form>)}
          {error && <p role="alert" className="mt-3 text-sm text-alert">{error}</p>}
          {feedback && <p role="status" className="mt-3 text-sm text-primary">{feedback}</p>}
        </section>)}

      <section className="mt-4 rounded-xl border border-line bg-white p-5 md:p-6">
        <h2 className="text-base font-semibold tracking-[-0.025em]">Activity</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {activity.map((item) => (<div key={item.label} className="rounded-xl bg-canvas/40 p-4 text-center ring-1 ring-inset ring-line">
              <p className="text-2xl font-semibold tracking-[-0.025em] text-ink">{item.value}</p>
              <p className="mt-1 text-xs font-semibold text-ink-secondary">{item.label}</p>
            </div>))}
        </div>
      </section>
    </section>);
}
