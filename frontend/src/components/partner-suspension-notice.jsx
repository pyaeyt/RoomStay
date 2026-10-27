import Link from "next/link";
import { formatBookingDate } from "@/lib/format-date";
export function PartnerSuspensionNotice({ application }) {
    return (<section className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6">
      <p className="text-sm font-semibold text-amber-800">Partner Access · Suspended</p>
      <h1 className="mt-2 text-2xl font-semibold">Partner access is currently suspended.</h1>
      {application.suspensionReason && <p className="mt-3 whitespace-pre-wrap break-words text-sm"><strong>Reason:</strong> {application.suspensionReason}</p>}
      {application.suspendedAt && <p className="mt-2 text-sm">Suspended on {formatBookingDate(application.suspendedAt)}</p>}
      <p className="mt-3 text-sm leading-6 text-ink-secondary">Your Normal User account remains available. You can browse rooms and use renter features. Your listings, bookings, and history are preserved.</p>
      <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">Back to RoomStay Home</Link>
    </section>);
}
