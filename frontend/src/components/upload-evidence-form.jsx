"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { findMockBookingRequest, saveMockPaymentEvidence, statusLabel, updateMockBookingRequest, } from "@/lib/mock-bookings";
import { ApiError } from "@/lib/api";
import { liveUploadEvidence } from "@/lib/live-actions";
import { liveEnabled } from "@/lib/live-store";
import { useMockAuth } from "@/lib/mock-auth";
import { usePublicProperties } from "@/lib/published-listings";
const allowedTypes = ["image/jpeg", "image/png"];
const allowedExtensions = [".jpg", ".jpeg", ".png"];
function formatDateTime(value) {
    if (!value)
        return "Not provided";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}
function isAllowedEvidenceFile(file) {
    const lowerName = file.name.toLowerCase();
    return allowedTypes.includes(file.type) || allowedExtensions.some((extension) => lowerName.endsWith(extension));
}
function statusName(status) {
    if (status === "DEPOSIT_PENDING")
        return "Deposit Pending";
    if (status === "VERIFICATION_PENDING")
        return "Verification Pending";
    return statusLabel(status);
}
export function UploadEvidenceForm({ bookingId }) {
    const router = useRouter();
    const { user, isReady } = useMockAuth();
    const [booking, setBooking] = useState(undefined);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [note, setNote] = useState("");
    const [fileError, setFileError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const { properties: publicProperties } = usePublicProperties();
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user) {
            router.replace(`/login?returnTo=${encodeURIComponent(`/bookings/${bookingId}/upload-evidence`)}`);
            return undefined;
        }
        const timeout = window.setTimeout(() => {
            const found = findMockBookingRequest(bookingId);
            setBooking(found && found.renterUserId === user.id ? found : null);
        }, 0);
        return () => window.clearTimeout(timeout);
    }, [bookingId, isReady, router, user]);
    useEffect(() => {
        return () => {
            if (previewUrl)
                URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);
    function handleFileChange(event) {
        const selectedFile = event.target.files?.[0] ?? null;
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (!selectedFile) {
            setFile(null);
            setFileError("Payment evidence file is required.");
            return;
        }
        if (!isAllowedEvidenceFile(selectedFile)) {
            setFile(null);
            setFileError("Upload a JPG, JPEG, or PNG image only.");
            return;
        }
        setFile(selectedFile);
        setFileError("");
        setPreviewUrl(URL.createObjectURL(selectedFile));
    }
    async function handleSubmit(event) {
        event.preventDefault();
        if (!booking || booking.status !== "DEPOSIT_PENDING")
            return;
        if (!file) {
            setFileError("Payment evidence file is required.");
            return;
        }
        if (!isAllowedEvidenceFile(file)) {
            setFileError("Upload a JPG, JPEG, or PNG image only.");
            return;
        }
        if (liveEnabled()) {
            try {
                setBooking(await liveUploadEvidence(booking.id, {
                    file,
                    note: note.trim(),
                }));
                setSubmitted(true);
            }
            catch (error) {
                setFileError(error instanceof ApiError ? error.message : "The evidence could not be uploaded.");
            }
            return;
        }
        const uploadedAt = new Date().toISOString();
        saveMockPaymentEvidence({
            id: `evidence-${booking.id}-${Date.now()}`,
            bookingId: booking.id,
            fileName: file.name,
            fileType: file.type || "image",
            note: note.trim(),
            uploadedAt,
            status: "PENDING_VERIFICATION",
        });
        const updatedBooking = {
            ...booking,
            status: "VERIFICATION_PENDING",
        };
        updateMockBookingRequest(updatedBooking);
        setBooking(updatedBooking);
        setSubmitted(true);
    }
    if (!isReady || booking === undefined) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Loading upload page...
      </div>);
    }
    if (!user) {
        return (<div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
        Redirecting to login...
      </div>);
    }
    if (!booking) {
        return (<section className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-5 text-center md:p-7">
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">Booking not found</h1>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">This booking may belong to another user or may no longer exist.</p>
        <Link href="/bookings" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white">
          Back to My Bookings
        </Link>
      </section>);
    }
    if (submitted) {
        return (<section className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-5 text-center md:p-7">
        <p className="text-sm font-semibold text-primary">Booking ID {booking.id}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Payment evidence submitted</h1>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          Your payment evidence is waiting for Partner verification. The booking is not confirmed yet, and the room remains reserved during this step.
        </p>
        <Link href={`/bookings/${booking.id}`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white">
          Return to Booking Details
        </Link>
      </section>);
    }
    const property = publicProperties.find((item) => item.id === booking.propertyId);
    const image = property?.image ?? "/images/home/cozy-condo.jpg";
    const imageAlt = property?.imageAlt ?? booking.propertyTitle;
    const rentFormatter = new Intl.NumberFormat("en-US");
    if (booking.status !== "DEPOSIT_PENDING") {
        return (<section className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-5 text-center md:p-7">
        <p className="text-sm font-semibold text-primary">Booking ID {booking.id}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Payment evidence upload unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          Evidence can only be uploaded while a booking is Deposit Pending. This booking is currently {statusName(booking.status)}.
        </p>
        <Link href={`/bookings/${booking.id}`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white">
          Back to Booking Details
        </Link>
      </section>);
    }
    return (<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-xl border border-line bg-white p-5 md:p-7">
        <p className="text-sm font-semibold text-primary">Booking ID {booking.id}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Upload Payment Evidence</h1>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          Pay the deposit from your own bank, then upload a photo of the transfer slip. The partner and admin can open that photo here. RoomStay does not move the money.
        </p>

        <dl className="mt-5 grid gap-3 rounded-xl bg-primary-tint p-4 text-sm text-ink-secondary sm:grid-cols-2">
          <div>
            <dt className="font-medium text-ink">Current status</dt>
            <dd className="mt-1">{statusName(booking.status)}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Payment reference</dt>
            <dd className="mt-1">{booking.id}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Deposit amount</dt>
            <dd className="mt-1">{booking.depositAmount ? `฿${rentFormatter.format(booking.depositAmount)}` : "Not provided"}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Payment deadline</dt>
            <dd className="mt-1">{formatDateTime(booking.paymentDeadline)}</dd>
          </div>
        </dl>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <div>
            <label htmlFor="payment-evidence" className="block text-sm font-medium text-ink">
              Payment evidence file <span className="text-alert">*</span>
            </label>
            <div className="mt-2 rounded-xl border border-dashed border-primary/35 bg-white p-4">
              <input id="payment-evidence" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleFileChange} className="block w-full text-sm text-ink-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white"/>
              <p className="mt-2 text-xs text-ink-secondary">Accepted formats: JPG, JPEG, PNG.</p>
              {file && <p className="mt-3 text-sm font-medium text-ink">Selected file: {file.name}</p>}
              {previewUrl && (<div className="relative mt-4 aspect-[4/3] max-w-sm overflow-hidden rounded-lg border border-line bg-photo">
                  <Image src={previewUrl} alt="Selected payment evidence preview" fill sizes="(min-width: 768px) 360px, calc(100vw - 76px)" className="object-cover" unoptimized/>
                </div>)}
              {fileError && <p className="mt-2 text-sm text-alert">{fileError}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="payment-note" className="block text-sm font-medium text-ink">Optional note</label>
            <textarea id="payment-note" value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Add a short note for the Partner, if needed." className="mt-2 w-full rounded-lg border border-line px-3 py-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"/>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Link href={`/bookings/${booking.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-5 text-sm font-semibold text-ink">
              Cancel
            </Link>
            <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">
              Submit Evidence
            </button>
          </div>
        </form>
      </section>

      <aside className="rounded-xl border border-line bg-white p-4 md:p-5 lg:sticky lg:top-8">
        <div className="relative aspect-[5/3] overflow-hidden rounded-lg bg-photo">
          <Image src={image} alt={imageAlt} fill sizes="(min-width: 1024px) 348px, calc(100vw - 44px)" className="object-cover"/>
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-[-0.025em]">{booking.propertyTitle}</h2>
        <p className="mt-1 text-sm text-ink-secondary">{booking.propertyLocation}</p>
        {property && (<ul aria-label="Room details" className="mt-3 flex flex-wrap gap-4 text-sm text-ink-secondary">
            <li>{property.bedrooms === 0 ? "Studio" : `${property.bedrooms} Bedroom${property.bedrooms === 1 ? "" : "s"}`}</li>
            <li>{property.bathrooms} Bath</li>
            <li>{property.size} m²</li>
          </ul>)}
      </aside>
    </div>);
}
