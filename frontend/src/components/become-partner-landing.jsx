"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { PartnerApplicationForm } from "@/components/partner-application-form";
import { useMockAuth } from "@/lib/mock-auth";
import { mockPartnerApplicationsChangedEvent, readMockPartnerApplicationsForUser, } from "@/lib/mock-partner-application";
const benefitChips = ["Reach more renters", "Manage your listings", "Review booking and viewing requests", "Track deposit evidence and rental progress"];
const howItWorks = [
    { title: "Apply to become a Partner", text: "Submit your details and required documents through RoomStay." },
    { title: "Admin reviews your application", text: "Your application is checked before Partner access is granted." },
    { title: "Create and submit your listing", text: "Add property details, photos, facilities, and house rules." },
    { title: "Manage bookings after approval", text: "Review requests and manage the rental lifecycle from the Partner area." },
];
const partnerBenefits = [
    { title: "Create and manage listings", text: "Draft, edit, submit, and track your property listings.", icon: "apartment" },
    { title: "Review booking requests", text: "Approve or decline renter booking requests from the Partner area.", icon: "room" },
    { title: "Set deposit amount and deadline", text: "After approval, define the deposit information renters need.", icon: "messages" },
    { title: "Verify payment evidence", text: "Review uploaded evidence metadata before confirming a booking.", icon: "bell" },
    { title: "Start and complete rentals", text: "Move confirmed bookings into active and completed rental stages.", icon: "home" },
];
function latestApplication(applications) {
    return applications[0] ?? null;
}
function statusText(application, isLoggedIn) {
    if (!isLoggedIn) {
        return {
            eyebrow: "Partner access",
            title: "Sign in to apply",
            text: "Create or access your RoomStay account, then continue to your Partner application.",
            href: `/login?returnTo=${encodeURIComponent("/partner-application")}`,
            label: "Apply to Become a Partner",
            secondaryHref: `/register?returnTo=${encodeURIComponent("/partner-application")}`,
            secondaryLabel: "Create account",
        };
    }
    if (!application) {
        return {
            eyebrow: "Ready to apply",
            title: "Start your Partner application",
            text: "Continue to your application page to submit your details and documents.",
            href: "/partner-application",
            label: "Apply to Become a Partner",
        };
    }
    if (application.status === "PENDING") {
        return {
            eyebrow: "Application under review",
            title: "Your application is being reviewed",
            text: "You can check the current application status while waiting for an Admin decision.",
            href: "/partner-application",
            label: "View Application Status",
        };
    }
    if (application.status === "SUSPENDED") {
        return {
            eyebrow: "Partner access suspended",
            title: "Partner access is currently suspended.",
            text: application.suspensionReason ?? "Your Normal User account and renter features remain available.",
            href: "/partner-application",
            label: "View Partner Access Status",
        };
    }
    if (application.status === "APPROVED") {
        return {
            eyebrow: "Partner access available",
            title: "Manage your rentals from the Partner Portal",
            text: "Your Partner application is approved. Continue to the Partner Portal.",
            href: "/partner",
            label: "Go to Partner Portal",
            secondaryHref: "/partner/bookings",
            secondaryLabel: "View Partner Bookings",
        };
    }
    return {
        eyebrow: "Application rejected",
        title: "You can apply again",
        text: "Review the rejection reason on your status page, then submit an updated application when ready.",
        href: "#application",
        label: "Apply Again",
        secondaryHref: "/partner-application",
        secondaryLabel: "View Status",
    };
}
export function BecomePartnerLanding() {
    const { user, isReady } = useMockAuth();
    const [application, setApplication] = useState(undefined);
    useEffect(() => {
        if (!isReady)
            return undefined;
        if (!user)
            return undefined;
        const currentUser = user;
        function loadApplication() {
            setApplication(latestApplication(readMockPartnerApplicationsForUser(currentUser.id)));
        }
        const timeout = window.setTimeout(loadApplication, 0);
        window.addEventListener(mockPartnerApplicationsChangedEvent, loadApplication);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(mockPartnerApplicationsChangedEvent, loadApplication);
        };
    }, [isReady, user]);
    const ready = isReady && (!user || application !== undefined);
    const cta = statusText(ready ? application ?? null : undefined, Boolean(user));
    return (<div className="grid gap-10 pb-10">
      <section className="overflow-hidden rounded-3xl border border-line bg-primary-tint/50 px-5 py-8 shadow-sm shadow-ink/5 md:px-8 md:py-12 xl:px-12">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_420px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-3 py-1.5 text-sm font-semibold text-primary">
              <Icon name="brand" size={22}/> RoomStay Partner
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-ink md:text-5xl">
              List your property. Find the right renter.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-secondary md:text-lg">
              Reach renters, manage listings, review bookings, and handle deposit verification from one platform.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {benefitChips.map((benefit) => (<span key={benefit} className="rounded-full border border-primary/15 bg-white px-3 py-1.5 text-sm font-semibold text-primary">
                  {benefit}
                </span>))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={cta.href} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white btn-primary">
                {cta.label}
              </Link>
              {cta.secondaryHref && cta.secondaryLabel && (<Link href={cta.secondaryHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink btn-secondary">
                  {cta.secondaryLabel}
                </Link>)}
            </div>
          </div>

          <aside className="rounded-2xl border border-line bg-white p-5 shadow-md shadow-primary/10 md:p-6">
            <p className="text-sm font-semibold text-primary">{ready ? cta.eyebrow : "Checking status"}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
              {ready ? cta.title : "Loading Partner access"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-secondary">
              {ready ? cta.text : "RoomStay is checking your application status in this browser."}
            </p>
          </aside>
        </div>
      </section>

      <section id="how-it-works" aria-labelledby="partner-how-heading" className="scroll-mt-24 rounded-3xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">How it works</p>
          <h2 id="partner-how-heading" className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">A simple path to Partner access</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {howItWorks.map((step, index) => (<article key={step.title} className="rounded-2xl border border-line bg-canvas/40 p-5">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{index + 1}</span>
              <h3 className="mt-4 text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-secondary">{step.text}</p>
            </article>))}
        </div>
      </section>

      <section aria-labelledby="partner-benefits-heading" className="rounded-3xl border border-line bg-white p-5 shadow-sm shadow-ink/5 md:p-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Partner tools</p>
          <h2 id="partner-benefits-heading" className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">What you can manage in RoomStay</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {partnerBenefits.map((benefit) => (<article key={benefit.title} className="flex gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm shadow-ink/5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                <Icon name={benefit.icon} size={22}/>
              </span>
              <div>
                <h3 className="font-semibold text-ink">{benefit.title}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-secondary">{benefit.text}</p>
              </div>
            </article>))}
        </div>
      </section>

      <section id="application" aria-labelledby="partner-application-heading" className="scroll-mt-24 rounded-3xl border border-line bg-canvas/50 p-5 md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-primary">Application</p>
          <h2 id="partner-application-heading" className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">Apply with your existing RoomStay account</h2>
          <p className="mt-3 text-sm leading-6 text-ink-secondary">
            The application form and validation below use the existing Partner application flow.
          </p>
        </div>

        <div className="mt-6">
          {!isReady ? (<div className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-5 text-sm text-ink-secondary">
              Loading application...
            </div>) : user ? (<PartnerApplicationForm />) : (<div className="mx-auto max-w-2xl rounded-xl border border-line bg-white px-5 py-10 text-center shadow-sm shadow-ink/5">
              <h3 className="text-xl font-semibold tracking-[-0.025em] text-ink">Log in before applying</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
                Public visitors can learn about Partner access here. Sign in or create a Normal User account before submitting an application.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href={`/login?returnTo=${encodeURIComponent("/partner-application")}`} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white btn-primary">
                  Log In to Apply
                </Link>
                <Link href="/register" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-5 text-sm font-semibold text-ink btn-secondary">
                  Create Account
                </Link>
              </div>
            </div>)}
        </div>
      </section>
    </div>);
}
