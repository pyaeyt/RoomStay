"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMockAuth } from "@/lib/mock-auth";
import { formatBookingDate } from "@/lib/format-date";
import { todayDateString } from "@/lib/viewing-time";
import { ApiError } from "@/lib/api";
import { liveRequestBooking } from "@/lib/live-actions";
import { liveEnabled } from "@/lib/live-store";
import { defaultRoomStatus, mockRoomStatusesChangedEvent, readMockRoomStatus, roomStatusLabel, roomStatusMessage, saveMockBookingRequest } from "@/lib/mock-bookings";
const rentFormatter = new Intl.NumberFormat("en-US");
function bedroomLabel(count) {
    return count === 0 ? "Studio" : `${count} ${count === 1 ? "Bedroom" : "Bedrooms"}`;
}
export function RequestBookingForm({ property }) {
    const router = useRouter();
    const { user, isReady, setPendingAction } = useMockAuth();
    const [moveInDate, setMoveInDate] = useState("");
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState({});
    const [request, setRequest] = useState(null);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [roomStatus, setRoomStatus] = useState(() => property.roomStatus || defaultRoomStatus(property.availableNow));
    const returnTo = `/properties/${property.id}/request-booking`;
    const today = todayDateString();
    useEffect(() => {
        if (!isReady || user)
            return;
        setPendingAction({
            action: "request-booking",
            propertyId: property.id,
            propertyTitle: property.title,
            returnTo,
            createdAt: new Date().toISOString(),
        });
        router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}&action=request-booking`);
    }, [isReady, property.id, property.title, returnTo, router, setPendingAction, user]);
    useEffect(() => {
        if (!isReady || !user)
            return undefined;
        function loadStatus() {
            setRoomStatus(readMockRoomStatus(property.id, property.roomStatus || defaultRoomStatus(property.availableNow)));
        }
        const timeout = window.setTimeout(loadStatus, 0);
        window.addEventListener(mockRoomStatusesChangedEvent, loadStatus);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockRoomStatusesChangedEvent, loadStatus);
        };
    }, [isReady, property.availableNow, property.id, property.roomStatus, user]);
    async function submit(event) {
        event.preventDefault();
        if (!user || submitting)
            return;
        const currentStatus = readMockRoomStatus(property.id, property.roomStatus || defaultRoomStatus(property.availableNow));
        setRoomStatus(currentStatus);
        if (currentStatus !== "AVAILABLE") {
            setFormError("This room is not available for a new booking request.");
            return;
        }
        const nextErrors = {};
        if (!moveInDate)
            nextErrors.moveInDate = "Preferred move-in date is required.";
        else if (moveInDate < today)
            nextErrors.moveInDate = "Preferred move-in date cannot be in the past.";
        setErrors(nextErrors);
        setFormError("");
        if (Object.keys(nextErrors).length > 0)
            return;
        if (liveEnabled()) {
            setSubmitting(true);
            try {
                setRequest(await liveRequestBooking({
                    propertyId: property.id,
                    requestedMoveInDate: moveInDate,
                    message: message.trim(),
                }));
            }
            catch (error) {
                setFormError(error instanceof ApiError ? error.message : "The booking request could not be saved.");
                setSubmitting(false);
            }
            return;
        }
        const nextRequest = {
            id: `BK-${Date.now()}`,
            propertyId: property.id,
            propertyTitle: property.title,
            propertyLocation: property.location,
            monthlyRent: property.price,
            renterUserId: user.id,
            renterName: user.fullName,
            requestedMoveInDate: moveInDate,
            message: message.trim(),
            status: "PENDING",
            createdAt: new Date().toISOString(),
        };
        saveMockBookingRequest(nextRequest);
        setRequest(nextRequest);
    }
    if (!isReady) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Checking account access...
      </div>);
    }
    if (!user) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Redirecting to login...
      </div>);
    }
    if (property.partnerUserId && user.id === property.partnerUserId) {
        return (<section className="rounded-xl border border-line bg-white p-5 md:p-7">
        <p className="text-sm font-semibold text-primary">Your room</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">You cannot book your own room</h1>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">Booking requests for this room go to you as the owning partner. Open your bookings to review renter requests.</p>
        <Link href="/partner/bookings" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">Review booking requests</Link>
      </section>);
    }
    if (request) {
        return (<section className="rounded-xl border border-line bg-white p-5 md:p-7">
        <div className="rounded-xl bg-primary-tint p-5">
          <p className="text-sm font-semibold text-primary">Booking request submitted</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Waiting for Partner review</h1>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            Your booking request is pending. The room is not reserved yet; it becomes reserved only after the Partner approves the request and moves it to deposit pending.
          </p>
        </div>
        <dl className="mt-5 grid gap-3 text-sm text-ink-secondary sm:grid-cols-2">
          <div>
            <dt className="font-medium text-ink">Booking ID</dt>
            <dd className="mt-1">{request.id}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Status</dt>
            <dd className="mt-1">{request.status}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Property</dt>
            <dd className="mt-1">{request.propertyTitle}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Preferred move-in date</dt>
                  <dd className="mt-1">{formatBookingDate(request.requestedMoveInDate)}</dd>
          </div>
          {request.message && (<div className="sm:col-span-2">
              <dt className="font-medium text-ink">Message</dt>
              <dd className="mt-1">{request.message}</dd>
            </div>)}
        </dl>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link href={`/properties/${property.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white">
            Back to Property
          </Link>
          <Link href="/bookings" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-5 text-sm font-semibold text-ink">
            View My Bookings
          </Link>
        </div>
      </section>);
    }
    if (roomStatus !== "AVAILABLE") {
        return (<section className="rounded-xl border border-line bg-white p-5 md:p-7">
        <div className="rounded-xl bg-primary-tint p-5">
          <p className="text-sm font-semibold text-primary">Property {roomStatusLabel(roomStatus).toLowerCase()}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Booking requests are unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            {roomStatusMessage(roomStatus)}
          </p>
        </div>
        <Link href={`/properties/${property.id}`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white">
          Back to Property
        </Link>
      </section>);
    }
    return (<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-xl border border-line bg-white p-5 md:p-7">
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">Request Booking</h1>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">
          Submit a booking request for Partner review. Viewing is optional, and this request does not reserve the room yet.
        </p>

        <form onSubmit={submit} noValidate className="mt-6 grid gap-5">
          <label className="text-sm font-medium">
            Preferred move-in date
            <input type="date" min={today} value={moveInDate} onChange={(event) => setMoveInDate(event.target.value)} required aria-invalid={Boolean(errors.moveInDate)} className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:ring-2 focus:ring-primary focus:outline-none"/>
            {errors.moveInDate && <span className="mt-1.5 block text-xs text-alert">{errors.moveInDate}</span>}
          </label>

          <label className="text-sm font-medium">
            Message to Partner (Optional)
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} maxLength={500} placeholder="Tell the partner about your preferred move-in details or questions." className="mt-2 w-full resize-none rounded-lg border border-line bg-white px-3 py-3 text-sm text-ink placeholder:text-ink-secondary focus:ring-2 focus:ring-primary focus:outline-none"/>
            <span className="mt-1.5 block text-right text-xs text-ink-secondary">{message.length}/500</span>
          </label>

          <div className="rounded-lg bg-primary-tint px-4 py-3 text-sm leading-6 text-ink-secondary">
            No deposit or payment evidence is needed now. Those steps happen only if the Partner approves this request.
          </div>
          {formError && <p className="text-sm text-alert">{formError}</p>}

          <div className="grid gap-2 bg-white sm:grid-cols-2 max-[1199px]:sticky max-[1199px]:bottom-[calc(78px+env(safe-area-inset-bottom))] max-[1199px]:z-40 max-[1199px]:py-3">
            <Link href={`/properties/${property.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink">
              Cancel
            </Link>
            <button type="submit" disabled={submitting} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white btn-primary disabled:opacity-70">
              {submitting ? "Submitting..." : "Submit Booking Request"}
            </button>
          </div>
        </form>
      </section>

      <aside className="rounded-xl border border-line bg-white p-4 md:p-5 lg:sticky lg:top-8">
        <div className="relative aspect-[5/3] overflow-hidden rounded-lg bg-photo">
          <Image src={property.image} alt={property.imageAlt} fill sizes="(min-width: 1024px) 388px, calc(100vw - 44px)" className="object-cover"/>
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-[-0.025em]">{property.title}</h2>
        <p className="mt-1 text-sm text-ink-secondary">{property.location}</p>
        <p className="mt-2 text-sm text-ink-secondary">
          <span className="text-xl font-semibold text-ink">฿{rentFormatter.format(property.price)}</span> / month
        </p>
        <ul aria-label="Room details" className="mt-3 flex flex-wrap gap-4 text-sm text-ink-secondary">
          <li>{bedroomLabel(property.bedrooms)}</li>
          <li>{property.bathrooms} Bath</li>
          <li>{property.size} m²</li>
        </ul>
      </aside>
    </div>);
}
